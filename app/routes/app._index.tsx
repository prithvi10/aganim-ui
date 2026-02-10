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
  FooterHelp,
  ProgressBar,
  Icon,
  Spinner,
  List,
} from "@shopify/polaris";
import "../styles/optimize-button.css";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { GetStartedGuide } from "../components/GetStartedGuide";
import { BrandSoulWizard } from "../components/BrandSoulWizard";
import {
  StarIcon,
  EditIcon,
  CodeIcon,
  SearchIcon,
  SocialAdIcon,
  ChartVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";
  const backendApiUrl =
    process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";

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

  try {
    const u = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shopParam)}`);
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      const eff = String(data?.effective_plan_name || data?.plan_name || "").trim();
      if (eff) planName = eff;
    }
  } catch {
    // best-effort
  }

  try {
    const s = await fetch(`${backendApiUrl}/api/admin/brand-context/status?shop=${encodeURIComponent(shopParam)}`);
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
      `${backendApiUrl}/api/admin/brand-intelligence?shop=${encodeURIComponent(shopParam)}`,
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
    shop: shopParam,
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
  };
};

export default function LandingPage() {
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
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [brandWizardOpen, setBrandWizardOpen] = useState(false);
  const [brandSoulCollapsed, setBrandSoulCollapsed] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
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
  const themeEditorUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/themes/current/editor?context=apps`
    : "https://admin.shopify.com/";

  const optimizeUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/optimize`
    : "https://admin.shopify.com/";

  // Navigation helper to preserve query params
  const nav = useCallback(
    (path: string) => {
      const params = new URLSearchParams();
      if (host) params.set("host", host);
      if (shop) params.set("shop", shop);
      const qs = params.toString();
      return qs ? `${path}?${qs}` : path;
    },
    [host, shop],
  );

  // Auto-launch onboarding modal if not seen
  useEffect(() => {
    const seen = localStorage.getItem("onboarding_seen");
    if (!seen) {
      // Trigger the GetStartedGuide modal by simulating a click
      // We'll use a ref or trigger it via the component's internal state
      // For now, we'll just set a flag and the guide will handle it
      setOnboardingModalOpen(true);
    }
  }, []);

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

  const displayBrandSummary = useMemo(() => {
    return brandSummaryEnState || brandSummaryJaState || brandSummaryLegacyState;
  }, [brandSummaryEnState, brandSummaryJaState, brandSummaryLegacyState]);

  const displayKeyFacts = useMemo(() => {
    return brandKeyFactsEnState.length
      ? brandKeyFactsEnState
      : brandKeyFactsJaState.length
        ? brandKeyFactsJaState
        : brandKeyFactsState;
  }, [brandKeyFactsEnState, brandKeyFactsJaState, brandKeyFactsState]);

  const isBrandSoulActive = useMemo(() => {
    return (brandStatusState === "ready" || brandStatusState === "completed") && !!displayBrandSummary;
  }, [brandStatusState, displayBrandSummary]);

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

  // Calculate onboarding progress (example: 40%)
  const onboardingProgress = 40;

  // Getting started checklist items
  const onboardingSteps = [
    { id: "soul", label: "Define Soul", completed: isBrandSoulActive },
    { id: "optimize", label: "Optimize First Product", completed: false },
    { id: "theme", label: "Configure Theme", completed: false },
    { id: "review", label: "Review Results", completed: false },
  ];


  return (
    <Page fullWidth>
      <BlockStack gap="500">
        {/* App Header with Logo */}
          <Card>
          <Box padding="400">
                  <InlineStack align="start" blockAlign="center" gap="400">
                    <img
                      src="/Icon-final.png"
                alt="Cross-Border AI"
                      style={{ width: 56, height: 56 }}
                    />
                    <BlockStack gap="100">
                      <Text as="h1" variant="headingXl">
                  Cross-Border AI
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                  Transform product info into a world-class marketing copy.
                      </Text>
                    </BlockStack>
                  </InlineStack>
          </Box>
        </Card>
        {/* Getting Started Guide */}
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  Getting Started
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Complete these steps to unlock the full power of Cross-Border AI.
                  </Text>
              </BlockStack>

              <ProgressBar progress={onboardingProgress} size="medium" />

                  <BlockStack gap="200">
                {onboardingSteps.map((step) => (
                  <InlineStack key={step.id} align="space-between" blockAlign="center">
                    <Text as="p" variant="bodyMd">
                      {step.label}
                    </Text>
                    <Text as="p" variant="bodySm" tone={step.completed ? "success" : "subdued"}>
                      {step.completed ? "✓" : "○"}
                    </Text>
                  </InlineStack>
                ))}
              </BlockStack>

                    <Button
                variant="secondary"
                onClick={() => setOnboardingModalOpen(true)}
              >
                View Full Guide
                    </Button>
                  </BlockStack>
          </Box>
          </Card>

        {/* Brand Soul Identity Bar */}
            <Card>
          <Box padding="400" background="bg-surface-secondary">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                <InlineStack align="start" gap="200" blockAlign="center">
                  <Text as="h2" variant="headingLg">
                        Brand Soul
                      </Text>
                  {brandStatusIcon}
                </InlineStack>
                    <Button variant="primary" onClick={() => setBrandWizardOpen(true)}>
                  Edit Identity
                    </Button>
                  </InlineStack>

              {brandStatusState === "running" || brandStatusState === "accepted" ? (
                    <Banner tone="info">
                      Generating brand intelligence… please check after a while.
                    </Banner>
                  ) : null}
              {brandStatusState === "failed" && (
                    <Banner tone="critical">
                      Brand intelligence failed. Please retry in the wizard.
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
                        <Text as="p" variant="bodySm" tone="subdued">
                          Latest summary
                        </Text>
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
                        {displayKeyFacts.length > 0 && (
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">
                              Key facts
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
                            Updated: {new Date(brandUpdatedState).toLocaleDateString()}
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
                              {intelligenceOpen ? "▾ Hide Brand Intelligence" : "▸ Show Brand Intelligence"}
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
                                      Brand Archetype
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
                                        Secondary: {String(brandIntelligence.secondary_archetype)
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
                                        Tonal Guardrails
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
                                        Power Words
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
                                        Banned Phrases
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
                                        Core Value Propositions
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
                                        Cultural Touchpoints
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
                                      Intelligence updated: {new Date(brandIntelligenceUpdatedAt).toLocaleDateString()}
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
                    {brandSoulCollapsed ? "Show" : "Hide"}
                  </Button>
                </>
              )}
            </BlockStack>
          </Box>
        </Card>

        {/* Features Grid */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Features
          </Text>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            {/* Card 1: Complete Optimization */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      Complete Optimization
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={StarIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Run all (Rewriter → SEO → Marketing → Pricing)
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
                        Open
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
                      Product rewriter, content templates, and AI writing tools.
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-2">
                    <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/writing-studio"))}
                    >
                        Open
                    </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 3: Theme Editor */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      Theme Editor
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={CodeIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Configure theme settings and widget placement.
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-3">
                      <Button
                        variant="primary"
                        onClick={() => window.open(themeEditorUrl, "_top")}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 4: Price Scout */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      Price Scout
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={SearchIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Analyze competitor pricing and optimize your product prices.
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-4">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/pricing"))}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>

            {/* Card 5: Marketing Agent */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      Marketing Agent
                    </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={SocialAdIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Generate social hooks and marketing copy for your products.
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-5">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/marketing"))}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
          </Card>

            {/* Card 6: SEO Manager */}
            <Card>
              <Box padding="500" background="bg-surface-secondary">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h3" variant="headingLg">
                      SEO Manager
                      </Text>
                    <div style={{ width: "48px", height: "48px", marginRight: "-4px", marginTop: "-8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ transform: "scale(1.5)" }}>
                        <Icon source={ChartVerticalIcon} tone="base" />
                      </div>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "-12px" }}>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Optimize SEO titles, descriptions, and alt text.
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="feature-btn-glow-6">
                      <Button
                        variant="primary"
                        onClick={() => navigate(nav("/app/seo"))}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>
        </BlockStack>

        {/* Footer */}
        <FooterHelp>
          <a href="https://support.example.com" target="_blank" rel="noopener noreferrer">
            Contact Support
          </a>{" "}
          or{" "}
          <a href="https://guide.example.com" target="_blank" rel="noopener noreferrer">
            Read the Guide
          </a>
        </FooterHelp>
          </BlockStack>

      {/* Modals */}
      <GetStartedGuide
        shop={shop}
        host={host}
        open={onboardingModalOpen}
        onClose={() => {
          setOnboardingModalOpen(false);
          localStorage.setItem("onboarding_seen", "true");
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
