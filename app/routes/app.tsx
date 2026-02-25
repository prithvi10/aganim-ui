import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server"; // Standard Shopify Boundary
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider, Frame } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";
  // 1. Authenticate (embedded session-token based). Let Shopify boundary handle 401s/reauthorize.
  const { session } = await authenticate.admin(request);

  // 2. Token Handshake to backend (Fire & Forget)
  try {
    const backendApiUrl =
      process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
    const tokenSyncSecret =
      process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET;

    if (tokenSyncSecret && session?.accessToken) {
      const tokenType = session.isOnline ? "online" : "offline";
      fetch(`${backendApiUrl}/api/admin/sync-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token-Sync-Secret": tokenSyncSecret,
        },
        body: JSON.stringify({
          shop: session.shop,
          access_token: session.accessToken,
          token_type: tokenType,
          force: true,
        }),
      }).catch((e) => console.error("[Token Sync] Background failed", e));
    }
  } catch (e) {
    console.error("[Token Sync] Error", e);
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host,
    shop: session.shop,
  };
};

export default function App() {
  const { apiKey, host, shop } = useLoaderData<typeof loader>();
  const navQs = (() => {
    const p = new URLSearchParams();
    if (host) p.set("host", host);
    if (shop) p.set("shop", shop);
    return p.toString();
  })();
  const nav = (path: string) => (navQs ? `${path}?${navQs}` : path);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={enTranslations}>
        <Frame>
          <s-app-nav>
            <s-link href={nav("/app")}>Home</s-link>
            <s-link href={nav("/app/optimize")}>Optimize</s-link>
            <s-link href={nav("/app/writing-studio")}>Writing Studio</s-link>
            <s-link href={nav("/app/marketing")}>Marketing</s-link>
            <s-link href={nav("/app/seo")}>SEO</s-link>
            <s-link href={nav("/app/pricing")}>Pricing</s-link>
            <s-link href={nav("/app/dashboard")}>Dashboard</s-link>
          </s-app-nav>
          <Outlet />
        </Frame>
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
