import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useNavigate, useSearchParams } from 'react-router';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  Button,
  Box,
  Icon,
} from '@shopify/polaris';
import { EditIcon, NoteIcon } from '@shopify/polaris-icons';
import { useCallback, useMemo } from 'react';
import { authenticate, getOfflineGraphqlClient } from '../shopify.server';

type LoaderData = {
  shop: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';

  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  let session;

  if (offlineContext) {
    session = offlineContext.session;
  } else {
    const authResult = await authenticate.admin(request);
    session = authResult.session;
  }

  return {
    shop: session.shop,
  };
};

export default function WritingStudio() {
  const { shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navQs = useMemo(() => {
    const p = new URLSearchParams();
    if (searchParams.get('host')) p.set('host', searchParams.get('host')!);
    if (shop) p.set('shop', shop);
    return p.toString();
  }, [searchParams, shop]);

  const nav = useCallback(
    (path: string) => {
      return navQs ? `${path}?${navQs}` : path;
    },
    [navQs]
  );

  return (
    <Page
      title="Writing Studio"
      backAction={{
        content: 'Back',
        onAction: () => navigate(nav('/app')),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Quick Navigation: Rewriter vs Templates */}
            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
              {/* Product Rewriter Card */}
              <Card>
                <Box padding="400">
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={EditIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        Product Rewriter
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Select a Shopify product, generate optimized descriptions, titles, and SEO copy. Results save directly to your store.
                    </Text>
                    <Button
                      variant="primary"
                      onClick={() => navigate(nav('/app/rewriter'))}
                      fullWidth
                    >
                      Open Product Rewriter
                    </Button>
                  </BlockStack>
                </Box>
              </Card>

              {/* Content Templates Card */}
              <Card>
                <Box padding="400">
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={NoteIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        Content Templates
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Generate product titles, FAQs, collection copy, and landing page content using AI-powered templates with brand voice.
                    </Text>
                    <Button
                      variant="primary"
                      onClick={() => navigate(nav('/app/content-templates'))}
                      fullWidth
                    >
                      Open Content Templates
                    </Button>
                  </BlockStack>
                </Box>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
