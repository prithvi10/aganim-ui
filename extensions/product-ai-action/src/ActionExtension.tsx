import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  reactExtension,
  AdminAction,
  Banner,
  BlockStack,
  Button,
  Checkbox,
  Heading,
  Link,
  Text,
  TextArea,
  useApi,
} from '@shopify/ui-extensions-react/admin';

// --- Types ---
type ShopLocale = {
  locale: string;
  name: string;
  published: boolean;
  primary: boolean;
};

type Subscription = {
  name: string;
  status?: string;
};

type GeneratedContent = {
  title?: string;
  description?: string;
};

// --- Configuration ---
const BACKEND_GENERATE_BULK_URL =
  'https://shopify-translator-api.onrender.com/api/proxy/generate-bulk';

const LOADING_MESSAGES = [
  '⏳ Analyzing materials and craftsmanship...',
  '⏳ Applying global marketing psychology...',
  '⏳ Building your brand story...',
] as const;

// --- Entry Point ---
export default reactExtension('admin.product-details.action.render', () => (
  <Extension />
));

function Extension() {
  // 1. Get the extension API (Standard Version)
  const api = useApi<'admin.product-details.action.render'>();

  // 2. Extract Product ID from context safely
  const productGid = useMemo(() => api.data?.selected?.[0]?.id, [api.data]);
  
  // Convert "gid://shopify/Product/123456" -> "123456" for backend
  const productIdNumeric = useMemo(() => {
    if (!productGid) return '';
    const last = String(productGid).split('/').pop();
    return last ?? '';
  }, [productGid]);

  // --- State Management ---
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  // Shop & Plan State
  const [shopSlug, setShopSlug] = useState<string>('');
  const plansUrl = useMemo(() => {
    if (!shopSlug) return '';
    return `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/plans`;
  }, [shopSlug]);

  const [currentPlan, setCurrentPlan] = useState<'Free' | 'Pro' | 'Growth'>('Free');
  const isPro = useMemo(
    () => currentPlan === 'Pro' || currentPlan === 'Growth',
    [currentPlan],
  );

  // Locales State
  const [shopLocales, setShopLocales] = useState<ShopLocale[]>([]);
  const publishedLocales = useMemo(
    () => shopLocales.filter((l) => l.published),
    [shopLocales],
  );

  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [showOverLimitWarning, setShowOverLimitWarning] = useState(false);

  // Product Data State
  const [productTitle, setProductTitle] = useState<string>('');
  const [productType, setProductType] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Generation State
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generating...');
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Helpers ---
  const startLoadingFeedback = useCallback(() => {
    let index = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    loadingIntervalRef.current = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[index]);
    }, 2000);
  }, []);

  const stopLoadingFeedback = useCallback(() => {
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    loadingIntervalRef.current = null;
  }, []);

  // --- Data Fetching ---
  const fetchPlanAndLocales = useCallback(
    async (forceRefreshLabel?: 'Refreshing plan...') => {
      setMarketsError(null);
      setShowOverLimitWarning(false);

      try {
        // A. Get Shop Domain (for Upgrade Link)
        const shopRes = await api.query<{
          shop: {myshopifyDomain: string};
        }>(`query ShopDomain { shop { myshopifyDomain } }`);
        const myshopifyDomain = shopRes.data?.shop?.myshopifyDomain ?? '';
        setShopSlug(myshopifyDomain.replace('.myshopify.com', ''));

        // B. Get App Plan (Active Subscriptions)
        const planRes = await api.query<{
          appInstallation: {activeSubscriptions: Subscription[]};
        }>(
          `query AppPlan {
            appInstallation {
              activeSubscriptions {
                name
                status
              }
            }
          }`,
        );

        const subs = planRes.data?.appInstallation?.activeSubscriptions ?? [];
        const activeNames = subs
          .filter((s) => !s.status || String(s.status).toUpperCase() === 'ACTIVE')
          .map((s) => s.name);

        const nextPlan: 'Free' | 'Pro' | 'Growth' =
          activeNames.includes('Growth')
            ? 'Growth'
            : activeNames.includes('Pro')
              ? 'Pro'
              : 'Free';
        setCurrentPlan(nextPlan);

        // C. Get Shop Locales
        const localesRes = await api.query<{shopLocales: ShopLocale[]}>(
          `query ShopLocales {
            shopLocales {
              locale
              name
              published
              primary
            }
          }`,
        );

        const locales = localesRes.data?.shopLocales ?? [];
        setShopLocales(locales);

        // Default selection: primary locale
        const primary = locales.find((l) => l.published && l.primary)?.locale;
        if (primary && selectedLocales.length === 0) setSelectedLocales([primary]);

      } catch (e) {
        setMarketsError('Connection error. Please refresh.');
      }
    },
    [api, selectedLocales.length],
  );

  const fetchProduct = useCallback(async () => {
    if (!productGid) return;
    try {
      const res = await api.query<{
        product: {title: string; descriptionHtml: string; productType: string};
      }>(
        `query Product($id: ID!) {
          product(id: $id) {
            title
            descriptionHtml
            productType
          }
        }`,
        {variables: {id: productGid}},
      );

      setProductTitle(res.data?.product?.title ?? '');
      setDescription(res.data?.product?.descriptionHtml ?? '');
      setProductType(res.data?.product?.productType ?? '');
    } catch (e) {
      // Ignore errors so UI still loads
    }
  }, [api, productGid]);

  // --- Initial Load Effect ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingInitial(true);
      setInitialLoadError(null);

      try {
        await Promise.all([fetchPlanAndLocales(), fetchProduct()]);
      } catch (e) {
        if (!cancelled) setInitialLoadError('Connection error. Please refresh.');
      } finally {
        if (!cancelled) setIsLoadingInitial(false);
      }
    })();

    return () => {
      cancelled = true;
      stopLoadingFeedback();
    };
  }, [fetchPlanAndLocales, fetchProduct, stopLoadingFeedback]);

  // --- Logic Handlers ---
  const onToggleLocale = useCallback(
    (locale: string, nextChecked: boolean) => {
      setOptimizeError(null);
      setShowOverLimitWarning(false);

      setSelectedLocales((prev) => {
        const next = nextChecked
          ? Array.from(new Set([...prev, locale]))
          : prev.filter((l) => l !== locale);

        if (!isPro && next.length > 1) {
          setShowOverLimitWarning(true);
          return prev; // Block selection
        }
        return next;
      });
    },
    [isPro],
  );

  const extractGeneratedData = (result: any): GeneratedContent | null => {
    if (result?.data) return result.data as GeneratedContent;
    if (result?.results) {
      const firstLocale = Object.keys(result.results)[0];
      if (firstLocale) return result.results[firstLocale] as GeneratedContent;
    }
    return null;
  };

  const handleOptimize = useCallback(async () => {
    setOptimizeError(null);
    setShowOverLimitWarning(false);

    if (!productGid) {
      setOptimizeError('Error: Missing product id.');
      return;
    }
    if (selectedLocales.length === 0) {
      setOptimizeError('Please select at least one market.');
      return;
    }

    setIsOptimizing(true);
    startLoadingFeedback();

    try {
      // 1. Get Admin Session Token (JWT)
      // This is crucial for your Python backend "resolve_shop_domain" logic
      const idToken = await api.auth.idToken();

      const payload = {
        japanese_description: description ?? '',
        product_name: productTitle ?? '',
        category: productType ?? '',
        product_id: productIdNumeric,
        target_locales: selectedLocales,
      };

      // 2. Call Backend
      const response = await fetch(BACKEND_GENERATE_BULK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? {Authorization: `Bearer ${idToken}`} : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.status !== 'success') {
        const errorMsg =
          result?.detail || (result?.data ? String(result.data) : 'Unknown Error');
        setOptimizeError(`Error: ${errorMsg}`);
        return;
      }

      const translatedData = extractGeneratedData(result);

      // 3. Save to Shopify (GraphQL Mutation)
      if (translatedData?.title || translatedData?.description) {
        const mutationRes = await api.query<{
          productUpdate: {
            product: {id: string} | null;
            userErrors: {message: string}[];
          };
        }>(
          `mutation UpdateProduct($input: ProductInput!) {
            productUpdate(input: $input) {
              product { id }
              userErrors { message }
            }
          }`,
          {
            variables: {
              input: {
                id: productGid,
                ...(translatedData.title ? {title: translatedData.title} : {}),
                ...(translatedData.description
                  ? {descriptionHtml: translatedData.description}
                  : {}),
              },
            },
          },
        );

        const userErrors = mutationRes.data?.productUpdate?.userErrors ?? [];
        if (userErrors.length > 0) {
          setOptimizeError(`Error: ${userErrors[0]?.message ?? 'Unknown Error'}`);
          return;
        }
      }

      // 4. Success Toast
      const anyApi = api as any; // Cast to avoid strict type checks on older versions
      if(anyApi.toast?.show) {
        anyApi.toast.show('Optimization Complete');
      }
      api.close();

    } catch (e: any) {
      setOptimizeError(`Network Error: ${e?.message ?? 'Request failed'}`);
    } finally {
      stopLoadingFeedback();
      setIsOptimizing(false);
    }
  }, [
    api,
    description,
    productGid,
    productIdNumeric,
    productTitle,
    productType,
    selectedLocales,
    startLoadingFeedback,
    stopLoadingFeedback,
  ]);

  const refreshPlan = useCallback(async () => {
    setMarketsError(null);
    await fetchPlanAndLocales('Refreshing plan...');
  }, [fetchPlanAndLocales]);

  // --- Render ---
  return (
    <AdminAction>
      <BlockStack gap="base">
        <Heading>越境 AI / Cross-Border AI</Heading>
        <Text>
          商品情報を世界に通用するマーケティング文に変換します。 (Transform product
          info into a world-class marketing copy.)
        </Text>

        {initialLoadError ? (
          <Banner tone="critical">{initialLoadError}</Banner>
        ) : null}

        <TextArea
          label="Product Description"
          value={description}
          onChange={setDescription}
        />

        <BlockStack gap="small">
          <Text fontWeight="bold">Target Markets:</Text>

          {isLoadingInitial ? (
            <Text>⏳ Loading markets...</Text>
          ) : publishedLocales.length === 0 ? (
            <Text>
              No published markets found. Please enable markets in Shopify
              Settings.
            </Text>
          ) : (
            <BlockStack gap="small">
              {publishedLocales.map((loc) => {
                const checked = selectedLocales.includes(loc.locale);
                return (
                  <Checkbox
                    key={loc.locale}
                    checked={checked}
                    onChange={(next) => onToggleLocale(loc.locale, next)}
                  >
                    {loc.name}
                    {loc.primary ? ' (Primary)' : ''}
                  </Checkbox>
                );
              })}
            </BlockStack>
          )}

          {marketsError ? <Text>{marketsError}</Text> : null}

          {/* Upgrade Banner for Free Users */}
          {!isPro && (
            <Banner tone="warning">
              {plansUrl ? (
                <Link href={plansUrl} target="_blank">
                  Upgrade to Pro
                </Link>
              ) : (
                <Text>Upgrade to Pro</Text>
              )}{' '}
              to select multiple markets at once.
            </Banner>
          )}

          {/* Over Limit Warning */}
          {showOverLimitWarning && (
            <Banner tone="warning">
               You need to upgrade to Pro to select multiple markets.
            </Banner>
          )}

          {!isPro && (
            <Button onPress={refreshPlan} variant="tertiary">
              Already upgraded? Refresh Plan
            </Button>
          )}
        </BlockStack>

        <Button variant="primary" onPress={handleOptimize} disabled={isOptimizing}>
          世界基準で最適化する / Optimize for Global
        </Button>

        {isOptimizing ? <Text>{loadingMessage}</Text> : null}

        {optimizeError ? <Banner tone="critical">{optimizeError}</Banner> : null}
      </BlockStack>
    </AdminAction>
  );
}