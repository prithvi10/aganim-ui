import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server"; // Standard Shopify Boundary
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  
  try {
    // 1. Authenticate (Try/Catch to allow UI to render even if auth fails)
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
  } catch (error) {
    // FIX: If auth fails, we log it but do NOT throw 401. 
    // This allows the <AppProvider> to render and the child route (static landing) to show up.
    console.warn("[App Layout] Auth failed or session missing. Rendering in Guest Mode.", error);
    
    // If it's a redirect response (e.g. to /auth/login), we can technically return null or let it bubble.
    // But to break the loop, we simply swallow it and render the app shell.
    // The App Bridge might not fully initialize features requiring a token, but the UI will load.
  }

  return { apiKey };
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
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

// 4. Important: Pass headers to the browser
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
