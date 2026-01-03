import { Page, Layout, Card, Text, BlockStack, ActionList, Button } from "@shopify/polaris";
import { useLocation, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function LandingPage() {
  const location = useLocation();
  const dashboardUrl = `/app/dashboard${location.search || ""}`;

  return (
    <Page title="Cross-Border AI Directory">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Get Started</Text>
              <Text as="p">Select an area to optimize your store for global markets.</Text>
              <Button variant="primary" url={dashboardUrl}>Open Dashboard</Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.AnnotatedSection title="Products" description="Optimize products and collections.">
          <Card>
            <ActionList items={[{ content: "Products" }, { content: "Collections" }]} />
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection title="Online Store" description="Optimize storefront content.">
          <Card>
            <ActionList items={[{ content: "Blog posts" }, { content: "Blog titles" }, { content: "Pages" }, { content: "Policies" }]} />
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection title="Site Metadata" description="Optimize store metadata and structures.">
          <Card>
            <ActionList items={[{ content: "Filters" }, { content: "Metaobjects" }, { content: "Store metadata" }]} />
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection title="Theme" description="Optimize theme configuration.">
          <Card>
            <ActionList items={[{ content: "App embeds" }, { content: "Templates" }, { content: "Section groups" }]} />
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}