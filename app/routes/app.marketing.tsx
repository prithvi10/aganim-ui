import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useSearchParams, useFetcher, useNavigate} from 'react-router';
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Divider,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  Toast,
  Tooltip,
} from '@shopify/polaris';
import {useAppBridge} from '@shopify/app-bridge-react';
import {getSessionToken} from '@shopify/app-bridge/utilities';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {authenticate, getOfflineGraphqlClient} from '../shopify.server';
import {descriptionHash} from '../utils/descriptionHash.server';
import { DowngradeScheduledBanner } from "../components/DowngradeScheduledBanner";
import { RichTextEditor } from "../components/RichTextEditor";
import "../styles/optimize-button.css";

type ProductListItem = {id: string; title: string};
type ProductImage = {url: string; altText?: string | null};
type SocialHooksCache = {
  hooks: Array<{
    type: string;
    caption: string;
    hashtags: string[];
    overlay?: string;
    copy_text: string;
  }>;
  overlay_suggestions?: string[];
  generated_at?: string;
  source_desc_hash?: string;
};
type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  images: ProductImage[];
  socialHooksCache?: SocialHooksCache | null;
  _contentHash?: string;
  _hooksSourceHash?: string;
  _hooksIsFresh?: boolean;
};

type MarketingTemplate = {
  id: string;
  name: string;
  category: 'product' | 'marketing';
  agent_type: 'rewriter' | 'marketing';
  description: string;
  output_format: string;
  inputs: Array<{
    name: string;
    label: string;
    required: boolean;
    input_type: string;
    description: string;
  }>;
};

type LoaderData = {
  planName: 'Free' | 'Basic' | 'Standard' | 'Pro';
  shop: string;
  shopSlug: string;
  backendApiUrl: string;
  pendingPlanName?: string | null;
  pendingPlanEffectiveAt?: string | null;
  lastPlanChangeType?: string | null;
  lastPlanChangeAt?: string | null;
  products: ProductListItem[];
  selectedProduct: SelectedProduct | null;
  contentHash: string | null;
  didResetMetaCache: boolean;
  marketingTemplates: MarketingTemplate[];
};

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return '';
  return String(gid).split('/').pop() ?? '';
}

function planTierFromName(name: string): LoaderData['planName'] {
  const n = String(name ?? '').toLowerCase();
  // IMPORTANT: word boundaries so "promo" does NOT match "pro"
  if (/\bpro\b/.test(n)) return 'Pro';
  if (/\bstandard\b/.test(n)) return 'Standard';
  if (/\bbasic\b/.test(n)) return 'Basic';
  return 'Free';
}

function discountCodeName(holidayName: string, category: string, year: number) {
  const base = String(holidayName).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const cat = String(category || 'SALE').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const yy = String(year).slice(-2);
  return `${base}${yy}${cat.slice(0, 6)}`.slice(0, 20);
}

