import React, {useEffect, useMemo, useState} from 'react';
import {
  reactExtension,
  AdminAction,
  Banner,
  BlockStack,
  Button,
  Heading,
  Text,
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

  const workspaceUrl = useMemo(() => {
    if (!shopSlug) return '';
    const base = `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/rewriter`;
    if (!productGid) return base;
    return `${base}?productId=${encodeURIComponent(productGid)}`;
  }, [productGid, shopSlug]);

  return (
    <AdminAction>
      <BlockStack gap="base">
        <Heading>越境 AI / Cross-Border AI</Heading>
        <Text>
          This action opens the Rewriter workspace (side-by-side review) instead
          of rewriting inside the product page.
        </Text>

        {!productGid ? (
          <Banner tone="warning">No product selected.</Banner>
        ) : null}

        {error ? <Banner tone="critical">{error}</Banner> : null}

        <Button
          variant="primary"
          href={workspaceUrl || undefined}
          target="_self"
          onPress={() => api.close()}
          disabled={!workspaceUrl}
        >
          Open Workspace
        </Button>

        <Button variant="tertiary" onPress={() => api.close()}>
          Cancel
        </Button>
      </BlockStack>
    </AdminAction>
  );
}


