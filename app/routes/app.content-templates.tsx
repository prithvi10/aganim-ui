import type {LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useNavigate, useSearchParams} from 'react-router';
import {useTranslation} from 'react-i18next';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Collapsible,
  Divider,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  TextField,
  Toast,
  Tooltip,
} from '@shopify/polaris';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {authenticate, getOfflineGraphqlClient} from '../shopify.server';
import {PlanGateBadge} from '../components/PlanGateBadge';
import {ProductImageUploader} from '../components/ProductImageUploader';
import {RichTextEditor} from '../components/RichTextEditor';
import {canAccess, formatUsage, type Entitlements, type FeatureUsageMap} from '../utils/entitlements';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductListItem = {id: string; title: string};

type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
};

type ContentTemplate = {
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
  shop: string;
  backendApiUrl: string;
  products: ProductListItem[];
  selectedProduct: SelectedProduct | null;
  templates: ContentTemplate[];
  planName: string;
  entitlements: Entitlements;
  feature_usage: FeatureUsageMap;
  defaultTargetLocale?: string;
};

// ─── Display name overrides ───────────────────────────────────────────────────

const TEMPLATE_DISPLAY_NAMES: Record<string, string> = {
  'product/landing-hero': 'Hero Section',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return '';
  return String(gid).split('/').pop() ?? '';
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({request}: LoaderFunctionArgs) => {
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
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://aganim-api.onrender.com';

  // Fetch products
  const productsQuery = usingOfflineClient
    ? `query Products { products(first: 50, sortKey: TITLE) { edges { node { id title } } } }`
    : `query Products($first: Int!) { products(first: $first, sortKey: TITLE) { edges { node { id title } } } }`;

  const productsRes = await graphqlQuery(
    productsQuery,
    usingOfflineClient ? undefined : {first: 50},
  );

  const products: ProductListItem[] =
    productsRes?.data?.products?.edges?.map((e: any) => e.node) ?? [];

  // Determine selected product
  const fallbackId = products[0]?.id ?? '';
  let selectedProductId = selectedProductIdParam || fallbackId;
  if (selectedProductId && !selectedProductId.startsWith('gid://')) {
    selectedProductId = `gid://shopify/Product/${selectedProductId}`;
  }

  // Fetch selected product details
  const selectedProductRes = selectedProductId
    ? usingOfflineClient
      ? await graphqlQuery(
          `query Product {
            product(id: "${String(selectedProductId).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}") {
              id title descriptionHtml productType tags
            }
          }`,
        )
      : await graphqlQuery(
          `query Product($id: ID!) {
            product(id: $id) { id title descriptionHtml productType tags }
          }`,
          {id: selectedProductId},
        )
    : null;

  const rawProduct = selectedProductRes?.data?.product ?? null;
  const selectedProduct: SelectedProduct | null = rawProduct
    ? {
        ...rawProduct,
        tags: Array.isArray(rawProduct.tags) ? rawProduct.tags : [],
      }
    : null;

  // Fetch product templates
  let templates: ContentTemplate[] = [];
  try {
    const templatesRes = await fetch(
      `${backendApiUrl}/api/templates?category=product&shop=${encodeURIComponent(shop)}`,
      {headers: {'X-Shopify-Shop-Domain': shop}},
    );
    if (templatesRes.ok) {
      const templatesData = await templatesRes.json();
      templates = (templatesData.templates || []).filter(
        (t: ContentTemplate) => t.category === 'product',
      );
    }
  } catch {
    // best-effort
  }

  // Fetch plan name and entitlements from backend
  let planName = 'Free';
  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
  let defaultTargetLocale: string | undefined = undefined;
  try {
    const usageResp = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shop)}`);
    if (usageResp.ok) {
      const usageData = await usageResp.json();
      planName = String(usageData.effective_plan_name || usageData.plan_name || 'Free').trim() || 'Free';
      entitlements = usageData.entitlements || {};
      feature_usage = usageData.feature_usage || {};
      defaultTargetLocale = usageData.default_target_locale ?? undefined;
    }
  } catch {
    // best-effort
  }

  return {shop, backendApiUrl, products, selectedProduct, templates, planName, entitlements, feature_usage, defaultTargetLocale} satisfies LoaderData;
};

// ─── Python dict parser (handles mixed single/double quotes) ──────────────────

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

function parsePythonList(raw: string): any[] | null {
  const s = raw.trim();
  if (!s.startsWith('[') || !s.endsWith(']')) return null;

  const inner = s.slice(1, -1).trim();
  if (!inner) return [];

  const items: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;

    if (ch === ',' && depth === 0) {
      items.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) items.push(current.trim());

  const result: any[] = [];
  for (const item of items) {
    const parsed = parsePythonDict(item);
    if (parsed) result.push(parsed);
  }
  return result.length > 0 ? result : null;
}

// ─── JSON → HTML converter for product template output ────────────────────────

function contentJsonToHtml(raw: string, heroUrl?: string | null): string {
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = parsePythonDict(raw);
    if (!parsed) {
      const arr = parsePythonList(raw);
      if (arr) {
        const looksLikeFaqs = arr.length > 0 && arr[0].question && arr[0].answer;
        parsed = looksLikeFaqs ? { faqs: arr } : arr;
      }
    }
  }

  if (Array.isArray(parsed)) {
    const looksLikeFaqs = parsed.length > 0 && parsed[0]?.question && parsed[0]?.answer;
    parsed = looksLikeFaqs ? { faqs: parsed } : { items: parsed };
  }

  if (!parsed || typeof parsed !== 'object') return raw;

  const parts: string[] = [];

  // Hero image (prepend when available)
  const heroImgHtml = heroUrl
    ? `<div style="margin-bottom:16px;border-radius:8px;overflow:hidden"><img src="${heroUrl}" alt="Hero banner" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block" /></div>`
    : '';

  // FAQs (no hero image)
  if (Array.isArray(parsed.faqs)) {
    parts.push(
      `<p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Frequently Asked Questions</p>`,
    );
    parsed.faqs.forEach((f: any, idx: number) => {
      parts.push(
        `<div style="border:1px solid #e1e3e5;border-radius:8px;padding:14px 18px;margin-bottom:10px">` +
          `<h4 style="margin:0 0 6px;font-size:15px;font-weight:600">Q${idx + 1}: ${f.question}</h4>` +
          `<p style="margin:0;font-size:14px;line-height:1.5;color:#303030">${f.answer}</p>` +
        `</div>`,
      );
    });
  }

  // Landing page hero (check BEFORE collection to avoid `description` fallback collision)
  if (parsed.headline && !parsed.faqs) {
    if (heroImgHtml && parts.length === 0) parts.push(heroImgHtml);
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Headline</p>` +
        `<h2 style="margin:0;font-size:22px;font-weight:700">${parsed.headline}</h2>` +
      `</div>`,
    );
  }
  if (parsed.subheadline) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Sub-headline</p>` +
        `<p style="margin:0;font-size:16px;line-height:1.5">${parsed.subheadline}</p>` +
      `</div>`,
    );
  }
  if (parsed.hero_description) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Hero Description</p>` +
        `<p style="margin:0;font-size:15px;line-height:1.6">${parsed.hero_description}</p>` +
      `</div>`,
    );
  }
  if (parsed.cta_text || parsed.cta) {
    const ctaLabel = parsed.cta_text || parsed.cta;
    parts.push(
      `<div style="text-align:center;margin:20px 0">` +
        `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${ctaLabel}</span>` +
      `</div>`,
    );
  }
  if (Array.isArray(parsed.social_proof) && parsed.social_proof.length) {
    const proofItems = parsed.social_proof
      .map((s: string) => `<li style="padding:4px 0;font-size:14px;color:#303030">${s}</li>`)
      .join('');
    parts.push(
      `<div style="margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Social Proof</p>` +
        `<ul style="margin:0;padding-left:18px">${proofItems}</ul>` +
      `</div>`,
    );
  }

  // Collection description (only when there's no headline — avoids collision with hero fallback)
  if (parsed.description && !parsed.faqs && !parsed.body_html && !parsed.headline) {
    if (heroImgHtml && parts.length === 0) parts.push(heroImgHtml);
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Collection Description</p>` +
        `<div style="font-size:15px;line-height:1.6">${parsed.description}</div>` +
      `</div>`,
    );
  }
  if (parsed.meta_description && !parsed.body_html && !parsed.headline) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:12px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">SEO Meta Description</p>` +
        `<p style="margin:0;font-size:14px;color:#6d7175">${parsed.meta_description}</p>` +
      `</div>`,
    );
  }

  // Blog post
  if (parsed.title && parsed.body_html) {
    if (heroImgHtml) parts.push(heroImgHtml);
    parts.push(`<h2 style="margin:0 0 8px;font-size:22px">${parsed.title}</h2>`);
    if (parsed.meta_description) {
      parts.push(
        `<div style="background:#f6f6f7;border-radius:8px;padding:10px 16px;margin-bottom:14px">` +
          `<p style="margin:0;font-size:13px;color:#6d7175"><em>Meta: ${parsed.meta_description}</em></p>` +
        `</div>`,
      );
    }
    parts.push(`<div style="font-size:15px;line-height:1.7">${parsed.body_html}</div>`);
    if (Array.isArray(parsed.tags) && parsed.tags.length) {
      parts.push(
        `<p style="font-size:13px;color:#6d7175;margin-top:16px">Tags: ${parsed.tags.join(', ')}</p>`,
      );
    }
  }

  // Fallback
  if (parts.length === 0) {
    if (heroImgHtml) parts.push(heroImgHtml);
    for (const [key, val] of Object.entries(parsed)) {
      if (val == null) continue;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const display = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
      parts.push(
        `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
          `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">${label}</p>` +
          `<div style="font-size:15px;line-height:1.5">${display}</div>` +
        `</div>`,
      );
    }
  }

  return parts.join('') || raw;
}