export const loader = async ({request}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';
  const selectedProductIdParam = url.searchParams.get('productId') || '';

  // Prefer offline context to avoid redirect loops; fall back to standard auth.
  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  const usingOfflineClient = Boolean(offlineContext);
  let sessionShop = '';
  let graphqlQuery: (query: string, variables?: Record<string, any>) => Promise<any>;

  if (offlineContext) {
    sessionShop = offlineContext.session.shop;
    graphqlQuery = async (query) => {
      const resp = await offlineContext.client.query({data: query});
      return resp?.body;
    };
  } else {
    const {admin, session} = await authenticate.admin(request);
    sessionShop = session.shop;
    graphqlQuery = async (query, variables) => {
      const resp = await admin.graphql(query, {variables});
      return await resp.json();
    };
  }

  const shop = sessionShop;
  const shopSlug = shop.replace('.myshopify.com', '');
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://shopify-translator-api.onrender.com';

  const planQuery = `query AppPlan {
    appInstallation {
      activeSubscriptions {
        name
        status
      }
    }
  }`;

  const productsQuery = usingOfflineClient
    ? `query Products {
        products(first: 50, sortKey: TITLE) {
          edges { node { id title } }
        }
      }`
    : `query Products($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges { node { id title } }
        }
      }`;

  const [planRes, productsRes] = await Promise.all([
    graphqlQuery(planQuery),
    graphqlQuery(productsQuery, usingOfflineClient ? undefined : {first: 50}),
  ]);

  const activeSubs: Array<{name: string; status: string}> =
    planRes?.data?.appInstallation?.activeSubscriptions ?? [];
  const activeNames = activeSubs
    .filter((s) => {
      const st = String(s.status || '').toUpperCase();
      // Shopify can return PENDING briefly right after upgrade; treat as active for UI.
      return !st || st === 'ACTIVE' || st === 'PENDING';
    })
    .map((s) => String(s.name || ''));
  const tiers = activeNames.map(planTierFromName);
  let planName: LoaderData['planName'] =
    tiers.includes('Pro')
      ? 'Pro'
      : tiers.includes('Standard')
        ? 'Standard'
        : tiers.includes('Basic')
          ? 'Basic'
          : 'Free';

  let pendingPlanName: string | null = null;
  let pendingPlanEffectiveAt: string | null = null;
  let lastPlanChangeType: string | null = null;
  let lastPlanChangeAt: string | null = null;

  // Grace-period override (reinstall-only):
  // After uninstall Shopify activeSubscriptions is often empty ("Free"), but backend grants access until access_expires_at.
  try {
    const u = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(sessionShop)}`);
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      const eff = String(data?.effective_plan_name || '').trim();
      if (eff === 'Free' || eff === 'Basic' || eff === 'Standard' || eff === 'Pro') {
        // DB is the source of truth for plan display/gating.
        planName = eff as LoaderData['planName'];
      }
      pendingPlanName = String(data?.pending_plan_name || '').trim() || null;
      pendingPlanEffectiveAt = String(data?.pending_plan_effective_at || '').trim() || null;
      lastPlanChangeType = String(data?.last_plan_change_type || '').trim() || null;
      lastPlanChangeAt = String(data?.last_plan_change_at || '').trim() || null;
    }
  } catch {
    // best-effort
  }

  const products: ProductListItem[] =
    productsRes?.data?.products?.edges?.map((e: any) => e.node) ?? [];

  const fallbackSelected = firstOrNull(products)?.id ?? '';
  // Convert numeric ID to full GID format if needed
  let selectedProductId = selectedProductIdParam || fallbackSelected;
  if (selectedProductId && !selectedProductId.startsWith('gid://')) {
    selectedProductId = `gid://shopify/Product/${selectedProductId}`;
  }

  const selectedProductRes = selectedProductId
    ? usingOfflineClient
      ? await graphqlQuery(
          `query Product {
            product(id: "${String(selectedProductId).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}") {
              id
              title
              descriptionHtml
              productType
              tags
              hooksMeta: metafield(namespace: "crossborderagent", key: "social_hooks_instagram") {
                id
                value
              }
              hooksHashMeta: metafield(namespace: "crossborderagent", key: "social_hooks_instagram_desc_hash") { id value }
              legacyDescHashMeta: metafield(namespace: "crossborderagent", key: "desc_hash") { id value }
              images(first: 6) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }`,
        )
      : await graphqlQuery(
          `query Product($id: ID!) {
            product(id: $id) {
              id
              title
              descriptionHtml
              productType
              tags
              hooksMeta: metafield(namespace: "crossborderagent", key: "social_hooks_instagram") {
                id
                value
              }
              hooksHashMeta: metafield(namespace: "crossborderagent", key: "social_hooks_instagram_desc_hash") { id value }
              legacyDescHashMeta: metafield(namespace: "crossborderagent", key: "desc_hash") { id value }
              images(first: 6) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }`,
          {id: selectedProductId},
        )
    : null;

  const rawSelectedProduct = selectedProductRes?.data?.product ?? null;
  const currentContentHash = rawSelectedProduct?.descriptionHtml
    ? descriptionHash(String(rawSelectedProduct.descriptionHtml ?? ''))
    : descriptionHash('');
  let didResetMetaCache = false;

  let parsedSocialHooks: SocialHooksCache | null = null;
  if (rawSelectedProduct?.hooksMeta?.value) {
    try {
      parsedSocialHooks = JSON.parse(String(rawSelectedProduct.hooksMeta.value));
    } catch {
      parsedSocialHooks = null;
    }
  }

  // Invalidate cached hooks if the product description has changed (manual OR via our app rewriter).
  if (rawSelectedProduct?.id) {
    const hooksHash =
      String(rawSelectedProduct?.hooksHashMeta?.value ?? '') ||
      String(parsedSocialHooks?.source_desc_hash ?? '') ||
      String(rawSelectedProduct?.legacyDescHashMeta?.value ?? '');
    const hasCache = Boolean(rawSelectedProduct?.hooksMeta?.id);
    if (hasCache && hooksHash && hooksHash !== currentContentHash) {
      const hooksId = rawSelectedProduct?.hooksMeta?.id;
      const hooksHashId = rawSelectedProduct?.hooksHashMeta?.id;
      if (hooksId) {
        try {
          await graphqlQuery(
            `mutation DeleteMetafield($input: MetafieldDeleteInput!) {
              metafieldDelete(input: $input) {
                deletedId
                userErrors { field message }
              }
            }`,
            {input: {id: hooksId}},
          );
        } catch {
          // best-effort
        }
      }
      if (hooksHashId) {
        try {
          await graphqlQuery(
            `mutation DeleteMetafield($input: MetafieldDeleteInput!) {
              metafieldDelete(input: $input) {
                deletedId
                userErrors { field message }
              }
            }`,
            {input: {id: hooksHashId}},
          );
        } catch {
          // best-effort
        }
      }
      didResetMetaCache = true;
      parsedSocialHooks = null;
    }
  }

  const hooksSourceHash =
    String(rawSelectedProduct?.hooksHashMeta?.value ?? '') ||
    String(parsedSocialHooks?.source_desc_hash ?? '') ||
    String(rawSelectedProduct?.legacyDescHashMeta?.value ?? '');
  const hooksIsFresh = Boolean(hooksSourceHash && hooksSourceHash === currentContentHash);
  const selectedProduct: SelectedProduct | null = rawSelectedProduct
    ? {
        ...rawSelectedProduct,
        tags: Array.isArray(rawSelectedProduct.tags) ? rawSelectedProduct.tags : [],
        images:
          rawSelectedProduct?.images?.edges?.map((e: any) => e.node).filter(Boolean) ?? [],
        socialHooksCache: parsedSocialHooks,
        _contentHash: currentContentHash,
        _hooksSourceHash: hooksSourceHash || undefined,
        _hooksIsFresh: hooksIsFresh,
      }
    : null;

  // Fetch marketing templates for the content generator section
  let marketingTemplates: MarketingTemplate[] = [];
  try {
    const templatesRes = await fetch(
      `${backendApiUrl}/api/templates?category=marketing&shop=${encodeURIComponent(sessionShop)}`,
      { headers: { 'X-Shopify-Shop-Domain': sessionShop } },
    );
    if (templatesRes.ok) {
      const templatesData = await templatesRes.json();
      marketingTemplates = (templatesData.templates || []).filter(
        (t: MarketingTemplate) => t.category === 'marketing',
      );
    }
  } catch {
    // best-effort
  }

  return {
    planName,
    shop,
    shopSlug,
    backendApiUrl,
    pendingPlanName,
    pendingPlanEffectiveAt,
    lastPlanChangeType,
    lastPlanChangeAt,
    products,
    selectedProduct,
    contentHash: selectedProduct?._contentHash ?? null,
    didResetMetaCache,
    marketingTemplates,
  } satisfies LoaderData;
};

