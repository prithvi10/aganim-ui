import { useState, useMemo, useEffect } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";
import { useAppBridge, TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText
} from "@shopify/polaris";

// Types
type Lang = "en" | "jp";

const TRANSLATIONS = {
  en: {
    title: "Cross-Border AI",
    toggleLabel: "日本語",
    heroTitle: "Welcome to Cross-Border Agent",
    heroText: "Start by enabling our Theme Extensions to optimize your storefront experience.",
    heroCta: "Go to Theme Extensions",
    dashboardCta: "View Dashboard"
  },
  jp: {
    title: "越境 AI",
    toggleLabel: "English",
    heroTitle: "Cross-Border Agent へようこそ",
    heroText: "テーマ拡張機能を有効にして、ストアフロントの最適化を始めましょう。",
    heroCta: "テーマ拡張へ",
    dashboardCta: "ダッシュボードを見る"
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Lightweight home loader: just ensure auth and sync token; no heavy queries
  const { admin, session } = await authenticate.admin(request);
  if (!admin || !session) {
    return { isAuthenticating: true };
  }

  if (!session.accessToken) {
    return { isAuthenticating: true };
  }

  const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
  const tokenSyncSecret = process.env.TOKEN_SYNC_SECRET_UI;
  let tokenToSync: string | undefined = session.accessToken;
  let isOffline = false;

  try {
    const sessions = await sessionStorage.findSessionsByShop(session.shop);
    const offline = sessions?.find((s) => s.isOnline === false && s.accessToken);
    if (session.isOnline && offline?.accessToken) {
      tokenToSync = offline.accessToken;
      isOffline = true;
    } else if (offline?.accessToken && !session.accessToken) {
      tokenToSync = offline.accessToken;
      isOffline = true;
    }
  } catch (e) {
    console.error("Home token sync: failed to load offline session", e);
  }

  if (tokenSyncSecret && tokenToSync) {
    try {
      const resp = await fetch(`${backendApiUrl}/api/admin/sync-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token-Sync-Secret": tokenSyncSecret
        },
        body: JSON.stringify({
          shop: session.shop,
          access_token: tokenToSync,
          token_type: isOffline ? "offline" : "online"
        })
      });
      console.log("[Home Token Sync] status", resp.status, { shop: session.shop, isOffline });
    } catch (e) {
      console.error("Home token sync failed", e);
    }
  }

  return { isAuthenticating: false };
};

export default function Dashboard() {
  const { isAuthenticating } = useLoaderData<typeof loader>();
  const [lang, setLang] = useState<Lang>("en");
  const [isLoading, setIsLoading] = useState(true);
  const app = useAppBridge();
  
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  useEffect(() => {
    // Simulate loading for better UX skeleton
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [app]);

  useEffect(() => {
    // If you need more complex actions, you can do it here, 
    // but the declarative TitleBar component below is preferred in v4.
  }, [app, t.title, t.toggleLabel]);

  if (isLoading || isAuthenticating) {
    return (
        <SkeletonPage primaryAction>
            <Layout>
                <Layout.Section>
                    <Card>
                        <SkeletonBodyText lines={2} />
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card>
                        <SkeletonDisplayText size="medium" />
                        <SkeletonBodyText lines={4} />
                    </Card>
                </Layout.Section>
            </Layout>
        </SkeletonPage>
    );
  }

  return (
    <Page fullWidth>
      <TitleBar title={t.title}>
        <button onClick={() => setLang(prev => prev === "en" ? "jp" : "en")}>
          {t.toggleLabel}
        </button>
      </TitleBar>

      <BlockStack gap="400">
        <Card sectioned>
          <BlockStack gap="200">
            <Text as="h1" variant="headingLg">{t.heroTitle}</Text>
            <Text variant="bodyMd">{t.heroText}</Text>
            <InlineStack align="start" gap="200">
              <Button primary url="/themes">{t.heroCta}</Button>
              <Button url="/app/dashboard" tone="success">{t.dashboardCta}</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
