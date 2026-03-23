import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Box,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Banner,
  Divider,
  Select,
  TextField,
  Checkbox,
} from "@shopify/polaris";
import {
  PlusIcon,
  DeleteIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  ArrowLeftIcon,
} from "@shopify/polaris-icons";
import { PlanGateBadge } from "./PlanGateBadge";
import "../styles/optimize-button.css";

type PlanTier = "Free" | "Basic" | "Standard" | "Pro";

const TIER_RANK: Record<PlanTier, number> = {
  Free: 0,
  Basic: 1,
  Standard: 2,
  Pro: 3,
};

function tierMeetsMin(current: PlanTier, required: PlanTier): boolean {
  return TIER_RANK[current] >= TIER_RANK[required];
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  agent_name: string;
  has_gate: boolean;
  /** When set, the agent runs this specific template instead of its default */
  template_id?: string;
}

/** Extra context gathered from the wizard (Step 2) and passed to the backend */
export interface MissionExtraContext {
  /** Human-readable mission title (preset name or agent names joined by +) */
  mission_title?: string;
  blog_topic?: string;
  blog_category?: string;
  collection_name?: string;
  /** GID list of products selected for collection missions */
  product_ids?: string[];
}

interface ProductOption {
  id: string;
  title: string;
}

interface AgentDefinition {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: "success" | "info" | "attention" | "warning";
}

interface TemplateDefinition {
  displayName: string;
  icon: string;
  description: string;
  /** Which agent powers this template */
  agentName: string;
}

interface MissionArchitectProps {
  /** Available products for selection */
  products: ProductOption[];
  /** Currently selected product ID (GID) — managed by parent via URL params */
  selectedProductId: string;
  /** Called when user changes product — parent syncs to URL */
  onProductChange: (productId: string) => void;
  /** Callback when user clicks "Launch Mission" with the pipeline + extra context */
  onStartMission: (pipeline: WorkflowStep[], extraContext?: MissionExtraContext) => void;
  /** Callback when a bulk upload preset is selected */
  onBulkSelect?: (missionType: "text_only" | "full_launch") => void;
  /** Whether a mission is currently running */
  isRunning?: boolean;
  /** User's plan tier */
  planTier?: string;
  /** Plan entitlements from backend */
  entitlements?: Record<string, unknown>;
  /** Per-feature usage from backend */
  feature_usage?: Record<string, { used: number; limit: number }>;
}

// ─── Agent Library ──────────────────────────────────────────────────────────

export const AVAILABLE_AGENTS: AgentDefinition[] = [
  {
    name: "RewriterAgent",
    displayName: "Rewriter",
    description: "Rewrites product descriptions with brand voice and cultural adaptation",
    icon: "✍️",
    color: "success",
  },
  {
    name: "SEOAgent",
    displayName: "SEO",
    description: "Optimizes titles, descriptions, and analyzes CTR performance",
    icon: "🔍",
    color: "info",
  },
  {
    name: "MarketingAgent",
    displayName: "Marketing",
    description: "Creates social media hooks, captions, and seasonal campaigns",
    icon: "📣",
    color: "attention",
  },
  {
    name: "PriceScoutAgent",
    displayName: "PriceScout",
    description: "Analyzes competitor pricing and suggests optimal price points",
    icon: "💰",
    color: "warning",
  },
  {
    name: "ImageRefinementAgent",
    displayName: "Image Refinement",
    description: "AI product photo cleanup and background refinement (Pro)",
    icon: "✨",
    color: "info",
  },
  {
    name: "VisualMarketingAgent",
    displayName: "Visual Marketing",
    description: "Marketing ad and hero banner generation (Pro)",
    icon: "📸",
    color: "info",
  },
];

// ─── Template Definitions ───────────────────────────────────────────────────

