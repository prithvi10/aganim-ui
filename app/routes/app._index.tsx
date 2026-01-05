import { Page, Layout, Card, Text, BlockStack, ActionList, Button } from "@shopify/polaris";
import { useLoaderData, type LoaderFunctionArgs, type HeadersFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  console.log(`[🔍 Trail] Landing Page Loader hit. Shop param: ${shop}`);

  // 1. Attempt Authentication
  // FIX: Allow authenticate.admin to handle 401s naturally.
  // We removed the manual try/catch that was forcing a redirect to /auth/login,
  // as this breaks the standard App Bridge re-authentication flow.
  const { session } = await authenticate.admin(request);
  console.log(`[🔍 Trail] ✅ Authentication Success! Session Shop: ${session.shop}`);
  return { shop: session.shop };

  /* 
   * REMOVED: Manual try/catch block.
   * Reason: Catching 401s here and redirecting to /auth/login prevents App Bridge
   * from handling the re-auth headers correctly, causing "Refused to display" errors.
   */
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function LandingPage() {
  const { shop } = useLoaderData<typeof loader>();
  return (
    <Page title="Cross-Border AI Menu">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Welcome!</Text>
              <Text as="p">Your store is connected. Click below to manage your settings.</Text>
              <Button variant="primary" url={`/app/dashboard?shop=${shop}`}>Open Management Dashboard</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.AnnotatedSection title="Features" description="Optimization areas available.">
          <Card>
            <ActionList items={[{content: 'Products & Collections'}, {content: 'Blogs & Pages'}]} />
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}