export const action = async ({request}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  const {admin} = await authenticate.admin(request);

  if (intent === 'saveSocialHooks') {
    const productId = String(formData.get('productId') || '');
    const value = String(formData.get('value') || '');
    if (!productId) return {ok: false, error: 'Missing productId'};
    if (!value) return {ok: false, error: 'Missing value'};

    // Stamp the current desc hash for this caption cache so we can invalidate it when description changes.
    let currentHash = '';
    try {
      const p = await admin.graphql(
        `query ProductDesc($id: ID!) { product(id: $id) { descriptionHtml } }`,
        {variables: {id: productId}},
      );
      const pj = await p.json();
      currentHash = descriptionHash(String(pj?.data?.product?.descriptionHtml ?? ''));
    } catch {
      currentHash = '';
    }

    // Ensure payload also carries the source description hash (back-compat friendly).
    let valueToSave = value;
    if (currentHash) {
      try {
        const obj = JSON.parse(valueToSave);
        if (obj && typeof obj === 'object') {
          obj.source_desc_hash = currentHash;
          valueToSave = JSON.stringify(obj);
        }
      } catch {
        // keep original value
      }
    }

    const resp = await admin.graphql(
      `mutation SetHooks($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: productId,
              namespace: 'crossborderagent',
              key: 'social_hooks_instagram',
              type: 'json',
              value: valueToSave,
            },
            ...(currentHash
              ? [
                  {
                    ownerId: productId,
                    namespace: 'crossborderagent',
                    key: 'social_hooks_instagram_desc_hash',
                    type: 'single_line_text_field',
                    value: currentHash,
                  },
                ]
              : []),
          ],
        },
      },
    );
    const body = await resp.json();
    const userErrors = body?.data?.metafieldsSet?.userErrors ?? [];
    if (userErrors.length) {
      return {ok: false, error: userErrors.map((e: any) => e.message).join('; ')};
    }
    return {ok: true};
  }

  return {ok: false, error: 'Unknown intent'};
};

/**
 * Parse a Python-style dict string (e.g. {'key': "value with 'quotes'"}).
 *
 * Python's str(dict) uses single-quoted keys but switches to double quotes
 * when a value contains single quotes. A naive replace-all-quotes approach
 * breaks on embedded quotes. This state-machine parser handles mixed styles.
 */
function parsePythonDict(raw: string): Record<string, any> | null {
  const s = raw.trim();
  if (!s.startsWith('{') || !s.endsWith('}')) return null;

  const inner = s.slice(1, -1);
  const result: Record<string, any> = {};
  let i = 0;

  function skip() {
    while (i < inner.length && /[\s]/.test(inner[i])) i++;
  }

  function readString(): string | null {
    const q = inner[i];
    if (q !== "'" && q !== '"') return null;
    i++; // opening quote
    let out = '';
    while (i < inner.length) {
      if (inner[i] === '\\' && i + 1 < inner.length) {
        out += inner[i + 1];
        i += 2;
      } else if (inner[i] === q) {
        i++; // closing quote
        return out;
      } else {
        out += inner[i];
        i++;
      }
    }
    return out; // unterminated — return what we have
  }

  while (i < inner.length) {
    skip();
    if (i >= inner.length) break;

    // ── key ──
    const key = readString();
    if (key === null) break;

    skip();
    if (inner[i] !== ':') break;
    i++; // skip ':'
    skip();

    // ── value ──
    const ch = inner[i];
    if (ch === "'" || ch === '"') {
      const val = readString();
      if (val !== null) result[key] = val;
    } else if (ch === '[') {
      // Array — collect until matching ']'
      let depth = 1;
      let arr = '[';
      i++;
      while (i < inner.length && depth > 0) {
        if (inner[i] === '[') depth++;
        else if (inner[i] === ']') depth--;
        arr += inner[i];
        i++;
      }
      try {
        result[key] = JSON.parse(arr.replace(/'/g, '"'));
      } catch {
        result[key] = arr;
      }
    } else if (ch === '{') {
      // Nested dict — skip for now, store as string
      let depth = 1;
      let sub = '{';
      i++;
      while (i < inner.length && depth > 0) {
        if (inner[i] === '{') depth++;
        else if (inner[i] === '}') depth--;
        sub += inner[i];
        i++;
      }
      const nested = parsePythonDict(sub);
      result[key] = nested ?? sub;
    } else {
      // Number / boolean / None
      let val = '';
      while (i < inner.length && inner[i] !== ',') {
        val += inner[i];
        i++;
      }
      const t = val.trim();
      if (t === 'True') result[key] = true;
      else if (t === 'False') result[key] = false;
      else if (t === 'None') result[key] = null;
      else if (!isNaN(Number(t)) && t !== '') result[key] = Number(t);
      else result[key] = t;
    }

    skip();
    if (i < inner.length && inner[i] === ',') i++; // skip ','
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Convert structured marketing JSON/Python-dict into merchant-ready HTML.
 *
 * Handles email (subject/preheader/body/cta_text), ad copy
 * (primary_text/headline/description/cta), Google Ads (headlines[]/descriptions[]),
 * and blog posts (title/meta_description/content/tags).
 */
function marketingJsonToHtml(raw: string): string {
  // 1. Try standard JSON
  let parsed: Record<string, any> | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 2. Fall back to Python-style dict parser (handles mixed quotes)
    parsed = parsePythonDict(raw);
  }

  if (!parsed || typeof parsed !== 'object') return raw;

  const parts: string[] = [];

  // ── Email templates (subject / preheader / body / cta_text) ───────
  if (parsed.subject) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:14px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Subject Line</p>` +
        `<p style="margin:0;font-size:16px;font-weight:600">${parsed.subject}</p>` +
      `</div>`,
    );
  }
  if (parsed.preheader) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:12px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Preheader</p>` +
        `<p style="margin:0;font-size:14px;color:#6d7175">${parsed.preheader}</p>` +
      `</div>`,
    );
  }
  if (parsed.body) {
    parts.push(
      `<div style="border:1px solid #e1e3e5;border-radius:8px;padding:20px;margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Email Body</p>` +
        `<div>${parsed.body}</div>` +
      `</div>`,
    );
  }
  if (parsed.cta_text) {
    parts.push(
      `<div style="text-align:center;margin:20px 0">` +
        `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${parsed.cta_text}</span>` +
      `</div>`,
    );
  }

  // ── Ad copy (primary_text / headline / description / cta) ─────────
  if (parsed.primary_text) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Primary Text</p>` +
        `<p style="margin:0;font-size:15px;line-height:1.6">${parsed.primary_text}</p>` +
      `</div>`,
    );
  }
  if (parsed.headline) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Headline</p>` +
        `<h3 style="margin:0;font-size:18px;font-weight:700">${parsed.headline}</h3>` +
      `</div>`,
    );
  }
  if (parsed.description && typeof parsed.description === 'string') {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Description</p>` +
        `<p style="margin:0;font-size:14px;line-height:1.5;color:#303030">${parsed.description}</p>` +
      `</div>`,
    );
  }
  if (parsed.cta && !parsed.cta_text) {
    parts.push(
      `<div style="text-align:center;margin:20px 0">` +
        `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${parsed.cta}</span>` +
      `</div>`,
    );
  }

  // ── Google Ads (headlines[] / descriptions[]) ─────────────────────
  if (Array.isArray(parsed.headlines)) {
    const rows = parsed.headlines
      .map((h: string, i: number) => `<li style="padding:6px 0;border-bottom:1px solid #ebebeb"><strong>H${i + 1}:</strong> ${h}</li>`)
      .join('');
    parts.push(
      `<div style="margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Headlines</p>` +
        `<ul style="list-style:none;padding:0;margin:0;border:1px solid #e1e3e5;border-radius:8px;padding:4px 14px">${rows}</ul>` +
      `</div>`,
    );
  }
  if (Array.isArray(parsed.descriptions)) {
    const rows = parsed.descriptions
      .map((d: string, i: number) => `<li style="padding:6px 0;border-bottom:1px solid #ebebeb"><strong>D${i + 1}:</strong> ${d}</li>`)
      .join('');
    parts.push(
      `<div style="margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Descriptions</p>` +
        `<ul style="list-style:none;padding:0;margin:0;border:1px solid #e1e3e5;border-radius:8px;padding:4px 14px">${rows}</ul>` +
      `</div>`,
    );
  }
  if (parsed.path1) {
    parts.push(`<p style="font-size:13px;color:#6d7175">Display URL: example.com/<strong>${parsed.path1}</strong>/${parsed.path2 || ''}</p>`);
  }

  // ── Blog post (title / meta_description / content / tags) ─────────
  if (parsed.title && parsed.content) {
    parts.push(`<h2 style="margin:0 0 8px">${parsed.title}</h2>`);
    if (parsed.meta_description) {
      parts.push(`<p style="font-size:13px;color:#6d7175;margin:0 0 16px"><em>Meta: ${parsed.meta_description}</em></p>`);
    }
    parts.push(parsed.content);
    if (Array.isArray(parsed.tags) && parsed.tags.length) {
      parts.push(`<p style="font-size:13px;color:#6d7175;margin-top:16px">Tags: ${parsed.tags.join(', ')}</p>`);
    }
  }

  // ── FAQs ──────────────────────────────────────────────────────────
  if (Array.isArray(parsed.faqs)) {
    const faqHtml = parsed.faqs
      .map((f: any) => `<div style="margin-bottom:12px"><h4 style="margin:0 0 4px">Q: ${f.question}</h4><p style="margin:0;color:#303030">A: ${f.answer}</p></div>`)
      .join('<hr style="border:none;border-top:1px solid #e1e3e5;margin:8px 0"/>');
    parts.push(faqHtml);
  }

  // ── Fallback: render any remaining unknown keys as labeled sections ─
  if (parts.length === 0) {
    const knownKeys = new Set([
      'subject', 'preheader', 'body', 'cta_text', 'cta',
      'primary_text', 'headline', 'description',
      'headlines', 'descriptions', 'path1', 'path2',
      'title', 'content', 'meta_description', 'tags', 'faqs',
    ]);
    for (const [key, val] of Object.entries(parsed)) {
      if (knownKeys.has(key) || val == null) continue;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const display = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
      parts.push(
        `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
          `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">${label}</p>` +
          `<p style="margin:0;font-size:15px;line-height:1.5">${display}</p>` +
        `</div>`,
      );
    }
    // Also render known keys that matched but weren't caught above
    // (handles case where e.g. only 'headline' exists without 'primary_text')
    for (const [key, val] of Object.entries(parsed)) {
      if (val == null || parts.length > 0) continue;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      parts.push(
        `<div style="padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:8px">` +
          `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">${label}</p>` +
          `<p style="margin:0;font-size:15px;line-height:1.5">${String(val)}</p>` +
        `</div>`,
      );
    }
  }

  return parts.join('') || raw;
}

