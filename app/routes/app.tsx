import { useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider, Frame } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import jaTranslations from "@shopify/polaris/locales/ja.json";
import "@shopify/polaris/build/esm/styles.css";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";
  const { session } = await authenticate.admin(request);

  const backendApiUrl =
    process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
  const tokenSyncSecret =
    process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET;

  // Token handshake (fire & forget)
  try {
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

  // Fetch ui_language from backend usage endpoint
  let uiLanguage = "en";
  try {
    const resp = await fetch(
      `${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(session.shop)}`,
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data?.ui_language === "ja") uiLanguage = "ja";
    }
  } catch {
    // fall back to English
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host,
    shop: session.shop,
    uiLanguage,
  };
};

const POLARIS_TRANSLATIONS: Record<string, typeof enTranslations> = {
  en: enTranslations,
  ja: jaTranslations,
};

export default function App() {
  const { apiKey, host, shop, uiLanguage } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  useEffect(() => {
    if (i18n.language !== uiLanguage) {
      i18n.changeLanguage(uiLanguage);
    }
  }, [uiLanguage]);

  const navQs = (() => {
    const p = new URLSearchParams();
    if (host) p.set("host", host);
    if (shop) p.set("shop", shop);
    return p.toString();
  })();
  const nav = (path: string) => (navQs ? `${path}?${navQs}` : path);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={POLARIS_TRANSLATIONS[i18n.language] ?? enTranslations}>
        <Frame>
          <s-app-nav>
            <s-link href={nav("/app")}>{t("nav.home")}</s-link>
            <s-link href={nav("/app/optimize")}>{t("nav.optimize")}</s-link>
            <s-link href={nav("/app/writing-studio")}>{t("nav.writingStudio")}</s-link>
            <s-link href={nav("/app/marketing")}>{t("nav.marketing")}</s-link>
            <s-link href={nav("/app/seo")}>{t("nav.seo")}</s-link>
            <s-link href={nav("/app/pricing")}>{t("nav.pricing")}</s-link>
            <s-link href={nav("/app/dashboard")}>{t("nav.dashboard")}</s-link>
            <s-link href={nav("/app/support")}>Support</s-link>
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
