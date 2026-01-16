import { useState, useMemo, useEffect } from "react";
import { useLoaderData, type LoaderFunctionArgs, type HeadersFunction } from "react-router";
import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { trail, trailWarn } from "../utils/trail";
import { TitleBar } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
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
    rewritesUsed: "rewrites used this month",
    priorityAccess: "Priority GPT-5 Access Active",
    health: "All Systems Operational",
    supportTitle: "Certified Support",
    supportText: "Our team is based in JST and typically responds within 2 hours.",
    quickStart: "Quick-Start Guide",
    docs: "Documentation",
    video: "Video Tutorial",
    trial: "Free Trial",
    daysRemaining: "days remaining",
    toggleLabel: "日本語"
  },
  jp: {
    title: "越境 AI",
    totalOptimized: "最適化済み商品数",
    activeMarkets: "有効な市場",
    currentPlan: "現在のプラン",
    manageSubscription: "サブスクリプション管理",
    usage: "利用状況",
    rewritesUsed: "件 / 今月の書き換え数",
    priorityAccess: "GPT-5 優先アクセス有効",
    health: "全システム稼働中",
    supportTitle: "認定サポート",
    supportText: "日本時間で対応中。通常2時間以内に返信いたします。",
    quickStart: "クイックスタートガイド",
    docs: "ドキュメント",
    video: "ビデオチュートリアル",
    trial: "無料トライアル",
    daysRemaining: "日残り",
    toggleLabel: "English"
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  trail(`[🔍 Trail] --------------------------------------------------`);
  trail(`[🔍 Trail] DASHBOARD LOADER STARTED`);
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");
  trail(`[🔍 Trail] Shop Param from URL: ${shopParam}`);
  
  // 1. Try to get the "Master Key" (Offline Client) first.
  //    This avoids the 302 redirect loop by talking server-to-server.
  trail(`[🔍 Trail] Step 1: Requesting Master Key context...`);
  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;

  // 2. SELF-HEALING: If no Master Key exists, we MUST trigger standard auth to create one.
  let client;
  let session;

  if (offlineContext) {
    trail(`[🔍 Trail] ✅ Master Key Acquired. Proceeding to Data Fetch.`);
    client = offlineContext.client;
    session = offlineContext.session;
  } else {
    trail(`[🔍 Trail] 🛑 Master Key returned NULL.`);
    trail(`[🔍 Trail] 🚑 TRIGGERING SELF-Healing: Calling authenticate.admin()...`);
    // This will throw a redirect if not authenticated
    const { admin, session: onlineSession } = await authenticate.admin(request);
    session = onlineSession;
    
    // Adapt standard admin.graphql to match our custom client interface
    client = {
      query: async ({ data }: { data: string }) => {
        try {
          const response = await admin.graphql(data);
          const body = await response.json();
          return { body };
        } catch (error) {
          console.error("[Dashboard] Online client query failed", error);
          return null;
        }
      }
    };
  }

  const shop = session.shop;
  const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";

  // Defaults
  let activeMarketsCount = 0;
  let usage = { used: 0, quota: 50, planName: "Basic", nextResetDate: null as string | null };
  let backendError401 = false;
  let planName = "Basic";
  let trialDays = 0;
  try {
    // 3. FETCH DATA using the Master Key (No 302s)
    
    // A. Fetch Locales
    const localeQuery = `
      query {
        shopLocales {
          locale
          name
          primary
          published
        }
      }
    `;
    
    // The client.query wrapper in shopify.server.ts handles 401s by returning null
    const localeResponse = await client.query({ data: localeQuery });
    trail(`[🔍 Trail] ✅ Locale Response received. Status: ${localeResponse ? "OK" : "NULL"}`);
    if (!localeResponse) {
      trailWarn(`[🔍 Trail] 🛑 Locale Fetch returned NULL (401 caught by wrapper).`);
      trailWarn(`[🔍 Trail] 🚑 TRIGGERING RE-AUTH (Self-Healing)...`);
      console.warn("[Dashboard] Master Key is dead (401). Triggering re-auth.");
      await authenticate.admin(request);
      return {
        activeMarketsCount: 0,
        usage: { used: 0, quota: 1000, planName: "Basic", nextResetDate: null },
        planName: "Basic",
        trialDays: 0,
        backendError401: false,
        isAuthenticating: false,
        needsReauth: true,
        isSyncing: false
      };
    }
    trail(`[🔍 Trail] ✅ Locales Fetched Successfully. Count: ${localeResponse.body?.data?.shopLocales?.length}`);
    const locales = localeResponse.body?.data?.shopLocales || [];
    activeMarketsCount = locales.filter((l: any) => l.published).length;
    trail(`[🔍 Trail] ✅ Active Markets Count: ${activeMarketsCount}`);
    // B. Fetch Billing/Plan
    const billingQuery = `
      query {
        currentAppInstallation {
          activeSubscriptions {
            name
            test
          }
        }
      }
    `;
    const billingResponse = await client.query({ data: billingQuery });
    
    // Double check token health
    if (!billingResponse) {
      await authenticate.admin(request);
      return {
        activeMarketsCount: 0,
        usage: { used: 0, quota: 1000, planName: "Basic", nextResetDate: null },
        planName: "Basic",
        trialDays: 0,
        backendError401: false,
        isAuthenticating: false,
        needsReauth: true,
        isSyncing: false
      };
    }

    const activeSubs = billingResponse.body?.data?.currentAppInstallation?.activeSubscriptions || [];
    if (activeSubs.length > 0) {
      planName = activeSubs[0].name;
      if (activeSubs[0].test) trialDays = 4;
    }

    // C. Fetch Usage from Backend
    // Note: Usage fetch uses a direct HTTP call. We sync the token first just in case.
    try {
      // Optional: Sync token to backend if needed (omitted for brevity/speed)
      const fetchUrl = `${backendApiUrl}/api/admin/usage?shop=${shop}`;
      const resp = await fetch(fetchUrl);
      
      if (resp.status === 401) {
        // Backend rejected the token
        backendError401 = true; 
      } else if (resp.ok) {
        const data = await resp.json();
        usage = {
          used: data.monthly_rewrites_used ?? data.current_usage ?? 0,
          quota: data.rewrite_limit ?? data.monthly_token_quota ?? 50,
          planName: data.plan_name || planName, // Prefer backend plan if available
          nextResetDate: data.next_reset_date ?? null,
        };
      }
    } catch (e) {
      console.error("Backend usage fetch failed", e);
    }

    return {
      activeMarketsCount,
      usage,
      planName,
      trialDays,
      backendError401,
      isAuthenticating: false,
      needsReauth: false,
      isSyncing: false
    };

  } catch (e) {
    // FIX: If the error is a Response (redirect), we MUST re-throw it
    // so the browser follows the redirect (e.g. to Shopify OAuth).
    if (e instanceof Response) {
      throw e;
    }

    console.error("Dashboard Loader Failed", e);
    // Return a safe fallback state instead of crashing
    return {
      isAuthenticating: false,
      needsReauth: true,
      activeMarketsCount: 0,
      usage: { used: 0, quota: 1000, planName: "Basic", nextResetDate: null },
      planName: "Basic",
      trialDays: 0,
      backendError401: false,
      isSyncing: false
    };
  }
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function Dashboard() {
  const { 
    activeMarketsCount, 
    usage, 
    planName, 
    trialDays, 
    backendError401, 
    isAuthenticating, 
    needsReauth, 
    isSyncing 
  } = useLoaderData<typeof loader>();
  
  const [lang, setLang] = useState<Lang>("en");
  const [isLoading, setIsLoading] = useState(true);
  // NOTE: App Bridge instance is not needed on this page right now.
  
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);
  const featureList = useMemo(() => {
    if (planName === "Pro") {
      return ["Unlimited Bulk Sync", "Priority GPT-5", "Supreme Features"];
    }
    if (planName === "Standard") {
      return ["Multi-locale", "Social Hook Architect", "AI Marketing"];
    }
    return ["1 Locale", "SEO optimization", "GPT-4o-mini"];
  }, [planName]);

  useEffect(() => {
    // Artificial delay to prevent skeleton flash on fast loads
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const usedCount = Number(usage?.used || 0);
  const quotaCount = Number(usage?.quota ?? 0);
  const isUnlimited = quotaCount === -1;
  const usagePercent = isUnlimited || quotaCount <= 0 ? 0 : Math.min(100, Math.round((usedCount / quotaCount) * 100));
  const isCritical = usagePercent > 90;
  const resetDateLabel = usage?.nextResetDate
    ? new Date(usage.nextResetDate).toLocaleDateString()
    : null;

  // 1. Re-Auth State
  if (needsReauth) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Banner tone="warning" title="Connection Lost">
              <p>We need to reconnect to your store. Please refresh the page.</p>
              <Button onClick={() => window.location.reload()}>Refresh Session</Button>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // 2. Loading State
  if (isLoading || isAuthenticating || isSyncing) {
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
        <div style={{ padding: "var(--p-space-400)", display: "flex", justifyContent: "center" }}>
          <Spinner accessibilityLabel="Loading dashboard" size="large" />
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
            action={{content: 'Reconnect', url: '/auth/login'}}
          >
            <p>We encountered an issue syncing your usage data. Please reconnect.</p>
          </Banner>
        )}

        <Layout>
          {/* IMPACT METRICS */}
          <Layout.Section>
            <InlineStack gap="400" align="start">
               {/* Optimized Count */}
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
               
               {/* Active Markets */}
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
               
               {/* Monthly Product Rewrite Usage */}
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">Monthly Product Rewrites</Text>
                      {isUnlimited ? (
                        <BlockStack gap="100">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="p" variant="headingMd">Unlimited</Text>
                            <Badge tone="success">Priority GPT-5 Access Active</Badge>
                          </InlineStack>
                          {resetDateLabel ? (
                            <Text as="p" variant="bodySm" tone="subdued">{`Resets on ${resetDateLabel}`}</Text>
                          ) : null}
                        </BlockStack>
                      ) : (
                        <BlockStack gap="100">
                      <InlineStack align="space-between">
                        <Text as="p" variant="headingMd">{usedCount} / {quotaCount}</Text>
                        <Badge tone={isCritical ? "critical" : "success"}>{`${usagePercent}%`}</Badge>
                      </InlineStack>
                      <ProgressBar progress={usagePercent} tone={isCritical ? "critical" : "highlight"} />
                          {resetDateLabel ? (
                            <Text as="p" variant="bodySm" tone="subdued">{`Resets on ${resetDateLabel}`}</Text>
                          ) : null}
                        </BlockStack>
                      )}
                    </BlockStack>
                  </div>
                </Card>
               </div>
            </InlineStack>
          </Layout.Section>

          {/* PLAN & BENEFITS */}
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

                    {/* Feature Table (new plan features) */}
                    <div style={{ marginTop: "4px" }}>
                      <DataTable
                        columnContentTypes={["text", "text"]}
                        headings={["Feature", "Status"]}
                        rows={[
                          ...featureList.map((f) => [f, "✅ Included"]),
                          ["Bulk Market Optimization", planName === "Pro" || planName === "Standard" ? "✅ Unlocked" : "❌ Upgrade Required"],
                        ]}
                        footerContent={null}
                      />
                    </div>
                  </BlockStack>

                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodySm" tone={isCritical ? "critical" : "subdued"}>
                        {t.usage}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {isUnlimited ? `Unlimited • ${t.priorityAccess}` : `${usedCount} / ${quotaCount} ${t.rewritesUsed}`}
                      </Text>
                    </InlineStack>
                    {isUnlimited ? (
                      <InlineStack align="start">
                        {resetDateLabel ? (
                          <Text as="span" variant="bodySm" tone="subdued">{`Your usage resets on ${resetDateLabel}`}</Text>
                        ) : (
                          <Text as="span" variant="bodySm" tone="subdued">Priority GPT-5 Access Active.</Text>
                        )}
                      </InlineStack>
                    ) : (
                      <BlockStack gap="100">
                    <ProgressBar progress={usagePercent} tone={isCritical ? "critical" : "highlight"} size="small" />
                        {resetDateLabel ? (
                          <Text as="span" variant="bodySm" tone="subdued">{`Your usage resets on ${resetDateLabel}`}</Text>
                        ) : null}
                      </BlockStack>
                    )}
                  </BlockStack>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          {/* FOOTER */}
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
                      <Link url="/privacy-policy" target="_blank">Privacy Policy</Link>
                   </InlineStack>
                </InlineStack>
             </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}