/**
 * Renders a structured marketing result as editable rich HTML
 * using the same RichTextEditor as the Rewriter draft.
 */
function MarketingResultDisplay({
  content,
  onContentChange,
}: {
  content: string;
  onContentChange?: (html: string) => void;
}) {
  const html = useMemo(() => marketingJsonToHtml(content), [content]);
  const [editableHtml, setEditableHtml] = useState(html);

  // Sync when new content arrives (re-generation)
  useEffect(() => {
    setEditableHtml(html);
  }, [html]);

  const handleChange = useCallback(
    (next: string) => {
      setEditableHtml(next);
      onContentChange?.(next);
    },
    [onContentChange],
  );

  return (
    <RichTextEditor
      label="Generated Content"
      value={editableHtml}
      onChange={handleChange}
      height={320}
      helpText="Edit the generated content above, then copy to use in your store."
    />
  );
}

/**
 * Self-contained template card with one-click generate + inline result display.
 */
function MarketingTemplateCard({
  template,
  selectedProduct,
  shop,
  backendApiUrl,
  onToast,
  planName,
}: {
  template: MarketingTemplate;
  selectedProduct: SelectedProduct | null;
  shop: string;
  backendApiUrl: string;
  onToast: (msg: string) => void;
  planName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  // Track the live editable HTML so Copy grabs the edited version
  const editableHtmlRef = useRef<string>('');

  // Strip HTML tags for plain-text description
  const plainDesc = useMemo(() => {
    if (!selectedProduct?.descriptionHtml) return '';
    return selectedProduct.descriptionHtml.replace(/<[^>]*>/g, '').slice(0, 500);
  }, [selectedProduct?.descriptionHtml]);

  const handleGenerate = useCallback(async () => {
    if (!selectedProduct?.id) return;
    setLoading(true);
    setError(null);
    setResult(null);
    editableHtmlRef.current = '';
    try {
      const body: Record<string, string> = {
        title: selectedProduct.title,
        category: selectedProduct.productType || 'General',
        description: plainDesc,
        target_locale: 'en',
        product_id: selectedProduct.id,
      };

      // Template-specific extras
      if (template.id === 'marketing/email-launch') {
        body.launch_date = new Date().toISOString().split('T')[0];
      }
      if (template.id === 'marketing/ad-facebook') {
        body.platform = 'Facebook & Instagram';
      }
      if (template.id === 'marketing/email-welcome') {
        body.brand_name = shop.replace('.myshopify.com', '');
      }

      const resp = await fetch(
        `${backendApiUrl}/api/generate/${template.id}?shop=${encodeURIComponent(shop)}`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Shop-Domain': shop,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        const raw = typeof data.content === 'object'
          ? JSON.stringify(data.content)
          : (data.content || data.description || '');
        setResult(raw);
        setResultOpen(true);
        onToast(`${template.name} generated successfully!`);
      } else {
        setError(data.detail || data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, template, shop, backendApiUrl, plainDesc, onToast]);

  const handleCopy = useCallback(async () => {
    // Copy the latest edited HTML (or original result)
    const toCopy = editableHtmlRef.current || result || '';
    if (!toCopy) return;
    try {
      await navigator.clipboard.writeText(toCopy);
      onToast('Content copied to clipboard!');
    } catch {
      onToast('Copy failed (clipboard not available).');
    }
  }, [result, onToast]);

  const handlePublish = useCallback(async () => {
    if (!result || !selectedProduct?.id) return;
    setPublishing(true);
    try {
      const content = editableHtmlRef.current || result;
      const resp = await fetch(
        `${backendApiUrl}/api/publish?shop=${encodeURIComponent(shop)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Shop-Domain': shop },
          body: JSON.stringify({
            template_id: template.id,
            product_id: selectedProduct.id,
            content,
            context: { product_title: selectedProduct.title },
          }),
        },
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Publish failed: ${resp.status}`);
      }
      setPublished(true);
      onToast(`Published ${template.name} successfully!`);
    } catch (e: any) {
      onToast(`Publish failed: ${e?.message || e}`);
    } finally {
      setPublishing(false);
    }
  }, [result, selectedProduct, template, shop, backendApiUrl, onToast]);

  const isPro = planName === 'Pro';

  return (
    <Card>
      <Box padding="300">
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Tooltip content={template.description} width="wide">
              <Text as="h3" variant="headingMd">
                {template.name}
              </Text>
            </Tooltip>
            <Button
              onClick={handleGenerate}
              disabled={!selectedProduct?.id || loading}
              loading={loading}
            >
              {loading ? 'Generating…' : result ? 'Regenerate' : 'Generate'}
            </Button>
          </InlineStack>

          {error && <Banner tone="critical">{error}</Banner>}

          {result && (
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Button
                  variant="plain"
                  onClick={() => setResultOpen(!resultOpen)}
                  textAlign="start"
                >
                  {resultOpen ? '▾ Hide Result' : '▸ Show Result'}
                </Button>
                <InlineStack gap="200">
                  {isPro && !published && (
                    <Button
                      onClick={handlePublish}
                      variant="primary"
                      size="slim"
                      loading={publishing}
                      disabled={publishing}
                    >
                      Publish
                    </Button>
                  )}
                  {isPro && published && (
                    <Button variant="plain" size="slim" disabled tone="success">
                      ✓ Published
                    </Button>
                  )}
                  <Button onClick={handleCopy} variant="secondary" size="slim">
                    Copy
                  </Button>
                </InlineStack>
              </InlineStack>
              <Collapsible
                open={resultOpen}
                id={`result-${template.id}`}
                transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
              >
                <MarketingResultDisplay
                  content={result}
                  onContentChange={(html) => { editableHtmlRef.current = html; }}
                />
              </Collapsible>
            </BlockStack>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

export default function MarketingWorkspace() {
  const {planName, pendingPlanName, pendingPlanEffectiveAt, lastPlanChangeType, products, selectedProduct, shopSlug, shop, backendApiUrl, contentHash, didResetMetaCache, marketingTemplates} =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge();
  const navigate = useNavigate();
  
  const nav = (path: string) => {
    const params = new URLSearchParams(searchParams);
    if (shop) params.set("shop", shop);
    return params.toString() ? `${path}?${params.toString()}` : path;
  };

  const [showDowngradeBanner, setShowDowngradeBanner] = useState(true);

  // Instagram Marketing Assistant
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hooksError, setHooksError] = useState<string | null>(null);
  const [overlaySuggestions, setOverlaySuggestions] = useState<string[]>([]);
  const [hooks, setHooks] = useState<
    Array<{
      type: string;
      caption: string;
      hashtags: string[];
      overlay?: string;
      copy_text: string;
    }>
  >([]);
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const saveHooksFetcher = useFetcher<typeof action>();

  // Seasonal Campaign
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [seasonalError, setSeasonalError] = useState<string | null>(null);
  const [holidayInfo, setHolidayInfo] = useState<any | null>(null);
  const [seasonalCaptionLoading, setSeasonalCaptionLoading] = useState(false);
  const [seasonalCaptionError, setSeasonalCaptionError] = useState<string | null>(null);
  const [seasonalCaption, setSeasonalCaption] = useState<string>('');

  const [toastContent, setToastContent] = useState<string | null>(null);

  const selectedProductId = searchParams.get('productId') || (products[0]?.id ?? '');
  
  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));
  
  const handleProductChange = useCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("productId", productIdFromGid(value));
    setSearchParams(newParams);
    // Reset hooks state when product changes
    setHooks([]);
    setHooksError(null);
    setOverlaySuggestions([]);
    setSeasonalCaption("");
    setSeasonalCaptionError(null);
  }, [searchParams, setSearchParams]);
  const shopMarketingUrl = useMemo(() => {
    if (!shopSlug) return '';
    return `https://admin.shopify.com/store/${shopSlug}/marketing`;
  }, [shopSlug]);
  const shopCampaignsUrl = useMemo(() => {
    if (!shopSlug) return '';
    return `https://admin.shopify.com/store/${shopSlug}/marketing/campaigns`;
  }, [shopSlug]);

  const callAgent = useCallback(
    async (actionName: string, productData: Record<string, any>, context: Record<string, any>) => {
      let token: string | null = null;
      try {
        token = await getSessionToken(app as any);
      } catch {
        token = null;
      }

      // Use the backend API URL with shop parameter
      const url = new URL(`${backendApiUrl}/api/agent`);
      if (!token && shop) {
        url.searchParams.set("shop", shop);
      }

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify({
          action: actionName,
          context,
          product_data: productData,
        }),
        credentials: 'include',
      });

      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.status !== 'success') {
        const msg = result?.detail || 'Agent request failed';
        throw new Error(String(msg));
      }
      return result;
    },
    [app, backendApiUrl, shop],
  );

  const runSocialHooks = useCallback(async () => {
    if (!selectedProduct?.id) return;
    setHooksLoading(true);
    setHooksError(null);
    setOverlaySuggestions([]);
    setSeasonalCaptionError(null);
    setSeasonalCaptionLoading(true);
    
    const productData = {
      id: selectedProduct.id,
      title: selectedProduct.title,
      category: selectedProduct.productType,
      productType: selectedProduct.productType,
      tags: selectedProduct.tags,
    };

    // Run both calls independently so one failing doesn't block the other
    const [socialSettled, seasonalSettled] = await Promise.allSettled([
      callAgent('social_hook_architect', productData, {focus: 'Instagram Reels'}),
      callAgent('seasonal_campaign_caption', productData, {current_date: new Date().toISOString()}),
    ]);

    // Process social hooks
    if (socialSettled.status === 'fulfilled') {
      const socialResult = socialSettled.value;
      const nextHooks = (socialResult?.data?.metadata?.hooks ?? []) as any[];
      const overlays = (socialResult?.data?.metadata?.overlay_suggestions ?? []) as any[];
      const safeHooks = Array.isArray(nextHooks) ? nextHooks : [];
      const safeOverlays = Array.isArray(overlays) ? overlays.map(String) : [];
      setHooks(safeHooks);
      setOverlaySuggestions(safeOverlays);
      setSelectedHookIndex(0);

      // Persist cache on the product (Shopify metafield)
      try {
        const payload = JSON.stringify({
          hooks: safeHooks,
          overlay_suggestions: safeOverlays,
          generated_at: new Date().toISOString(),
        });
        const fd = new FormData();
        fd.set('intent', 'saveSocialHooks');
        fd.set('productId', selectedProduct.id);
        fd.set('value', payload);
        saveHooksFetcher.submit(fd, {method: 'post'});
      } catch {
        // best-effort; ignore cache write failures
      }
    } else {
      setHooksError(socialSettled.reason?.message ?? 'Failed to generate hooks.');
    }

    // Process seasonal caption
    if (seasonalSettled.status === 'fulfilled') {
      const seasonalResult = seasonalSettled.value;
      const text = String(
        seasonalResult?.data?.metadata?.copy_text ||
        seasonalResult?.data?.metadata?.caption ||
        seasonalResult?.data?.text ||
        ''
      );
      setSeasonalCaption(text);
    } else {
      setSeasonalCaptionError(seasonalSettled.reason?.message ?? 'Failed to generate seasonal caption.');
    }

    // Toast
    const hooksOk = socialSettled.status === 'fulfilled';
    const captionOk = seasonalSettled.status === 'fulfilled';
    if (hooksOk && captionOk) {
      setToastContent('Generated Instagram hooks and seasonal caption.');
    } else if (hooksOk) {
      setToastContent('Generated Instagram hooks (seasonal caption failed).');
    } else if (captionOk) {
      setToastContent('Generated seasonal caption (hooks failed).');
    }

    setHooksLoading(false);
    setSeasonalCaptionLoading(false);
  }, [callAgent, saveHooksFetcher, selectedProduct?.id, selectedProduct?.productType, selectedProduct?.tags, selectedProduct?.title]);

  const loadUpcomingHolidayOnce = useCallback(async () => {
    // Holiday window doesn't depend on product, so load once and keep the banner stable.
    setSeasonalLoading(true);
    setSeasonalError(null);
    try {
      const result = await callAgent(
        'seasonal_campaign_agent',
        {category: 'General', productType: 'General'},
        {current_date: new Date().toISOString()},
      );
      setHolidayInfo(result?.data?.metadata?.holiday ?? null);
      // Use the backend's decision on whether to show (within 6 weeks)
      setHolidayInfo((prev: any) => {
        const shouldShow = Boolean(result?.data?.metadata?.should_show);
        return prev ? {...prev, should_show: shouldShow} : {should_show: shouldShow};
      });
    } catch (e: any) {
      setSeasonalError(e?.message ?? 'Seasonal check failed.');
      setHolidayInfo(null);
    } finally {
      setSeasonalLoading(false);
    }
  }, [callAgent]);

  // Reset seasonal caption immediately when product changes (seasonal captions are not cached)
  useEffect(() => {
    setSeasonalCaption("");
    setSeasonalCaptionError(null);
  }, [selectedProduct?.id]);

  // Load cached hooks when product changes (display but allow regeneration)
  useEffect(() => {
    // Reset hooks state
    setHooks([]);
    setHooksError(null);
    setSeasonalError(null);
    setOverlaySuggestions([]);
    
    // If no product selected, we're done
    if (!selectedProduct?.id) return;
    
    // Load cached hooks if present (display but allow regeneration)
    const cached = selectedProduct.socialHooksCache;
    if (cached?.hooks?.length) {
      setHooks(cached.hooks);
      setOverlaySuggestions(Array.isArray(cached.overlay_suggestions) ? cached.overlay_suggestions : []);
      setSelectedHookIndex(0);
    }
    // Note: Seasonal captions are not cached in metafields, so they must be regenerated for each product
    if (didResetMetaCache) {
      setToastContent('Product description changed. Please generate hooks again.');
    }
  }, [selectedProduct?.id, contentHash, didResetMetaCache]);

  // Load holiday banner once per page load
  useEffect(() => {
    if (holidayInfo) return;
    loadUpcomingHolidayOnce();
  }, [holidayInfo, loadUpcomingHolidayOnce]);

  const copyHook = async (idx: number) => {
    const h = hooks[idx];
    if (!h?.copy_text) return;
    try {
      await navigator.clipboard.writeText(h.copy_text);
      setSelectedHookIndex(idx);
      setToastContent(`Copied ${h.type} hook.`);
    } catch {
      setToastContent('Copy failed (clipboard not available).');
    }
  };

  const seasonalForSelectedProduct = useMemo(() => {
    const h = holidayInfo;
    if (!selectedProduct?.id || !h?.name || !h?.date) return null;
    const year = Number(String(h.date).slice(0, 4)) || new Date().getFullYear();
    const category = selectedProduct.productType || 'General';
    const title = `${h.name} ${category} Campaign`;
    const code = discountCodeName(h.name, category, year);
    const shouldShow = Boolean(h.should_show);
    return {
      should_show: shouldShow,
      holiday: {name: h.name, date: h.date, days_until: h.days_until},
      campaign: {title, discount_code_name: code},
    };
  }, [holidayInfo, selectedProduct?.id, selectedProduct?.productType]);

  return (
    <Page 
      title="Marketing Consultant"
      backAction={{
        content: "Home",
        onAction: () => navigate(nav("/app")),
      }}
    >
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

      {showDowngradeBanner ? (
        <div style={{marginBottom: 16}}>
          <DowngradeScheduledBanner
            currentPlanName={String(planName)}
            pendingPlanName={pendingPlanName}
            pendingPlanEffectiveAt={pendingPlanEffectiveAt}
            lastPlanChangeType={lastPlanChangeType}
            dismissible
            onDismiss={() => setShowDowngradeBanner(false)}
          />
        </div>
      ) : null}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Product Selection Card - Similar to SEO page */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Select Product</Text>
                <Select label="Product" labelHidden options={productOptions} value={selectedProduct?.id || ""} onChange={handleProductChange} />
                {selectedProduct && (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="agent-btn-border-5">
                      <Button
                        onClick={runSocialHooks}
                        disabled={!selectedProduct?.id || hooksLoading}
                        variant="primary"
                        size="large"
                        loading={hooksLoading}
                      >
                        {hooksLoading
                          ? 'Generating…'
                          : hooks.length
                            ? 'Regenerate'
                            : 'Generate'}
                      </Button>
                    </div>
                  </div>
                )}
              </BlockStack>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">
                      Social Media Captions
                    </Text>
                    <InlineStack gap="200" blockAlign="center">
                      <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram" style={{display: 'inline-flex'}}>
                        <img src="/instagram.svg" alt="Instagram" width={20} height={20} style={{width: 20, height: 20, borderRadius: 4}} />
                      </a>
                      <a href="https://www.tiktok.com/creator-center/upload" target="_blank" rel="noopener noreferrer" title="TikTok" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                      </a>
                      <a href="https://timeline.line.me/" target="_blank" rel="noopener noreferrer" title="LINE" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#00B900"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                      </a>
                      <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" title="Facebook" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                      <a href="https://channels.weixin.qq.com/" target="_blank" rel="noopener noreferrer" title="WeChat" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#07C160"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.139.045c.133 0 .241-.108.241-.243 0-.06-.023-.118-.039-.177l-.326-1.233a.49.49 0 01.178-.553C23.028 18.443 24 16.706 24 14.813c0-3.381-3.058-6.118-7.062-5.955zm-1.834 2.89c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.857 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/></svg>
                      </a>
                      <a href="https://www.snapchat.com/" target="_blank" rel="noopener noreferrer" title="Snapchat" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.49.49 0 01.172-.03c.27 0 .48.12.55.254.12.209.015.553-.301.804-.42.326-1.378.658-1.652.814-.167.095-.27.213-.276.416-.014.302.168.599.381.928l.024.036c.96 1.43 2.013 2.305 3.162 2.611a.96.96 0 01.646.539c.108.267-.033.548-.09.675-.301.674-1.147 1.073-2.59 1.224-.066.008-.131.047-.136.165l-.007.123c-.01.127-.019.25-.03.377a.45.45 0 01-.359.378c-.195.047-.396.072-.6.072-.224 0-.45-.022-.677-.068-.657-.135-1.236.12-1.935.399l-.116.047c-.66.27-1.406.577-2.367.577-.028 0-.057 0-.085-.002-.92.019-1.662-.283-2.337-.561l-.152-.062c-.71-.283-1.293-.534-1.955-.397a3.975 3.975 0 01-.677.068c-.204 0-.405-.025-.6-.072a.45.45 0 01-.359-.378c-.01-.127-.02-.25-.03-.377l-.007-.123c-.005-.118-.07-.157-.136-.165-1.443-.151-2.289-.55-2.59-1.224-.057-.127-.198-.408-.09-.675a.96.96 0 01.646-.539c1.149-.306 2.202-1.181 3.162-2.611l.024-.036c.213-.329.395-.626.381-.928-.006-.203-.109-.32-.276-.416-.274-.156-1.232-.488-1.652-.814-.316-.251-.421-.595-.301-.804.07-.134.28-.254.55-.254a.49.49 0 01.172.03c.374.181.733.285 1.033.301.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/></svg>
                      </a>
                      <a href="https://www.threads.net/" target="_blank" rel="noopener noreferrer" title="Threads" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.082-1.146 3.48-1.206 1.007-.044 1.946.052 2.813.266-.07-.838-.316-1.457-.732-1.848-.478-.45-1.228-.673-2.227-.673h-.057c-.768.007-1.666.196-2.275.524l-.963-1.719c.906-.487 2.12-.741 3.296-.746h.082c1.488 0 2.659.404 3.476 1.199.772.75 1.227 1.845 1.336 3.226.392.142.762.31 1.108.5 1.199.658 2.095 1.598 2.59 2.725.628 1.432.663 3.972-1.452 6.038-1.798 1.756-4.02 2.537-7.186 2.56zm-.136-6.318c.071 0 .141-.002.211-.006 1.05-.057 2.27-.48 2.655-1.858a4.308 4.308 0 00-.01-.964c-.833-.242-1.736-.36-2.715-.317-.9.04-1.649.27-2.165.665-.473.363-.693.826-.66 1.377.052.878.76 1.103 2.684 1.103z"/></svg>
                      </a>
                      <a href="https://twitter.com/compose/tweet" target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={{display: 'inline-flex'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    </InlineStack>
                  </InlineStack>

                  {hooksError ? <Banner tone="critical">{hooksError}</Banner> : null}

                  {!hooks.length && !hooksLoading ? (
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Generate social media captions with different themes
                    </Text>
                  ) : null}

                  {hooks.length ? (
                    <BlockStack gap="200">
                      {hooks.map((h, idx) => (
                        <Card key={`${h.type}-${idx}`}>
                          <Box padding="300">
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="h3" variant="headingSm">
                                  {h.type}
                                </Text>
                                <Button onClick={() => copyHook(idx)} variant="primary">
                                  Copy
                                </Button>
                              </InlineStack>
                              <Text as="p">{h.caption}</Text>
                              <Text as="p" tone="subdued">
                                {(h.hashtags || []).join(' ')}
                              </Text>
                              {idx === selectedHookIndex ? (
                                <Text as="p" tone="success">
                                  Selected
                                </Text>
                              ) : null}
                            </BlockStack>
                          </Box>
                        </Card>
                      ))}
                    </BlockStack>
                  ) : null}
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">
                      Seasonal Campaign
                    </Text>
                    <Button
                      onClick={loadUpcomingHolidayOnce}
                      disabled={!selectedProduct?.id}
                    >
                      {seasonalLoading ? 'Checking…' : 'Re-check'}
                    </Button>
                  </InlineStack>

                  {seasonalError ? <Banner tone="critical">{seasonalError}</Banner> : null}

                  {seasonalLoading ? (
                    <Text as="p" tone="subdued">
                      Checking upcoming holidays…
                    </Text>
                  ) : seasonalForSelectedProduct?.should_show ? (
                    <Banner tone="success">
                      Upcoming: {seasonalForSelectedProduct?.holiday?.name} in {seasonalForSelectedProduct?.holiday?.days_until} days. Suggested campaign:{' '}
                      <strong>{seasonalForSelectedProduct?.campaign?.title}</strong> (code: {seasonalForSelectedProduct?.campaign?.discount_code_name})
                    </Banner>
                  ) : (
                    <Banner tone="info">
                      No major US holiday within 6 weeks for this product category.
                    </Banner>
                  )}

                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" tone="subdued">
                      Create the campaign in Shopify using the suggested title/code above.
                    </Text>

                    {shopCampaignsUrl ? (
                      <Button url={shopCampaignsUrl} external variant="primary">
                        Open Campaigns
                      </Button>
                    ) : shopMarketingUrl ? (
                      <Button url={shopMarketingUrl} external variant="primary">
                        Open Marketing
                      </Button>
                    ) : null}
                  </InlineStack>

                  <Divider />

                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingSm">
                      Seasonal caption
                    </Text>
                    <Button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(seasonalCaption || '');
                          setToastContent('Caption copied.');
                        } catch {
                          setToastContent('Copy failed (clipboard not available).');
                        }
                      }}
                      disabled={!seasonalCaption}
                      variant="secondary"
                    >
                      Copy
                    </Button>
                  </InlineStack>

                  {seasonalCaptionError ? <Banner tone="critical">{seasonalCaptionError}</Banner> : null}
                  {seasonalCaptionLoading ? (
                    <Text as="p" tone="subdued">
                      Generating seasonal caption…
                    </Text>
                  ) : seasonalCaption ? (
                    <Card>
                      <Box padding="300">
                        <Text as="p">{seasonalCaption}</Text>
                      </Box>
                    </Card>
                  ) : (
                    <Text as="p" tone="subdued">
                      Click "Generate" above to create social hooks and a seasonal caption.
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Marketing Content Generator — One-Click Templates */}
        {marketingTemplates.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">
                      Marketing Content Generator
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Select a product above, then click Generate to create content instantly using your brand voice.
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="400">
                    {marketingTemplates.map((template) => (
                      <MarketingTemplateCard
                        key={template.id}
                        template={template}
                        selectedProduct={selectedProduct}
                        shop={shop}
                        backendApiUrl={backendApiUrl}
                        onToast={setToastContent}
                        planName={planName}
                      />
                    ))}
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
