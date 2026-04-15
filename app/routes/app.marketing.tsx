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
  Badge,
} from '@shopify/polaris';
import { CalendarTimeIcon, SocialAdIcon, ThemeTemplateIcon } from '@shopify/polaris-icons';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      title={t("marketing.marketingConsultant")}
      backAction={{
        content: t("marketing.home"),
        onAction: () => navigate(nav('/app')),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <InlineGrid columns={{ xs: 1, sm: 2, lg: 3 }} gap="400">
              {/* Digital Marketing Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={SocialAdIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        {t("marketing.digitalMarketing")}
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      {t("marketing.digitalMarketingDesc")}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-2">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/marketing/digital'))}
                        >
                          {t("marketing.open")}
                        </Button>
                      </div>
                    </div>
                  </BlockStack>
                </Box>
              </Card>

              {/* Retail Campaigns Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={CalendarTimeIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        {t("marketing.retailCampaigns")}
                      </Text>
                      <Badge tone="info">Only US market</Badge>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      {t("marketing.retailCampaignsDesc")}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-2">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/marketing/campaigns'))}
                        >
                          {t("marketing.open")}
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
                        <Icon source={ThemeTemplateIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        {t("marketing.templates")}
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      {t("marketing.templatesDesc")}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-1">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/marketing/templates'))}
                        >
                          {t("marketing.open")}
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
