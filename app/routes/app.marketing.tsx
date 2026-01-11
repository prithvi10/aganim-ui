import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useSearchParams, useFetcher} from 'react-router';
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
  Link,
  Modal,
  Page,
  Scrollable,
  Text,
  TextField,
  Thumbnail,
  Toast,
} from '@shopify/polaris';
import {useAppBridge} from '@shopify/app-bridge-react';
import {getSessionToken} from '@shopify/app-bridge/utilities';
import {useCallback, useEffect, useMemo, useState} from 'react';

import {authenticate, getOfflineGraphqlClient} from '../shopify.server';

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
};
type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  images: ProductImage[];
  socialHooksCache?: SocialHooksCache | null;
};

type LoaderData = {
  planName: 'Free' | 'Pro' | 'Growth';
  shop: string;
  shopSlug: string;
  products: ProductListItem[];
  selectedProduct: SelectedProduct | null;
};

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return '';
  return String(gid).split('/').pop() ?? '';
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
  const hasGrowth = activeSubs.some((s) => s.status === 'ACTIVE' && s.name === 'Growth');
  const hasPro = activeSubs.some((s) => s.status === 'ACTIVE' && s.name === 'Pro');
  const planName: LoaderData['planName'] = hasGrowth ? 'Growth' : hasPro ? 'Pro' : 'Free';

  const products: ProductListItem[] =
    productsRes?.data?.products?.edges?.map((e: any) => e.node) ?? [];

  const fallbackSelected = firstOrNull(products)?.id ?? '';
  const selectedProductId = selectedProductIdParam || fallbackSelected;

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
              metafield(namespace: "crossborderagent", key: "social_hooks_instagram") {
                value
              }
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
              metafield(namespace: "crossborderagent", key: "social_hooks_instagram") {
                value
              }
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
  let parsedSocialHooks: SocialHooksCache | null = null;
  if (rawSelectedProduct?.metafield?.value) {
    try {
      parsedSocialHooks = JSON.parse(String(rawSelectedProduct.metafield.value));
    } catch {
      parsedSocialHooks = null;
    }
  }
  const selectedProduct: SelectedProduct | null = rawSelectedProduct
    ? {
        ...rawSelectedProduct,
        tags: Array.isArray(rawSelectedProduct.tags) ? rawSelectedProduct.tags : [],
        images:
          rawSelectedProduct?.images?.edges?.map((e: any) => e.node).filter(Boolean) ?? [],
        socialHooksCache: parsedSocialHooks,
      }
    : null;

  return {
    planName,
    shop,
    shopSlug,
    products,
    selectedProduct,
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
              value,
            },
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

