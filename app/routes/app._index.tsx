import {
  Page,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Banner,
  Box,
  InlineGrid,
  Collapsible,
  Icon,
  Spinner,
  List,
  TextField,
} from "@shopify/polaris";
import "../styles/optimize-button.css";
import type { Entitlements, FeatureUsageMap } from "../utils/entitlements";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { GetStartedGuide } from "../components/GetStartedGuide";
import { BrandSoulWizard } from "../components/BrandSoulWizard";
import {
  StarIcon,
  EditIcon,
  SearchIcon,
  SocialAdIcon,
  ChartVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
} from "@shopify/polaris-icons";
import { useTranslation } from "react-i18next";
import { authenticate, getOfflineGraphqlClient } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";
  const backendApiUrl =
    process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";

  // Defensive auth: prefer offline client, fallback to authenticate.admin
  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  let shop: string;
  if (offlineContext) {
    shop = offlineContext.session.shop;
  } else {
    const { session } = await authenticate.admin(request);
    shop = session.shop;
  }

  let planName = "Free";
  let brandStatus = "idle";
  let brandSummary = "";
  let brandKeyFacts: string[] = [];
  let brandKeyFactsEn: string[] = [];
  let brandKeyFactsJa: string[] = [];
  let brandSummaryEn = "";
  let brandSummaryJa = "";
  let brandUpdatedAt: string | null = null;
  let brandLastError: string | null = null;

  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
  let isOnboardingFinished = false;
  try {
    const u = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shop)}`, { headers: { "X-Token-Sync-Secret": process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET || "" } });
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      const eff = String(data?.effective_plan_name || data?.plan_name || "").trim();
      if (eff) planName = eff;
      entitlements = data.entitlements || {};
      feature_usage = data.feature_usage || {};
      isOnboardingFinished = Boolean(data.is_onboarding_finished);
    }
  } catch {
    // best-effort
  }

  try {
    const s = await fetch(`${backendApiUrl}/api/admin/brand-context/status?shop=${encodeURIComponent(shop)}`);
    if (s.ok) {
      const data: any = await s.json().catch(() => ({}));
      const ctx = data?.brand_context || {};
      
      let ctxObj = {};
      if (typeof ctx === 'string') {
        try { ctxObj = JSON.parse(ctx); } catch {}
      } else if (typeof ctx === 'object') {
        ctxObj = ctx;
      }
      
      // Support new nested structure {en: {clean_text}, ja: {clean_text}}
      // Fallback to flat structure {summary_en, summary_ja}
      const nestedEn = (ctxObj as any)?.en || {};
      const nestedJa = (ctxObj as any)?.ja || {};
      
      brandStatus = String(data?.status || "idle");
      brandSummaryEn = String(nestedEn?.clean_text || (ctxObj as any)?.summary_en || data?.summary_en || "").trim();
      brandSummaryJa = String(nestedJa?.clean_text || (ctxObj as any)?.summary_ja || data?.summary_ja || "").trim();
      brandSummary = String(data?.summary || brandSummaryEn || brandSummaryJa || "").trim();
      
      const pillarsEn = Array.isArray(nestedEn?.pillars) ? nestedEn.pillars : null;
      const pillarsJa = Array.isArray(nestedJa?.pillars) ? nestedJa.pillars : null;
      
      brandKeyFactsEn = pillarsEn
        ? pillarsEn.map((k: any) => String(k))
        : Array.isArray((ctxObj as any)?.key_facts_en)
          ? (ctxObj as any).key_facts_en.map((k: any) => String(k))
          : Array.isArray(data?.key_facts_en)
            ? data.key_facts_en.map((k: any) => String(k))
            : [];
            
      brandKeyFactsJa = pillarsJa
        ? pillarsJa.map((k: any) => String(k))
        : Array.isArray((ctxObj as any)?.key_facts_ja)
          ? (ctxObj as any).key_facts_ja.map((k: any) => String(k))
          : Array.isArray(data?.key_facts_ja)
            ? data.key_facts_ja.map((k: any) => String(k))
            : [];
      brandKeyFacts = Array.isArray(data?.key_facts)
        ? data.key_facts.map((k: any) => String(k))
        : brandKeyFactsEn.length
          ? brandKeyFactsEn
          : brandKeyFactsJa;
      brandUpdatedAt = data?.updated_at || null;
      brandLastError = data?.last_error ? String(data?.last_error) : null;
    }
  } catch {
    // best-effort
  }

  // Fetch brand intelligence (strategic audit)
  let brandIntelligence: Record<string, any> | null = null;
  let brandIntelligenceUpdatedAt: string | null = null;
  try {
    const intelRes = await fetch(
      `${backendApiUrl}/api/admin/brand-intelligence?shop=${encodeURIComponent(shop)}`,
    );
    if (intelRes.ok) {
      const intelData: any = await intelRes.json().catch(() => ({}));
      brandIntelligence = intelData?.intelligence || null;
      brandIntelligenceUpdatedAt = intelData?.updated_at || null;
    }
  } catch {
    // best-effort
  }

  return {
    shop,
    host,
    backendApiUrl,
    planName,
    entitlements,
    feature_usage,
    isOnboardingFinished,
    brandStatus,
    brandSummary,
    brandKeyFacts,
    brandKeyFactsEn,
    brandKeyFactsJa,
    brandSummaryEn,
    brandSummaryJa,
    brandUpdatedAt,
    brandLastError,
    brandIntelligence,
    brandIntelligenceUpdatedAt,
  };
};

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const {
    shop,
    host,
    backendApiUrl,
    planName,
    brandStatus,
    brandSummary,
    brandKeyFacts,
    brandKeyFactsEn,
    brandKeyFactsJa,
    brandSummaryEn,
    brandSummaryJa,
    brandUpdatedAt,
    brandLastError,
    brandIntelligence,
    brandIntelligenceUpdatedAt,
    feature_usage,
    isOnboardingFinished,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [brandWizardOpen, setBrandWizardOpen] = useState(false);
  const [brandSoulCollapsed, setBrandSoulCollapsed] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(!isOnboardingFinished);
  const [brandEditMode, setBrandEditMode] = useState(false);
  const [brandEditText, setBrandEditText] = useState("");
  const [brandEditSaving, setBrandEditSaving] = useState(false);
  const [brandStatusState, setBrandStatusState] = useState(brandStatus);
  const [brandSummaryEnState, setBrandSummaryEnState] = useState(brandSummaryEn);
  const [brandSummaryJaState, setBrandSummaryJaState] = useState(brandSummaryJa);
  const [brandSummaryLegacyState, setBrandSummaryLegacyState] = useState(brandSummary);
  const [brandKeyFactsState, setBrandKeyFactsState] = useState<string[]>(brandKeyFacts);
  const [brandKeyFactsEnState, setBrandKeyFactsEnState] = useState<string[]>(brandKeyFactsEn);
  const [brandKeyFactsJaState, setBrandKeyFactsJaState] = useState<string[]>(brandKeyFactsJa);
  const [brandUpdatedState, setBrandUpdatedState] = useState<string | null>(brandUpdatedAt);
  const [brandErrorState, setBrandErrorState] = useState<string | null>(brandLastError);

  const shopSlug = shop.replace(".myshopify.com", "");

  const optimizeUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/optimize`
    : "https://admin.shopify.com/";

  // Navigation helper: merge shop/host into path (preserves existing ?query on path)
  const nav = useCallback(
    (path: string) => {
      const q = path.indexOf("?");
      const pathname = q >= 0 ? path.slice(0, q) : path;
      const params = new URLSearchParams(q >= 0 ? path.slice(q + 1) : "");
      if (host) params.set("host", host);
      if (shop) params.set("shop", shop);
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [host, shop],
  );

  const handleBrandEditSave = useCallback(async () => {
    setBrandEditSaving(true);
    try {
      const resp = await fetch(`${backendApiUrl}/api/admin/brand-context/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Shop-Domain": shop,
        },
        body: JSON.stringify({ clean_text_en: brandEditText }),
      });
      if (!resp.ok) throw new Error("Failed to save");
      const data = await resp.json().catch(() => ({}));
      setBrandSummaryEnState(data.summary_en || brandEditText);
      setBrandEditMode(false);
    } catch {
      // best-effort
    } finally {
      setBrandEditSaving(false);
    }
  }, [backendApiUrl, shop, brandEditText]);

  useEffect(() => {
    setBrandStatusState(brandStatus);
    setBrandSummaryLegacyState(brandSummary);
    setBrandSummaryEnState(brandSummaryEn);
    setBrandSummaryJaState(brandSummaryJa);
    setBrandKeyFactsState(brandKeyFacts);
    setBrandKeyFactsEnState(brandKeyFactsEn);
    setBrandKeyFactsJaState(brandKeyFactsJa);
    setBrandUpdatedState(brandUpdatedAt);
    setBrandErrorState(brandLastError);
  }, [
    brandStatus,
    brandSummary,
    brandSummaryEn,
    brandSummaryJa,
    brandKeyFacts,
    brandKeyFactsEn,
    brandKeyFactsJa,
    brandUpdatedAt,
    brandLastError,
  ]);

  const preferJapaneseBrandSoul = (i18n.language || "").toLowerCase().startsWith("ja");

  const displayBrandSummary = useMemo(() => {
    if (preferJapaneseBrandSoul) {
      return brandSummaryJaState || brandSummaryEnState || brandSummaryLegacyState;
    }
    return brandSummaryEnState || brandSummaryJaState || brandSummaryLegacyState;
  }, [
    preferJapaneseBrandSoul,
    brandSummaryEnState,
    brandSummaryJaState,
    brandSummaryLegacyState,
  ]);

  const displayKeyFacts = useMemo(() => {
    if (preferJapaneseBrandSoul) {
      if (brandKeyFactsJaState.length) return brandKeyFactsJaState;
      if (brandKeyFactsEnState.length) return brandKeyFactsEnState;
      return brandKeyFactsState;
    }
    if (brandKeyFactsEnState.length) return brandKeyFactsEnState;
    if (brandKeyFactsJaState.length) return brandKeyFactsJaState;
    return brandKeyFactsState;
  }, [
    preferJapaneseBrandSoul,
    brandKeyFactsEnState,
    brandKeyFactsJaState,
    brandKeyFactsState,
  ]);

  const isBrandSoulActive = useMemo(() => {
    return (brandStatusState === "ready" || brandStatusState === "completed") && !!displayBrandSummary;
  }, [brandStatusState, displayBrandSummary]);

  const isFree = String(planName || "").toLowerCase() === "free";

  // Determine status icon
  const brandStatusIcon = useMemo(() => {
    if (brandStatusState === "running" || brandStatusState === "accepted") {
      return (
        <div className="brand-soul-spinner" style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner size="small" accessibilityLabel="Generating" />
        </div>
      );
    }
    if (isBrandSoulActive) {
      return (
        <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon source={CheckCircleIcon} tone="success" />
        </div>
      );
    }
    return (
      <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon source={XCircleIcon} tone="critical" />
      </div>
    );
  }, [brandStatusState, isBrandSoulActive]);

  // Polling for brand status updates
  useEffect(() => {
    // Poll when status is "running" or "accepted" (waiting for completion)
    // Also poll once on mount to check current status
    const shouldPoll = brandStatusState === "running" || brandStatusState === "accepted";
    let active = true;
    const poll = async () => {
      try {
        const resp = await fetch(
          `${backendApiUrl}/api/admin/brand-context/status?shop=${encodeURIComponent(shop)}`,
        );
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        if (!active) return;
        const ctx = data?.brand_context || {};
        const newStatus = String(data?.status || "idle");
        setBrandStatusState(newStatus);
        setBrandSummaryLegacyState(String(data?.summary || "").trim());
        setBrandSummaryEnState(String(ctx?.en?.clean_text || ctx?.summary_en || data?.summary_en || "").trim());
        setBrandSummaryJaState(String(ctx?.ja?.clean_text || ctx?.summary_ja || data?.summary_ja || "").trim());
        const nextKeyFactsEn = Array.isArray(ctx?.en?.pillars)
          ? ctx.en.pillars.map((k: any) => String(k))
          : Array.isArray(ctx?.key_facts_en)
            ? ctx.key_facts_en.map((k: any) => String(k))
            : Array.isArray(data?.key_facts_en)
              ? data.key_facts_en.map((k: any) => String(k))
              : [];
        const nextKeyFactsJa = Array.isArray(ctx?.ja?.pillars)
          ? ctx.ja.pillars.map((k: any) => String(k))
          : Array.isArray(ctx?.key_facts_ja)
            ? ctx.key_facts_ja.map((k: any) => String(k))
            : Array.isArray(data?.key_facts_ja)
              ? data.key_facts_ja.map((k: any) => String(k))
              : [];
        setBrandKeyFactsEnState(nextKeyFactsEn);
        setBrandKeyFactsJaState(nextKeyFactsJa);
        setBrandKeyFactsState(
          Array.isArray(data?.key_facts)
            ? data.key_facts.map((k: any) => String(k))
            : nextKeyFactsEn.length
              ? nextKeyFactsEn
              : nextKeyFactsJa,
        );
        setBrandUpdatedState(data?.updated_at || null);
        setBrandErrorState(data?.last_error ? String(data?.last_error) : null);
      } catch {
        // best-effort
      }
    };
    
    // Poll immediately on mount or when status changes to running/accepted
    poll();
    
    // Only set up interval if we should continue polling
    if (!shouldPoll) return;
    
    const id = window.setInterval(poll, 10000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [brandStatusState, backendApiUrl, shop]);


  return (
    <Page fullWidth>
      <BlockStack gap="500">
        {/* App Header with Logo */}
          <Card>
          <Box padding="400">
                  <InlineStack align="start" blockAlign="center" gap="400">
                    <img
                      src="/Icon-final.png"
                alt={t("home.crossBorderAi")}
                      style={{ width: 56, height: 56 }}
                    />
                    <BlockStack gap="100">
                      <Text as="h1" variant="headingXl">
                  {t("home.crossBorderAi")}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                  {t("home.tagline")}
                      </Text>
                    </BlockStack>
                  </InlineStack>
          </Box>
        </Card>

        {/* Quick Product Launch CTA – Free plan only */}
        {isFree && (
          <div
            className="quick-launch-card"
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => navigate(nav("/app/optimize?mission=full_launch"))}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(nav("/app/optimize?mission=full_launch")); }}
          >
            <Card>
              <Box padding="200">
                <InlineStack align="center" blockAlign="center" gap="200">
                  <span className="quick-launch-icon" aria-hidden="true">&#10024;</span>
                  <Text as="p" variant="headingLg" className="quick-launch-cta-text">
                    {t("home.quickLaunchCta")}
                  </Text>
                </InlineStack>
              </Box>
            </Card>
          </div>
        )}

        {/* Features Grid */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            {t("home.features")}
          </Text>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            {/* Card 1: Complete Optimization */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      {t("home.completeOptimization")}
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={StarIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("home.completeOptimizationDesc")}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-1">
                          <Button
                        variant="primary"
                            onClick={() => {
                              window.open(optimizeUrl, "_top");
                            }}
                          >
                        {t("home.open")}
                          </Button>
                        </div>
                      </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 2: Writing Studio */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      Writing Studio
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={EditIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("home.writingStudioDesc")}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-2">
                    <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/writing-studio"))}
                    >
                        {t("home.open")}
                    </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 3: Price Scout */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      {t("home.priceScout")}
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={SearchIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("home.priceScoutDesc")}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-4">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/pricing"))}
                      >
                        {t("home.open")}
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 4: Marketing Agent */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      {t("home.marketingAgent")}
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={SocialAdIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("home.marketingAgentDesc")}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-5">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/marketing"))}
                      >
                        {t("home.open")}
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
          </Card>

            {/* Card 5: SEO Manager */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      {t("home.seoManager")}
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={ChartVerticalIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("home.seoManagerDesc")}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-6">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/seo"))}
                      >
                        {t("home.open")}
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 6: Dashboard */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      {t("home.dashboardCard")}
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={HomeIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {t("home.dashboardCardDesc")}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-6">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/dashboard"))}
                      >
                        {t("home.open")}
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>
        </BlockStack>

        {/* Brand Soul Identity Bar */}
            <Card>
          <Box padding="400" background="bg-surface-secondary">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                <InlineStack align="start" gap="200" blockAlign="center">
                  <img src="/landing%20page/Brand%20soul%20logo.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4 }} />
                  <Text as="h2" variant="headingLg">
                        {t("home.brandSoul")}
                      </Text>
                  {brandStatusIcon}
                </InlineStack>
                    <Button variant="primary" onClick={() => setBrandWizardOpen(true)}>
                  {t("home.editIdentity")}
                    </Button>
                  </InlineStack>

              {brandStatusState === "running" || brandStatusState === "accepted" ? (
                    <Banner tone="info">
                      {t("home.generatingBrandIntelligence")}
                    </Banner>
                  ) : null}
              {brandStatusState === "failed" && (
                    <Banner tone="critical">
                      {t("home.brandIntelligenceFailed")}
                    </Banner>
              )}
              {brandErrorState && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {brandErrorState}
                    </Text>
              )}

              {displayBrandSummary && (
                <>
                  <Collapsible
                    open={!brandSoulCollapsed}
                    id="brand-soul-collapsible"
                    transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                  >
                    <Box padding="300" background="bg-surface" borderRadius="200">
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t("home.latestSummary")}
                          </Text>
                          {!brandEditMode ? (
                            <Button
                              variant="plain"
                              size="slim"
                              onClick={() => {
                                setBrandEditText(displayBrandSummary);
                                setBrandEditMode(true);
                              }}
                            >
                              Edit
                            </Button>
                          ) : null}
                        </InlineStack>
                        {brandEditMode ? (
                          <BlockStack gap="200">
                            <TextField
                              label=""
                              labelHidden
                              value={brandEditText}
                              onChange={setBrandEditText}
                              multiline={6}
                              autoComplete="off"
                            />
                            <InlineStack gap="200">
                              <Button
                                variant="primary"
                                size="slim"
                                loading={brandEditSaving}
                                onClick={handleBrandEditSave}
                              >
                                Save
                              </Button>
                              <Button
                                size="slim"
                                onClick={() => setBrandEditMode(false)}
                                disabled={brandEditSaving}
                              >
                                Cancel
                              </Button>
                            </InlineStack>
                          </BlockStack>
                        ) : (
                          <>
                            {displayBrandSummary.includes("\n") ? (
                              <List type="bullet">
                                {displayBrandSummary
                                  .split("\n")
                                  .map((line) => line.replace(/^•\s?/, "").trim())
                                  .filter(Boolean)
                                  .map((line, idx) => (
                                    <List.Item key={`${idx}-${line}`}>{line}</List.Item>
                                  ))}
                              </List>
                            ) : (
                              <Text as="p" variant="bodyMd">
                                {displayBrandSummary}
                              </Text>
                            )}
                          </>
                        )}
                        {displayKeyFacts.length > 0 && (
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">
                              {t("home.keyFacts")}
                            </Text>
                            <List type="bullet">
                              {displayKeyFacts.map((fact: string, idx: number) => (
                                <List.Item key={`${idx}-${fact}`}>{fact}</List.Item>
                              ))}
                            </List>
                          </BlockStack>
                        )}
                        {brandUpdatedState && (
                          <Text as="span" variant="bodySm" tone="subdued">
                            {t("home.updated")}{" "}
                            {new Date(brandUpdatedState).toLocaleDateString(
                              preferJapaneseBrandSoul ? "ja-JP" : undefined,
                            )}
                          </Text>
                        )}

                        {/* Brand Intelligence dropdown inside Brand Soul */}
                        {brandIntelligence && (
                          <BlockStack gap="200">
                            <Button
                              variant="plain"
                              onClick={() => setIntelligenceOpen(!intelligenceOpen)}
                              textAlign="start"
                            >
                              {intelligenceOpen ? t("home.hideBrandIntelligence") : t("home.showBrandIntelligence")}
                            </Button>
                            <Collapsible
                              open={intelligenceOpen}
                              id="brand-intelligence-collapsible"
                              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                            >
                              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                                <BlockStack gap="300">
                                  {/* Archetype */}
                                  <BlockStack gap="100">
                                    <Text as="p" variant="bodySm" fontWeight="semibold">
                                      {t("home.brandArchetype")}
                                    </Text>
                                    <InlineStack gap="200">
                                      <Text as="span" variant="bodyMd">
                                        {String(brandIntelligence.archetype || "")
                                          .split("_")
                                          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                          .join(" ")}
                                      </Text>
                                      {brandIntelligence.archetype_confidence != null && (
                                        <Text as="span" variant="bodySm" tone="subdued">
                                          ({Math.round(brandIntelligence.archetype_confidence * 100)}%)
                                        </Text>
                                      )}
                                    </InlineStack>
                                    {brandIntelligence.secondary_archetype && (
                                      <Text as="p" variant="bodySm" tone="subdued">
                                        {t("home.secondary")} {String(brandIntelligence.secondary_archetype)
                                          .split("_")
                                          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                          .join(" ")}
                                      </Text>
                                    )}
                                  </BlockStack>

                                  {/* Tonal Guardrails */}
                                  {brandIntelligence.tonal_guardrails && (
                                    <BlockStack gap="100">
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        {t("home.tonalGuardrails")}
                                      </Text>
                                      <List type="bullet">
                                        <List.Item>Formality: {brandIntelligence.tonal_guardrails.formality_level}</List.Item>
                                        <List.Item>Energy: {brandIntelligence.tonal_guardrails.energy_level}</List.Item>
                                        <List.Item>Emotion: {brandIntelligence.tonal_guardrails.emotional_register}</List.Item>
                                        <List.Item>Technical: {brandIntelligence.tonal_guardrails.technical_depth}</List.Item>
                                      </List>
                                    </BlockStack>
                                  )}

                                  {/* Power Words */}
                                  {Array.isArray(brandIntelligence.power_words) && brandIntelligence.power_words.length > 0 && (
                                    <BlockStack gap="100">
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        {t("home.powerWords")}
                                      </Text>
                                      <Text as="p" variant="bodySm">
                                        {brandIntelligence.power_words.slice(0, 10).join(", ")}
                                      </Text>
                                    </BlockStack>
                                  )}

                                  {/* Banned Phrases */}
                                  {Array.isArray(brandIntelligence.banned_phrases) && brandIntelligence.banned_phrases.length > 0 && (
                                    <BlockStack gap="100">
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        {t("home.bannedPhrases")}
                                      </Text>
                                      <Text as="p" variant="bodySm" tone="critical">
                                        {brandIntelligence.banned_phrases.slice(0, 10).join(", ")}
                                      </Text>
                                    </BlockStack>
                                  )}

                                  {/* Core Value Props */}
                                  {Array.isArray(brandIntelligence.core_value_props) && brandIntelligence.core_value_props.length > 0 && (
                                    <BlockStack gap="100">
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        {t("home.coreValuePropositions")}
                                      </Text>
                                      <List type="bullet">
                                        {brandIntelligence.core_value_props.map((v: string, i: number) => (
                                          <List.Item key={i}>{v}</List.Item>
                                        ))}
                                      </List>
                                    </BlockStack>
                                  )}

                                  {/* Cultural Touchpoints */}
                                  {Array.isArray(brandIntelligence.cultural_touchpoints) && brandIntelligence.cultural_touchpoints.length > 0 && (
                                    <BlockStack gap="100">
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        {t("home.culturalTouchpoints")}
                                      </Text>
                                      <List type="bullet">
                                        {brandIntelligence.cultural_touchpoints.map((t: string, i: number) => (
                                          <List.Item key={i}>{t}</List.Item>
                                        ))}
                                      </List>
                                    </BlockStack>
                                  )}

                                  {brandIntelligenceUpdatedAt && (
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      {t("home.intelligenceUpdated")}{" "}
                                      {new Date(brandIntelligenceUpdatedAt).toLocaleDateString(
                                        preferJapaneseBrandSoul ? "ja-JP" : undefined,
                                      )}
                                    </Text>
                                  )}
                                </BlockStack>
                              </Box>
                            </Collapsible>
                          </BlockStack>
                        )}
                      </BlockStack>
                    </Box>
                  </Collapsible>
                  <Button
                    variant="plain"
                    onClick={() => setBrandSoulCollapsed(!brandSoulCollapsed)}
                  >
                    {brandSoulCollapsed ? t("home.show") : t("home.hide")}
                  </Button>
                </>
              )}
            </BlockStack>
          </Box>
        </Card>

        {/* Onboarding Guide */}
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  {t("home.onboardingGuide")}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {t("home.gettingStartedDesc")}
                </Text>
              </BlockStack>

              <Button
                variant="secondary"
                onClick={() => setOnboardingModalOpen(true)}
              >
                {t("home.viewFullGuide")}
              </Button>
            </BlockStack>
          </Box>
        </Card>

      </BlockStack>

      {/* Modals */}
      <GetStartedGuide
        shop={shop}
        host={host}
        open={onboardingModalOpen}
        onClose={() => {
          setOnboardingModalOpen(false);
        }}
        onOpenBrandSoul={() => {
          setOnboardingModalOpen(false);
          setBrandWizardOpen(true);
        }}
      />

      <BrandSoulWizard
        open={brandWizardOpen}
        onClose={() => setBrandWizardOpen(false)}
        onComplete={() => {
          setBrandStatusState("running");
        }}
        backendApiUrl={backendApiUrl}
        planName={String(planName)}
      />
    </Page>
  );
}
