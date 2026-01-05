import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server"; // Standard Shopify Boundary
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 1. Authenticate (Let it throw 401 natively if needed)
  // We removed the manual try/catch redirect here because it causes "Unsafe Attempt" errors.
  const { session } = await authenticate.admin(request);

  // 2. Token Handshake (Fire & Forget)
  try {
    const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
    const tokenSyncSecret = process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET;
    
    if (tokenSyncSecret && session?.accessToken) {
       // Fire and forget - don't await
       fetch(`${backendApiUrl}/api/admin/sync-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Token-Sync-Secret": tokenSyncSecret },
          body: JSON.stringify({ shop: session.shop, access_token: session.accessToken, token_type: "online", force: true }),
       }).catch(e => console.error("[Token Sync] Background failed", e));
    }
  } catch (e) {
    console.error("[Token Sync] Error", e);
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={enTranslations}>
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/plans">Plans</s-link>
          <s-link href="/app/dashboard">Dashboard</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

// 3. Use the Standard Shopify Boundary
// This component knows how to read the 401 headers and redirect the PARENT window safely.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

// 4. Important: Pass headers to the browser
// This ensures the "Exit Iframe" headers reach the App Bridge.
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};