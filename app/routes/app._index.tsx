// app/routes/app._index.tsx
import { Page, Layout, Card, Text, BlockStack, ActionList, Button } from "@shopify/polaris";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopQuery = url.searchParams.get("shop");
  console.log(`[🔍 Trail] Landing Page Loader hit. Shop param: ${shopQuery}`);

  try {
    console.log(`[🔍 Trail] Attempting authenticate.admin(request)...`);
    const { session } = await authenticate.admin(request);
    console.log(`[🔍 Trail] ✅ Authentication Success! Session Shop: ${session.shop}`);
    console.log(`[🔍 Trail] Token Saved? (Implicitly yes if we got here).`);
    
    return { shop: session.shop };
  } catch (error) {
    console.log(`[🔍 Trail] ⚠️ Landing Page Auth Failed / Redirecting.`);
    // If it's a redirect (302), we just let it happen (normal OAuth flow)
    if (error instanceof Response) {
        console.log(`[🔍 Trail] ↪️ Redirecting to Shopify/Auth (Status: ${error.status})`);
    } else {
        console.error(`[🔍 Trail] 💥 Unexpected Error in Landing Loader:`, error);
    }
    throw error;
  }
};

export default function LandingPage() {
  const { shop } = useLoaderData<typeof loader>();
  return (
    <Page title="Cross-Border AI Menu">
      {/* ... UI Code ... */}
      <Button variant="primary" url={`/app/dashboard?shop=${shop}`}>Open Management Dashboard</Button>
    </Page>
  );
}