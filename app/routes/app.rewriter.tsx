import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {
  useFetcher,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Divider,
  Box,
  Banner,
  Checkbox,
  Scrollable,
  Badge,
  Select,
  Toast,
} from '@shopify/polaris';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useAppBridge} from '@shopify/app-bridge-react';
import type {ClientApplication} from '@shopify/app-bridge/client';
import type {AppBridgeState} from '@shopify/shopify-app-react-router/react';
import {getSessionToken} from '@shopify/app-bridge/utilities';

import {authenticate, getOfflineGraphqlClient} from '../shopify.server';

type ShopLocale = {
  locale: string;
  name: string;
  published: boolean;
  primary: boolean;
};

type ProductListItem = {
  id: string;
  title: string;
};

type LoaderData = {
  shop: string;
  shopSlug: string;
  planName: 'Free' | 'Pro' | 'Growth';
  locales: ShopLocale[];
  products: ProductListItem[];
  selectedProduct: {
    id: string;
    title: string;
    descriptionHtml: string;
    productType: string;
  } | null;
  backendApiUrl: string;
};

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return '';
  return String(gid).split('/').pop() ?? '';
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
    graphqlQuery = async (query, variables) => {
      const resp = await offlineContext.client.query({data: query, variables});
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

  const shopSlug = sessionShop.replace('.myshopify.com', '');
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

  const localesQuery = `query ShopLocales {
    shopLocales {
      locale
      name
      published
      primary
    }
  }`;

  // NOTE: the offline GraphQL wrapper (`getOfflineGraphqlClient`) does not accept variables.
  // For offline mode, inline the arguments instead of using `$first`.
  const productsQuery = usingOfflineClient
    ? `query Products {
        products(first: 50, sortKey: TITLE) {
          edges {
            node { id title }
          }
        }
      }`
    : `query Products($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges {
            node { id title }
          }
        }
      }`;

  const [planRes, localesRes, productsRes] = await Promise.all([
    graphqlQuery(planQuery),
    graphqlQuery(localesQuery),
    graphqlQuery(productsQuery, usingOfflineClient ? undefined : {first: 50}),
  ]);

  const subs: {name: string; status?: string}[] =
    planRes?.data?.appInstallation?.activeSubscriptions ?? [];
  const activeNames = subs
    .filter((s) => !s.status || String(s.status).toUpperCase() === 'ACTIVE')
    .map((s) => s.name);
  const planName: LoaderData['planName'] =
    activeNames.includes('Growth') ? 'Growth' : activeNames.includes('Pro') ? 'Pro' : 'Free';

  const locales: ShopLocale[] = localesRes?.data?.shopLocales ?? [];
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
            }
          }`,
          {id: selectedProductId},
        )
    : null;

  const selectedProduct = selectedProductRes?.data?.product ?? null;

  return {
    shop: sessionShop,
    shopSlug,
    planName,
    locales,
    products,
    selectedProduct,
    backendApiUrl,
  } satisfies LoaderData;
};

export const action = async ({request}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  // Ensure the request is an authenticated embedded-app request.
  const {admin} = await authenticate.admin(request);

  if (intent === 'save') {
    const productId = String(formData.get('productId') || '');
    const title = String(formData.get('draftTitle') || '');
    const descriptionHtml = String(formData.get('draftDescription') || '');

    const resp = await admin.graphql(
      `mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id }
          userErrors { message }
        }
      }`,
      {
        variables: {
          input: {
            id: productId,
            ...(title ? {title} : {}),
            ...(descriptionHtml ? {descriptionHtml} : {}),
          },
        },
      },
    );
    const body = await resp.json();
    const errors = body?.data?.productUpdate?.userErrors ?? [];
    if (errors.length > 0) {
      return {ok: false, error: errors[0]?.message ?? 'Unknown error'};
    }
    return {ok: true};
  }

  return {ok: false, error: 'Unknown intent'};
};

function RichTextEditor({
  label,
  value,
  onChange,
  height = 320,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keep the editor showing rendered HTML without forcing cursor jumps while typing.
  useEffect(() => {
    if (!ref.current) return;
    if (isFocused) return;
    if (ref.current.innerHTML === value) return;
    ref.current.innerHTML = value || '';
  }, [value, isFocused]);

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      try {
        // eslint-disable-next-line deprecation/deprecation
        document.execCommand(command, false, commandValue);
        if (ref.current) onChange(ref.current.innerHTML);
      } catch {
        // no-op
      }
    },
    [onChange],
  );

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" tone="subdued">
        {label}
      </Text>

      <InlineStack gap="100">
        <Button size="micro" onClick={() => exec('bold')}>
          Bold
        </Button>
        <Button size="micro" onClick={() => exec('italic')}>
          Italic
        </Button>
        <Button size="micro" onClick={() => exec('insertUnorderedList')}>
          Bullets
        </Button>
        <Button size="micro" onClick={() => exec('insertOrderedList')}>
          Numbered
        </Button>
      </InlineStack>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        style={{
          border: '1px solid var(--p-color-border-secondary)',
          borderRadius: 8,
          padding: 12,
          minHeight: height,
          maxHeight: height,
          overflowY: 'auto',
          background: 'var(--p-color-bg-surface)',
        }}
      />
    </BlockStack>
  );
}

export default function RewriterWorkspace() {
  const {planName, locales, products, selectedProduct} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<string>('');
  const [overLimit, setOverLimit] = useState(false);

  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceDescription, setReferenceDescription] = useState('');

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('⏳ Analyzing materials and craftsmanship...');
  const loadingTimerRef = useRef<number | null>(null);

  const saveFetcher = useFetcher<typeof action>();

  const [toastContent, setToastContent] = useState<string | null>(null);

  const isPro = planName === 'Pro' || planName === 'Growth';

  const publishedLocales = useMemo(
    () => locales.filter((l) => l.published),
    [locales],
  );

  // Default selected locale: primary
  useEffect(() => {
    if (selectedLocales.length > 0) return;
    const primary = publishedLocales.find((l) => l.primary)?.locale;
    if (primary) setSelectedLocales([primary]);
  }, [publishedLocales, selectedLocales.length]);

  // Keep active locale in sync
  useEffect(() => {
    if (activeLocale && selectedLocales.includes(activeLocale)) return;
    const next = selectedLocales[0] || publishedLocales.find((l) => l.primary)?.locale || '';
    setActiveLocale(next);
  }, [activeLocale, publishedLocales, selectedLocales]);

  // When product changes, reset reference + draft to current product
  useEffect(() => {
    setOptimizeError(null);
    setReferenceTitle(selectedProduct?.title ?? '');
    setReferenceDescription(selectedProduct?.descriptionHtml ?? '');
    setDraftTitle(selectedProduct?.title ?? '');
    setDraftDescription(selectedProduct?.descriptionHtml ?? '');
  }, [selectedProduct?.id]);

  // Success toast after Save
  useEffect(() => {
    if ((saveFetcher.data as any)?.ok) {
      setToastContent('Product saved, please refresh to check!');
    }
  }, [saveFetcher.data]);

  const app = useAppBridge() as unknown as ClientApplication<AppBridgeState>;

  const startLoading = useCallback(() => {
    const msgs = [
      '⏳ Analyzing materials and craftsmanship...',
      '⏳ Applying global marketing psychology...',
      '⏳ Building your brand story...',
    ];
    let i = 0;
    setLoadingMessage(msgs[0]);
    if (loadingTimerRef.current) window.clearInterval(loadingTimerRef.current);
    loadingTimerRef.current = window.setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMessage(msgs[i]);
    }, 2000);
  }, []);

  const stopLoading = useCallback(() => {
    if (loadingTimerRef.current) window.clearInterval(loadingTimerRef.current);
    loadingTimerRef.current = null;
  }, []);

  const extractGenerated = (result: any, locale: string): {title?: string; description?: string} | null => {
    if (result?.data) return result.data;
    const results = result?.results;
    if (results && typeof results === 'object') {
      if (locale && results[locale]) return results[locale];
      const first = Object.keys(results)[0];
      if (first) return results[first];
    }
    return null;
  };

  const handleOptimize = useCallback(async () => {
    setOptimizeError(null);
    setOverLimit(false);

    if (!selectedProduct?.id) {
      setOptimizeError('No product selected.');
      return;
    }
    if (!activeLocale) {
      setOptimizeError('Please select a market.');
      return;
    }

    setIsOptimizing(true);
    startLoading();

    try {
      let token: string | null = null;
      try {
        token = await getSessionToken(app);
      } catch {
        token = null;
      }

      const payload = {
        japanese_description: referenceDescription ?? '',
        product_name: referenceTitle ?? '',
        category: selectedProduct?.productType ?? '',
        product_id: productIdFromGid(selectedProduct?.id),
        target_locales: [activeLocale],
      };

      // Call through same-origin proxy to avoid CORS; forward the session token to backend.
      const resp = await fetch('/api/proxy/generate-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.status !== 'success') {
        const msg = result?.detail || 'Generation failed';
        setOptimizeError(String(msg));
        return;
      }

      const data = extractGenerated(result, activeLocale);
      if (!data) {
        setOptimizeError('Generation succeeded but no content was returned.');
        return;
      }

      if (typeof data.title === 'string' && data.title) setDraftTitle(data.title);
      if (typeof data.description === 'string' && data.description) setDraftDescription(data.description);

      setToastContent('Product Description updated!');
    } catch (e: any) {
      setOptimizeError(e?.message ? `Network Error: ${e.message}` : 'Network Error');
    } finally {
      stopLoading();
      setIsOptimizing(false);
    }
  }, [
    activeLocale,
    app,
    referenceDescription,
    referenceTitle,
    selectedProduct?.id,
    selectedProduct?.productType,
    startLoading,
    stopLoading,
  ]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, search]);

  const selectedProductId = searchParams.get('productId') || (products[0]?.id ?? '');

  const toggleLocale = (locale: string, nextChecked: boolean) => {
    setOverLimit(false);
    setSelectedLocales((prev) => {
      const next = nextChecked ? Array.from(new Set([...prev, locale])) : prev.filter((l) => l !== locale);
      if (!isPro && next.length > 1) {
        setOverLimit(true);
        return prev;
      }
      return next;
    });
  };

  return (
    <Page
      title={
        <InlineStack gap="300" blockAlign="center">
          <img
            src="/Icon-final.png"
            alt="Cross-Border AI"
            style={{width: 24, height: 24}}
          />
          <span>Rewriter</span>
        </InlineStack>
      }
      fullWidth
    >
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

                <Box>
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
                            <Button
                              variant="plain"
                              onClick={() => {
                                const next = new URLSearchParams(searchParams);
                                next.set('productId', p.id);
                                setSearchParams(next);
                              }}
                            >
                              {p.title}
                            </Button>
                          </Box>
                        );
                      })}
                    </BlockStack>
                  </Scrollable>
                </Box>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">
                      Workspace
                    </Text>
                    <Text as="p" tone="subdued">
                      Generate a draft, refine it, then save to Shopify.
                    </Text>
                  </BlockStack>
                </InlineStack>

                {!selectedProduct ? (
                  <Banner tone="warning">No product selected.</Banner>
                ) : null}

                {optimizeError ? <Banner tone="critical">{optimizeError}</Banner> : null}

                <Divider />

                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Target Markets
                  </Text>
                  {overLimit ? (
                    <Banner tone="warning">
                      Free plan allows selecting 1 market. Upgrade to select multiple.
                    </Banner>
                  ) : null}

                  <Select
                    label="Active market for draft"
                    options={publishedLocales.map((l) => ({label: l.name, value: l.locale}))}
                    value={activeLocale}
                    onChange={(v) => setActiveLocale(v)}
                  />

                  <InlineStack gap="200">
                    {publishedLocales.map((loc) => (
                      <Checkbox
                        key={loc.locale}
                        label={`${loc.name}${loc.primary ? ' (Primary)' : ''}`}
                        checked={selectedLocales.includes(loc.locale)}
                        onChange={(v) => toggleLocale(loc.locale, v)}
                      />
                    ))}
                  </InlineStack>
                </BlockStack>

                <Divider />

                <InlineStack gap="500" blockAlign="start" wrap={false}>
                  <Box width="50%">
                    <Card>
                      <Box padding="400">
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Reference
                          </Text>
                          <TextField label="Title" value={referenceTitle} onChange={setReferenceTitle} autoComplete="off" />
                          <RichTextEditor
                            label="Description"
                            value={referenceDescription}
                            onChange={setReferenceDescription}
                            height={420}
                          />
                        </BlockStack>
                      </Box>
                    </Card>
                  </Box>

                  <Box width="50%">
                    <Card>
                      <Box padding="400">
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Draft
                          </Text>
                          <TextField
                            label="Title"
                            value={draftTitle}
                            onChange={setDraftTitle}
                            autoComplete="off"
                          />
                          <RichTextEditor
                            label="Description"
                            value={draftDescription}
                            onChange={setDraftDescription}
                            height={420}
                          />
                        </BlockStack>
                      </Box>
                    </Card>
                  </Box>
                </InlineStack>

                {(saveFetcher.data as any)?.error ? (
                  <Banner tone="critical">{(saveFetcher.data as any).error}</Banner>
                ) : null}

                <InlineStack align="end" gap="200">
                  <Button
                    onClick={handleOptimize}
                    disabled={
                      !selectedProduct ||
                      !activeLocale ||
                      isOptimizing ||
                      saveFetcher.state !== 'idle'
                    }
                  >
                    Optimize for Global
                  </Button>

                  <saveFetcher.Form method="post">
                    <input type="hidden" name="intent" value="save" />
                    <input type="hidden" name="productId" value={selectedProduct?.id ?? ''} />
                    <input type="hidden" name="draftTitle" value={draftTitle} />
                    <input type="hidden" name="draftDescription" value={draftDescription} />
                    <Button
                      variant="primary"
                      submit
                      disabled={
                        !selectedProduct ||
                        saveFetcher.state !== 'idle' ||
                        isOptimizing
                      }
                    >
                      Save
                    </Button>
                  </saveFetcher.Form>
                </InlineStack>

                {isOptimizing ? (
                  <Text as="p" tone="subdued">
                    {loadingMessage}
                  </Text>
                ) : null}
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