export default function MarketingWorkspace() {
  const {planName, products, selectedProduct, shopSlug} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge();

  const [search, setSearch] = useState('');
  const [imagesOpen, setImagesOpen] = useState(false);

  // Social Hook Architect
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

  const [toastContent, setToastContent] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, search]);

  const selectedProductId = searchParams.get('productId') || (products[0]?.id ?? '');
  const shopMarketingUrl = useMemo(() => {
    if (!shopSlug) return '';
    return `https://admin.shopify.com/store/${shopSlug}/marketing`;
  }, [shopSlug]);
  const shopCampaignsUrl = useMemo(() => {
    if (!shopSlug) return '';
    return `https://admin.shopify.com/store/${shopSlug}/marketing/campaigns`;
  }, [shopSlug]);
  const adminProductUrl = useMemo(() => {
    if (!shopSlug || !selectedProduct?.id) return '';
    const id = productIdFromGid(selectedProduct.id);
    if (!id) return '';
    return `https://admin.shopify.com/store/${shopSlug}/products/${encodeURIComponent(id)}`;
  }, [selectedProduct?.id, shopSlug]);

  const callAgent = useCallback(
    async (actionName: string, productData: Record<string, any>, context: Record<string, any>) => {
      let token: string | null = null;
      try {
        token = await getSessionToken(app as any);
      } catch {
        token = null;
      }

      const resp = await fetch('/api/agent', {
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
    [app],
  );

  const runSocialHooks = useCallback(async () => {
    if (!selectedProduct?.id) return;
    setHooksLoading(true);
    setHooksError(null);
    setOverlaySuggestions([]);
    try {
      const result = await callAgent(
        'social_hook_architect',
        {
          id: selectedProduct.id,
          title: selectedProduct.title,
          category: selectedProduct.productType,
          productType: selectedProduct.productType,
          tags: selectedProduct.tags,
        },
        {focus: 'Instagram Reels'},
      );
      const nextHooks = (result?.data?.metadata?.hooks ?? []) as any[];
      const overlays = (result?.data?.metadata?.overlay_suggestions ?? []) as any[];
      const safeHooks = Array.isArray(nextHooks) ? nextHooks : [];
      const safeOverlays = Array.isArray(overlays) ? overlays.map(String) : [];
      setHooks(safeHooks);
      setOverlaySuggestions(safeOverlays);
      setSelectedHookIndex(0);

      // Persist cache on the product (Shopify metafield) to avoid re-calling the LLM.
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
    } catch (e: any) {
      setHooksError(e?.message ?? 'Failed to generate hooks.');
    } finally {
      setHooksLoading(false);
    }
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

  // Run both panels when product changes
  useEffect(() => {
    setHooks([]);
    setHooksError(null);
    setSeasonalError(null);
    if (!selectedProduct?.id) return;
    // Use cached hooks if present; otherwise generate once and persist to metafield.
    const cached = selectedProduct.socialHooksCache;
    if (cached?.hooks?.length) {
      setHooks(cached.hooks);
      setOverlaySuggestions(Array.isArray(cached.overlay_suggestions) ? cached.overlay_suggestions : []);
      setSelectedHookIndex(0);
    } else {
      runSocialHooks();
    }
  }, [selectedProduct?.id]);

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
    <Page title="Marketing Consultant">
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Products
                  </Text>
                  <Badge tone={planName === 'Free' ? 'warning' : 'success'}>{planName}</Badge>
                </InlineStack>

                <TextField
                  label="Search"
                  labelHidden
                  value={search}
                  onChange={setSearch}
                  placeholder="Search products…"
                  autoComplete="off"
                />

                <Divider />

                <Scrollable style={{height: 720}}>
                  <BlockStack gap="100">
                    {filteredProducts.map((p) => {
                      const isSelected = p.id === selectedProductId;
                      return (
                        <Box
                          key={p.id}
                          padding="200"
                          background={isSelected ? 'bg-surface-secondary' : undefined}
                          borderRadius="200"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const next = new URLSearchParams(searchParams);
                              next.set('productId', p.id);
                              setSearchParams(next);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                            aria-current={isSelected ? 'true' : undefined}
                          >
                            <Text as="span" variant="bodySm" breakWord>
                              {p.title}
                            </Text>
                          </button>
                        </Box>
                      );
                    })}
                  </BlockStack>
                </Scrollable>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <Box padding="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Selected product
                  </Text>
                  {selectedProduct ? (
                    <>
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd">
                            <strong>{selectedProduct.title}</strong>
                          </Text>
                          <Text as="p" tone="subdued">
                            Category: {selectedProduct.productType || '—'}
                          </Text>
                          {adminProductUrl ? (
                            <Link url={adminProductUrl} external>
                              Open product details
                            </Link>
                          ) : null}
                        </BlockStack>

                        {selectedProduct.images?.length ? (
                          <InlineStack gap="200" blockAlign="center">
                            {selectedProduct.images.slice(0, 3).map((img, idx) => (
                              <button
                                key={`${img.url}-${idx}`}
                                type="button"
                                onClick={() => setImagesOpen(true)}
                                aria-label="View product images"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                }}
                              >
                                <Thumbnail
                                  source={img.url}
                                  alt={img.altText || selectedProduct.title}
                                  size="small"
                                />
                              </button>
                            ))}
                            {selectedProduct.images.length > 3 ? (
                              <Button variant="plain" onClick={() => setImagesOpen(true)}>
                                {`+${selectedProduct.images.length - 3}`}
                              </Button>
                            ) : null}
                          </InlineStack>
                        ) : null}
                      </InlineStack>

                      <Modal
                        open={imagesOpen}
                        onClose={() => setImagesOpen(false)}
                        title="Product images"
                      >
                        <Modal.Section>
                          {selectedProduct.images?.length ? (
                            <Scrollable style={{maxHeight: 520}}>
                              <BlockStack gap="300">
                                {selectedProduct.images.map((img, idx) => (
                                  <Card key={`${img.url}-${idx}`}>
                                    <Box padding="300">
                                      <BlockStack gap="200">
                                        <Thumbnail
                                          source={img.url}
                                          alt={img.altText || selectedProduct.title}
                                          size="large"
                                        />
                                        <Link url={img.url} external>
                                          Open image
                                        </Link>
                                      </BlockStack>
                                    </Box>
                                  </Card>
                                ))}
                              </BlockStack>
                            </Scrollable>
                          ) : (
                            <Text as="p" tone="subdued">
                              No images found for this product.
                            </Text>
                          )}
                        </Modal.Section>
                      </Modal>
                    </>
                  ) : (
                    <Banner tone="warning">No product selected.</Banner>
                  )}
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Social Hook Architect (Instagram)
                    </Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Link url="https://www.instagram.com/reels/create/" external>
                        Open Instagram Reels
                      </Link>
                    </InlineStack>
                  </InlineStack>

                  {hooksError ? <Banner tone="critical">{hooksError}</Banner> : null}

                  <InlineStack align="end">
                    <Button onClick={runSocialHooks} disabled={!selectedProduct?.id}>
                      {hooksLoading ? 'Generating…' : 'Regenerate'}
                    </Button>
                  </InlineStack>

                  <Banner tone="info">
                    Text overlay suggestions:{' '}
                    {overlaySuggestions.length
                      ? overlaySuggestions.join(' · ')
                      : 'Generating…'}
                  </Banner>

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
                  ) : (
                    <Text as="p" tone="subdued">
                      Select a product to generate hooks.
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
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
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


