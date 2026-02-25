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
import { authenticate } from "../shopify.server";

type LoaderData = {
  shop: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function CompliancePage() {
  const { shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page title="Compliance Check" subtitle="Regulatory compliance verification">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner
              tone="warning"
              title="Feature Temporarily Disabled"
            >
              <p>
                The Compliance Check feature is currently being improved and will return soon with enhanced regulatory detection capabilities.
              </p>
            </Banner>

            <Card>
              <Box padding="600">
                <BlockStack gap="400" align="center">
                  <Text variant="headingLg" as="h2" alignment="center">
                    🛡️ Coming Soon
                  </Text>
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    Our AI-powered compliance checker will help you identify potential regulatory issues including:
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" alignment="center">• FTC advertising guidelines</Text>
                    <Text as="p" variant="bodyMd" alignment="center">• FDA health claims</Text>
                    <Text as="p" variant="bodyMd" alignment="center">• GDPR and privacy requirements</Text>
                    <Text as="p" variant="bodyMd" alignment="center">• Regional regulatory standards</Text>
                  </BlockStack>
                  <Box paddingBlockStart="400">
                    <Button onClick={() => navigate(`/app?shop=${encodeURIComponent(shop)}`)}>
                      Return to Home
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
