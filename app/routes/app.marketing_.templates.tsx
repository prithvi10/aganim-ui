import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useSearchParams, useNavigate } from 'react-router';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import { RichTextEditor } from '../components/RichTextEditor';
import { type Entitlements, type FeatureUsageMap } from '../utils/entitlements';
import '../styles/optimize-button.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductListItem = { id: string; title: string };
type ProductImage = { url: string; altText?: string | null };
type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  images: ProductImage[];
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
  backendApiUrl: string;
  products: ProductListItem[];
  selectedProduct: SelectedProduct | null;
  marketingTemplates: MarketingTemplate[];
  entitlements: Entitlements;
  feature_usage: FeatureUsageMap;
  defaultTargetLocale?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return '';
  return String(gid).split('/').pop() ?? '';
}

function planTierFromName(name: string): LoaderData['planName'] {
  const n = String(name ?? '').toLowerCase();
  if (/\bpro\b/.test(n)) return 'Pro';
  if (/\bstandard\b/.test(n)) return 'Standard';
  if (/\bbasic\b/.test(n)) return 'Basic';
  return 'Free';
}

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
    i++;
    let out = '';
    while (i < inner.length) {
      if (inner[i] === '\\' && i + 1 < inner.length) {
        out += inner[i + 1];
        i += 2;
      } else if (inner[i] === q) {
        i++;
        return out;
      } else {
        out += inner[i];
        i++;
      }
    }
    return out;
  }

  while (i < inner.length) {
    skip();
    if (i >= inner.length) break;

    const key = readString();
    if (key === null) break;

    skip();
    if (inner[i] !== ':') break;
    i++;
    skip();

    const ch = inner[i];
    if (ch === "'" || ch === '"') {
      const val = readString();
      if (val !== null) result[key] = val;
    } else if (ch === '[') {
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
    if (i < inner.length && inner[i] === ',') i++;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function marketingJsonToHtml(raw: string): string {
  let parsed: Record<string, any> | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = parsePythonDict(raw);
  }

  if (!parsed || typeof parsed !== 'object') return raw;

  const parts: string[] = [];

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
    const bodyStr = String(parsed.body);
    const bodyHasButton = /<(a|button)\b/i.test(bodyStr) ||
      /background[^;]*#[0-9a-fA-F]/i.test(bodyStr) && /padding/i.test(bodyStr) && /border-radius/i.test(bodyStr);
    parts.push(
      `<div style="border:1px solid #e1e3e5;border-radius:8px;padding:20px;margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Email Body</p>` +
        `<div>${bodyStr}</div>` +
      `</div>`,
    );
    if (parsed.cta_text && !bodyHasButton) {
      parts.push(
        `<div style="text-align:center;margin:20px 0">` +
          `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${parsed.cta_text}</span>` +
        `</div>`,
      );
    }
  } else if (parsed.cta_text) {
    parts.push(
      `<div style="text-align:center;margin:20px 0">` +
        `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${parsed.cta_text}</span>` +
      `</div>`,
    );
  }

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

  if (Array.isArray(parsed.faqs)) {
    const faqHtml = parsed.faqs
      .map((f: any) => `<div style="margin-bottom:12px"><h4 style="margin:0 0 4px">Q: ${f.question}</h4><p style="margin:0;color:#303030">A: ${f.answer}</p></div>`)
      .join('<hr style="border:none;border-top:1px solid #e1e3e5;margin:8px 0"/>');
    parts.push(faqHtml);
  }

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MarketingResultDisplay({
  content,
  onContentChange,
}: {
  content: string;
  onContentChange?: (html: string) => void;
}) {
  const html = useMemo(() => marketingJsonToHtml(content), [content]);
  const [editableHtml, setEditableHtml] = useState(html);

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

function MarketingTemplateCard({
  template,
  selectedProduct,
  shop,
  backendApiUrl,
  onToast,
  planName,
  entitlements,
  defaultTargetLocale,
}: {
  template: MarketingTemplate;
  selectedProduct: SelectedProduct | null;
  shop: string;
  backendApiUrl: string;
  onToast: (msg: string) => void;
  planName?: string;
  entitlements: Entitlements;
  defaultTargetLocale?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const editableHtmlRef = useRef<string>('');

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
        target_locale: defaultTargetLocale || 'en',
        product_id: selectedProduct.id,
      };

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

  const handleCopyText = useCallback(async () => {
    const html = editableHtmlRef.current || result || '';
    if (!html) return;
    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
    try {
      await navigator.clipboard.writeText(plain);
      onToast('Text copied to clipboard!');
    } catch {
      onToast('Copy failed (clipboard not available).');
    }
  }, [result, onToast]);

  const handleCopyHtml = useCallback(async () => {
    const html = editableHtmlRef.current || result || '';
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      onToast('HTML copied to clipboard!');
    } catch {
      onToast('Copy failed (clipboard not available).');
    }
  }, [result, onToast]);


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
                  <Button onClick={handleCopyText} variant="secondary" size="slim">
                    Copy Text
                  </Button>
                  <Button onClick={handleCopyHtml} variant="secondary" size="slim">
                    Copy HTML
                  </Button>
                </InlineStack>
              </InlineStack>
              <Collapsible
                open={resultOpen}
                id={`result-${template.id}`}
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
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

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';
  const selectedProductIdParam = url.searchParams.get('productId') || '';

  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  const usingOfflineClient = Boolean(offlineContext);
  let sessionShop = '';
  let graphqlQuery: (query: string, variables?: Record<string, any>) => Promise<any>;

  if (offlineContext) {
    sessionShop = offlineContext.session.shop;
    graphqlQuery = async (query) => {
      const resp = await offlineContext.client.query({ data: query });
      return resp?.body;
    };
  } else {
    const { admin, session } = await authenticate.admin(request);
    sessionShop = session.shop;
    graphqlQuery = async (query, variables) => {
      const resp = await admin.graphql(query, { variables });
      return await resp.json();
    };
  }

  const shop = sessionShop;
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://shopify-translator-api.onrender.com';

  // Plan detection
  const planQuery = `query AppPlan {
    appInstallation {
      activeSubscriptions { name status }
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
    graphqlQuery(productsQuery, usingOfflineClient ? undefined : { first: 50 }),
  ]);

  const activeSubs: Array<{ name: string; status: string }> =
    planRes?.data?.appInstallation?.activeSubscriptions ?? [];
  const tiers = activeSubs
    .filter((s) => {
      const st = String(s.status || '').toUpperCase();
      return !st || st === 'ACTIVE' || st === 'PENDING';
    })
    .map((s) => planTierFromName(String(s.name || '')));
  let planName: LoaderData['planName'] =
    tiers.includes('Pro') ? 'Pro' : tiers.includes('Standard') ? 'Standard' : tiers.includes('Basic') ? 'Basic' : 'Free';

  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
  let defaultTargetLocale: string | undefined = undefined;
  try {
    const u = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(sessionShop)}`);
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      const eff = String(data?.effective_plan_name || '').trim();
      if (eff === 'Free' || eff === 'Basic' || eff === 'Standard' || eff === 'Pro') {
        planName = eff as LoaderData['planName'];
      }
      entitlements = data.entitlements || {};
      feature_usage = data.feature_usage || {};
      defaultTargetLocale = data.default_target_locale ?? undefined;
    }
  } catch {
    // best-effort
  }

  const products: ProductListItem[] =
    productsRes?.data?.products?.edges?.map((e: any) => e.node) ?? [];

  const fallbackSelected = firstOrNull(products)?.id ?? '';
  let selectedProductId = selectedProductIdParam || fallbackSelected;
  if (selectedProductId && !selectedProductId.startsWith('gid://')) {
    selectedProductId = `gid://shopify/Product/${selectedProductId}`;
  }

  const selectedProductRes = selectedProductId
    ? usingOfflineClient
      ? await graphqlQuery(
          `query Product {
            product(id: "${String(selectedProductId).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}") {
              id title descriptionHtml productType tags
              images(first: 6) { edges { node { url altText } } }
            }
          }`,
        )
      : await graphqlQuery(
          `query Product($id: ID!) {
            product(id: $id) {
              id title descriptionHtml productType tags
              images(first: 6) { edges { node { url altText } } }
            }
          }`,
          { id: selectedProductId },
        )
    : null;

  const rawSelectedProduct = selectedProductRes?.data?.product ?? null;
  const selectedProduct: SelectedProduct | null = rawSelectedProduct
    ? {
        ...rawSelectedProduct,
        tags: Array.isArray(rawSelectedProduct.tags) ? rawSelectedProduct.tags : [],
        images: rawSelectedProduct?.images?.edges?.map((e: any) => e.node).filter(Boolean) ?? [],
      }
    : null;

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
    backendApiUrl,
    products,
    selectedProduct,
    marketingTemplates,
    entitlements,
    feature_usage,
    defaultTargetLocale,
  } satisfies LoaderData;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketingTemplates() {
  const { planName, shop, backendApiUrl, products, selectedProduct, marketingTemplates, entitlements, feature_usage, defaultTargetLocale } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const nav = (path: string) => {
    const [basePath, existingQs] = path.split('?');
    const params = new URLSearchParams(existingQs || '');
    const sp = new URLSearchParams(searchParams);
    sp.forEach((v, k) => { if (!params.has(k)) params.set(k, v); });
    if (shop) params.set('shop', shop);
    return params.toString() ? `${basePath}?${params.toString()}` : basePath;
  };

  const [toastContent, setToastContent] = useState<string | null>(null);

  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));

  const handleProductChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('productId', productIdFromGid(value));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  return (
    <Page
      title="Marketing Templates"
      backAction={{
        content: 'Marketing',
        onAction: () => navigate(nav('/app/marketing')),
      }}
    >
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Product Selection */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Select Product
                </Text>
                <Select
                  label="Product"
                  labelHidden
                  options={productOptions}
                  value={selectedProduct?.id || ''}
                  onChange={handleProductChange}
                />
              </BlockStack>
            </Card>

            {/* Marketing Content Generator */}
            {marketingTemplates.length > 0 && (
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
                          entitlements={entitlements}
                          defaultTargetLocale={defaultTargetLocale}
                        />
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Box>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
