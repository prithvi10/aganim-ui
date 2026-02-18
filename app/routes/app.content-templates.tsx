import type {LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useSearchParams, useNavigate} from 'react-router';
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
  TextField,
  Toast,
  Tooltip,
} from '@shopify/polaris';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {authenticate, getOfflineGraphqlClient} from '../shopify.server';
import {RichTextEditor} from '../components/RichTextEditor';

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
    process.env.BACKEND_API_URL || 'https://shopify-translator-api.onrender.com';

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

  // Fetch plan name from backend
  let planName = 'Free';
  try {
    const usageResp = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shop)}`);
    if (usageResp.ok) {
      const usageData = await usageResp.json();
      planName = String(usageData.effective_plan_name || usageData.plan_name || 'Free').trim() || 'Free';
    }
  } catch {
    // best-effort
  }

  return {shop, backendApiUrl, products, selectedProduct, templates, planName} satisfies LoaderData;
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

/**
 * Parse a Python-style list string: [{'key': 'val'}, {'key': 'val'}]
 * Uses parsePythonDict for each item.
 */
function parsePythonList(raw: string): any[] | null {
  const s = raw.trim();
  if (!s.startsWith('[') || !s.endsWith(']')) return null;

  const inner = s.slice(1, -1).trim();
  if (!inner) return [];

  // Split on top-level `}, {` boundaries (respecting nested braces)
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

function contentJsonToHtml(raw: string): string {
  // 1. Try standard JSON (covers both objects and arrays)
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 2. Try Python dict
    parsed = parsePythonDict(raw);
    // 3. Try Python list (bare FAQ array)
    if (!parsed) {
      const arr = parsePythonList(raw);
      if (arr) {
        // Detect FAQ-style array: items have question/answer keys
        const looksLikeFaqs = arr.length > 0 && arr[0].question && arr[0].answer;
        parsed = looksLikeFaqs ? { faqs: arr } : arr;
      }
    }
  }

  // Handle JSON arrays returned by JSON.parse
  if (Array.isArray(parsed)) {
    const looksLikeFaqs = parsed.length > 0 && parsed[0]?.question && parsed[0]?.answer;
    parsed = looksLikeFaqs ? { faqs: parsed } : { items: parsed };
  }

  if (!parsed || typeof parsed !== 'object') return raw;

  const parts: string[] = [];

  // Collection description
  if (parsed.description && !parsed.faqs && !parsed.body_html) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Collection Description</p>` +
        `<div style="font-size:15px;line-height:1.6">${parsed.description}</div>` +
      `</div>`,
    );
  }
  if (parsed.meta_description && !parsed.body_html) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:12px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">SEO Meta Description</p>` +
        `<p style="margin:0;font-size:14px;color:#6d7175">${parsed.meta_description}</p>` +
      `</div>`,
    );
  }

  // FAQs
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

  // Landing page hero
  if (parsed.headline && !parsed.faqs) {
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

  // Blog post
  if (parsed.title && parsed.body_html) {
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

  // Fallback: render all keys as labelled sections
  if (parts.length === 0) {
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
  onContentChange,
}: {
  content: string;
  onContentChange?: (html: string) => void;
}) {
  const html = useMemo(() => contentJsonToHtml(content), [content]);
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

// ─── Template Card (mirrors MarketingTemplateCard pattern) ────────────────────

/** Templates that need product selection */
const PRODUCT_WIRED_TEMPLATES = new Set([
  'product/collection',
  'product/faq',
  'product/landing-hero',
]);

/** Templates eligible for hero banner generation */
const HERO_ELIGIBLE_TEMPLATES = new Set([
  'product/blog-post',
  'product/collection',
  'product/landing-hero',
]);

function ContentTemplateCard({
  template,
  selectedProduct,
  shop,
  backendApiUrl,
  onToast,
  planName,
}: {
  template: ContentTemplate;
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
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const editableHtmlRef = useRef<string>('');

  // Blog post has its own fields
  const isBlogPost = template.id === 'product/blog-post';
  const needsProduct = PRODUCT_WIRED_TEMPLATES.has(template.id);
  const [blogTopic, setBlogTopic] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogContext, setBlogContext] = useState('');
  const [collectionName, setCollectionName] = useState('');

  const plainDesc = useMemo(() => {
    if (!selectedProduct?.descriptionHtml) return '';
    return selectedProduct.descriptionHtml.replace(/<[^>]*>/g, '').slice(0, 500);
  }, [selectedProduct?.descriptionHtml]);

  const handleGenerate = useCallback(async () => {
    if (needsProduct && !selectedProduct?.id) return;
    if (isBlogPost && !blogTopic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHeroUrl(null);
    editableHtmlRef.current = '';

    try {
      const body: Record<string, string> = {
        target_locale: 'en',
      };

      if (isBlogPost) {
        body.topic = blogTopic;
        body.category = blogCategory || 'General';
        body.context = blogContext;
      } else if (template.id === 'product/collection') {
        body.collection_name = collectionName || selectedProduct?.title || '';
        body.category = selectedProduct?.productType || 'General';
        body.products = selectedProduct?.title || '';
        if (selectedProduct?.id) body.product_id = selectedProduct.id;
      } else {
        body.title = selectedProduct?.title || '';
        body.category = selectedProduct?.productType || 'General';
        body.description = plainDesc;
        if (selectedProduct?.id) body.product_id = selectedProduct.id;
      }

      if (selectedProduct?.images?.[0]?.url && HERO_ELIGIBLE_TEMPLATES.has(template.id)) {
        body.image_url = selectedProduct.images[0].url;
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
        const raw =
          typeof data.content === 'object'
            ? JSON.stringify(data.content)
            : data.content || data.description || '';
        setResult(raw);
        setResultOpen(true);
        setHeroUrl(data.hero_url || null);
        onToast(`${template.name} generated successfully!`);
      } else {
        setError(data.detail || data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [
    selectedProduct,
    template,
    shop,
    backendApiUrl,
    plainDesc,
    onToast,
    isBlogPost,
    needsProduct,
    blogTopic,
    blogCategory,
    blogContext,
    collectionName,
  ]);

  const handleCopy = useCallback(async () => {
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
    if (!result) return;
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
            product_id: selectedProduct?.id || '',
            content,
            context: { product_title: selectedProduct?.title || '' },
          }),
        },
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Publish failed: ${resp.status}`);
      }
      setPublished(true);
      onToast(`Published ${TEMPLATE_DISPLAY_NAMES[template.id] || template.name} to Shopify!`);
    } catch (e: any) {
      onToast(`Publish failed: ${e?.message || e}`);
    } finally {
      setPublishing(false);
    }
  }, [result, selectedProduct, template, shop, backendApiUrl, onToast]);

  const isPro = planName === 'Pro';

  // Determine if Generate should be disabled
  const canGenerate = isBlogPost ? Boolean(blogTopic.trim()) : Boolean(selectedProduct?.id);

  return (
    <Card>
      <Box padding="300">
        <BlockStack gap="300">
          {/* Name + Generate button on the same row */}
          <InlineStack align="space-between" blockAlign="center">
            <Tooltip content={template.description} width="wide">
              <Text as="h3" variant="headingMd">
                {TEMPLATE_DISPLAY_NAMES[template.id] || template.name}
              </Text>
            </Tooltip>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              loading={loading}
            >
              {loading ? 'Generating…' : result ? 'Regenerate' : 'Generate'}
            </Button>
          </InlineStack>

          {/* Blog Post — custom inputs */}
          {isBlogPost && (
            <BlockStack gap="300">
              <TextField
                label="Subject / Topic"
                value={blogTopic}
                onChange={setBlogTopic}
                placeholder="e.g. 'Our wood-kiln firing process', 'How we source Shigaraki clay'"
                autoComplete="off"
              />
              <TextField
                label="Category"
                value={blogCategory}
                onChange={setBlogCategory}
                placeholder="e.g. Manufacturing, Artisan Techniques, Sustainability"
                autoComplete="off"
              />
              <TextField
                label="Additional Context"
                value={blogContext}
                onChange={setBlogContext}
                multiline={3}
                placeholder="Any extra details, product mentions, or angles to include"
                autoComplete="off"
              />
            </BlockStack>
          )}

          {/* Collection — extra collection name field */}
          {template.id === 'product/collection' && (
            <TextField
              label="Collection Name"
              value={collectionName}
              onChange={setCollectionName}
              placeholder={selectedProduct?.title || 'Enter collection name'}
              autoComplete="off"
            />
          )}

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
                      Publish to Shopify
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
                <ContentResultDisplay
                  content={result}
                  onContentChange={(html) => {
                    editableHtmlRef.current = html;
                  }}
                />
              </Collapsible>
            </BlockStack>
          )}

          {heroUrl && (
            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Hero Banner</Text>
                  <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                    <img src={heroUrl} alt="Hero banner" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  </div>
                </BlockStack>
              </Box>
            </Card>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ContentTemplatesPage() {
  const {shop, backendApiUrl, products, selectedProduct, templates, planName} =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const nav = (path: string) => {
    const params = new URLSearchParams(searchParams);
    if (shop) params.set('shop', shop);
    return params.toString() ? `${path}?${params.toString()}` : path;
  };

  const [toastContent, setToastContent] = useState<string | null>(null);

  const selectedProductId = searchParams.get('productId') || (products[0]?.id ?? '');
  const productOptions = products.map((p) => ({label: p.title, value: p.id}));

  const handleProductChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('productId', productIdFromGid(value));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  // Separate blog post from product-wired templates
  const productTemplates = templates.filter((t) => t.id !== 'product/blog-post');
  const blogTemplate = templates.find((t) => t.id === 'product/blog-post');

  return (
    <Page
      title="Content Templates"
      subtitle="Generate product titles, FAQs, collection copy, and landing page content using AI-powered templates with brand voice."
      backAction={{
        content: 'Writing Studio',
        onAction: () => navigate(nav('/app/writing-studio')),
      }}
    >
      <Layout>
        {/* Product Selection */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">
                Select Product
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Choose a product to auto-fill template inputs (title, category, description).
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
        </Layout.Section>

        {/* Product-Wired Templates */}
        {productTemplates.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">
                      Product Content Generator
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Select a product above, then click Generate to create content instantly using
                      your brand voice.
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="400">
                    {productTemplates.map((template) => (
                      <ContentTemplateCard
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

        {/* Blog Post Template (no product wiring) */}
        {blogTemplate && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">
                      Brand Blog Post
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Write long-form blog posts about your craft, manufacturing process, artisan
                      techniques, and more. No product selection needed.
                    </Text>
                  </BlockStack>
                  <Divider />
                  <ContentTemplateCard
                    template={blogTemplate}
                    selectedProduct={null}
                    shop={shop}
                    backendApiUrl={backendApiUrl}
                    onToast={setToastContent}
                    planName={planName}
                  />
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {toastContent && (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      )}
    </Page>
  );
}
