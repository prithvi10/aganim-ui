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
  Collapsible,
} from "@shopify/polaris";
import { PlanCard } from "../components/PlanCard";
import { PlanGateBadge } from "../components/PlanGateBadge";
import { DowngradeScheduledBanner } from "../components/DowngradeScheduledBanner";
import { canAccess, formatUsage, getRequiredTier, type Entitlements, type FeatureUsageMap } from "../utils/entitlements";
import { buildPlanCatalog, PLAN_BASIC, PLAN_FREE, PLAN_PRO, PLAN_STANDARD, type PlanName } from "../utils/planCatalog";
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
  const backendApiUrl = process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";

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
  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
  let brandSoulEnabled = true;
  let brandContextStatus = "idle";
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
    let localeResponse = await client.query({ data: localeQuery });
    trail(`[🔍 Trail] ✅ Locale Response received. Status: ${localeResponse ? "OK" : "NULL"}`);
    if (!localeResponse) {
      trailWarn(`[🔍 Trail] 🛑 Locale Fetch returned NULL (401 caught by wrapper).`);
      trailWarn(`[🔍 Trail] 🚑 TRIGGERING RE-AUTH (Self-Healing)...`);
      console.warn("[Dashboard] Master Key is dead (401). Clearing stale sessions + triggering re-auth.");
      try {
        if (shopParam) {
          await db.session.deleteMany({ where: { shop: shopParam } });
        }
      } catch {
        // best-effort
      }
      // Use authenticate.admin which handles embedded re-auth correctly
      // (sends an App Bridge-aware bounce page instead of a raw 302 that
      // would show "refused to connect" inside the Shopify iframe).
      const { admin, session: freshSession } = await authenticate.admin(request);
      session = freshSession;
      client = {
        query: async ({ data }: { data: string }) => {
          try {
            const response = await admin.graphql(data);
            const body = await response.json();
            return { body };
          } catch (error) {
            console.error("[Dashboard] Fresh online client query failed", error);
            return null;
          }
        }
      };
      localeResponse = await client.query({ data: localeQuery });
    }
    trail(`[🔍 Trail] ✅ Locales Fetched Successfully. Count: ${localeResponse?.body?.data?.shopLocales?.length}`);
    const locales = localeResponse?.body?.data?.shopLocales || [];
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
      // Use authenticate.admin for embedded-safe re-auth (avoids iframe "refused to connect")
      const { admin, session: freshSession } = await authenticate.admin(request);
      session = freshSession;
      client = {
        query: async ({ data }: { data: string }) => {
          try {
            const response = await admin.graphql(data);
            const body = await response.json();
            return { body };
          } catch (error) {
            console.error("[Dashboard] Fresh online client query failed (billing)", error);
            return null;
          }
        }
      };
    }

    const activeSubs = billingResponse?.body?.data?.currentAppInstallation?.activeSubscriptions || [];
    const hasShopifySubscription = activeSubs.length > 0;
    // Shopify billing is NOT the source of truth for plan display/gating.
    // Keep this only for trial-day display.
    if (activeSubs.length > 0 && activeSubs[0].test) trialDays = 4;

    // C. Fetch Usage from Backend
    // Note: Usage fetch uses a direct HTTP call. We sync the token first just in case.
    try {
      // Optional: Sync token to backend if needed (omitted for brevity/speed)
      const fetchUrl = `${backendApiUrl}/api/admin/usage?shop=${shop}`;
      const resp = await fetch(fetchUrl, { headers: { "X-Token-Sync-Secret": process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET || "" } });
      
      if (resp.status === 401) {
        // Backend rejected the token
        backendError401 = true;
      } else if (resp.ok) {
        const data = await resp.json();
        entitlements = (data.entitlements || {}) as Entitlements;
        feature_usage = (data.feature_usage || {}) as FeatureUsageMap;
        if (data?.ui_language === "ja") uiLanguage = "ja";
        if (data?.default_target_locale) defaultTargetLocale = String(data.default_target_locale).trim() || "en";
        const brandSoulEnabledValue = data?.brand_soul_enabled !== undefined ? Boolean(data.brand_soul_enabled) : true;
        const brandContextStatusValue = String(data?.brand_context_status || "idle");
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
          isBetaTester: Boolean(data.is_beta_tester),
        };
        brandSoulEnabled = brandSoulEnabledValue;
        brandContextStatus = brandContextStatusValue;
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
      isSyncing: false,
      backendApiUrl,
      entitlements,
      feature_usage,
      shop,
      uiLanguage,
      defaultTargetLocale,
      brandSoulEnabled,
      brandContextStatus,
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
      backendApiUrl: process.env.BACKEND_API_URL || "https://aganim-api.onrender.com",
      entitlements: {},
      feature_usage: {},
      shop: "",
      uiLanguage: "en",
      defaultTargetLocale: "en",
      brandSoulEnabled: true,
      brandContextStatus: "idle",
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
    entitlements,
    feature_usage,
    shop,
    uiLanguage,
    defaultTargetLocale,
    brandSoulEnabled: initialBrandSoulEnabled,
    brandContextStatus,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(uiLanguage);
  const [brandSoulOn, setBrandSoulOn] = useState(initialBrandSoulEnabled);
  const [currentLocale, setCurrentLocale] = useState(defaultTargetLocale || "en");

  const LOCALE_OPTIONS = ["ja", "en", "zh-TW", "ko", "de", "fr", "es", "it", "pt", "th", "vi", "zh-CN"] as const;

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

  const toggleBrandSoul = useCallback(async () => {
    const next = !brandSoulOn;
    setBrandSoulOn(next);
    try {
      await fetch(`${backendApiUrl}/api/admin/brand-soul-toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, enabled: next }),
      });
    } catch {
      // persist failed, UI still updated locally
    }
  }, [brandSoulOn, shop, backendApiUrl]);
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

  
  const planCatalog = useMemo(() => buildPlanCatalog(t), [t]);

  const activePlanCard = useMemo(() => {
    const name = String(planName || "Free") as PlanName;
    return planCatalog.find((p) => p.name === name) ?? planCatalog[0];
  }, [planName, planCatalog]);


  const KEY_FEATURES = useMemo<Array<{ key: string; label: string }>>(() => [
    { key: "seo", label: t("dashboard.featureSeoOptimization") },
    { key: "price_scout", label: t("dashboard.featurePriceScout") },
    { key: "image_refinement_adhoc", label: t("dashboard.featureImageRefinement") },
    { key: "ad_image_generation", label: t("dashboard.featureAdImageGeneration") },
    { key: "social_post_preview", label: t("dashboard.featureSocialPostPreview") },
    { key: "autonomous", label: t("dashboard.featureAutonomousPublishing") },
    { key: "apply_price", label: t("dashboard.featureApplyPriceChanges") },
  ], [t]);

  const lockedFeaturesWithTiers = useMemo(() => {
    return KEY_FEATURES
      .filter((f) => !canAccess(entitlements, f.key))
      .map((f) => ({ ...f, tier: getRequiredTier(f.key) ?? "Pro" }));
  }, [entitlements, KEY_FEATURES]);

  useEffect(() => {
    // Artificial delay to prevent skeleton flash on fast loads
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const usedCount = Number(usage?.used || 0);
  const quotaCount = Number(usage?.quota ?? 0);

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
  // Concern form state
  const [concernFormOpen, setConcernFormOpen] = useState(false);
  const [concernEmail, setConcernEmail] = useState("");
  const [concernSubject, setConcernSubject] = useState("");
  const [concernMessage, setConcernMessage] = useState("");
  const [concernSending, setConcernSending] = useState(false);
  const [concernSuccess, setConcernSuccess] = useState(false);
  const [concernError, setConcernError] = useState<string | null>(null);

  const handleConcernSubmit = useCallback(async () => {
    setConcernSending(true);
    setConcernError(null);
    setConcernSuccess(false);
    try {
      const resp = await fetch(`${backendApiUrl}/api/admin/submit-concern`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Shop-Domain": shop,
        },
        body: JSON.stringify({
          shop_domain: shop,
          email: concernEmail.trim(),
          subject: concernSubject.trim(),
          message: concernMessage.trim(),
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setConcernSuccess(true);
      setConcernEmail("");
      setConcernSubject("");
      setConcernMessage("");
    } catch (e: any) {
      setConcernError(t("dashboard.concernFailed"));
    } finally {
      setConcernSending(false);
    }
  }, [backendApiUrl, shop, concernEmail, concernSubject, concernMessage, t]);

  const resetDateLabel = usage?.nextResetDate
    ? new Date(usage.nextResetDate).toLocaleDateString()
    : null;
  const isFree = String(planName || "").toLowerCase() === "free";

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
    const target = `/app/plans?returning_paid=1${qs ? `&${qs.replace(/^\?/, "")}` : ""}`;
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

          {/* CONTENT TARGET MARKET */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">{t("dashboard.contentLocaleTitle")}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t("dashboard.contentLocaleDesc")}
                    </Text>
                  </BlockStack>
                  <div style={{ minWidth: 220 }}>
                    <Select
                      label=""
                      labelHidden
                      options={LOCALE_OPTIONS.map((lc) => ({
                        label: t(`localeLabels.${lc}`),
                        value: lc,
                      }))}
                      value={currentLocale}
                      onChange={handleLocaleChange}
                    />
                  </div>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>

          {/* BRAND SOUL TOGGLE */}
          {brandContextStatus === "ready" && (
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingMd">{t("dashboard.brandSoulToggle")}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t("dashboard.brandSoulToggleHelp")}
                      </Text>
                    </BlockStack>
                    <Button
                      onClick={toggleBrandSoul}
                      variant={brandSoulOn ? "primary" : "secondary"}
                      tone={brandSoulOn ? "success" : undefined}
                    >
                      {brandSoulOn ? t("dashboard.brandSoulOn") : t("dashboard.brandSoulOff")}
                    </Button>
                  </InlineStack>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {/* USAGE METRICS */}
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingSm" tone="subdued">{t("dashboard.usageSummary")}</Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">
                      {t("dashboard.productsRewritesSummary", { used: usedCount, quota: quotaCount > 0 ? quotaCount : "—" })}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {t("dashboard.missions")} {formatUsage(feature_usage.missions, false) || "—"}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {t("dashboard.images")} {formatUsage(feature_usage.image_generation, false) || "—"}
                    </Text>
                  </BlockStack>
                  {resetDateLabel ? (
                    <Text as="p" variant="bodySm" tone="subdued">{`${t("dashboard.resetsOn")} ${resetDateLabel}`}</Text>
                  ) : null}
                  {isFree ? (
                    <div style={{ marginTop: 4 }}>
                      <Button onClick={() => navigate(plansUrl)} variant="primary">
                        {t("dashboard.get50Rewrites")}
                      </Button>
                    </div>
                  ) : null}
                </BlockStack>
              </Box>
            </Card>
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
              {Boolean((usage as any)?.isBetaTester) && (usage as any)?.accessExpiresAt && !Boolean((usage as any)?.graceActive) ? (
                <Banner tone="info" title="特別プログラム — 全Pro機能が無料">
                  <Text as="p" variant="bodyMd">
                    現在、特別プログラムにより全Pro機能を無料でご利用いただけます。
                    有効期限: {new Date(String((usage as any)?.accessExpiresAt)).toLocaleDateString("ja-JP")}。
                    この機会にぜひすべての機能をお試しください！
                  </Text>
                </Banner>
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

          {/* SUPPORT */}
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h2" variant="headingLg">{t("dashboard.supportTitle")}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">{t("dashboard.supportText")}</Text>
                      </BlockStack>
                      <Button variant="primary" url="/support" target="_blank">
                        {t("dashboard.openSupportPage")}
                      </Button>
                    </InlineStack>

                    <Button
                      variant="plain"
                      onClick={() => setConcernFormOpen(!concernFormOpen)}
                    >
                      {concernFormOpen ? t("dashboard.hideConcernForm") : t("dashboard.submitAConcern")}
                    </Button>

                    <Collapsible
                      open={concernFormOpen}
                      id="concern-form-collapsible"
                      transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                    >
                      <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="300">
                          {concernSuccess ? (
                            <Banner tone="success">
                              {t("dashboard.concernSubmitted")}
                            </Banner>
                          ) : null}
                          {concernError ? (
                            <Banner tone="critical">{concernError}</Banner>
                          ) : null}

                          <FormLayout>
                            <TextField
                              label={t("dashboard.concernEmail")}
                              type="email"
                              value={concernEmail}
                              onChange={setConcernEmail}
                              autoComplete="email"
                              helpText={t("dashboard.concernEmailHelp")}
                            />
                            <TextField
                              label={t("dashboard.concernSubject")}
                              value={concernSubject}
                              onChange={setConcernSubject}
                              autoComplete="off"
                              requiredIndicator
                            />
                            <TextField
                              label={t("dashboard.concernMessage")}
                              value={concernMessage}
                              onChange={setConcernMessage}
                              multiline={4}
                              autoComplete="off"
                              requiredIndicator
                            />
                            <Button
                              variant="primary"
                              onClick={handleConcernSubmit}
                              loading={concernSending}
                              disabled={!concernSubject.trim() || !concernMessage.trim()}
                            >
                              {t("dashboard.submitConcern")}
                            </Button>
                          </FormLayout>
                        </BlockStack>
                      </Box>
                    </Collapsible>
                  </BlockStack>
                </Box>
              </Card>

              <InlineStack align="space-between" blockAlign="center">
                <Badge tone="success" progress="complete">{t("dashboard.allSystemsOperational")}</Badge>
                <Link url="/privacy-policy" target="_blank">{t("dashboard.privacyPolicy")}</Link>
              </InlineStack>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

    </Page>
  );
}