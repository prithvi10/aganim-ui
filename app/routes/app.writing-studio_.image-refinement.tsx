import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useNavigate, useSearchParams, useFetcher } from 'react-router';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  Banner,
  Select,
  Spinner,
} from '@shopify/polaris';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import type { ClientApplication } from '@shopify/app-bridge/client';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { useTranslation } from 'react-i18next';
import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import { MissionTimeline } from '../components/MissionTimeline';
import { LockedFeatureNotice } from '../components/LockedFeatureNotice';
import { PlanGateBadge } from '../components/PlanGateBadge';

import { canAccess, formatUsage, type Entitlements, type FeatureUsageMap } from '../utils/entitlements';
import '../styles/optimize-button.css';

type ProductItem = {
  id: string;
  title: string;
  featuredImageUrl: string;
  descriptionHtml: string;
  productType: string;
};

type LoaderData = {
  shop: string;
  backendApiUrl: string;
  planName: 'Free' | 'Basic' | 'Standard' | 'Pro';
  products: ProductItem[];
  entitlements: Entitlements;
  feature_usage: FeatureUsageMap;
  defaultTargetLocale?: string;
};

function productIdFromGid(gid: string) {
  return String(gid).split('/').pop() ?? '';
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';

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

  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://aganim-api.onrender.com';

  const productsQuery = usingOfflineClient
    ? `query Products {
        products(first: 50, sortKey: TITLE) {
          edges {
            node {
              id
              title
              descriptionHtml
              productType
              featuredImage { url }
            }
          }
        }
      }`
    : `query Products($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges {
            node {
              id
              title
              descriptionHtml
              productType
              featuredImage { url }
            }
          }
        }
      }`;

  let productsRes = await graphqlQuery(
    productsQuery,
    usingOfflineClient ? undefined : { first: 50 },
  );

  if (!productsRes?.data && usingOfflineClient) {
    const { admin, session } = await authenticate.admin(request);
    sessionShop = session.shop;
    graphqlQuery = async (query, variables) => {
      const resp = await admin.graphql(query, { variables });
      return await resp.json();
    };
    productsRes = await graphqlQuery(
      `query Products($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges {
            node {
              id
              title
              descriptionHtml
              productType
              featuredImage { url }
            }
          }
        }
      }`,
      { first: 50 },
    );
  }

  const rawProducts =
    productsRes?.data?.products?.edges?.map((e: any) => e.node) ?? [];

  const products: ProductItem[] = rawProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    descriptionHtml: p.descriptionHtml || '',
    productType: p.productType || '',
    featuredImageUrl: p.featuredImage?.url ?? '',
  }));

  let planName: LoaderData['planName'] = 'Free';
  let defaultTargetLocale: string | undefined = undefined;
  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
  try {
    const u = await fetch(
      `${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(sessionShop)}`,
    );
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      const eff = String(data?.effective_plan_name || data?.plan_name || '').trim();
      if (eff === 'Free' || eff === 'Basic' || eff === 'Standard' || eff === 'Pro') {
        planName = eff as LoaderData['planName'];
      }
      entitlements = (data.entitlements || {}) as Entitlements;
      feature_usage = (data.feature_usage || {}) as FeatureUsageMap;
      defaultTargetLocale = data?.default_target_locale ?? undefined;
    }
  } catch {
    // best-effort
  }

  return { shop: sessionShop, backendApiUrl, planName, products, entitlements, feature_usage, defaultTargetLocale };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  if (intent !== 'save_image') {
    return { ok: false, error: 'Unknown intent' };
  }

  const productId = String(formData.get('productId') || '');
  const imageUrl = String(formData.get('imageUrl') || '');

  if (!productId || !imageUrl) {
    return { ok: false, error: 'Missing productId or imageUrl' };
  }

  const { admin } = await authenticate.admin(request);

  const resp = await admin.graphql(
    `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
            image { url }
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        productId,
        media: [
          {
            originalSource: imageUrl,
            mediaContentType: 'IMAGE',
          },
        ],
      },
    },
  );

  const body: any = await resp.json();
  const errs = body?.data?.productCreateMedia?.mediaUserErrors ?? [];
  if (errs.length > 0) {
    return { ok: false, error: errs[0]?.message ?? 'Failed to add image' };
  }

  return { ok: true };
};

const LOADING_MSG_KEYS = ['analyzing', 'isolating', 'regenerating', 'polishing'] as const;

export default function ImageRefinement() {
  const { shop, backendApiUrl, planName, products, entitlements, feature_usage, defaultTargetLocale } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const app = useAppBridge() as unknown as ClientApplication<any>;
  const { t } = useTranslation();

  const canUseImages = canAccess(entitlements, 'image_refinement_adhoc');

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id ?? '',
  );
  const [missionId, setMissionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [refinedImageUrl, setRefinedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const saveFetcher = useFetcher<typeof action>();
  const isSaving = saveFetcher.state !== 'idle';
  const saveError =
    saveFetcher.data && !saveFetcher.data.ok ? saveFetcher.data.error : null;

  const [loadingIdx, setLoadingIdx] = useState(0);
  const loadingTimerRef = useRef<number | null>(null);
  const isRunning = Boolean(missionId) && !isComplete && !error;

  useEffect(() => {
    if (!isRunning) {
      if (loadingTimerRef.current) window.clearInterval(loadingTimerRef.current);
      return;
    }
    setLoadingIdx(0);
    loadingTimerRef.current = window.setInterval(() => {
      setLoadingIdx((prev) => (prev + 1) % LOADING_MSG_KEYS.length);
    }, 4000);
    return () => {
      if (loadingTimerRef.current) window.clearInterval(loadingTimerRef.current);
    };
  }, [isRunning]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        label: p.title,
        value: p.id,
      })),
    [products],
  );

  const navQs = useMemo(() => {
    const p = new URLSearchParams();
    if (searchParams.get('host')) p.set('host', searchParams.get('host')!);
    if (shop) p.set('shop', shop);
    return p.toString();
  }, [searchParams, shop]);

  const nav = useCallback(
    (path: string) => (navQs ? `${path}?${navQs}` : path),
    [navQs],
  );

  const plansUrl = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/app/plans?from=dashboard&${qs}` : '/app/plans?from=dashboard';
  }, [searchParams]);

  useEffect(() => {
    if (saveFetcher.data?.ok) {
      setSavedSuccess(true);
    }
  }, [saveFetcher.data]);

  useEffect(() => {
    setMissionId(null);
    setIsComplete(false);
    setRefinedImageUrl(null);
    setError(null);
    setSavedSuccess(false);
  }, [selectedProductId]);

  const handleOptimize = useCallback(async () => {
    if (!selectedProduct) return;
    setError(null);
    setIsStarting(true);

    let token: string | null = null;
    try {
      token = await getSessionToken(app);
    } catch {
      token = null;
    }

    try {
      const url = new URL(`${backendApiUrl}/api/missions`);
      if (!token && shop) {
        url.searchParams.set('shop', shop);
      }

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          product_id: productIdFromGid(selectedProduct.id),
          product_name: selectedProduct.title,
          japanese_description: selectedProduct.descriptionHtml,
          category: selectedProduct.productType || 'General',
          image_url: selectedProduct.featuredImageUrl || '',
          target_locale: defaultTargetLocale || 'en',
          workflow_config: [{ agent_name: 'ImageRefinementAgent', has_gate: false }],
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        const detail = errBody?.detail;
        throw new Error(
          typeof detail === 'string' ? detail : `Image refinement failed (${resp.status})`
        );
      }
      const data = await resp.json();
      setMissionId(data.mission_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to start image refinement');
    } finally {
      setIsStarting(false);
    }
  }, [selectedProduct, backendApiUrl, app, shop, defaultTargetLocale]);

  return (
    <Page
      title={t('imageRefinement.title')}
      titleMetadata={!canUseImages ? <PlanGateBadge tierName="Pro" /> : undefined}
      backAction={{
        content: t('imageRefinement.backToWritingStudio'),
        onAction: () => navigate(nav('/app/writing-studio')),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {!canUseImages ? (
              <LockedFeatureNotice
                title={t('imageRefinement.proFeature')}
                description={t('imageRefinement.proFeatureDesc')}
                ctaLabel={t('imageRefinement.upgradeToPro')}
                ctaUrl={plansUrl}
              />
            ) : (
              <>
                {/* Product Selection */}
                <Card>
                  <Box padding="500">
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd">
                        {t('imageRefinement.selectProduct')}
                      </Text>
                      {products.length === 0 ? (
                        <Banner tone="warning">
                          <Text as="p">
                            {t('imageRefinement.noProducts')}
                          </Text>
                        </Banner>
                      ) : (
                        <Select
                          label={t('imageRefinement.product')}
                          options={productOptions}
                          value={selectedProductId}
                          onChange={(val) => setSelectedProductId(val)}
                        />
                      )}

                      {/* Product image preview */}
                      {selectedProduct && (
                        <InlineStack gap="400" blockAlign="center">
                          {selectedProduct.featuredImageUrl ? (
                            <div
                              style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid #e1e3e5',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={selectedProduct.featuredImageUrl}
                                alt={selectedProduct.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '12px',
                                background: '#f6f6f7',
                                border: '2px dashed #c9cccf',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Text as="p" tone="subdued" variant="bodySm">
                                {t('imageRefinement.noImage')}
                              </Text>
                            </div>
                          )}
                          <BlockStack gap="200">
                            <Text as="p" variant="headingSm">
                              {selectedProduct.title}
                            </Text>
                            {selectedProduct.featuredImageUrl ? (
                              <Text as="p" variant="bodySm" tone="subdued">
                                {t('imageRefinement.imageCleanupDesc')}
                              </Text>
                            ) : (
                              <Text as="p" variant="bodySm" tone="caution">
                                {t('imageRefinement.noFeaturedImage')}
                              </Text>
                            )}
                          </BlockStack>
                        </InlineStack>
                      )}
                    </BlockStack>
                  </Box>
                </Card>

                {/* Visual Agent Card */}
                <Card>
                  <Box padding="500">
                    <BlockStack gap="400">
                      <InlineStack gap="200" blockAlign="center" wrap>
                        <span style={{ fontSize: '20px' }}>🎨</span>
                        <Text as="h2" variant="headingMd">
                          {t('imageRefinement.visualEnhancement')}
                        </Text>
                        {(() => {
                          const imgUsage = feature_usage.image_generation;
                          const usageStr = formatUsage(imgUsage, false);
                          return usageStr ? (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {t('imageRefinement.credits')} {usageStr}
                            </Text>
                          ) : null;
                        })()}
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t('imageRefinement.enhancementDesc')}
                      </Text>

                      {error && (
                        <Banner tone="critical" title={t('imageRefinement.refinementError')}>
                          <Text as="p">{error}</Text>
                        </Banner>
                      )}

                      {!selectedProduct?.featuredImageUrl && selectedProduct && (
                        <Banner tone="warning">
                          <Text as="p" variant="bodySm">
                            {t('imageRefinement.noProductImage')}
                          </Text>
                        </Banner>
                      )}

                      {/* Optimize button */}
                      {!missionId && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <div className="feature-btn-glow-2">
                            <Button
                              variant="primary"
                              size="large"
                              onClick={handleOptimize}
                              disabled={
                                !selectedProduct?.featuredImageUrl ||
                                isStarting ||
                                !selectedProduct
                              }
                              loading={isStarting}
                            >
                              {t('imageRefinement.optimize')}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Rotating loading messages while processing */}
                      {isRunning && (
                        <Box>
                          <div className="aiActionsLoader" aria-live="polite">
                            <InlineStack gap="200" blockAlign="center">
                              <Spinner size="small" />
                              <Text as="p" tone="subdued">
                                <span className="aiLoaderText">{t(`imageRefinement.${LOADING_MSG_KEYS[loadingIdx]}`)}</span>
                              </Text>
                            </InlineStack>
                          </div>
                        </Box>
                      )}

                      {/* MissionTimeline for live visual generation */}
                      {missionId && (
                        <MissionTimeline
                          missionId={missionId}
                          apiBaseUrl={backendApiUrl}
                          shop={shop}
                          initialAgents={['ImageRefinementAgent']}
                          compact
                          showSummary={false}
                          onComplete={(state) => {
                            setIsComplete(true);
                            const url =
                              state?.visual_assets?.refined_url ||
                              (state?.agent_outputs?.ImageRefinementAgent?.refined_url as string | undefined) ||
                              null;
                            if (url) setRefinedImageUrl(url);
                          }}
                          onError={(err) => setError(err)}
                        />
                      )}

                      {/* Before / After preview + Save to Shopify */}
                      {isComplete && refinedImageUrl && !savedSuccess && (
                        <BlockStack gap="400">
                          <Card>
                            <Box padding="400">
                              <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">
                                  {t('imageRefinement.resultPreview')}
                                </Text>
                                <InlineStack gap="400" align="center" wrap>
                                  {selectedProduct?.featuredImageUrl && (
                                    <BlockStack gap="200">
                                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                                        {t('imageRefinement.before')}
                                      </Text>
                                      <div
                                        style={{
                                          width: '180px',
                                          height: '180px',
                                          borderRadius: '12px',
                                          overflow: 'hidden',
                                          border: '1px solid #e1e3e5',
                                        }}
                                      >
                                        <img
                                          src={selectedProduct.featuredImageUrl}
                                          alt={t('imageRefinement.originalAlt')}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      </div>
                                    </BlockStack>
                                  )}
                                  <div style={{ fontSize: '24px', color: '#8c9196' }}>→</div>
                                  <BlockStack gap="200">
                                    <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                                      {t('imageRefinement.after')}
                                    </Text>
                                    <div
                                      style={{
                                        width: '180px',
                                        height: '180px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '2px solid #2c6ecb',
                                        boxShadow: '0 0 0 3px rgba(44, 110, 203, 0.15)',
                                      }}
                                    >
                                      <img
                                        src={refinedImageUrl}
                                        alt={t('imageRefinement.refinedAlt')}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    </div>
                                  </BlockStack>
                                </InlineStack>
                              </BlockStack>
                            </Box>
                          </Card>

                          {saveError && (
                            <Banner tone="critical" title={t('imageRefinement.saveFailed')}>
                              <Text as="p">{saveError}</Text>
                            </Banner>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="feature-btn-glow-2">
                              <Button
                                variant="primary"
                                size="large"
                                onClick={() => {
                                  saveFetcher.submit(
                                    {
                                      intent: 'save_image',
                                      productId: selectedProductId,
                                      imageUrl: refinedImageUrl,
                                    },
                                    { method: 'POST' },
                                  );
                                }}
                                loading={isSaving}
                                disabled={isSaving}
                              >
                                {t('imageRefinement.saveToShopify')}
                              </Button>
                            </div>
                          </div>
                        </BlockStack>
                      )}

                      {savedSuccess && (
                        <Banner tone="success" title={t('imageRefinement.imageSaved')}>
                          <Text as="p">
                            {t('imageRefinement.imageSavedDesc')}
                          </Text>
                        </Banner>
                      )}
                    </BlockStack>
                  </Box>
                </Card>
              </>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
