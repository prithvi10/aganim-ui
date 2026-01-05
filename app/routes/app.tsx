import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError, redirect } from "react-router"; // Added redirect
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let session;

  // 1. SAFE AUTHENTICATION
  try {
    const authResult = await authenticate.admin(request);
    session = authResult.session;
  } catch (error) {
    // If it's a Response (like a 302 Redirect), let Remix handle it
    if (error instanceof Response) {
      // If Shopify throws a 401 Unauthorized here, we MUST redirect to login manually
      if (error.status === 401 || error.status === 403) {
        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");
        if (shop) {
            console.log("[Layout] 🛡️ 401/403 detected in Layout. Redirecting to login.");
            throw redirect(`/auth/login?shop=${shop}`);
        }
      }
      throw error;
    }
    throw error;
  }

  // 2. Token Handshake (Your existing logic)
  try {
    const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
    const tokenSyncSecret = process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET;
    const shop = session.shop;

    if (tokenSyncSecret && shop) {
      const tokenToSync = session.accessToken;
      // Use fire-and-forget style (don't await) to speed up UI load, 
      // OR keep await if you need it strictly synced before render.
      // Keeping your logic but wrapped safely:
      if (tokenToSync) {
         fetch(`${backendApiUrl}/api/admin/sync-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token-Sync-Secret": tokenSyncSecret,
          },
          body: JSON.stringify({
            shop,
            access_token: tokenToSync,
            token_type: "online",
            force: true
          }),
        }).catch(err => console.error("[Token Sync] Async fail", err));
      }
    }
  } catch (e) {
    console.error("[Token Sync] Failed", e);
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
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};