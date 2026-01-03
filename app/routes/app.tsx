import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate, sessionStorage } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Token handshake: sync a token to the backend as soon as the embedded app loads
  // (so theme App Proxy endpoints can work even before the user opens /app/dashboard).
  try {
    const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
    const tokenSyncSecret = process.env.TOKEN_SYNC_SECRET_UI;
    const shop = session.shop;

    if (tokenSyncSecret && shop) {
      // Prefer offline token if present, otherwise use current online token.
      let tokenToSync: string | undefined = session.accessToken;
      let tokenType: "offline" | "online" = "online";

      try {
        const sessions = await sessionStorage.findSessionsByShop(shop);
        const offline = sessions?.find((s) => s.isOnline === false && s.accessToken);
        if (offline?.accessToken) {
          tokenToSync = offline.accessToken;
          tokenType = "offline";
        }
      } catch (e) {
        console.error("[Token Sync] Failed to load offline session", e);
      }

      if (tokenToSync) {
        await fetch(`${backendApiUrl}/api/admin/sync-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token-Sync-Secret": tokenSyncSecret,
          },
          body: JSON.stringify({
            shop,
            access_token: tokenToSync,
            token_type: tokenType,
          }),
        });
      }
    }
  } catch (e) {
    console.error("[Token Sync] Failed", e);
  }

  // eslint-disable-next-line no-undef
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
