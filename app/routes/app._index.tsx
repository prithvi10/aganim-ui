// app/routes/app._index.tsx
import { Page, Layout, Card, Text, BlockStack, ActionList, Button } from "@shopify/polaris";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function LandingPage() {
  return (
    <Page title="Cross-Border AI Directory">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Get Started</Text>
              <Text as="p">Select an area to optimize your store for global markets.</Text>
              <Button variant="primary" url="/app/dashboard">Open Performance Dashboard</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.AnnotatedSection title="Product Optimization" description="Translate and enhance product metadata.">
          <Card>
            <ActionList items={[{content: 'Products'}, {content: 'Collections'}]} />
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection title="Storefront Content" description="Optimize blogs, pages, and policies.">
          <Card>
            <ActionList items={[{content: 'Blog Posts'}, {content: 'Pages'}, {content: 'Policies'}]} />
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}