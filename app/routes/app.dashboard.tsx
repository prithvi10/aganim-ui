import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
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
  TextField,
  FormLayout,
  Select,
} from "@shopify/polaris";
import { PlanCard } from "../components/PlanCard";
import { PlanGateBadge } from "../components/PlanGateBadge";
import { DowngradeScheduledBanner } from "../components/DowngradeScheduledBanner";
import { canAccess, formatUsage, getRequiredTier, type Entitlements, type FeatureUsageMap } from "../utils/entitlements";
import { PLAN_CATALOG, PLAN_BASIC, PLAN_FREE, PLAN_PRO, PLAN_STANDARD, type PlanName } from "../utils/planCatalog";
import { XSmallIcon } from "@shopify/polaris-icons";
import db from "../db.server";

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
  let uiLanguage = "en";
  let defaultTargetLocale = "en";
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
  let metaCredentials = { access_token_present: false, page_id_present: false, page_id: null as string | null };
  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
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
        entitlements = (data.entitlements || {}) as Entitlements;
        feature_usage = (data.feature_usage || {}) as FeatureUsageMap;
        if (data?.ui_language === "ja") uiLanguage = "ja";
        if (data?.default_target_locale) defaultTargetLocale = String(data.default_target_locale).trim() || "en";
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

    // D. Fetch Meta credentials status (Pro users only)
    if (planName === "Pro") {
      try {
        const metaResp = await fetch(`${backendApiUrl}/api/admin/meta-credentials?shop=${shop}`);
        if (metaResp.ok) {
          const metaData = await metaResp.json();
          metaCredentials = {
            access_token_present: Boolean(metaData.access_token_present),
            page_id_present: Boolean(metaData.page_id_present),
            page_id: metaData.page_id ?? null,
          };
        }
      } catch (e) {
        console.error("Meta credentials fetch failed", e);
      }
    }

    return {
      activeMarketsCount,
      usage,
      planName,
      trialDays,
      backendError401,
      isAuthenticating: false,
      needsReauth: false,
      isSyncing: false,
      backendApiUrl,
      metaCredentials,
      entitlements,
      feature_usage,
      shop,
      uiLanguage,
      defaultTargetLocale,
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
      isSyncing: false,
      backendApiUrl: process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com",
      metaCredentials: { access_token_present: false, page_id_present: false, page_id: null },
      entitlements: {},
      feature_usage: {},
      shop: "",
      uiLanguage: "en",
      defaultTargetLocale: "en",
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
    isSyncing,
    backendApiUrl,
    metaCredentials: initialMetaCredentials,
    entitlements,
    feature_usage,
    shop,
    uiLanguage,
    defaultTargetLocale,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(uiLanguage);
  const [currentLocale, setCurrentLocale] = useState(defaultTargetLocale || "en");

  const LOCALE_OPTIONS = ["en", "zh-TW", "ko", "de", "fr", "es", "it", "pt", "th", "vi", "zh-CN"] as const;

  const handleLocaleChange = useCallback(
    async (newValue: string) => {
      setCurrentLocale(newValue);
      try {
        await fetch(`${backendApiUrl}/api/admin/default-target-locale`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, locale: newValue }),
        });
      } catch {
        // persist failed, revert
        setCurrentLocale(currentLocale);
      }
    },
    [shop, backendApiUrl, currentLocale],
  );

  const toggleLanguage = useCallback(async () => {
    const next = currentLang === "en" ? "ja" : "en";
    setCurrentLang(next);
    i18n.changeLanguage(next);
    try {
      await fetch(`${backendApiUrl}/api/admin/ui-language`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, ui_language: next }),
      });
    } catch {
      // persist failed, UI still updated locally
    }
  }, [currentLang, shop, backendApiUrl]);
  const [searchParams] = useSearchParams();
  const rewriterUrl = useMemo(() => {
    const qs =
      searchParams?.toString() ||
      (typeof window !== "undefined" ? new URL(window.location.href).searchParams.toString() : "");
    return qs ? `/app/rewriter?${qs}` : "/app/rewriter";
  }, [searchParams]);
  const optimizeUrl = useMemo(() => {
    const qs =
      searchParams?.toString() ||
      (typeof window !== "undefined" ? new URL(window.location.href).searchParams.toString() : "");
    return qs ? `/app/optimize?${qs}` : "/app/optimize";
  }, [searchParams]);
  const plansUrl = useMemo(() => {
    const qs =
      searchParams?.toString() ||
      (typeof window !== "undefined" ? new URL(window.location.href).searchParams.toString() : "");
    const prefix = qs ? `/app/plans?${qs}` : "/app/plans";
    // Guarded route: only Dashboard can open plans directly.
    return prefix.includes("?") ? `${prefix}&from=dashboard` : `${prefix}?from=dashboard`;
  }, [searchParams]);
  
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [toastContent, setToastContent] = useState<string | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  // NOTE: App Bridge instance is not needed on this page right now.

  // Meta credentials state (gated by meta_integration entitlement)
  const canUseMetaIntegration = canAccess(entitlements, "meta_integration");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaPageId, setMetaPageId] = useState(initialMetaCredentials?.page_id ?? "");
  const [metaConnected, setMetaConnected] = useState(
    Boolean(initialMetaCredentials?.access_token_present && initialMetaCredentials?.page_id_present),
  );
  const [metaSaving, setMetaSaving] = useState(false);
  
  const activePlanCard = useMemo(() => {
    const name = String(planName || "Free") as PlanName;
    return PLAN_CATALOG.find((p) => p.name === name) ?? PLAN_CATALOG[0];
  }, [planName]);


  const KEY_FEATURES: Array<{ key: string; label: string }> = [
    { key: "seo", label: "SEO optimization" },
    { key: "price_scout", label: "Price Scout" },
    { key: "image_refinement_adhoc", label: "Image refinement" },
    { key: "ad_image_generation", label: "Ad image generation" },
    { key: "social_post_preview", label: "Social post preview" },
    { key: "autonomous", label: "Autonomous publishing" },
    { key: "publish", label: "Publish to Meta" },
    { key: "apply_price", label: "Apply price changes" },
    { key: "meta_integration", label: "Meta integration" },
  ];

  const lockedFeaturesWithTiers = useMemo(() => {
    return KEY_FEATURES
      .filter((f) => !canAccess(entitlements, f.key))
      .map((f) => ({ ...f, tier: getRequiredTier(f.key) ?? "Pro" }));
  }, [entitlements, currentLang]);

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
    setToastContent(t("dashboard.welcomeBack"));
  }, [welcomeBack, t]);

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
  const handleMetaSave = async () => {
    if (!metaAccessToken.trim() || !metaPageId.trim()) {
      setToastContent(t("dashboard.pleaseEnterBoth"));
      return;
    }
    setMetaSaving(true);
    try {
      const shop = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("shop") || "";
      const resp = await fetch(
        `${backendApiUrl}/api/admin/meta-credentials?shop=${shop}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: metaAccessToken.trim(), page_id: metaPageId.trim() }),
        },
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      setMetaConnected(true);
      setMetaAccessToken(""); // clear the token from memory
      setToastContent(t("dashboard.metaCredentialsSaved"));
    } catch (e: any) {
      setToastContent(`${t("dashboard.failedToSaveMeta")} ${e.message || e}`);
    } finally {
      setMetaSaving(false);
    }
  };

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
            <Banner tone="warning" title={t("dashboard.connectionLost")}>
              <p>{t("dashboard.reconnectMessage")}</p>
              <Button onClick={() => window.location.reload()}>{t("dashboard.refreshSession")}</Button>
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
      <Page title={t("dashboard.title")} fullWidth>
        <TitleBar title={t("dashboard.title")} />
        <Modal
          open
          title={t("dashboard.prePaidEnded")}
          onClose={() => window.open(target, "_top")}
          primaryAction={{
            content: t("dashboard.selectPlan"),
            onAction: () => window.open(target, "_top"),
          }}
        >
          <Modal.Section>
            <Text as="p" variant="bodyMd">
              {t("dashboard.selectPlanToContinue")}
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
          <Spinner accessibilityLabel={t("dashboard.loadingDashboard")} size="large" />
        </div>
      </SkeletonPage>
    );
  }

  return (
    <Page fullWidth>
      <TitleBar title={t("dashboard.title")} />
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

      <BlockStack gap="300">
        {backendError401 && (
          <Banner
            tone="critical"
            title={t("dashboard.authenticationError")}
            action={{content: t("dashboard.reconnect"), url: '/auth/login'}}
          >
            <p>{t("dashboard.authErrorDesc")}</p>
          </Banner>
        )}

        <Layout>
          {/* AI OPTIMIZATION CTA */}
          <Layout.Section>
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">{t("dashboard.optimizeUsingAi")}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("dashboard.optimizeUsingAiDesc")}
                    </Text>
                  </BlockStack>
                  <Button variant="primary" size="large" onClick={() => navigate(optimizeUrl)}>
                    {t("dashboard.startAiOptimization")}
                  </Button>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>

          {/* IMPACT METRICS */}
          <Layout.Section>
            <InlineStack gap="400" align="start">
               {/* Optimized Count */}
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)", height: 140, display: "flex", flexDirection: "column" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">{t("dashboard.totalOptimized")}</Text>
                      <Text as="p" variant="heading2xl">{usedCount.toLocaleString()}</Text>
                    </BlockStack>

                    <div style={{ marginTop: "auto" }}>
                      {usedCount === 0 && !welcomeBack ? (
                        <Button size="micro" onClick={() => navigate(rewriterUrl)}>
                          {t("dashboard.optimizeFirstProduct")}
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
                      <Text as="h2" variant="headingSm" tone="subdued">{t("dashboard.activeMarkets")}</Text>
                      <Text as="p" variant="heading2xl">{activeMarketsCount}</Text>
                    </BlockStack>
                    <div style={{ marginTop: "auto", height: 28 }} />
                  </div>
                </Card>
               </div>
               
               {/* Usage Summary: products, missions, images ───────────────── */}
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)", height: 140, display: "flex", flexDirection: "column" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">Usage Summary</Text>
                      <BlockStack gap="100">
                        <Text as="p" variant="bodyMd">
                          Products: {usedCount} / {quotaCount > 0 ? quotaCount : "—"} rewrites
                        </Text>
                        <Text as="p" variant="bodyMd">
                          {t("dashboard.missions")} {formatUsage(feature_usage.missions, false) || "—"}
                        </Text>
                        <Text as="p" variant="bodyMd">
                          {t("dashboard.images")} {formatUsage(feature_usage.image_generation, false) || "—"}
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </div>
                </Card>
               </div>

               {/* Monthly Product Rewrite Usage */}
               <div style={{ flex: 1 }}>
                <Card>
                  <div style={{ padding: "var(--p-space-400)", height: 140, display: "flex", flexDirection: "column" }}>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingSm" tone="subdued">
                        {isLifetime ? t("dashboard.lifetimeCredits") : t("dashboard.monthlyProductRewrites")}
                      </Text>
                      {isLifetime ? (
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <Text as="p" variant="headingMd">
                              {lifetimeRemaining} / {lifetimeTotal} {t("dashboard.left")}
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
                            <Button onClick={() => navigate(plansUrl)} variant="primary">
                              {t("dashboard.get50Rewrites")}
                            </Button>
                          </div>
                        </BlockStack>
                      ) : isUnlimited ? (
                        <BlockStack gap="100">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="p" variant="headingMd">{t("dashboard.unlimited")}</Text>
                            <Badge tone="success">{t("dashboard.unlimited")}</Badge>
                          </InlineStack>
                          {resetDateLabel ? (
                            <Text as="p" variant="bodySm" tone="subdued">{`${t("dashboard.resetsOn")} ${resetDateLabel}`}</Text>
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
                            <Text as="p" variant="bodySm" tone="subdued">{`${t("dashboard.resetsOn")} ${resetDateLabel}`}</Text>
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
                <Banner tone="info" title={t("dashboard.gracePeriodActive")}>
                  <Text as="p" variant="bodyMd">
                    {t("dashboard.gracePeriodMessage")}{" "}
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
                      <Button fullWidth variant="primary" onClick={() => navigate(plansUrl)}>
                        {t("dashboard.manageSubscription")}
                      </Button>
                    }
                  />
                </div>

                {lockedFeaturesWithTiers.length > 0 ? (
                  <div style={{ flex: "1 1 420px", minWidth: 360 }}>
                    <Card>
                      <div style={{ height: 480, padding: "var(--p-space-400)" }}>
                        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                          <BlockStack gap="200">
                            <Text as="h2" variant="headingLg">
                              {t("dashboard.lockedFeatures")}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {t("dashboard.lockedFeaturesDesc")}
                            </Text>
                          </BlockStack>

                          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2, marginTop: 12 }}>
                            <BlockStack gap="200">
                              {lockedFeaturesWithTiers.map((f) => (
                                <InlineStack key={f.key} gap="200" blockAlign="center" wrap>
                                  <ExceptionList
                                    items={[
                                      {
                                        icon: XSmallIcon,
                                        description: f.label,
                                      },
                                    ]}
                                  />
                                  <PlanGateBadge tierName={f.tier} />
                                </InlineStack>
                              ))}
                            </BlockStack>
                          </div>

                          <div style={{ paddingTop: 16, marginTop: "auto" }}>
                            <Button fullWidth variant="primary" onClick={() => navigate(plansUrl)}>
                              {t("dashboard.manageSubscription")}
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

          {/* LANGUAGE SETTINGS */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">{t("dashboard.languageTitle")}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t("dashboard.languageDesc")}
                    </Text>
                  </BlockStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={currentLang === "en" ? "info" : undefined}>English</Badge>
                    <Button onClick={toggleLanguage} variant="primary">
                      {t("dashboard.switchTo")}
                    </Button>
                    <Badge tone={currentLang === "ja" ? "info" : undefined}>日本語</Badge>
                  </InlineStack>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>

          {/* META API CREDENTIALS – gated by meta_integration entitlement */}
          {canUseMetaIntegration && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h2" variant="headingMd">{t("dashboard.metaIntegration")}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {t("dashboard.metaIntegrationDesc")}
                        </Text>
                      </BlockStack>
                      {metaConnected ? (
                        <Badge tone="success" progress="complete">{t("dashboard.connected")}</Badge>
                      ) : (
                        <Badge tone="attention">{t("dashboard.notConnected")}</Badge>
                      )}
                    </InlineStack>

                    {metaConnected ? (
                      <Banner tone="success" title={t("dashboard.metaAccountConnected")}>
                        <Text as="p" variant="bodyMd">
                          {t("dashboard.pageId")} <strong>{metaPageId || initialMetaCredentials?.page_id || "—"}</strong>.{" "}
                          {t("dashboard.autonomousPublishingEnabled")}
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <Button
                            variant="plain"
                            onClick={() => {
                              setMetaConnected(false);
                              setMetaAccessToken("");
                            }}
                          >
                            {t("dashboard.updateCredentials")}
                          </Button>
                        </div>
                      </Banner>
                    ) : (
                      <FormLayout>
                        <TextField
                          label={t("dashboard.metaAccessToken")}
                          type="password"
                          value={metaAccessToken}
                          onChange={setMetaAccessToken}
                          placeholder="EAAxxxxxxx…"
                          helpText={t("dashboard.metaAccessTokenHelp")}
                          autoComplete="off"
                        />
                        <TextField
                          label={t("dashboard.metaPageId")}
                          value={metaPageId}
                          onChange={setMetaPageId}
                          placeholder="123456789012345"
                          helpText={t("dashboard.metaPageIdHelp")}
                          autoComplete="off"
                        />
                        <Button
                          variant="primary"
                          onClick={handleMetaSave}
                          loading={metaSaving}
                          disabled={!metaAccessToken.trim() || !metaPageId.trim()}
                        >
                          {t("dashboard.saveMetaCredentials")}
                        </Button>
                      </FormLayout>
                    )}
                  </BlockStack>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {/* FOOTER */}
          <Layout.Section>
             <BlockStack gap="400">
                <Banner tone="info" title={t("dashboard.supportTitle")}>
                  <p>{t("dashboard.supportText")}</p>
                </Banner>

                <InlineStack align="space-between" blockAlign="center">
                   <InlineStack gap="200">
                      <Badge tone="success" progress="complete">{t("dashboard.allSystemsOperational")}</Badge>
                   </InlineStack>
                  <InlineStack gap="400">
                      <Text as="span" variant="bodySm" tone="subdued">{t("dashboard.quickStart")}:</Text>
                      <Link url="/support" target="_blank">{t("dashboard.quickHelp")}</Link>
                      <Link url="https://docs.crossborder.ai" target="_blank">{t("dashboard.docs")}</Link>
                      <Link url="#" target="_blank">{t("dashboard.video")}</Link>
                      <Link url="/privacy-policy" target="_blank">{t("dashboard.privacyPolicy")}</Link>
                   </InlineStack>
                </InlineStack>
             </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

    </Page>
  );
}