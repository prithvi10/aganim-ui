import { useState, useMemo, useEffect } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { useAppBridge, TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  ProgressBar,
  Badge,
  Banner,
  Link,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  DataTable,
  Spinner,
} from "@shopify/polaris";

type Lang = "en" | "jp";

const TRANSLATIONS = {
  en: {
    title: "Cross-Border AI",
    totalOptimized: "Total Products Optimized",
    activeMarkets: "Active Markets",
    currentPlan: "Current Plan",
    manageSubscription: "Manage Subscription",
    usage: "Usage",
    syncsUsed: "syncs used this month",
    health: "All Systems Operational",
    supportTitle: "Certified Support",
    supportText: "Our team is based in JST and typically responds within 2 hours.",
    quickStart: "Quick-Start Guide",
    docs: "Documentation",
    video: "Video Tutorial",
    trial: "Free Trial",
    daysRemaining: "days remaining",
    benefits: [
      "3 Markets Enabled",
      "SEO Meta-tag Sync",
      "Priority AI Generation"
    ],
    toggleLabel: "日本語"
  },
  jp: {
    title: "越境 AI",
    totalOptimized: "最適化済み商品数",
    activeMarkets: "有効な市場",
    currentPlan: "現在のプラン",
    manageSubscription: "サブスクリプション管理",
    usage: "利用状況",
    syncsUsed: "件 / 今月の同期数",
    health: "全システム稼働中",
    supportTitle: "認定サポート",
    supportText: "日本時間で対応中。通常2時間以内に返信いたします。",
    quickStart: "クイックスタートガイド",
    docs: "ドキュメント",
    video: "ビデオチュートリアル",
    trial: "無料トライアル",
    daysRemaining: "日残り",
    benefits: [
      "3市場対応",
      "SEOメタタグ同期",
      "優先AI生成"
    ],
    toggleLabel: "English"
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopFromQuery = url.searchParams.get("shop") || undefined;

  // Always trigger auth first so OAuth can store/refresh tokens
  const { admin, session } = await authenticate.admin(request);
  if (!admin || !session?.accessToken) {
    return { isAuthenticating: true, needsReauth: true, isSyncing: false };
  }

  const shop = session.shop;

  const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
  const accessToken = session?.accessToken;
  const offlineContext = await getOfflineGraphqlClient(shop);

  // If offline token isn't in DB yet (first install / race), avoid crashing and let UI render a syncing state.
  if (!offlineContext) {
    return {
      isSyncing: true,
      isAuthenticating: false,
      needsReauth: false,
      activeMarketsCount: 0,
      usage: { used: 0, quota: 1000, planName: "Free" },
      planName: "Free",
      trialDays: 0,
      backendError401: false
    };
  }

  // Defaults
  let activeMarketsCount = 0;
  let usage = { used: 0, quota: 1000, planName: "Free" };
  let backendError401 = false;
  let planName = usage.planName;
  let trialDays = 0;
  let needsReauth = false;
  let locales: any[] = [];
  let isSyncing = false;

  try {
    // Sync the access token to the backend so proxy endpoints have credentials.
    const tokenSyncSecret = process.env.TOKEN_SYNC_SECRET_UI;
    let tokenToSync: string | undefined = accessToken;
    const isOffline = Boolean(session && session.isOnline === false);

    if (tokenSyncSecret && tokenToSync) {
      try {
        const resp = await fetch(`${backendApiUrl}/api/admin/sync-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token-Sync-Secret": tokenSyncSecret
          },
          body: JSON.stringify({ 
            shop, 
            access_token: tokenToSync,
            token_type: isOffline ? "offline" : "online"
          })
        });
        console.log("[Token Sync] success", { shop, isOffline, status: resp.status });
      } catch (e) {
        console.error("Token sync to backend failed", e);
      }
    } else {
      console.warn("Token sync skipped: missing TOKEN_SYNC_SECRET_UI or session access token", {
        hasSecret: Boolean(tokenSyncSecret),
        hasAccessToken: Boolean(tokenToSync)
      });
    }

    // 1. Fetch Active Markets (Shopify GraphQL) - only if we have admin and token
    // Fetch locales only if offline token already exists
    const graphqlClient: any = offlineContext?.client;
    if (graphqlClient?.query) {
      try {
        const localeResponse = await graphqlClient.query({
          data: `
            query {
              shopLocales {
                locale
                name
                primary
                published
              }
            }
          `,
        });
        locales = localeResponse.body?.data?.shopLocales || [];
        activeMarketsCount = locales.filter((l: any) => l.published).length;
      } catch (e: any) {
        console.error("Failed to fetch locales", e);
      }
    } else {
      needsReauth = true;
    }

    // 2. Fetch Usage Data (Backend API)
    try {
      const fetchUrl = `${backendApiUrl}/api/admin/usage?shop=${shop}`;
      const resp = await fetch(fetchUrl);
      if (resp.status === 401) {
        console.warn("Backend 401 for usage. Token might be invalid.");
        backendError401 = true;
      }
      if (resp.ok) {
        const data = await resp.json();
        usage = {
          used: data.current_usage || 0,
          quota: data.monthly_token_quota || 1000,
          planName: data.plan_name || "Free"
        };
      }
    } catch (e) {
      console.error("Failed to fetch backend usage", e);
      usage = { used: 0, quota: 1000, planName: "Free" };
    }

    // 3. Billing Info - only if we have a token
    planName = usage.planName;
    try {
      if (graphqlClient?.query) {
        const billingResponse = await graphqlClient.query({
          data: `
            query {
              currentAppInstallation {
                activeSubscriptions {
                  name
                  status
                  test
                }
              }
            }
          `,
        });
        const activeSubs = billingResponse.body?.data?.currentAppInstallation?.activeSubscriptions || [];
        const sub = activeSubs[0];
        if (sub) {
          planName = sub.name;
          if (sub.test) trialDays = 4; // Mock trial logic or derive from createdAt
        }
      } else {
        needsReauth = true;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("Missing access token")) {
        return { isAuthenticating: true, needsReauth: true };
      }

      console.error("Billing check failed", e);
      return {
        isAuthenticating: true,
        activeMarketsCount,
        usage,
        planName,
        trialDays,
        backendError401,
        needsReauth: true
      };
    }

    return {
      activeMarketsCount,
      usage,
      planName,
      trialDays,
      backendError401,
      isAuthenticating: false,
      needsReauth,
      isSyncing
    };
  } catch (e) {
    console.error("Loader failed", e);
    return {
      isAuthenticating: true,
      activeMarketsCount,
      usage,
      planName,
      trialDays,
      backendError401,
      needsReauth: true,
      isSyncing: false
    };
  }
};

export default function Dashboard() {
  const { activeMarketsCount, usage, planName, trialDays = 0, backendError401, isAuthenticating, needsReauth, isSyncing } = useLoaderData<typeof loader>();
  const [lang, setLang] = useState<Lang>("en");
  const [isLoading, setIsLoading] = useState(true);
  const app = useAppBridge();
  
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [app]);

  useEffect(() => {
  }, [app, t.title, t.toggleLabel]);

  const usedCount = usage?.used || 0;
  const quotaCount = usage?.quota || 1000;
  const usagePercent = Math.min(100, Math.round((usedCount / quotaCount) * 100));
  const isCritical = usagePercent > 90;

  if (needsReauth) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Banner tone="warning" title="Reconnect needed">
              <p>Please reinstall or reauthorize the app to restore offline access.</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (isSyncing) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Banner tone="info" title="Preparing your data...">
              <p>We’re finalizing your store’s access token. This usually takes a moment—please refresh in a few seconds.</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

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
        <div style={{ padding: "var(--p-space-400)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner accessibilityLabel="Loading dashboard data" size="large" />
        </div>
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

      <BlockStack gap="300">
        {backendError401 && (
          <Banner
            tone="critical"
            title="Authentication Error"
            action={{content: 'Refresh Session', url: '/auth/login'}}
          >
            <p>
              We encountered an issue connecting to Shopify. Please refresh your session to restore full functionality.
            </p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <InlineStack gap="400" align="start">
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">{t.totalOptimized}</Text>
                      <Text as="p" variant="heading2xl">{usedCount.toLocaleString()}</Text>
                      {usedCount === 0 && (
                          <div style={{marginTop: '4px'}}>
                              <Button size="micro" url="/products">Optimize your first product</Button>
                          </div>
                      )}
                    </BlockStack>
                  </div>
                </Card>
               </div>
               
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">{t.activeMarkets}</Text>
                      <Text as="p" variant="heading2xl">{activeMarketsCount}</Text>
                    </BlockStack>
                  </div>
                </Card>
               </div>
               
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">Tokens Used</Text>
                      <InlineStack align="space-between">
                        <Text as="p" variant="headingMd">{usedCount} / {quotaCount}</Text>
                        <Badge tone={isCritical ? "critical" : "success"}>{`${usagePercent}%`}</Badge>
                      </InlineStack>
                      <ProgressBar progress={usagePercent} tone={isCritical ? "critical" : "highlight"} />
                    </BlockStack>
                  </div>
                </Card>
               </div>
            </InlineStack>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: "var(--p-space-400)" }}>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">{t.currentPlan}</Text>
                    {trialDays > 0 && (
                       <Badge tone="info">{`${t.trial}: ${trialDays} ${t.daysRemaining}`}</Badge>
                    )}
                  </InlineStack>

                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="h3" variant="headingLg">{planName}</Text>
                      <Button url="/app/plans">{t.manageSubscription}</Button>
                    </InlineStack>

                    <div style={{ marginTop: "4px" }}>
                      <DataTable
                        columnContentTypes={["text", "text"]}
                        headings={["Feature", "Status"]}
                        rows={[
                          ["Bulk Market Optimization", planName === "Pro" ? "✅ Unlocked" : "❌ Upgrade Required"],
                          ["Priority AI Support", "✅ Included"],
                        ]}
                        footerContent={null}
                      />
                    </div>
                  </BlockStack>

                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodySm" tone={usagePercent > 90 ? "critical" : "subdued"}>
                        {t.usage}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {usedCount} / {quotaCount} {t.syncsUsed}
                      </Text>
                    </InlineStack>
                    <ProgressBar progress={usagePercent} tone={usagePercent > 90 ? "critical" : "highlight"} size="small" />
                    
                    {usedCount === 0 && quotaCount === 1000 && !backendError401 && (
                        <Banner tone="warning">
                            <p>Live usage sync pending...</p>
                        </Banner>
                    )}
                  </BlockStack>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
             <BlockStack gap="400">
                <Banner tone="info" title={t.supportTitle}>
                  <p>{t.supportText}</p>
                </Banner>

                <InlineStack align="space-between" blockAlign="center">
                   <InlineStack gap="200">
                      <Badge tone="success" progress="complete">All Systems Operational</Badge>
                   </InlineStack>
                   
                   <InlineStack gap="400">
                      <Text as="span" variant="bodySm" tone="subdued">{t.quickStart}:</Text>
                      <Link url="https://docs.crossborder.ai" target="_blank">{t.docs}</Link>
                      <Link url="#" target="_blank">{t.video}</Link>
                   </InlineStack>
                </InlineStack>
             </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

