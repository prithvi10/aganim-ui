import React, {useEffect, useMemo, useState} from 'react';
import {
  reactExtension,
  AdminAction,
  Banner,
  BlockStack,
  InlineStack,
  Button,
  Text,
  Divider,
  useApi,
} from '@shopify/ui-extensions-react/admin';

export default reactExtension('admin.product-details.action.render', () => (
  <Extension />
));

function Extension() {
  const api = useApi<'admin.product-details.action.render'>();
  const productGid = useMemo(() => api.data?.selected?.[0]?.id, [api.data]);

  const [shopSlug, setShopSlug] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.query<{shop: {myshopifyDomain: string}}>(
          `query ShopDomain { shop { myshopifyDomain } }`,
        );
        const domain = res.data?.shop?.myshopifyDomain ?? '';
        const slug = domain.replace('.myshopify.com', '');
        if (!cancelled) setShopSlug(slug);
      } catch (e) {
        if (!cancelled) setError('Unable to determine shop. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const optimizeUrl = useMemo(() => {
    if (!shopSlug) return '';
    const base = `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/optimize`;
    if (!productGid) return base;
    return `${base}?productId=${encodeURIComponent(productGid)}`;
  }, [productGid, shopSlug]);

  const rewriterUrl = useMemo(() => {
    if (!shopSlug) return '';
    const base = `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/rewriter`;
    if (!productGid) return base;
    return `${base}?productId=${encodeURIComponent(productGid)}`;
  }, [productGid, shopSlug]);

  const marketingUrl = useMemo(() => {
    if (!shopSlug) return '';
    const base = `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/marketing`;
    if (!productGid) return base;
    return `${base}?productId=${encodeURIComponent(productGid)}`;
  }, [productGid, shopSlug]);

  const seoUrl = useMemo(() => {
    if (!shopSlug) return '';
    const base = `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/seo`;
    if (!productGid) return base;
    return `${base}?productId=${encodeURIComponent(productGid)}`;
  }, [productGid, shopSlug]);

  const pricingUrl = useMemo(() => {
    if (!shopSlug) return '';
    const base = `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/pricing`;
    if (!productGid) return base;
    return `${base}?productId=${encodeURIComponent(productGid)}`;
  }, [productGid, shopSlug]);

  return (
    <AdminAction
      secondaryAction={
        <Button onPress={() => api.close()}>Cancel</Button>
      }
    >
      <BlockStack gap="large">
        {!productGid ? <Banner tone="warning">No product selected.</Banner> : null}
        {error ? <Banner tone="critical">{error}</Banner> : null}

        {/* Card 1: Complete Optimization */}
        <BlockStack gap="base">
          <Text fontWeight="bold">🚀 Complete Optimization</Text>
          <Text>Run Copywriter → SEO → Marketing → Pricing</Text>
          <Button
            variant="primary"
            href={optimizeUrl || undefined}
            target="_self"
            onPress={() => api.close()}
            disabled={!optimizeUrl}
          >
            Optimize this Product
          </Button>
        </BlockStack>

        <Divider />

        {/* Card 2: Individual Features */}
        <BlockStack gap="base">
          <Text fontWeight="bold">Individual Features</Text>
          <Text>Access individual agents</Text>
          <InlineStack gap="base" blockAlignment="center">
            <Button
              variant="secondary"
              href={rewriterUrl || undefined}
              target="_self"
              onPress={() => api.close()}
              disabled={!rewriterUrl}
            >
              Rewriter
            </Button>
            <Button
              variant="secondary"
              href={seoUrl || undefined}
              target="_self"
              onPress={() => api.close()}
              disabled={!seoUrl}
            >
              SEO
            </Button>
            <Button
              variant="secondary"
              href={marketingUrl || undefined}
              target="_self"
              onPress={() => api.close()}
              disabled={!marketingUrl}
            >
              Marketing
            </Button>
            <Button
              variant="secondary"
              href={pricingUrl || undefined}
              target="_self"
              onPress={() => api.close()}
              disabled={!pricingUrl}
            >
              Pricing
            </Button>
          </InlineStack>
        </BlockStack>
      </BlockStack>
    </AdminAction>
  );
}


