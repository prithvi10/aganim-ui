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
import { SocialAdIcon, TemplateIcon } from '@shopify/polaris-icons';
import { useCallback, useMemo } from 'react';
import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import '../styles/optimize-button.css';

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

export default function MarketingHub() {
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
      title="Marketing Consultant"
      backAction={{
        content: 'Home',
        onAction: () => navigate(nav('/app')),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
              {/* Digital Marketing Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={SocialAdIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        Digital Marketing
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      Generate social media captions, ad banners, hero images, and seasonal campaigns. Preview content for Instagram, TikTok, and more.
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-2">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/marketing/digital'))}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </BlockStack>
                </Box>
              </Card>

              {/* Marketing Templates Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={TemplateIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        Marketing Templates
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      One-click marketing content: launch emails, abandoned cart emails, welcome emails, Facebook/Instagram ads, Google Ads, and blog posts.
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-1">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/marketing/templates'))}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
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