export const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  "product/faq": {
    displayName: "Product FAQ",
    icon: "❓",
    description: "Generate FAQ from product details",
    agentName: "RewriterAgent",
  },
  "product/landing-hero": {
    displayName: "Hero Section",
    icon: "🏆",
    description: "Hero section copy for landing pages",
    agentName: "RewriterAgent",
  },
  "product/blog-post": {
    displayName: "Brand Blog Post",
    icon: "📝",
    description: "Blog about craft, manufacturing, etc.",
    agentName: "RewriterAgent",
  },
  "product/collection": {
    displayName: "Collection Description",
    icon: "📦",
    description: "Collection/category page copy",
    agentName: "RewriterAgent",
  },
  "marketing/email-launch": {
    displayName: "Launch Email",
    icon: "🚀",
    description: "Product launch announcement email",
    agentName: "MarketingAgent",
  },
  "marketing/email-abandoned": {
    displayName: "Abandoned Cart Email",
    icon: "🛒",
    description: "Cart recovery email",
    agentName: "MarketingAgent",
  },
  "marketing/email-welcome": {
    displayName: "Welcome Email",
    icon: "👋",
    description: "New subscriber welcome email",
    agentName: "MarketingAgent",
  },
  "marketing/ad-facebook": {
    displayName: "Facebook/IG Ad",
    icon: "📱",
    description: "Social media ad copy",
    agentName: "MarketingAgent",
  },
  "marketing/ad-google": {
    displayName: "Google Ads",
    icon: "🔎",
    description: "Search ad copy for Google",
    agentName: "MarketingAgent",
  },
  "visual/content-hero": {
    displayName: "Content Hero Image",
    icon: "🖼️",
    description: "Generate hero banner for blog or collection",
    agentName: "ContentHeroAgent",
  },
};

// ─── Helper: Get display info for a workflow step ───────────────────────────

export function getStepDisplayInfo(step: WorkflowStep): {
  displayName: string;
  icon: string;
  description: string;
  color: "success" | "info" | "attention" | "warning";
  isTemplate: boolean;
} {
  if (step.template_id && TEMPLATE_DEFINITIONS[step.template_id]) {
    const tmpl = TEMPLATE_DEFINITIONS[step.template_id];
    const agent = AVAILABLE_AGENTS.find((a) => a.name === tmpl.agentName);
    return {
      displayName: tmpl.displayName,
      icon: tmpl.icon,
      description: tmpl.description,
      color: agent?.color || "info",
      isTemplate: true,
    };
  }
  const agent = AVAILABLE_AGENTS.find((a) => a.name === step.agent_name);
  if (agent) {
    return {
      displayName: agent.displayName,
      icon: agent.icon,
      description: agent.description,
      color: agent.color,
      isTemplate: false,
    };
  }
  return {
    displayName: step.agent_name,
    icon: "🤖",
    description: "",
    color: "info",
    isTemplate: false,
  };
}

// ─── Context Types ──────────────────────────────────────────────────────────

type ContextType = "product" | "product_blog" | "product_hero" | "collection" | "bulk_csv" | "bulk_zip";

// ─── Presets ────────────────────────────────────────────────────────────────

interface Preset {
  label: string;
  icon: string;
  description: string;
  steps: WorkflowStep[];
  contextType: ContextType;
  minTier: PlanTier;
}

