import { Page, Layout, Card, Text, BlockStack, Button, ActionList } from "@shopify/polaris";
import { type LoaderFunctionArgs } from "react-router";

// Simplified loader - just gets the shop param for constructing links if needed,
// but skips the heavy authentication check to avoid loops.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  console.log(`[🔍 Trail] Static Landing Page Hit. Shop: ${shop}`);
  return { shop };
};

export default function LandingPage() {
  return (
    <Page title="Cross-Border AI">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Welcome to Cross-Border AI</Text>
              <Text as="p">
                Optimize your store for international markets. Use the navigation menu to access features.
              </Text>
              
              <BlockStack gap="200">
                <Button url="/app/plans">View Subscription Plans</Button>
                {/* 
                  Keeping the dashboard link optional/secondary if you want to try it later,
                  but simplifying the main flow to avoid the auth loop.
                */}
                <Button variant="plain" url="/app/dashboard">Go to Dashboard (Advanced)</Button>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.AnnotatedSection title="Quick Actions" description="Jump straight to key features.">
           <Card>
            <ActionList
              items={[
                {content: 'Manage Plans', url: '/app/plans'},
                {content: 'Extension Settings (Theme Editor)', url: 'https://admin.shopify.com/store/test-crossborder-connect-new/themes/current/editor', target: '_blank', external: true}
              ]}
            />
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
