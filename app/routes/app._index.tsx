import { Page, Layout, Card, Text, BlockStack, ActionList, Button } from "@shopify/polaris";
import { useLoaderData, type LoaderFunctionArgs, redirect } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  console.log(`[🔍 Trail] Landing Page Loader hit. Shop param: ${shop}`);

  try {
    // 1. Attempt Authentication
    const { session } = await authenticate.admin(request);
    console.log(`[🔍 Trail] ✅ Authentication Success! Session Shop: ${session.shop}`);
    return { shop: session.shop };

  } catch (error) {
    // 2. Intercept Authentication Failures
    if (error instanceof Response) {
      const status = error.status;
      console.log(`[🔍 Trail] ⚠️ Auth Response Caught. Status: ${status}`);

      // CRITICAL FIX: If Shopify throws a 401 (Unauthorized), we MUST force a login.
      // Re-throwing the 401 here causes the iframe to hang/loop.
      if (status === 401 || status === 403) {
        if (shop) {
          console.log(`[🔍 Trail] 🛡️ 401 Detected. Forcing manual redirect to /auth/login`);
          throw redirect(`/auth/login?shop=${shop}`);
        }
      }
      
      // If it's a 302 (Redirect), let Remix handle it normally (this starts OAuth)
      throw error;
    }
    
    // 3. Handle unexpected errors
    console.error(`[🔍 Trail] 💥 Unexpected Error:`, error);
    if (shop) throw redirect(`/auth/login?shop=${shop}`);
    throw error;
  }
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