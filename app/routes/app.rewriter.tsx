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
  Toast,
  Tabs,
  Spinner,
} from '@shopify/polaris';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useAppBridge} from '@shopify/app-bridge-react';
import type {ClientApplication} from '@shopify/app-bridge/client';
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
  primaryLocale: string;
  locales: ShopLocale[];
  products: ProductListItem[];
  selectedProduct: {
    id: string;
    title: string;
    descriptionHtml: string;
    productType: string;
  } | null;
  translationsByLocale: Record<string, {title?: string; descriptionHtml?: string}>;
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
    .filter((s) => {
      const st = String(s.status || '').toUpperCase();
      // Shopify can return PENDING briefly right after upgrade; treat as active for UI gating.
      return !st || st === 'ACTIVE' || st === 'PENDING';
    })
    .map((s) => String(s.name || ''));
  const normalizedNames = activeNames.map((n) => n.toLowerCase());
  const hasGrowth = normalizedNames.some((n) => n.includes('growth'));
  const hasPro = normalizedNames.some((n) => n.includes('pro'));
  const planName: LoaderData['planName'] = hasGrowth ? 'Growth' : hasPro ? 'Pro' : 'Free';

  const locales: ShopLocale[] = localesRes?.data?.shopLocales ?? [];
  const primaryLocale = locales.find((l) => l.primary)?.locale || 'en';
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

  // Existing translations for this product (used for locale switching in the workspace).
  // NOTE: Shopify requires a `locale` argument for `translations(...)`, so we query per locale.
  const translationsByLocale: LoaderData['translationsByLocale'] = {};
  if (selectedProductId) {
    const safeId = String(selectedProductId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const localeList = locales.filter((l) => l.published).map((l) => l.locale);

    for (const loc of localeList) {
      const safeLocale = String(loc).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const tr = await graphqlQuery(
        `query TranslationsForLocale {
          translatableResource(resourceId: "${safeId}") {
            translations(locale: "${safeLocale}") {
              key
              value
            }
          }
        }`,
      );

      const items: Array<{key: string; value: string}> =
        tr?.data?.translatableResource?.translations ?? [];

      const bucket = (translationsByLocale[loc] ||= {});
      for (const item of items) {
        if (item?.key === 'title') bucket.title = item.value;
        if (item?.key === 'body_html') bucket.descriptionHtml = item.value;
      }
    }
  }

  return {
    shop: sessionShop,
    shopSlug,
    planName,
    primaryLocale,
    locales,
    products,
    selectedProduct,
    translationsByLocale,
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
    const targetLocale = String(formData.get('targetLocale') || '');
    const title = String(formData.get('draftTitle') || '');
    const descriptionHtml = String(formData.get('draftDescription') || '');

    // Determine shop primary locale
    const localesResp = await admin.graphql(`query ShopLocales { shopLocales { locale primary } }`);
    const localesJson = await localesResp.json();
    const shopLocales: Array<{locale: string; primary: boolean}> =
      localesJson?.data?.shopLocales ?? [];
    const primaryLocale = shopLocales.find((l) => l.primary)?.locale || 'en';

    // If saving to primary locale, update product directly
    if (!targetLocale || targetLocale === primaryLocale) {
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

    // Otherwise, register translation for the target locale (prevents overwriting the primary language)
    const digestResp = await admin.graphql(
      `query Digests($id: ID!) {
        translatableResource(resourceId: $id) {
          translatableContent {
            key
            digest
          }
        }
      }`,
      {variables: {id: productId}},
    );
    const digestJson = await digestResp.json();
    const contents: Array<{key: string; digest: string}> =
      digestJson?.data?.translatableResource?.translatableContent ?? [];
    const titleDigest = contents.find((c) => c.key === 'title')?.digest || '';
    const bodyDigest = contents.find((c) => c.key === 'body_html')?.digest || '';
    if (!titleDigest || !bodyDigest) {
      return {ok: false, error: 'Missing translation digests for title/body_html.'};
    }

    const registerResp = await admin.graphql(
      `mutation Register($id: ID!, $translations: [TranslationInput!]!) {
        translationsRegister(resourceId: $id, translations: $translations) {
          userErrors { message }
        }
      }`,
      {
        variables: {
          id: productId,
          translations: [
            {
              locale: targetLocale,
              key: 'title',
              value: title,
              translatableContentDigest: titleDigest,
            },
            {
              locale: targetLocale,
              key: 'body_html',
              value: descriptionHtml,
              translatableContentDigest: bodyDigest,
            },
          ],
        },
      },
    );
    const registerJson = await registerResp.json();
    const userErrors = registerJson?.data?.translationsRegister?.userErrors ?? [];
    if (userErrors.length > 0) {
      return {ok: false, error: userErrors[0]?.message ?? 'Translation save failed'};
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
  const {planName, primaryLocale, locales, products, selectedProduct, translationsByLocale} =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<string>('');
  const [overLimit, setOverLimit] = useState(false);

  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceDescription, setReferenceDescription] = useState('');

  const [draftByLocale, setDraftByLocale] = useState<
    Record<string, {title: string; description: string}>
  >({});
  const [isSwitchingLocale, setIsSwitchingLocale] = useState(false);
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
    const primary = publishedLocales.find((l) => l.primary)?.locale || primaryLocale;
    if (primary) setSelectedLocales([primary]);
  }, [publishedLocales, selectedLocales.length]);

  // Keep active locale in sync (tabs control the visible draft)
  useEffect(() => {
    const published = publishedLocales.map((l) => l.locale);
    if (activeLocale && published.includes(activeLocale)) return;
    const next =
      publishedLocales.find((l) => l.primary)?.locale ||
      primaryLocale ||
      published[0] ||
      '';
    setActiveLocale(next);
  }, [activeLocale, primaryLocale, publishedLocales]);

  // When product changes, reset reference + draft to current product
  useEffect(() => {
    setOptimizeError(null);
    setReferenceTitle(selectedProduct?.title ?? '');
    setReferenceDescription(selectedProduct?.descriptionHtml ?? '');

    const baseTitle = selectedProduct?.title ?? '';
    const baseDesc = selectedProduct?.descriptionHtml ?? '';

    // Seed draft map from existing Shopify translations, falling back to primary content.
    const seeded: Record<string, {title: string; description: string}> = {};
    for (const loc of publishedLocales.map((l) => l.locale)) {
      const t = translationsByLocale?.[loc];
      seeded[loc] = {
        title: t?.title ?? baseTitle,
        description: t?.descriptionHtml ?? baseDesc,
      };
    }
    setDraftByLocale(seeded);

    // Ensure activeLocale stays valid for the new product
    const initLocale =
      activeLocale ||
      publishedLocales.find((l) => l.primary)?.locale ||
      primaryLocale ||
      publishedLocales[0]?.locale ||
      '';
    if (initLocale) setActiveLocale(initLocale);
  }, [selectedProduct?.id]);

  // Success toast after Save
  useEffect(() => {
    if ((saveFetcher.data as any)?.ok) {
      setToastContent('Product saved, please refresh to check!');
    }
  }, [saveFetcher.data]);

  const app = useAppBridge() as unknown as ClientApplication<any>;

  // Show a small spinner while switching locales (prevents perceived flicker)
  useEffect(() => {
    if (!activeLocale) return;
    const hasDraft = Boolean(draftByLocale[activeLocale]);
    // if we don't have draft data yet, keep spinner on until it arrives
    setIsSwitchingLocale(!hasDraft);
  }, [activeLocale, draftByLocale]);

  const currentDraft = useMemo(() => {
    const baseTitle = selectedProduct?.title ?? '';
    const baseDesc = selectedProduct?.descriptionHtml ?? '';
    const fromMap = activeLocale ? draftByLocale[activeLocale] : undefined;
    if (fromMap) return fromMap;
    const fromTranslations = activeLocale ? translationsByLocale?.[activeLocale] : undefined;
    return {
      title: fromTranslations?.title ?? baseTitle,
      description: fromTranslations?.descriptionHtml ?? baseDesc,
    };
  }, [activeLocale, draftByLocale, selectedProduct?.descriptionHtml, selectedProduct?.title, translationsByLocale]);

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
        // Pro users can generate for multiple locales at once; we still preview the activeLocale in the Draft pane.
        target_locales: selectedLocales.length > 0 ? selectedLocales : [activeLocale],
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

      // Update the currently-visible locale draft (active tab)
      setDraftByLocale((prev) => ({
        ...prev,
        [activeLocale]: {
          title: typeof data.title === 'string' && data.title ? data.title : prev[activeLocale]?.title ?? '',
          description:
            typeof data.description === 'string' && data.description
              ? data.description
              : prev[activeLocale]?.description ?? '',
        },
      }));

      // If multi-locale, store drafts for all returned locales so switching works.
      if (result?.results && typeof result.results === 'object') {
        setDraftByLocale((prev) => {
          const next = {...prev};
          for (const [loc, payload] of Object.entries(result.results)) {
            const p: any = payload;
            next[loc] = {
              title: String(p?.title ?? next[loc]?.title ?? ''),
              description: String(p?.description ?? next[loc]?.description ?? ''),
            };
          }
          return next;
        });
      }

      const processed = Array.isArray(result?.processed) ? result.processed : [];
      setToastContent(
        processed.length > 1
          ? `Product Description updated! (${processed.join(', ')})`
          : 'Product Description updated!',
      );
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
    selectedLocales,
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

  const draftTabs = useMemo(() => {
    // Show all published locales as tabs (EN, FR, KO, zh-TW, etc.)
    return publishedLocales.map((l) => {
      const short = String(l.locale).split('-')[0]?.toUpperCase() || String(l.locale).toUpperCase();
      return {
        id: l.locale,
        content: short,
        accessibilityLabel: l.name,
      };
    });
  }, [publishedLocales]);

  const selectedTabIndex = useMemo(() => {
    const idx = draftTabs.findIndex((t) => t.id === activeLocale);
    return idx >= 0 ? idx : 0;
  }, [activeLocale, draftTabs]);

  return (
    <Page title="Rewriter" titleHidden fullWidth>
      <Box padding="400">
        <InlineStack gap="300" blockAlign="center">
          <img
            src="/Icon-final.png"
            alt="Cross-Border AI"
            style={{width: 24, height: 24}}
          />
          <Text as="h1" variant="headingLg">
            Rewriter
          </Text>
        </InlineStack>
      </Box>
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

                <InlineStack gap="500" blockAlign="start" wrap={false}>
                  <Box width="50%">
                    <Card>
                      <Box padding="400">
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Reference
                          </Text>
                          {/* Spacer to align with the Draft locale tabs row */}
                          <div style={{height: 44}} aria-hidden="true" />
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
                          <Tabs
                            tabs={draftTabs}
                            selected={selectedTabIndex}
                            onSelect={(index) => {
                              const id = draftTabs[index]?.id;
                              if (id) {
                                setIsSwitchingLocale(true);
                                setActiveLocale(id);
                              }
                            }}
                          />
                          {isSwitchingLocale ? (
                            <InlineStack gap="200" blockAlign="center">
                              <Spinner accessibilityLabel="Loading locale" size="small" />
                              <Text as="span" variant="bodySm" tone="subdued">
                                Loading…
                              </Text>
                            </InlineStack>
                          ) : null}
                          <TextField
                            label="Title"
                            value={currentDraft.title}
                            onChange={(v) =>
                              setDraftByLocale((prev) => ({
                                ...prev,
                                [activeLocale]: {title: v, description: currentDraft.description},
                              }))
                            }
                            autoComplete="off"
                          />
                          <RichTextEditor
                            label="Description"
                            value={currentDraft.description}
                            onChange={(v) =>
                              setDraftByLocale((prev) => ({
                                ...prev,
                                [activeLocale]: {title: currentDraft.title, description: v},
                              }))
                            }
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

                <InlineStack align="space-between" gap="200" blockAlign="center">
                  {/* Locale selection for rewrite (moved next to Optimize button) */}
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Rewrite markets
                    </Text>
                    {overLimit ? (
                      <Banner tone="warning">
                        Free plan allows selecting 1 market. Upgrade to select multiple.
                      </Banner>
                    ) : null}
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                      {publishedLocales.map((loc) => {
                        const short =
                          String(loc.locale).split('-')[0]?.toUpperCase() ||
                          String(loc.locale).toUpperCase();
                        return (
                          <Checkbox
                            key={loc.locale}
                            label={short}
                            checked={selectedLocales.includes(loc.locale)}
                            onChange={(v) => toggleLocale(loc.locale, v)}
                          />
                        );
                      })}
                    </div>
                  </BlockStack>

                  <InlineStack align="end" gap="200">
                  <Button
                    onClick={handleOptimize}
                    disabled={
                      !selectedProduct ||
                      selectedLocales.length === 0 ||
                      isOptimizing ||
                      saveFetcher.state !== 'idle'
                    }
                  >
                    Optimize for Global
                  </Button>

                  <saveFetcher.Form method="post">
                    <input type="hidden" name="intent" value="save" />
                    <input type="hidden" name="productId" value={selectedProduct?.id ?? ''} />
                    <input type="hidden" name="targetLocale" value={activeLocale || primaryLocale} />
                    <input type="hidden" name="draftTitle" value={currentDraft.title} />
                    <input type="hidden" name="draftDescription" value={currentDraft.description} />
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