const PRESETS: Record<string, Preset> = {
  // ── Free: Rewriter + Marketing captions (3 lifetime missions) ──────
  social_hype_man: {
    label: "Social Hype-Man",
    icon: "📱",
    description:
      "Use Brand Soul-adapted description to feed a perfectly synced FB/IG ad",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/ad-facebook" },
    ],
    contextType: "product",
    minTier: "Free",
  },
  new_arrival_blast: {
    label: "New Arrival Blast",
    icon: "🎯",
    description:
      "Rewrite for Brand Soul alignment, then instantly generate launch email",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/email-launch" },
    ],
    contextType: "product",
    minTier: "Free",
  },
  welcome_journey: {
    label: "Welcome Journey",
    icon: "👋",
    description:
      "Use Brand Soul to ensure welcome email sounds like your store's personality",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/email-welcome" },
    ],
    contextType: "product",
    minTier: "Free",
  },
  artisan_storyteller: {
    label: "Artisan Storyteller",
    icon: "🏆",
    description:
      'Turn raw Japanese specs into a "Hero" section for US/Global audience',
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/landing-hero" },
    ],
    contextType: "product_hero",
    minTier: "Free",
  },

  // ── Standard: +SEO and Pricing missions ────────────────────────────
  competitor_rebuttal: {
    label: "Competitor Rebuttal",
    icon: "⚔️",
    description:
      'When a competitor is cheaper, use FAQ to explain the "Value Difference"',
    steps: [
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/faq" },
    ],
    contextType: "product",
    minTier: "Standard",
  },
  abandoned_cart_fix: {
    label: "Abandoned Cart Fix",
    icon: "🛒",
    description:
      'Use competitor price data to craft a "Quality vs. Discount" recovery email',
    steps: [
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/email-abandoned" },
    ],
    contextType: "product",
    minTier: "Standard",
  },
  seo_content_factory: {
    label: "SEO Content Factory",
    icon: "📝",
    description:
      "Use SEO analysis to write a blog post that ranks for important keywords",
    steps: [
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/blog-post" },
    ],
    contextType: "product_blog",
    minTier: "Standard",
  },
  collection_refresher: {
    label: "Collection Refresher",
    icon: "📦",
    description:
      "Select products, name your collection, and generate optimized SEO + description",
    steps: [
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/collection" },
    ],
    contextType: "collection",
    minTier: "Standard",
  },
  google_ads_shield: {
    label: "Google Ads Shield",
    icon: "🔎",
    description:
      "Use SEO keyword research to feed Google Ads for high-intent traffic",
    steps: [
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/ad-google" },
    ],
    contextType: "product",
    minTier: "Standard",
  },
  market_awareness_audit: {
    label: "Market Awareness Audit",
    icon: "📊",
    description:
      'Analyze if you\'re "Outpriced" or "Outranked" vs competitors',
    steps: [
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "SEOAgent", has_gate: true },
    ],
    contextType: "product",
    minTier: "Standard",
  },

  // ── Pro: All missions including visual ─────────────────────────────
  full_launch: {
    label: "Full Launch",
    icon: "🚀",
    description: "Full pipeline — rewrite, image refinement, SEO, pricing, marketing, and visual ads",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "ImageRefinementAgent", has_gate: true },
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true },
      { agent_name: "VisualMarketingAgent", has_gate: true },
    ],
    contextType: "product",
    minTier: "Pro",
  },
  visual_ad_blitz: {
    label: "Visual Ad Blitz",
    icon: "📸",
    description:
      "Generate social hooks then produce ready-to-post marketing ads and hero banners",
    steps: [
      { agent_name: "MarketingAgent", has_gate: true },
      { agent_name: "VisualMarketingAgent", has_gate: true },
    ],
    contextType: "product",
    minTier: "Pro",
  },
  bulk_text_only: {
    label: "Bulk Text Upload",
    icon: "📄",
    description:
      "Upload a CSV with up to 10 products — rewrite and SEO-optimize all at once",
    steps: [],
    contextType: "bulk_csv",
    minTier: "Pro",
  },
  bulk_full_launch: {
    label: "Bulk Full Launch",
    icon: "📦",
    description:
      "Upload a ZIP with products and images — rewrite, refine images, and SEO-optimize",
    steps: [],
    contextType: "bulk_zip",
    minTier: "Pro",
  },
};

// ─── Mission Card ───────────────────────────────────────────────────────────