// ─── Result Display with RichTextEditor ───────────────────────────────────────

function ContentResultDisplay({
  content,
  heroUrl,
  onContentChange,
}: {
  content: string;
  heroUrl?: string | null;
  onContentChange?: (html: string) => void;
}) {
  const { t } = useTranslation();
  const html = useMemo(() => contentJsonToHtml(content, heroUrl), [content, heroUrl]);
  const [editableHtml, setEditableHtml] = useState(html);

  useEffect(() => {
    setEditableHtml(html);
    onContentChange?.(html);
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
      label={t('contentTemplates.generatedContent')}
      value={editableHtml}
      onChange={handleChange}
      height={320}
      helpText={t('contentTemplates.editGeneratedContent')}
    />
  );
}

// ─── Shared result + actions block ────────────────────────────────────────────

function ResultBlock({
  templateId,
  templateName,
  result,
  heroUrl,
  resultOpen,
  setResultOpen,
  canPublish,
  published,
  publishing,
  handlePublish,
  handleCopy,
  editableHtmlRef,
  publishLabel,
}: {
  templateId: string;
  templateName: string;
  result: string;
  heroUrl: string | null;
  resultOpen: boolean;
  setResultOpen: (v: boolean) => void;
  canPublish: boolean;
  published: boolean;
  publishing: boolean;
  handlePublish: () => void;
  handleCopy: () => void;
  editableHtmlRef: React.MutableRefObject<string>;
  publishLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <BlockStack gap="200">
      <InlineStack align="space-between" blockAlign="center">
        <Button variant="plain" onClick={() => setResultOpen(!resultOpen)} textAlign="start">
          {resultOpen ? t('contentTemplates.hideResult') : t('contentTemplates.showResult')}
        </Button>
        <InlineStack gap="200">
          {canPublish && !published && (
            <Button onClick={handlePublish} variant="primary" size="slim" loading={publishing} disabled={publishing}>
              {publishLabel || t('contentTemplates.publishToShopify')}
            </Button>
          )}
          {canPublish && published && (
            <Button variant="plain" size="slim" disabled tone="success">
              ✓ {t('contentTemplates.published')}
            </Button>
          )}
          {!canPublish && <PlanGateBadge tierName="Pro" />}
          <Button onClick={handleCopy} variant="secondary" size="slim">
            {t('contentTemplates.copy')}
          </Button>
        </InlineStack>
      </InlineStack>
      <Collapsible open={resultOpen} id={`result-${templateId}`} transition={{duration: '200ms', timingFunction: 'ease-in-out'}}>
        <ContentResultDisplay
          content={result}
          heroUrl={heroUrl}
          onContentChange={(html) => { editableHtmlRef.current = html; }}
        />
      </Collapsible>
    </BlockStack>
  );
}

// ─── Collection Card (multi-product + name + description) ─────────────────────

function getImageStyleOptions(t: (key: string) => string) {
  return [
    { label: t('contentTemplates.attractive'), value: 'attractive' },
    { label: t('contentTemplates.seasonal'), value: 'seasonal' },
    { label: t('contentTemplates.minimalist'), value: 'minimalist' },
    { label: t('contentTemplates.informative'), value: 'informative' },
    { label: t('contentTemplates.monochrome'), value: 'monochrome' },
  ];
}

async function uploadCustomImage(file: File, backendApiUrl: string, shop: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const uploadResp = await fetch(
    `${backendApiUrl}/api/upload-product-image?shop=${encodeURIComponent(shop)}`,
    { method: 'POST', headers: { 'X-Shopify-Shop-Domain': shop }, body: formData },
  );
  if (!uploadResp.ok) throw new Error('Failed to upload custom image');
  const uploadData = await uploadResp.json();
  return uploadData.url;
}

function CollectionCard({
  template,
  products,
  shop,
  backendApiUrl,
  onToast,
  entitlements,
  defaultTargetLocale,
}: {
  template: ContentTemplate;
  products: ProductListItem[];
  shop: string;
  backendApiUrl: string;
  onToast: (msg: string) => void;
  entitlements: Entitlements;
  defaultTargetLocale?: string;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const editableHtmlRef = useRef<string>('');

  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [imageStyle, setImageStyle] = useState('attractive');
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);

  const toggleProduct = useCallback((id: string) => {
    setSelectedProductIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }, []);

  const selectedProductNames = useMemo(
    () => selectedProductIds.map((id) => products.find((p) => p.id === id)?.title || '').filter(Boolean),
    [selectedProductIds, products],
  );

  const canGenerate = Boolean(collectionName.trim() && collectionDescription.trim());

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setHeroUrl(null);
    editableHtmlRef.current = '';

    try {
      let imageUrl = '';
      if (customImageFile) {
        imageUrl = await uploadCustomImage(customImageFile, backendApiUrl, shop);
      }

      const body: Record<string, any> = {
        target_locale: defaultTargetLocale || 'en',
        collection_name: collectionName,
        description: collectionDescription,
        products: selectedProductNames.join(', '),
        product_names: selectedProductNames,
        image_style: imageStyle,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const resp = await fetch(
        `${backendApiUrl}/api/generate/${template.id}?shop=${encodeURIComponent(shop)}`,
        { method: 'POST', headers: { 'X-Shopify-Shop-Domain': shop, 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        const raw = typeof data.content === 'object' ? JSON.stringify(data.content) : data.content || '';
        setResult(raw);
        setResultOpen(true);
        setHeroUrl(data.hero_url || null);
        onToast(t('contentTemplates.collectionContentGenerated'));
      } else {
        setError(data.detail || data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [canGenerate, collectionName, collectionDescription, selectedProductNames, imageStyle, customImageFile, template, shop, backendApiUrl, onToast, t]);

  const handleCopy = useCallback(async () => {
    const toCopy = editableHtmlRef.current || result || '';
    if (!toCopy) return;
    try { await navigator.clipboard.writeText(toCopy); onToast(t('contentTemplates.copied')); } catch { onToast(t('contentTemplates.copyFailed')); }
  }, [result, onToast, t]);

  const handlePublish = useCallback(async () => {
    if (!result) return;
    setPublishing(true);
    try {
      const content = editableHtmlRef.current || result;
      const resp = await fetch(`${backendApiUrl}/api/publish?shop=${encodeURIComponent(shop)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Shop-Domain': shop },
        body: JSON.stringify({ template_id: template.id, content, collection_name: collectionName, hero_url: heroUrl, product_ids: selectedProductIds, context: { collection_name: collectionName } }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.detail || `Publish failed: ${resp.status}`); }
      setPublished(true);
      onToast(t('contentTemplates.publishedCollectionToShopify'));
    } catch (e: any) { onToast(`Publish failed: ${e?.message || e}`); } finally { setPublishing(false); }
  }, [result, collectionName, heroUrl, selectedProductIds, template, shop, backendApiUrl, onToast, t]);

  const canPublish = canAccess(entitlements, 'publish');

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">{t('contentTemplates.collectionDescription')}</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {t('contentTemplates.collectionDesc')}
            </Text>
          </BlockStack>
          <Divider />
          <TextField label={t('contentTemplates.collectionName')} value={collectionName} onChange={setCollectionName} placeholder={t('contentTemplates.collectionNamePlaceholder')} autoComplete="off" requiredIndicator />
          <TextField label={t('contentTemplates.shortDescription')} value={collectionDescription} onChange={setCollectionDescription} placeholder={t('contentTemplates.shortDescPlaceholder')} multiline={2} autoComplete="off" requiredIndicator />

          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="semibold">{t('contentTemplates.selectProducts')}</Text>
              <Badge>{`${selectedProductIds.length} ${t('contentTemplates.selected')}`}</Badge>
            </InlineStack>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e1e3e5', borderRadius: 8, padding: 8 }}>
              {products.map((p) => (
                <Checkbox key={p.id} label={p.title} checked={selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
              ))}
            </div>
          </BlockStack>

          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
            {canAccess(entitlements, 'ad_image_generation') ? (
              <ProductImageUploader productTitle={collectionName || 'Product'} onCustomImage={setCustomImageFile} disabled={loading} />
            ) : (
              <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                <BlockStack gap="200" inlineAlign="center">
                  <PlanGateBadge tierName="Standard" />
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">Custom images require Standard</Text>
                </BlockStack>
              </Box>
            )}
            <BlockStack gap="300">
              <Select label={t('contentTemplates.imageStyle')} options={getImageStyleOptions(t)} value={imageStyle} onChange={setImageStyle} />
              <div style={{ flex: 1 }} />
              <InlineStack align="end">
                <Button onClick={handleGenerate} disabled={!canGenerate || loading} loading={loading} size="large">
                  {loading ? t('contentTemplates.generating') : result ? t('contentTemplates.regenerate') : t('contentTemplates.generate')}
                </Button>
              </InlineStack>
            </BlockStack>
          </div>
          {error && <Banner tone="critical">{error}</Banner>}
          {result && (
            <ResultBlock templateId={template.id} templateName="Collection" result={result} heroUrl={heroUrl} resultOpen={resultOpen} setResultOpen={setResultOpen} canPublish={canPublish} published={published} publishing={publishing} handlePublish={handlePublish} handleCopy={handleCopy} editableHtmlRef={editableHtmlRef} />
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ─── Hero Section Card ────────────────────────────────────────────────────────

function HeroSectionCard({
  template,
  shop,
  backendApiUrl,
  onToast,
  entitlements,
  defaultTargetLocale,
}: {
  template: ContentTemplate;
  shop: string;
  backendApiUrl: string;
  onToast: (msg: string) => void;
  entitlements: Entitlements;
  defaultTargetLocale?: string;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const editableHtmlRef = useRef<string>('');

  const [heroSubject, setHeroSubject] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageStyle, setImageStyle] = useState('attractive');
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);

  const canGenerate = Boolean(heroSubject.trim());

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setHeroUrl(null);
    editableHtmlRef.current = '';

    try {
      let imageUrl = '';
      if (customImageFile) {
        imageUrl = await uploadCustomImage(customImageFile, backendApiUrl, shop);
      }

      const body: Record<string, any> = {
        target_locale: defaultTargetLocale || 'en',
        title: heroSubject,
        subject_text: heroSubject,
        short_description: shortDescription,
        image_style: imageStyle,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const resp = await fetch(
        `${backendApiUrl}/api/generate/${template.id}?shop=${encodeURIComponent(shop)}`,
        { method: 'POST', headers: { 'X-Shopify-Shop-Domain': shop, 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        const raw = typeof data.content === 'object' ? JSON.stringify(data.content) : data.content || '';
        setResult(raw);
        setResultOpen(true);
        setHeroUrl(data.hero_url || null);
        onToast(t('contentTemplates.heroSectionGenerated'));
      } else {
        setError(data.detail || data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [canGenerate, heroSubject, shortDescription, imageStyle, customImageFile, template, shop, backendApiUrl, onToast, t]);

  const handleCopy = useCallback(async () => {
    const toCopy = editableHtmlRef.current || result || '';
    if (!toCopy) return;
    try { await navigator.clipboard.writeText(toCopy); onToast(t('contentTemplates.copied')); } catch { onToast(t('contentTemplates.copyFailed')); }
  }, [result, onToast, t]);

  const handlePublish = useCallback(async () => {
    if (!result) return;
    setPublishing(true);
    try {
      const content = editableHtmlRef.current || result;
      const resp = await fetch(`${backendApiUrl}/api/publish?shop=${encodeURIComponent(shop)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Shop-Domain': shop },
        body: JSON.stringify({ template_id: template.id, content, context: {} }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.detail || `Publish failed: ${resp.status}`); }
      setPublished(true);
      onToast(t('contentTemplates.publishedHeroToShopify'));
    } catch (e: any) { onToast(`Publish failed: ${e?.message || e}`); } finally { setPublishing(false); }
  }, [result, template, shop, backendApiUrl, onToast, t]);

  const canPublish = canAccess(entitlements, 'publish');

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">{t('contentTemplates.heroSection')}</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {t('contentTemplates.heroSectionDesc')}
            </Text>
          </BlockStack>
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
            {canAccess(entitlements, 'ad_image_generation') ? (
              <ProductImageUploader productTitle={heroSubject || 'Product'} onCustomImage={setCustomImageFile} disabled={loading} />
            ) : (
              <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                <BlockStack gap="200" inlineAlign="center">
                  <PlanGateBadge tierName="Standard" />
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">Custom images require Standard</Text>
                </BlockStack>
              </Box>
            )}
            <BlockStack gap="300">
              <TextField label={t('contentTemplates.subjectTheme')} value={heroSubject} onChange={setHeroSubject} placeholder={t('contentTemplates.subjectPlaceholder')} autoComplete="off" requiredIndicator />
              <TextField label={t('contentTemplates.shortDescription')} value={shortDescription} onChange={setShortDescription} placeholder={t('contentTemplates.shortDescriptionPlaceholder')} autoComplete="off" multiline={2} />
              <Select label={t('contentTemplates.imageStyle')} options={getImageStyleOptions(t)} value={imageStyle} onChange={setImageStyle} />
              <div style={{ flex: 1 }} />
              <InlineStack align="end">
                <Button onClick={handleGenerate} disabled={!canGenerate || loading} loading={loading} size="large">
                  {loading ? t('contentTemplates.generating') : result ? t('contentTemplates.regenerate') : t('contentTemplates.generate')}
                </Button>
              </InlineStack>
            </BlockStack>
          </div>
          {error && <Banner tone="critical">{error}</Banner>}
          {result && (
            <ResultBlock templateId={template.id} templateName="Hero Section" result={result} heroUrl={heroUrl} resultOpen={resultOpen} setResultOpen={setResultOpen} canPublish={canPublish} published={published} publishing={publishing} handlePublish={handlePublish} handleCopy={handleCopy} editableHtmlRef={editableHtmlRef} />
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ─── Blog Post Card ───────────────────────────────────────────────────────────

function BlogPostCard({
  template,
  shop,
  backendApiUrl,
  onToast,
  entitlements,
  defaultTargetLocale,
}: {
  template: ContentTemplate;
  shop: string;
  backendApiUrl: string;
  onToast: (msg: string) => void;
  entitlements: Entitlements;
  defaultTargetLocale?: string;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const editableHtmlRef = useRef<string>('');

  const [blogTopic, setBlogTopic] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogShortDescription, setBlogShortDescription] = useState('');
  const [blogContext, setBlogContext] = useState('');
  const [imageStyle, setImageStyle] = useState('attractive');
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);

  const canGenerate = Boolean(blogTopic.trim() && blogCategory.trim());

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setHeroUrl(null);
    editableHtmlRef.current = '';

    try {
      let imageUrl = '';
      if (customImageFile) {
        imageUrl = await uploadCustomImage(customImageFile, backendApiUrl, shop);
      }

      const body: Record<string, any> = {
        target_locale: defaultTargetLocale || 'en',
        topic: blogTopic,
        category: blogCategory,
        short_description: blogShortDescription,
        context: blogContext,
        image_style: imageStyle,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const resp = await fetch(
        `${backendApiUrl}/api/generate/${template.id}?shop=${encodeURIComponent(shop)}`,
        { method: 'POST', headers: { 'X-Shopify-Shop-Domain': shop, 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        const raw = typeof data.content === 'object' ? JSON.stringify(data.content) : data.content || '';
        setResult(raw);
        setResultOpen(true);
        setHeroUrl(data.hero_url || null);
        onToast(t('contentTemplates.blogPostGenerated'));
      } else {
        setError(data.detail || data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [canGenerate, blogTopic, blogCategory, blogShortDescription, blogContext, imageStyle, customImageFile, template, shop, backendApiUrl, onToast, t]);

  const handleCopy = useCallback(async () => {
    const toCopy = editableHtmlRef.current || result || '';
    if (!toCopy) return;
    try { await navigator.clipboard.writeText(toCopy); onToast(t('contentTemplates.copied')); } catch { onToast(t('contentTemplates.copyFailed')); }
  }, [result, onToast, t]);

  const handlePublish = useCallback(async () => {
    if (!result) return;
    setPublishing(true);
    try {
      const content = editableHtmlRef.current || result;
      const resp = await fetch(`${backendApiUrl}/api/publish?shop=${encodeURIComponent(shop)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Shop-Domain': shop },
        body: JSON.stringify({ template_id: template.id, content, hero_url: heroUrl, blog_title: blogTopic, context: {} }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.detail || `Publish failed: ${resp.status}`); }
      setPublished(true);
      onToast(t('contentTemplates.publishedBlogToShopify'));
    } catch (e: any) { onToast(`Publish failed: ${e?.message || e}`); } finally { setPublishing(false); }
  }, [result, heroUrl, blogTopic, template, shop, backendApiUrl, onToast]);

  const canPublish = canAccess(entitlements, 'publish');

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">{t('contentTemplates.brandBlogPost')}</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {t('contentTemplates.brandBlogPostDesc')}
            </Text>
          </BlockStack>
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
            {canAccess(entitlements, 'ad_image_generation') ? (
              <ProductImageUploader productTitle={blogTopic || 'Product'} onCustomImage={setCustomImageFile} disabled={loading} />
            ) : (
              <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                <BlockStack gap="200" inlineAlign="center">
                  <PlanGateBadge tierName="Standard" />
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">Custom images require Standard</Text>
                </BlockStack>
              </Box>
            )}
            <BlockStack gap="300">
              <TextField label={t('contentTemplates.subjectTopic')} value={blogTopic} onChange={setBlogTopic} placeholder={t('contentTemplates.topicPlaceholder')} autoComplete="off" requiredIndicator />
              <TextField label={t('contentTemplates.category')} value={blogCategory} onChange={setBlogCategory} placeholder={t('contentTemplates.categoryPlaceholder')} autoComplete="off" requiredIndicator />
              <TextField label={t('contentTemplates.shortDescription')} value={blogShortDescription} onChange={setBlogShortDescription} placeholder={t('contentTemplates.shortDescriptionPlaceholder')} autoComplete="off" multiline={2} />
              <TextField label={t('contentTemplates.additionalContext')} value={blogContext} onChange={setBlogContext} multiline={3} placeholder={t('contentTemplates.contextPlaceholder')} autoComplete="off" />
              <Select label={t('contentTemplates.imageStyle')} options={getImageStyleOptions(t)} value={imageStyle} onChange={setImageStyle} />
              <div style={{ flex: 1 }} />
              <InlineStack align="end">
                <Button onClick={handleGenerate} disabled={!canGenerate || loading} loading={loading} size="large">
                  {loading ? t('contentTemplates.generating') : result ? t('contentTemplates.regenerate') : t('contentTemplates.generate')}
                </Button>
              </InlineStack>
            </BlockStack>
          </div>
          {error && <Banner tone="critical">{error}</Banner>}
          {result && (
            <ResultBlock templateId={template.id} templateName={t('contentTemplates.brandBlogPost')} result={result} heroUrl={heroUrl} resultOpen={resultOpen} setResultOpen={setResultOpen} canPublish={canPublish} published={published} publishing={publishing} handlePublish={handlePublish} handleCopy={handleCopy} editableHtmlRef={editableHtmlRef} />
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ContentTemplatesPage() {
  const { t } = useTranslation();
  const {shop, backendApiUrl, products, selectedProduct, templates, planName, entitlements, feature_usage, defaultTargetLocale} =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
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

  const collectionTemplate = templates.find((t) => t.id === 'product/collection');
  const heroTemplate = templates.find((t) => t.id === 'product/landing-hero');
  const blogTemplate = templates.find((t) => t.id === 'product/blog-post');

  return (
    <Page
      title={t('contentTemplates.contentTemplates')}
      subtitle={t('contentTemplates.contentTemplatesSubtitle')}
      backAction={{
        content: t('contentTemplates.writingStudio'),
        onAction: () => navigate(nav('/app/writing-studio')),
      }}
    >
      <Layout>
        {/* Collection Description */}
        {collectionTemplate && (
          <Layout.Section>
            <CollectionCard template={collectionTemplate} products={products} shop={shop} backendApiUrl={backendApiUrl} onToast={setToastContent} entitlements={entitlements} defaultTargetLocale={defaultTargetLocale} />
          </Layout.Section>
        )}

        {/* Hero Section */}
        {heroTemplate && (
          <Layout.Section>
            <HeroSectionCard template={heroTemplate} shop={shop} backendApiUrl={backendApiUrl} onToast={setToastContent} entitlements={entitlements} defaultTargetLocale={defaultTargetLocale} />
          </Layout.Section>
        )}

        {/* Brand Blog Post */}
        {blogTemplate && (
          <Layout.Section>
            <BlogPostCard template={blogTemplate} shop={shop} backendApiUrl={backendApiUrl} onToast={setToastContent} entitlements={entitlements} defaultTargetLocale={defaultTargetLocale} />
          </Layout.Section>
        )}
      </Layout>

      {toastContent && (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      )}
    </Page>
  );
}
