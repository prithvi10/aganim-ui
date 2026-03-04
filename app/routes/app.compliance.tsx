import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  Box,
  Button,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";

type LoaderData = {
  shop: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function CompliancePage() {
  const { t } = useTranslation();
  const { shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page title={t("compliance.complianceCheck")} subtitle={t("compliance.complianceSubtitle")}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner
              tone="warning"
              title={t("compliance.featureTemporarilyDisabled")}
            >
              <p>
                {t("compliance.complianceDisabledDesc")}
              </p>
            </Banner>

            <Card>
              <Box padding="600">
                <BlockStack gap="400" align="center">
                  <Text variant="headingLg" as="h2" alignment="center">
                    🛡️ {t("compliance.comingSoon")}
                  </Text>
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    {t("compliance.complianceComingDesc")}
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" alignment="center">• {t("compliance.ftcGuidelines")}</Text>
                    <Text as="p" variant="bodyMd" alignment="center">• {t("compliance.fdaClaims")}</Text>
                    <Text as="p" variant="bodyMd" alignment="center">• {t("compliance.gdprPrivacy")}</Text>
                    <Text as="p" variant="bodyMd" alignment="center">• {t("compliance.regionalStandards")}</Text>
                  </BlockStack>
                  <Box paddingBlockStart="400">
                    <Button onClick={() => navigate(`/app?shop=${encodeURIComponent(shop)}`)}>
                      {t("compliance.returnToHome")}
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
