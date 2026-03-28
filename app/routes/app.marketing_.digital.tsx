import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useSearchParams, useFetcher, useNavigate } from 'react-router';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  Toast,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import { descriptionHash } from '../utils/descriptionHash.server';
import { DowngradeScheduledBanner } from '../components/DowngradeScheduledBanner';
import { MissionTimeline } from '../components/MissionTimeline';
import { ProductImageUploader } from '../components/ProductImageUploader';
import { InstaPreview } from '../components/InstaPreview';
import { LockedFeatureNotice } from '../components/LockedFeatureNotice';
import { PlanGateBadge } from '../components/PlanGateBadge';
import { canAccess, type Entitlements, type FeatureUsageMap } from '../utils/entitlements';
import '../styles/optimize-button.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductListItem = { id: string; title: string };
type ProductImage = { url: string; altText?: string | null };
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
  const shopSlug = shop.replace('.myshopify.com', '');
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://aganim-api.onrender.com';

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
    graphqlQuery(productsQuery, usingOfflineClient ? undefined : { first: 50 }),
  ]);

  const activeSubs: Array<{ name: string; status: string }> =
    planRes?.data?.appInstallation?.activeSubscriptions ?? [];
  const activeNames = activeSubs
    .filter((s) => {
      const st = String(s.status || '').toUpperCase();
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
      pendingPlanName = String(data?.pending_plan_name || '').trim() || null;
      pendingPlanEffectiveAt = String(data?.pending_plan_effective_at || '').trim() || null;
      lastPlanChangeType = String(data?.last_plan_change_type || '').trim() || null;
      lastPlanChangeAt = String(data?.last_plan_change_at || '').trim() || null;
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
          { id: selectedProductId },
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
            { input: { id: hooksId } },
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
            { input: { id: hooksHashId } },
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
    entitlements,
    feature_usage,
    defaultTargetLocale,
  } satisfies LoaderData;
};

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  const { admin } = await authenticate.admin(request);

  if (intent === 'saveSocialHooks') {
    const productId = String(formData.get('productId') || '');
    const value = String(formData.get('value') || '');
    if (!productId) return { ok: false, error: 'Missing productId' };
    if (!value) return { ok: false, error: 'Missing value' };

    let currentHash = '';
    try {
      const p = await admin.graphql(
        `query ProductDesc($id: ID!) { product(id: $id) { descriptionHtml } }`,
        { variables: { id: productId } },
      );
      const pj = await p.json();
      currentHash = descriptionHash(String(pj?.data?.product?.descriptionHtml ?? ''));
    } catch {
      currentHash = '';
    }

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
      return { ok: false, error: userErrors.map((e: any) => e.message).join('; ') };
    }
    return { ok: true };
  }

  return { ok: false, error: 'Unknown intent' };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DigitalMarketing() {
  const {
    planName,
    pendingPlanName,
    pendingPlanEffectiveAt,
    lastPlanChangeType,
    products,
    selectedProduct,
    shopSlug,
    shop,
    backendApiUrl,
    contentHash,
    didResetMetaCache,
    entitlements,
    feature_usage,
    defaultTargetLocale,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge();
  const navigate = useNavigate();

  const nav = (path: string) => {
    const [basePath, existingQs] = path.split('?');
    const params = new URLSearchParams(existingQs || '');
    const sp = new URLSearchParams(searchParams);
    sp.forEach((v, k) => { if (!params.has(k)) params.set(k, v); });
    if (shop) params.set('shop', shop);
    return params.toString() ? `${basePath}?${params.toString()}` : basePath;
  };

  const [showDowngradeBanner, setShowDowngradeBanner] = useState(true);

  // Step 1: Caption Generation
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

  // Step 2: Visual Ad Generation
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [visualMissionId, setVisualMissionId] = useState<string | null>(null);
  const [visualMissionRunning, setVisualMissionRunning] = useState(false);
  const [visualAdError, setVisualAdError] = useState<string | null>(null);
  const [generatedAdUrl, setGeneratedAdUrl] = useState<string | null>(null);

  const [toastContent, setToastContent] = useState<string | null>(null);

  const selectedProductId = searchParams.get('productId') || (products[0]?.id ?? '');

  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));

  // Derived values
  const selectedCaption = hooks[selectedHookIndex]?.caption || '';
  const selectedOverlay = hooks[selectedHookIndex]?.overlay || hooks[selectedHookIndex]?.caption || '';
  const brandName = shop.replace('.myshopify.com', '');
  const productImageUrl = selectedProduct?.images?.[0]?.url || '';

  const handleProductChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('productId', productIdFromGid(value));
      setSearchParams(newParams);
      setHooks([]);
      setHooksError(null);
      setOverlaySuggestions([]);
      setVisualMissionId(null);
      setVisualMissionRunning(false);
      setCustomImageFile(null);
      setGeneratedAdUrl(null);
      setVisualAdError(null);
    },
    [searchParams, setSearchParams],
  );

  const callAgent = useCallback(
    async (actionName: string, productData: Record<string, any>, context: Record<string, any>) => {
      let token: string | null = null;
      try {
        token = await getSessionToken(app as any);
      } catch {
        token = null;
      }

      const agentUrl = new URL(`${backendApiUrl}/api/agent`);
      if (!token && shop) {
        agentUrl.searchParams.set('shop', shop);
      }

      const resp = await fetch(agentUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  // Step 1: Generate captions only (no visual mission)
  const runSocialHooks = useCallback(async () => {
    if (!selectedProduct?.id) return;
    setHooksLoading(true);
    setHooksError(null);
    setOverlaySuggestions([]);

    const productData = {
      id: selectedProduct.id,
      title: selectedProduct.title,
      category: selectedProduct.productType,
      productType: selectedProduct.productType,
      tags: selectedProduct.tags,
    };

    try {
      const socialResult = await callAgent('social_hook_architect', productData, { focus: 'Instagram Reels', target_locale: defaultTargetLocale || 'en' });
      const nextHooks = (socialResult?.data?.metadata?.hooks ?? []) as any[];
      const overlays = (socialResult?.data?.metadata?.overlay_suggestions ?? []) as any[];
      const safeHooks = Array.isArray(nextHooks) ? nextHooks : [];
      const safeOverlays = Array.isArray(overlays) ? overlays.map(String) : [];
      setHooks(safeHooks);
      setOverlaySuggestions(safeOverlays);
      setSelectedHookIndex(0);

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
        saveHooksFetcher.submit(fd, { method: 'post' });
      } catch {
        // best-effort
      }

      setToastContent('Generated Instagram hooks.');
    } catch (e: any) {
      setHooksError(e?.message ?? 'Failed to generate hooks.');
    }

    setHooksLoading(false);
  }, [
    callAgent,
    saveHooksFetcher,
    selectedProduct?.id,
    selectedProduct?.descriptionHtml,
    selectedProduct?.productType,
    selectedProduct?.tags,
    selectedProduct?.title,
    defaultTargetLocale,
  ]);

  // Step 2: Generate visual ad (separate from captions)
  const runVisualAd = useCallback(async () => {
    if (!selectedProduct?.id) return;
    const imageSource = productImageUrl;
    if (!imageSource && !customImageFile) {
      setVisualAdError('No product image available. Upload an image or select a product with images.');
      return;
    }

    setVisualMissionRunning(true);
    setVisualAdError(null);
    setGeneratedAdUrl(null);

    try {
      let imageUrlToUse = imageSource;

      // Upload custom image if provided
      if (customImageFile) {
        const formData = new FormData();
        formData.append('file', customImageFile);
        const uploadUrl = new URL(`${backendApiUrl}/api/upload-product-image`);
        uploadUrl.searchParams.set('shop', shop);
        const uploadResp = await fetch(uploadUrl.toString(), {
          method: 'POST',
          headers: { 'X-Shopify-Shop-Domain': shop },
          body: formData,
        });
        if (!uploadResp.ok) {
          throw new Error('Failed to upload custom image');
        }
        const uploadData = await uploadResp.json();
        imageUrlToUse = uploadData.url;
      }

      const hookText = selectedOverlay || selectedProduct.title;

      const missionResp = await fetch(
        `${backendApiUrl}/api/missions?shop=${encodeURIComponent(shop)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Shop-Domain': shop },
          body: JSON.stringify({
            product_id: productIdFromGid(selectedProduct.id),
            product_name: selectedProduct.title,
            japanese_description: selectedProduct.descriptionHtml || selectedProduct.title,
            category: selectedProduct.productType || 'General',
            image_url: imageUrlToUse,
            workflow_config: [{ agent_name: 'VisualMarketingAgent', has_gate: false }],
            extra_context: {
              brand_name: brandName,
              hook_text: hookText,
              image_src: imageUrlToUse,
            },
          }),
        },
      );
      if (missionResp.ok) {
        const mData = await missionResp.json();
        setVisualMissionId(mData.mission_id || null);
      } else {
        const errBody = await missionResp.json().catch(() => ({}));
        const detail = errBody?.detail || `Mission creation failed (${missionResp.status})`;
        throw new Error(
          typeof detail === 'string'
            ? detail
            : `Mission creation failed (${missionResp.status})`
        );
      }
    } catch (e: any) {
      setVisualAdError(e?.message ?? 'Failed to generate visual ad.');
      setVisualMissionRunning(false);
    }
  }, [
    selectedProduct?.id,
    selectedProduct?.title,
    selectedProduct?.descriptionHtml,
    productImageUrl,
    customImageFile,
    selectedOverlay,
    brandName,
    backendApiUrl,
    shop,
  ]);

  useEffect(() => {
    setHooks([]);
    setHooksError(null);
    setOverlaySuggestions([]);

    if (!selectedProduct?.id) return;

    const cached = selectedProduct.socialHooksCache;
    if (cached?.hooks?.length) {
      setHooks(cached.hooks);
      setOverlaySuggestions(Array.isArray(cached.overlay_suggestions) ? cached.overlay_suggestions : []);
      setSelectedHookIndex(0);
    }
    if (didResetMetaCache) {
      setToastContent('Product description changed. Please generate hooks again.');
    }
  }, [selectedProduct?.id, contentHash, didResetMetaCache]);

  const selectHook = (idx: number) => {
    setSelectedHookIndex(idx);
  };

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

  const hasGeneratedAd = Boolean(generatedAdUrl);
  const hasHooks = hooks.length > 0;

  return (
    <Page
      title="Marketing Studio"
      backAction={{
        content: 'Marketing',
        onAction: () => navigate(nav('/app/marketing')),
      }}
    >
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

      {showDowngradeBanner ? (
        <div style={{ marginBottom: 16 }}>
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
            {/* ═══ Product Selection (AS IS) ═══ */}
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

            {/* ═══ Step 1: Caption Generation ═══ */}
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#2c6ecb', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                      }}>1</div>
                      <Text as="h2" variant="headingLg">Caption Generation</Text>
                    </InlineStack>
                    {selectedProduct && (
                      <div className="agent-btn-border-5">
                        <Button
                          onClick={runSocialHooks}
                          disabled={!selectedProduct?.id || hooksLoading}
                          variant="primary"
                          loading={hooksLoading}
                        >
                          {hooksLoading ? 'Generating...' : hooks.length ? 'Regenerate Captions' : 'Generate Captions'}
                        </Button>
                      </div>
                    )}
                  </InlineStack>

                  {hooksError ? <Banner tone="critical">{hooksError}</Banner> : null}

                  {!hooks.length && !hooksLoading ? (
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Generate social media captions with different themes for your product
                    </Text>
                  ) : null}

                  {hooks.length ? (
                    <BlockStack gap="200">
                      {hooks.map((h, idx) => {
                        const isSelected = idx === selectedHookIndex;
                        return (
                          <div
                            key={`${h.type}-${idx}`}
                            onClick={() => selectHook(idx)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 10,
                              border: isSelected ? '2px solid #2c6ecb' : '2px solid transparent',
                              background: isSelected ? '#f0f5ff' : undefined,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Card>
                              <Box padding="300">
                                <BlockStack gap="200">
                                  <InlineStack align="space-between" blockAlign="center">
                                    <InlineStack gap="200" blockAlign="center">
                                      <Text as="h3" variant="headingSm">{h.type}</Text>
                                      {isSelected && <Badge tone="info">Selected</Badge>}
                                    </InlineStack>
                                    <Button onClick={() => copyHook(idx)} variant="plain">
                                      Copy
                                    </Button>
                                  </InlineStack>
                                  <Text as="p">{h.caption}</Text>
                                  <Text as="p" tone="subdued">
                                    {(h.hashtags || []).join(' ')}
                                  </Text>
                                </BlockStack>
                              </Box>
                            </Card>
                          </div>
                        );
                      })}
                    </BlockStack>
                  ) : null}
                </BlockStack>
              </Box>
            </Card>

            {/* ═══ Step 2: Visual Ad Creation ═══ */}
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: hasHooks ? '#2c6ecb' : '#8c9196', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                      }}>2</div>
                      <Text as="h2" variant="headingLg">Visual Ad Creation</Text>
                      {!canAccess(entitlements, 'ad_image_generation') && <PlanGateBadge tierName="Pro" />}
                    </InlineStack>
                  </InlineStack>

                  {!canAccess(entitlements, 'ad_image_generation') ? (
                    <LockedFeatureNotice
                      title="Pro Plan Feature"
                      description="Visual ad generation requires the Pro plan. Captions are available on all plans."
                      ctaLabel="Upgrade to Pro"
                      ctaUrl={nav('/app/plans?from=dashboard')}
                    />
                  ) : (
                    <BlockStack gap="400">
                      <ProductImageUploader
                        shopifyImageUrl={productImageUrl}
                        productTitle={selectedProduct?.title || 'Product'}
                        onCustomImage={setCustomImageFile}
                        disabled={visualMissionRunning}
                      />

                      <Divider />

                      {visualAdError && <Banner tone="critical">{visualAdError}</Banner>}

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="agent-btn-border-5">
                          <Button
                            onClick={runVisualAd}
                            disabled={!selectedProduct?.id || visualMissionRunning || (!productImageUrl && !customImageFile)}
                            variant="primary"
                            size="large"
                            loading={visualMissionRunning}
                          >
                            {visualMissionRunning ? 'Generating Ad...' : 'Generate Ad'}
                          </Button>
                        </div>
                      </div>

                      {visualMissionId ? (
                        <MissionTimeline
                          missionId={visualMissionId}
                          apiBaseUrl={backendApiUrl}
                          shop={shop}
                          compact
                          showSummary={false}
                          initialAgents={['VisualMarketingAgent']}
                          onComplete={(missionState: any) => {
                            setVisualMissionRunning(false);
                            const adUrl = missionState?.visual_assets?.ad_url;
                            if (adUrl) setGeneratedAdUrl(adUrl);
                          }}
                          onError={() => {
                            setVisualMissionRunning(false);
                            setVisualAdError('Ad generation failed. Please try again.');
                          }}
                          externalSocialHooks={hooks}
                        />
                      ) : null}
                    </BlockStack>
                  )}
                </BlockStack>
              </Box>
            </Card>

            {/* ═══ Step 3: Preview & Share ═══ */}
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: (hasGeneratedAd || hasHooks) ? '#2c6ecb' : '#8c9196', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}>3</div>
                    <Text as="h2" variant="headingLg">Preview & Share</Text>
                    {!canAccess(entitlements, 'social_post_preview') && <PlanGateBadge tierName="Pro" />}
                  </InlineStack>

                  {!canAccess(entitlements, 'social_post_preview') ? (
                    <LockedFeatureNotice
                      title="Pro Plan Feature"
                      description="Social media preview, sharing, and publishing require the Pro plan."
                      ctaLabel="Upgrade to Pro"
                      ctaUrl={nav('/app/plans?from=dashboard')}
                    />
                  ) : (
                  <>

                  {generatedAdUrl ? (
                    <InstaPreview
                      imageUrl={generatedAdUrl}
                      caption={selectedCaption}
                      brandName={brandName}
                      productName={selectedProduct?.title}
                    />
                  ) : (
                    <div style={{
                      textAlign: 'center', padding: '32px 16px',
                      background: '#fafafa', borderRadius: 10,
                    }}>
                      <BlockStack gap="200" inlineAlign="center">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {hasHooks
                            ? 'Generate a visual ad in Step 2 to see your post preview'
                            : 'Complete Steps 1 and 2 to preview your social media post'}
                        </Text>
                      </BlockStack>
                    </div>
                  )}

                  <Divider />

                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm">Share to Social Media</Text>
                    <InlineStack gap="300" blockAlign="center">
                      <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram" style={{ display: 'inline-flex' }}>
                        <img src="/instagram.svg" alt="Instagram" width={24} height={24} style={{ width: 24, height: 24, borderRadius: 4 }} />
                      </a>
                      <a href="https://www.tiktok.com/creator-center/upload" target="_blank" rel="noopener noreferrer" title="TikTok" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" /></svg>
                      </a>
                      <a href="https://timeline.line.me/" target="_blank" rel="noopener noreferrer" title="LINE" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#00B900"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                      </a>
                      <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" title="Facebook" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                      <a href="https://channels.weixin.qq.com/" target="_blank" rel="noopener noreferrer" title="WeChat" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#07C160"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.139.045c.133 0 .241-.108.241-.243 0-.06-.023-.118-.039-.177l-.326-1.233a.49.49 0 01.178-.553C23.028 18.443 24 16.706 24 14.813c0-3.381-3.058-6.118-7.062-5.955zm-1.834 2.89c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.857 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" /></svg>
                      </a>
                      <a href="https://www.snapchat.com/" target="_blank" rel="noopener noreferrer" title="Snapchat" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.49.49 0 01.172-.03c.27 0 .48.12.55.254.12.209.015.553-.301.804-.42.326-1.378.658-1.652.814-.167.095-.27.213-.276.416-.014.302.168.599.381.928l.024.036c.96 1.43 2.013 2.305 3.162 2.611a.96.96 0 01.646.539c.108.267-.033.548-.09.675-.301.674-1.147 1.073-2.59 1.224-.066.008-.131.047-.136.165l-.007.123c-.01.127-.019.25-.03.377a.45.45 0 01-.359.378c-.195.047-.396.072-.6.072-.224 0-.45-.022-.677-.068-.657-.135-1.236.12-1.935.399l-.116.047c-.66.27-1.406.577-2.367.577-.028 0-.057 0-.085-.002-.92.019-1.662-.283-2.337-.561l-.152-.062c-.71-.283-1.293-.534-1.955-.397a3.975 3.975 0 01-.677.068c-.204 0-.405-.025-.6-.072a.45.45 0 01-.359-.378c-.01-.127-.02-.25-.03-.377l-.007-.123c-.005-.118-.07-.157-.136-.165-1.443-.151-2.289-.55-2.59-1.224-.057-.127-.198-.408-.09-.675a.96.96 0 01.646-.539c1.149-.306 2.202-1.181 3.162-2.611l.024-.036c.213-.329.395-.626.381-.928-.006-.203-.109-.32-.276-.416-.274-.156-1.232-.488-1.652-.814-.316-.251-.421-.595-.301-.804.07-.134.28-.254.55-.254a.49.49 0 01.172.03c.374.181.733.285 1.033.301.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z" /></svg>
                      </a>
                      <a href="https://www.threads.net/" target="_blank" rel="noopener noreferrer" title="Threads" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.082-1.146 3.48-1.206 1.007-.044 1.946.052 2.813.266-.07-.838-.316-1.457-.732-1.848-.478-.45-1.228-.673-2.227-.673h-.057c-.768.007-1.666.196-2.275.524l-.963-1.719c.906-.487 2.12-.741 3.296-.746h.082c1.488 0 2.659.404 3.476 1.199.772.75 1.227 1.845 1.336 3.226.392.142.762.31 1.108.5 1.199.658 2.095 1.598 2.59 2.725.628 1.432.663 3.972-1.452 6.038-1.798 1.756-4.02 2.537-7.186 2.56zm-.136-6.318c.071 0 .141-.002.211-.006 1.05-.057 2.27-.48 2.655-1.858a4.308 4.308 0 00-.01-.964c-.833-.242-1.736-.36-2.715-.317-.9.04-1.649.27-2.165.665-.473.363-.693.826-.66 1.377.052.878.76 1.103 2.684 1.103z" /></svg>
                      </a>
                      <a href="https://twitter.com/compose/tweet" target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={{ display: 'inline-flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                    </InlineStack>
                  </BlockStack>
                  </>
                  )}
                </BlockStack>
              </Box>
            </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
