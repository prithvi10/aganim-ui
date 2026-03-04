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
import { EditIcon, NoteIcon, ImageIcon } from '@shopify/polaris-icons';
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

export default function WritingStudio() {
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
      title={t("writingStudio.writingStudio")}
      backAction={{
        content: t("writingStudio.home"),
        onAction: () => navigate(nav('/app')),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Quick Navigation: Rewriter vs Templates */}
            <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
              {/* Product Rewriter Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={EditIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        {t("writingStudio.productRewriter")}
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      {t("writingStudio.productRewriterDesc")}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-2">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/rewriter'))}
                        >
                          {t("writingStudio.open")}
                        </Button>
                      </div>
                    </div>
                  </BlockStack>
                </Box>
              </Card>

              {/* Product Image Refinement Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={ImageIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        {t("writingStudio.imageRefinement")}
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      {t("writingStudio.imageRefinementDesc")}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-1">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/writing-studio/image-refinement'))}
                        >
                          {t("writingStudio.open")}
                        </Button>
                      </div>
                    </div>
                  </BlockStack>
                </Box>
              </Card>

              {/* Content Templates Card */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon source={NoteIcon} tone="base" />
                      </div>
                      <Text as="h2" variant="headingLg">
                        {t("writingStudio.contentTemplates")}
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodyMd">
                      {t("writingStudio.contentTemplatesDesc")}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="feature-btn-glow-1">
                        <Button
                          variant="primary"
                          onClick={() => navigate(nav('/app/content-templates'))}
                        >
                          {t("writingStudio.open")}
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