function MissionCard({
  icon,
  label,
  description,
  onClick,
  isCustom,
  minTier,
  currentTier,
}: {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
  isCustom?: boolean;
  minTier?: PlanTier;
  currentTier: PlanTier;
}) {
  const { t } = useTranslation("missions");
  const isLocked = !!minTier && !tierMeetsMin(currentTier, minTier);

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={(e) => !isLocked && e.key === "Enter" && onClick()}
      style={{
        padding: "20px",
        borderRadius: "12px",
        border: `2px solid ${
          isCustom
            ? "var(--p-color-border-emphasis)"
            : isLocked
              ? "var(--p-color-border-caution)"
              : "var(--p-color-border)"
        }`,
        background: isLocked
          ? "var(--p-color-bg-surface-disabled)"
          : isCustom
            ? "var(--p-color-bg-surface-secondary)"
            : "var(--p-color-bg-surface)",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.65 : 1,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (isLocked) return;
        e.currentTarget.style.borderColor = "var(--p-color-border-emphasis)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        if (isLocked) return;
        e.currentTarget.style.borderColor = isCustom
          ? "var(--p-color-border-emphasis)"
          : isLocked
            ? "var(--p-color-border-caution)"
            : "var(--p-color-border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <BlockStack gap="200">
        <InlineStack gap="200" blockAlign="center" wrap={false}>
          <Text as="span" variant="headingXl">
            {icon}
          </Text>
          <Text as="h3" variant="headingSm" fontWeight="bold">
            {label}
          </Text>
          {/* Badge intentionally removed for cleaner UX */}
        </InlineStack>
        <Text as="p" variant="bodySm" tone="subdued">
          {isLocked
            ? t("upgradeToUnlock", { tier: minTier })
            : description}
        </Text>
      </BlockStack>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MissionArchitect({
  products,
  selectedProductId,
  onProductChange,
  onStartMission,
  onBulkSelect,
  isRunning = false,
  planTier = "Basic",
  entitlements,
}: MissionArchitectProps) {
  const { t } = useTranslation("missions");
  const currentTier = (["Free", "Basic", "Standard", "Pro"].includes(planTier) ? planTier : "Free") as PlanTier;

  const agentLabel = (name: string) => {
    const map: Record<string, string> = {
      RewriterAgent: t("agentRewriter"),
      SEOAgent: t("agentSeo"),
      MarketingAgent: t("agentMarketing"),
      PriceScoutAgent: t("agentPriceScout"),
      ImageRefinementAgent: t("agentImageRefinement"),
      VisualMarketingAgent: t("agentVisualMarketing"),
    };
    return map[name] || name;
  };

  const agentDesc = (name: string) => {
    const map: Record<string, string> = {
      RewriterAgent: t("agentRewriterDesc"),
      SEOAgent: t("agentSeoDesc"),
      MarketingAgent: t("agentMarketingDesc"),
      PriceScoutAgent: t("agentPriceScoutDesc"),
      ImageRefinementAgent: t("agentImageRefinementDesc"),
      VisualMarketingAgent: t("agentVisualMarketingDesc"),
    };
    return map[name] || "";
  };

  const presetLabel = (key: string) => {
    const map: Record<string, string> = {
      social_hype_man: t("socialHypeMan"),
      new_arrival_blast: t("newArrivalBlast"),
      welcome_journey: t("welcomeJourney"),
      artisan_storyteller: t("artisanStoryteller"),
      competitor_rebuttal: t("competitorRebuttal"),
      abandoned_cart_fix: t("abandonedCartFix"),
      seo_content_factory: t("seoContentFactory"),
      collection_refresher: t("collectionRefresher"),
      google_ads_shield: t("googleAdsShield"),
      market_awareness_audit: t("marketAwarenessAudit"),
      full_launch: t("fullLaunch"),
      visual_ad_blitz: t("visualAdBlitz"),
      bulk_text_only: t("bulkTextOnly"),
      bulk_full_launch: t("bulkFullLaunch"),
    };
    return map[key] || key;
  };

  const presetDesc = (key: string) => {
    const map: Record<string, string> = {
      social_hype_man: t("socialHypeManDesc"),
      new_arrival_blast: t("newArrivalBlastDesc"),
      welcome_journey: t("welcomeJourneyDesc"),
      artisan_storyteller: t("artisanStorytellerDesc"),
      competitor_rebuttal: t("competitorRebuttalDesc"),
      abandoned_cart_fix: t("abandonedCartFixDesc"),
      seo_content_factory: t("seoContentFactoryDesc"),
      collection_refresher: t("collectionRefresherDesc"),
      google_ads_shield: t("googleAdsShieldDesc"),
      market_awareness_audit: t("marketAwarenessAuditDesc"),
      full_launch: t("fullLaunchDesc"),
      visual_ad_blitz: t("visualAdBlitzDesc"),
      bulk_text_only: t("bulkTextOnlyDesc"),
      bulk_full_launch: t("bulkFullLaunchDesc"),
    };
    return map[key] || "";
  };

  const templateLabel = (templateId: string) => {
    const map: Record<string, string> = {
      "product/faq": t("tplProductFaq"),
      "product/landing-hero": t("tplHeroSection"),
      "product/blog-post": t("tplBlogPost"),
      "product/collection": t("tplCollection"),
      "marketing/email-launch": t("tplLaunchEmail"),
      "marketing/email-abandoned": t("tplAbandonedCart"),
      "marketing/email-welcome": t("tplWelcomeEmail"),
      "marketing/ad-facebook": t("tplFacebookAd"),
      "marketing/ad-google": t("tplGoogleAds"),
      "visual/content-hero": t("tplContentHero"),
    };
    return map[templateId] || templateId;
  };

  const templateDesc = (templateId: string) => {
    const map: Record<string, string> = {
      "product/faq": t("tplProductFaqDesc"),
      "product/landing-hero": t("tplHeroSectionDesc"),
      "product/blog-post": t("tplBlogPostDesc"),
      "product/collection": t("tplCollectionDesc"),
      "marketing/email-launch": t("tplLaunchEmailDesc"),
      "marketing/email-abandoned": t("tplAbandonedCartDesc"),
      "marketing/email-welcome": t("tplWelcomeEmailDesc"),
      "marketing/ad-facebook": t("tplFacebookAdDesc"),
      "marketing/ad-google": t("tplGoogleAdsDesc"),
      "visual/content-hero": t("tplContentHeroDesc"),
    };
    return map[templateId] || "";
  };

  // ── Wizard state ────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedMissionKey, setSelectedMissionKey] = useState<string>("");
  const [pipeline, setPipeline] = useState<WorkflowStep[]>([]);

  // Blog context
  const [blogTopic, setBlogTopic] = useState("");
  const [blogCategory, setBlogCategory] = useState("");

  // Collection context
  const [collectionName, setCollectionName] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Derived
  const isCustom = selectedMissionKey === "custom";
  const preset = !isCustom ? PRESETS[selectedMissionKey] : null;
  const contextType: ContextType = isCustom
    ? "product"
    : preset?.contextType || "product";

  // ── Mission selection (Step 1 → Step 2) ─────────────────────────────────

  const handleMissionSelect = useCallback(
    (key: string) => {
      // Bulk presets are handled by the parent via onBulkSelect
      if (key === "bulk_text_only" && onBulkSelect) {
        onBulkSelect("text_only");
        return;
      }
      if (key === "bulk_full_launch" && onBulkSelect) {
        onBulkSelect("full_launch");
        return;
      }

      setSelectedMissionKey(key);
      if (key === "custom") {
        setPipeline([]);
      } else if (PRESETS[key]) {
        setPipeline([...PRESETS[key].steps]);
      }
      setWizardStep(2);
    },
    [onBulkSelect],
  );

  const handleBack = useCallback(() => {
    setWizardStep(1);
    setSelectedMissionKey("");
    setPipeline([]);
    setBlogTopic("");
    setBlogCategory("");
    setCollectionName("");
    setSelectedProductIds([]);
  }, []);

  // ── Custom pipeline manipulation ────────────────────────────────────────

  const addAgent = useCallback((agentName: string) => {
    setPipeline((prev) => [
      ...prev,
      { agent_name: agentName, has_gate: true },
    ]);
  }, []);

  const removeStep = useCallback((index: number) => {
    setPipeline((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveStep = useCallback((index: number, direction: "up" | "down") => {
    setPipeline((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  // ── Collection product toggle ───────────────────────────────────────────

  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  // ── Launch ──────────────────────────────────────────────────────────────

  const handleLaunch = useCallback(() => {
    if (pipeline.length === 0) return;

    // Compute a human-readable mission title
    let missionTitle: string;
    if (isCustom) {
      // Deduplicate agent names and join with " + "
      const agentNames = pipeline.map((step) => {
        const agent = AVAILABLE_AGENTS.find((a) => a.name === step.agent_name);
        return agent?.displayName || step.agent_name;
      });
      const unique = [...new Set(agentNames)];
      missionTitle = unique.join(" + ");
    } else if (preset) {
      missionTitle = `${preset.icon} ${preset.label}`;
    } else {
      missionTitle = "Mission";
    }

    const ctx: MissionExtraContext = { mission_title: missionTitle };
    if (blogTopic) ctx.blog_topic = blogTopic;
    if (blogCategory) ctx.blog_category = blogCategory;
    if (collectionName) ctx.collection_name = collectionName;
    if (selectedProductIds.length > 0) ctx.product_ids = selectedProductIds;
    onStartMission(pipeline, ctx);
  }, [
    pipeline,
    isCustom,
    preset,
    blogTopic,
    blogCategory,
    collectionName,
    selectedProductIds,
    onStartMission,
  ]);

  // ── Can launch? ─────────────────────────────────────────────────────────

  const canLaunch =
    pipeline.length > 0 &&
    !isRunning &&
    (contextType === "collection"
      ? selectedProductIds.length > 0 && collectionName.trim().length > 0
      : !!selectedProductId) &&
    (contextType === "product_blog" ? blogTopic.trim().length > 0 : true);

  // ── Product dropdown options ────────────────────────────────────────────

  const productOptions = [
    { label: t("chooseProduct"), value: "" },
    ...products.map((p) => ({ label: p.title, value: p.id })),
  ];

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 1: Choose Your Mission
  // ═════════════════════════════════════════════════════════════════════════

  if (wizardStep === 1) {
    return (
      <Card>
        <Box padding="500">
          <BlockStack gap="500">
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="headingXl">
                  🎯
                </Text>
                <Text as="h2" variant="headingLg">
                  {t("chooseYourMission")}
                </Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {t("pickReadyMade")}
              </Text>
            </BlockStack>

            <Divider />

            {/* Mission cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              {Object.entries(PRESETS).map(([key, p]) => (
                <MissionCard
                  key={key}
                  icon={p.icon}
                  label={presetLabel(key)}
                  description={presetDesc(key)}
                  onClick={() => handleMissionSelect(key)}
                  minTier={p.minTier}
                  currentTier={currentTier}
                />
              ))}

              {/* Custom Mission card */}
              <MissionCard
                icon="🛠️"
                label={t("customMission")}
                description={t("customMissionDesc")}
                onClick={() => handleMissionSelect("custom")}
                isCustom
                currentTier={currentTier}
              />
            </div>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 2: Configure & Launch
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="500">
          {/* ── Header with Back ────────────────────────────────────── */}
          <InlineStack gap="300" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="plain"
              onClick={handleBack}
              disabled={isRunning}
              accessibilityLabel={t("backToMissions")}
            />
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="headingXl">
                {isCustom ? "🛠️" : preset?.icon}
              </Text>
            <Text as="h2" variant="headingLg">
                {isCustom ? t("customMission") : preset ? presetLabel(selectedMissionKey) : ""}
            </Text>
            </InlineStack>
          </InlineStack>

          {!isCustom && preset && (
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                {presetDesc(selectedMissionKey)}
            </Text>
            </Banner>
          )}

          <Divider />

          {/* ── Product Selector (non-collection modes) ──────────── */}
          {contextType !== "collection" && (
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                {t("selectProduct")}
                </Text>
              <Select
                label={t("product")}
                labelHidden
                options={productOptions}
                value={selectedProductId}
                onChange={onProductChange}
                disabled={isRunning}
              />
              {!selectedProductId && (
                <Banner tone="warning">
                  <Text as="p" variant="bodySm">
                    {t("pleaseSelectProduct")}
                  </Text>
                </Banner>
              )}
            </BlockStack>
          )}

          {/* ── Blog Context (SEO Content Factory) ───────────────── */}
          {contextType === "product_blog" && (
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                {t("blogDetails")}
              </Text>
              <TextField
                label={t("blogTopic")}
                placeholder={t("blogTopicPlaceholder")}
                value={blogTopic}
                onChange={setBlogTopic}
                autoComplete="off"
                helpText={t("blogTopicHelp")}
              />
              <TextField
                label={t("category")}
                placeholder={t("categoryPlaceholder")}
                value={blogCategory}
                onChange={setBlogCategory}
                autoComplete="off"
                helpText={t("categoryHelp")}
              />
            </BlockStack>
          )}

          {/* ── Hero Context (Artisan Storyteller) ───────────────── */}
          {contextType === "product_hero" && (
            <BlockStack gap="200">
              <Banner tone="info">
                <Text as="p" variant="bodySm">
                  {t("heroContextInfo")}
            </Text>
              </Banner>
            </BlockStack>
          )}

          {/* ── Collection Context ───────────────────────────────── */}
          {contextType === "collection" && (
            <BlockStack gap="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  {t("collectionDetails")}
                </Text>
                <TextField
                  label={t("collectionName")}
                  placeholder={t("collectionNamePlaceholder")}
                  value={collectionName}
                  onChange={setCollectionName}
                  autoComplete="off"
                />
              </BlockStack>

              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">
                    {t("selectProducts")}
                  </Text>
                  <Badge
                    tone={selectedProductIds.length > 0 ? "success" : "attention"}
                  >
                    {t("nSelected", { count: selectedProductIds.length })}
                  </Badge>
                </InlineStack>

                <div
                  style={{
                    maxHeight: "280px",
                    overflowY: "auto",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "var(--p-color-bg-surface-secondary)",
                    border: "1px solid var(--p-color-border)",
                  }}
                >
                  <BlockStack gap="200">
                    {products.map((p) => (
                      <Checkbox
                        key={p.id}
                        label={p.title}
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => toggleProductSelection(p.id)}
                      />
                    ))}
                    {products.length === 0 && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t("noProductsAvailable")}
                      </Text>
                    )}
                  </BlockStack>
                </div>

                {selectedProductIds.length === 0 && (
                  <Banner tone="warning">
                    <Text as="p" variant="bodySm">
                      {t("selectAtLeastOne")}
                    </Text>
                  </Banner>
                )}
              </BlockStack>
            </BlockStack>
          )}

          {/* ── Custom Mission: Agent Builder ────────────────────── */}
          {isCustom && (
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                {t("addAgents")}
                </Text>
                <InlineStack gap="300" wrap>
                  {AVAILABLE_AGENTS
                    .filter((agent) => {
                      if (["ImageRefinementAgent", "VisualMarketingAgent"].includes(agent.name))
                        return tierMeetsMin(currentTier, "Pro");
                      if (["SEOAgent", "PriceScoutAgent"].includes(agent.name))
                        return tierMeetsMin(currentTier, "Standard");
                      return tierMeetsMin(currentTier, "Basic");
                    })
                    .map((agent) => (
                    <div key={agent.name} style={{ minWidth: "160px" }}>
                      <Button
                        onClick={() => addAgent(agent.name)}
                        disabled={isRunning}
                        size="medium"
                        icon={PlusIcon}
                        fullWidth
                      >
                        {agent.icon} {agentLabel(agent.name)}
                      </Button>
                    </div>
                  ))}
                </InlineStack>
              </BlockStack>
          )}

          <Divider />

          {/* ── Pipeline Preview ─────────────────────────────────── */}
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                {t("pipeline")}
              </Text>
              {pipeline.length > 0 && (
                <Badge tone="success">
                  {t("nSteps", { count: pipeline.length })}
                </Badge>
              )}
            </InlineStack>

            {pipeline.length === 0 ? (
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <Text
                  as="p"
                  variant="bodyMd"
                  tone="subdued"
                  alignment="center"
                >
                  {isCustom
                    ? t("addAgentsToBuild")
                    : t("noStepsConfigured")}
                  </Text>
              </Box>
            ) : (
              <BlockStack gap="200">
                {pipeline.map((step, index) => {
                  const info = getStepDisplayInfo(step);
                  return (
                    <Box
                      key={`${step.agent_name}-${step.template_id || ""}-${index}`}
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                        gap="200"
                      >
                        {/* Step info */}
                        <InlineStack gap="300" blockAlign="center">
                          <BlockStack gap="050">
                            <InlineStack gap="100" blockAlign="center">
                              <Text
                                as="span"
                                variant="bodyMd"
                                fontWeight="semibold"
                              >
                                {info.icon}{" "}
                                {info.isTemplate && step.template_id
                                  ? templateLabel(step.template_id)
                                  : agentLabel(step.agent_name)}
                              </Text>
                              {info.isTemplate && (
                                <Badge tone="info" size="small">
                                  {t("template")}
                                </Badge>
                              )}
                            </InlineStack>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {info.isTemplate && step.template_id
                                ? templateDesc(step.template_id)
                                : agentDesc(step.agent_name)}
                            </Text>
                          </BlockStack>
                        </InlineStack>

                        {/* Controls — only for custom missions */}
                        {isCustom && (
                        <InlineStack gap="200" blockAlign="center">
                          <InlineStack gap="100">
                            <Button
                              icon={ArrowUpIcon}
                              size="slim"
                              variant="plain"
                              onClick={() => moveStep(index, "up")}
                              disabled={index === 0 || isRunning}
                              accessibilityLabel={t("moveUp")}
                            />
                            <Button
                              icon={ArrowDownIcon}
                              size="slim"
                              variant="plain"
                              onClick={() => moveStep(index, "down")}
                                disabled={
                                  index === pipeline.length - 1 || isRunning
                                }
                              accessibilityLabel={t("moveDown")}
                            />
                          </InlineStack>
                          <Button
                            icon={DeleteIcon}
                            size="slim"
                            variant="plain"
                            tone="critical"
                            onClick={() => removeStep(index)}
                            disabled={isRunning}
                            accessibilityLabel={t("removeStep")}
                          />
                        </InlineStack>
                        )}
                      </InlineStack>
                    </Box>
                  );
                })}
              </BlockStack>
            )}
          </BlockStack>

          {/* ── Launch Button ─────────────────────────────────────── */}
            <Box paddingBlockStart="200">
              <div className="aiOptimizeCenter">
                <div className="aiOptimizeWrap">
                  <div className="aiOptimizeInner">
                    <Button
                      variant="primary"
                      size="large"
                    onClick={handleLaunch}
                    disabled={!canLaunch}
                      loading={isRunning}
                      fullWidth
                      icon={PlayIcon}
                    >
                    {t("launchMission", { count: pipeline.length })}
                    </Button>
                  </div>
                </div>
              </div>
            </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}

export { PRESETS };
export type { MissionArchitectProps, ProductOption, MissionExtraContext as ExtraContext, ContextType };
