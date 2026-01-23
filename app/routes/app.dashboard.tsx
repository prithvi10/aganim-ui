import { useState, useMemo, useEffect } from "react";
import { useLoaderData, useSearchParams, useNavigate, redirect, type LoaderFunctionArgs, type HeadersFunction } from "react-router";
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
  Box,
  Link,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  ExceptionList,
  Spinner,
  Toast,
  Modal,
} from "@shopify/polaris";
import { PlanCard } from "../components/PlanCard";
import { DowngradeScheduledBanner } from "../components/DowngradeScheduledBanner";
import { PLAN_CATALOG, PLAN_BASIC, PLAN_FREE, PLAN_PRO, PLAN_STANDARD, type PlanName } from "../utils/planCatalog";
import { XSmallIcon } from "@shopify/polaris-icons";
import db from "../db.server";

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
  let usage = {
    used: 0,
    quota: 10,
    planName: "Free",
    nextResetDate: null as string | null,
    billingCycleType: "lifetime" as "lifetime" | "recurring",
    lifetimeRemaining: 10 as number | null,
    accessExpiresAt: null as string | null,
    graceActive: false,
    lastPlanName: null as string | null,
    welcomeBack: false,
    pendingPlanName: null as string | null,
    pendingPlanEffectiveAt: null as string | null,
    lastPlanChangeType: null as string | null,
  };
  let backendError401 = false;
  let planName = "Free";
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
      console.warn("[Dashboard] Master Key is dead (401). Clearing stale sessions + triggering re-auth.");
      // The offline token is invalid after uninstall/reinstall. Clear it so we don't loop on 401.
      try {
        if (shopParam) {
          await db.session.deleteMany({ where: { shop: shopParam } });
        }
      } catch {
        // best-effort
      }
      // Force OAuth refresh.
      const sp = new URLSearchParams();
      if (shopParam) sp.set("shop", shopParam);
      const host = url.searchParams.get("host");
      if (host) sp.set("host", host);
      throw redirect(`/auth/login?${sp.toString()}`);
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
      // Same failure mode: stale offline token. Clear and re-auth.
      try {
        if (shopParam) {
          await db.session.deleteMany({ where: { shop: shopParam } });
        }
      } catch {
        // best-effort
      }
      const sp = new URLSearchParams();
      if (shopParam) sp.set("shop", shopParam);
      const host = url.searchParams.get("host");
      if (host) sp.set("host", host);
      throw redirect(`/auth/login?${sp.toString()}`);
    }

    const activeSubs = billingResponse.body?.data?.currentAppInstallation?.activeSubscriptions || [];
    const hasShopifySubscription = activeSubs.length > 0;
    // Shopify billing is NOT the source of truth for plan display/gating.
    // Keep this only for trial-day display.
    if (activeSubs.length > 0 && activeSubs[0].test) trialDays = 4;

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
        const billingCycleType =
          String(data.billing_cycle_type || "")
            .trim()
            .toLowerCase() === "lifetime"
            ? "lifetime"
            : "recurring";
        // DB is source-of-truth: prefer effective_plan_name for display/gating.
        planName = String(data.effective_plan_name || data.plan_name || planName).trim() || planName;
        usage = {
          used: data.monthly_rewrites_used ?? data.current_usage ?? 0,
          quota: data.rewrite_limit ?? data.monthly_token_quota ?? 50,
          planName,
          nextResetDate: data.next_reset_date ?? data.nextResetDate ?? null,
          billingCycleType,
          lifetimeRemaining:
            billingCycleType === "lifetime"
              ? (data.lifetime_rewrites_remaining ?? null)
              : null,
          welcomeBack: Boolean(data.welcome_back),
          accessExpiresAt: data.access_expires_at ?? null,
          // Reinstall-only UI: backend grace_mode is true only when the shop actually uninstalled.
          graceActive: Boolean(data.grace_mode) && !hasShopifySubscription,
          lastPlanName: data.last_plan_name ?? null,
          pendingPlanName: data.pending_plan_name ?? null,
          pendingPlanEffectiveAt: data.pending_plan_effective_at ?? null,
          lastPlanChangeType: data.last_plan_change_type ?? null,
        };
        // Backend effective_plan_name already incorporates grace handling; no UI override needed.
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rewriterUrl = useMemo(() => {
    const qs =
      searchParams?.toString() ||
      (typeof window !== "undefined" ? new URL(window.location.href).searchParams.toString() : "");
    return qs ? `/app/rewriter?${qs}` : "/app/rewriter";
  }, [searchParams]);
  const plansUrl = useMemo(() => {
    const qs =
      searchParams?.toString() ||
      (typeof window !== "undefined" ? new URL(window.location.href).searchParams.toString() : "");
    const prefix = qs ? `/app/plans?${qs}` : "/app/plans";
    // Guarded route: only Dashboard can open plans directly.
    return prefix.includes("?") ? `${prefix}&from=dashboard` : `${prefix}?from=dashboard`;
  }, [searchParams]);
  
  const [lang, setLang] = useState<Lang>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [toastContent, setToastContent] = useState<string | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  // NOTE: App Bridge instance is not needed on this page right now.
  
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);
  const activePlanCard = useMemo(() => {
    const name = String(planName || "Free") as PlanName;
    return PLAN_CATALOG.find((p) => p.name === name) ?? PLAN_CATALOG[0];
  }, [planName]);

  const lockedFeatureSections = useMemo(() => {
    const order: PlanName[] = [PLAN_FREE, PLAN_BASIC, PLAN_STANDARD, PLAN_PRO];
    const current = (String(planName || PLAN_FREE) as PlanName) ?? PLAN_FREE;
    if (current === PLAN_PRO) return [];
    const currentIdx = order.indexOf(current);
    if (currentIdx < 0 || currentIdx === order.length - 1) return [];

    const isFiller = (s: string) => /^everything in\s+/i.test(String(s || "").trim());
    const normalize = (s: string) => String(s || "").trim();

    const currentCard = PLAN_CATALOG.find((p) => p.name === current);
    const currentSet = new Set<string>(
      [
        ...(currentCard?.rewriterFeatures ?? []),
        ...(currentCard?.marketingFeatures ?? []),
        ...(currentCard?.otherFeatures ?? []),
      ]
        .map(normalize)
        .filter((x) => x && !isFiller(x)),
    );

    const sections: Array<{ title: string; plan: PlanName; rewrites: string; features: string[] }> = [];
    const seen = new Set<string>(currentSet);

    for (let i = currentIdx + 1; i < order.length; i++) {
      const tier = order[i];
      const card = PLAN_CATALOG.find((p) => p.name === tier);
      if (!card) continue;
      const all = [
        ...(card.rewriterFeatures ?? []),
        ...(card.marketingFeatures ?? []),
        ...(card.otherFeatures ?? []),
      ]
        .map(normalize)
        .filter((x) => x && !isFiller(x));

      const additions = all.filter((x) => !seen.has(x));
      additions.forEach((x) => seen.add(x));
      if (additions.length) {
        sections.push({
          title:
            tier === PLAN_PRO
              ? "Unlock with Pro"
              : tier === PLAN_STANDARD
                ? "Unlock with Standard"
                : "Unlock with Basic",
          plan: tier,
          rewrites: String(card.rewrites || "").trim(),
          features: additions,
        });
      }
    }

    return sections;
  }, [planName]);

  useEffect(() => {
    // Artificial delay to prevent skeleton flash on fast loads
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const usedCount = Number(usage?.used || 0);
  const quotaCount = Number(usage?.quota ?? 0);
  const isLifetime =
    String((usage as any)?.billingCycleType || "").toLowerCase() === "lifetime" ||
    String(usage?.planName || "").toLowerCase() === "free" ||
    String(planName || "").toLowerCase() === "free";
  const lifetimeTotal = isLifetime ? (quotaCount > 0 ? quotaCount : 10) : 0;
  const lifetimeRemaining = isLifetime
    ? Number(
        (usage as any)?.lifetimeRemaining ??
          Math.max(0, Number(lifetimeTotal) - Number(usedCount)),
      )
    : 0;
  const lifetimeRemainingPct =
    isLifetime && lifetimeTotal > 0
      ? Math.max(0, Math.min(100, Math.round((lifetimeRemaining / lifetimeTotal) * 100)))
      : 0;

  const welcomeBack = Boolean((usage as any)?.welcomeBack);
  useEffect(() => {
    if (!welcomeBack) return;
    setToastContent("Welcome back!");
  }, [welcomeBack]);

  // Plan-expired interceptor: if the grace window ends while the merchant is active,
  // prompt and route them to pricing for reactivation.
  useEffect(() => {
    const expiresAt = String((usage as any)?.accessExpiresAt || "").trim();
    if (!expiresAt) return;
    const dt = new Date(expiresAt);
    if (Number.isNaN(dt.getTime())) return;
    if (Date.now() > dt.getTime()) {
      setShowExpiredModal(true);
    }
  }, [(usage as any)?.accessExpiresAt]);
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

  if (showExpiredModal) {
    const qs =
      typeof window !== "undefined" ? (window.location.search || "") : "";
    const target = `/app/pricing?returning_paid=1${qs ? `&${qs.replace(/^\?/, "")}` : ""}`;
    return (
      <Page title={t.title} fullWidth>
        <TitleBar title={t.title} />
        <Modal
          open
          title="Your pre-paid period has ended"
          onClose={() => window.open(target, "_top")}
          primaryAction={{
            content: "Select a plan",
            onAction: () => window.open(target, "_top"),
          }}
        >
          <Modal.Section>
            <Text as="p" variant="bodyMd">
              Please select a plan to continue using the app.
            </Text>
          </Modal.Section>
        </Modal>
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
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

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
                  <div style={{ padding: "var(--p-space-400)", height: 140, display: "flex", flexDirection: "column" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">{t.totalOptimized}</Text>
                      <Text as="p" variant="heading2xl">{usedCount.toLocaleString()}</Text>
                    </BlockStack>

                    <div style={{ marginTop: "auto" }}>
                      {usedCount === 0 && !welcomeBack ? (
                        <Button size="micro" onClick={() => navigate(rewriterUrl)}>
                          Optimize your first product
                        </Button>
                      ) : (
                        <div style={{ height: 28 }} />
                      )}
                    </div>
                  </div>
                </Card>
               </div>
               
               {/* Active Markets */}
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)", height: 140, display: "flex", flexDirection: "column" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">{t.activeMarkets}</Text>
                      <Text as="p" variant="heading2xl">{activeMarketsCount}</Text>
                    </BlockStack>
                    <div style={{ marginTop: "auto", height: 28 }} />
                  </div>
                </Card>
               </div>
               
               {/* Monthly Product Rewrite Usage */}
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)", height: 140, display: "flex", flexDirection: "column" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">
                        {isLifetime ? "Lifetime Credits" : "Monthly Product Rewrites"}
                      </Text>
                      {isLifetime ? (
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <Text as="p" variant="headingMd">
                              {lifetimeRemaining} / {lifetimeTotal} left
                            </Text>
                            <Badge tone={lifetimeRemaining <= 2 ? "critical" : "success"}>
                              {`${lifetimeRemainingPct}%`}
                            </Badge>
                          </InlineStack>
                          <ProgressBar
                            progress={lifetimeRemainingPct}
                            tone={lifetimeRemaining <= 2 ? "critical" : "highlight"}
                          />
                          <div style={{marginTop: "6px"}}>
                            <Button url={plansUrl} variant="primary">
                              Get 50 rewrites/month
                            </Button>
                          </div>
                        </BlockStack>
                      ) : isUnlimited ? (
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
            <BlockStack gap="300">
              {Boolean((usage as any)?.graceActive) && (usage as any)?.accessExpiresAt ? (
                <Banner tone="info" title="Grace Period Active">
                  <Text as="p" variant="bodyMd">
                    You can keep using your previous plan until{" "}
                    {new Date(String((usage as any)?.accessExpiresAt)).toLocaleDateString()}.
                  </Text>
                </Banner>
              ) : null}
              {String((usage as any)?.pendingPlanName || "").trim() &&
              String((usage as any)?.pendingPlanEffectiveAt || "").trim() ? (
                <DowngradeScheduledBanner
                  currentPlanName={String(planName)}
                  pendingPlanName={String((usage as any)?.pendingPlanName || "")}
                  pendingPlanEffectiveAt={String((usage as any)?.pendingPlanEffectiveAt || "")}
                  lastPlanChangeType={String((usage as any)?.lastPlanChangeType || "")}
                />
              ) : null}

              <InlineStack gap="400" align="start" wrap>
                <div style={{ flex: "1 1 420px", minWidth: 360 }}>
                  <PlanCard
                    plan={activePlanCard}
                    isCurrent
                    graceActive={Boolean((usage as any)?.graceActive)}
                    cta={
                      <Button fullWidth variant="primary" url={plansUrl}>
                        {t.manageSubscription}
                      </Button>
                    }
                  />
                </div>

                {planName !== PLAN_PRO && lockedFeatureSections.length ? (
                  <div style={{ flex: "1 1 420px", minWidth: 360 }}>
                    <Card>
                      <div style={{ height: 480, padding: "var(--p-space-400)" }}>
                        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                          <BlockStack gap="200">
                            <Text as="h2" variant="headingLg">
                              Locked features (upgrade to unlock)
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              These features are not available on your current plan.
                            </Text>
                          </BlockStack>

                          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2, marginTop: 12 }}>
                            <BlockStack gap="300">
                              {lockedFeatureSections.map((sec) => (
                                <Box
                                  key={sec.title}
                                  padding="300"
                                  background="bg-surface-secondary"
                                  borderRadius="200"
                                >
                                  <BlockStack gap="150">
                                    <InlineStack align="space-between" blockAlign="center">
                                      <Text as="h3" variant="headingSm">
                                        {sec.title}
                                      </Text>
                                      {sec.plan === PLAN_STANDARD && sec.rewrites ? (
                                        <Text as="span" variant="bodySm" tone="subdued">
                                          {sec.rewrites}
                                        </Text>
                                      ) : null}
                                    </InlineStack>
                                    <BlockStack gap="100">
                                      {sec.features.map((f) => (
                                        <ExceptionList
                                          key={`${sec.title}-${f}`}
                                          items={[
                                            {
                                              icon: XSmallIcon,
                                              description: f,
                                            },
                                          ]}
                                        />
                                      ))}
                                    </BlockStack>
                                  </BlockStack>
                                </Box>
                              ))}
                            </BlockStack>
                          </div>

                          <div style={{ paddingTop: 16, marginTop: "auto" }}>
                            <Button fullWidth variant="primary" url={plansUrl}>
                              {t.manageSubscription}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : null}
              </InlineStack>

            </BlockStack>
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