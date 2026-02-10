import { useState, useCallback } from "react";
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
} from "@shopify/polaris";
import {
  PlusIcon,
  DeleteIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
} from "@shopify/polaris-icons";
import "../styles/optimize-button.css";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  agent_name: string;
  has_gate: boolean;
  /** When set, the agent runs this specific template instead of its default */
  template_id?: string;
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
  /** Callback when user clicks "Start Mission" with the pipeline config */
  onStartMission: (workflowConfig: WorkflowStep[]) => void;
  /** Whether a mission is currently running */
  isRunning?: boolean;
  /** User's plan tier */
  planTier?: string;
  /** Whether to show the product selector inside this component */
  showProductSelector?: boolean;
  /** Callback when pipeline changes — lets parent track the current pipeline */
  onPipelineChange?: (pipeline: WorkflowStep[]) => void;
  /** Hide the "Start Mission" button (parent renders its own) */
  hideStartButton?: boolean;
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
];

// ─── Template Definitions ───────────────────────────────────────────────────

export const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  "product/faq": {
    displayName: "Product FAQ",
    icon: "❓",
    description: "Generate FAQ from product details",
    agentName: "RewriterAgent",
  },
  "product/collection": {
    displayName: "Collection Description",
    icon: "📦",
    description: "Collection/category page copy",
    agentName: "RewriterAgent",
  },
  "product/landing-hero": {
    displayName: "Landing Page Hero",
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
};

// ─── Helper: Get display info for a workflow step ───────────────────────────

export function getStepDisplayInfo(step: WorkflowStep): {
  displayName: string;
  icon: string;
  description: string;
  color: "success" | "info" | "attention" | "warning";
  isTemplate: boolean;
} {
  // Template step
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
  // Agent step
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

// ─── Presets ────────────────────────────────────────────────────────────────

interface Preset {
  label: string;
  description: string;
  steps: WorkflowStep[];
}

const PRESETS: Record<string, Preset> = {
  full_launch: {
    label: "🚀 Full Launch",
    description: "All 4 agents with human approval at every step",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true },
      { agent_name: "PriceScoutAgent", has_gate: true },
    ],
  },
  competitor_rebuttal: {
    label: "⚔️ The Competitor Rebuttal",
    description: 'When a competitor is cheaper, use FAQ to explain the "Value Difference"',
    steps: [
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/faq" },
    ],
  },
  social_hype_man: {
    label: "📱 The Social Hype-Man",
    description: "Use Brand Soul-adapted description to feed a perfectly synced FB/IG ad",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/ad-facebook" },
    ],
  },
  abandoned_cart_fix: {
    label: "🛒 The Abandoned Cart Fix",
    description: 'Use competitor price data to craft a "Quality vs. Discount" recovery email',
    steps: [
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/email-abandoned" },
    ],
  },
  seo_content_factory: {
    label: "📝 The SEO Content Factory",
    description: "Use SEO analysis to write a blog post that ranks for important keywords",
    steps: [
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/blog-post" },
    ],
  },
  artisan_storyteller: {
    label: "🏆 The Artisan Storyteller",
    description: 'Turn raw Japanese specs into a "Hero" section for US/Global audience',
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/landing-hero" },
    ],
  },
  new_arrival_blast: {
    label: '🎯 The "New Arrival" Blast',
    description: "Rewrite for Brand Soul alignment, then instantly generate launch email",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/email-launch" },
    ],
  },
  collection_refresher: {
    label: "📦 The Collection Refresher",
    description: "Optimize SEO and rewrite collection description for better CTR",
    steps: [
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "RewriterAgent", has_gate: true, template_id: "product/collection" },
    ],
  },
  google_ads_shield: {
    label: "🔎 The Google Ads Shield",
    description: "Use SEO keyword research to feed Google Ads for high-intent traffic",
    steps: [
      { agent_name: "SEOAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/ad-google" },
    ],
  },
  welcome_journey: {
    label: "👋 The Welcome Journey",
    description: "Use Brand Soul to ensure welcome email sounds like your store's personality",
    steps: [
      { agent_name: "RewriterAgent", has_gate: true },
      { agent_name: "MarketingAgent", has_gate: true, template_id: "marketing/email-welcome" },
    ],
  },
  market_awareness_audit: {
    label: '📊 The Market Awareness Audit',
    description: 'Analyze if you\'re "Outpriced" or "Outranked" vs competitors',
    steps: [
      { agent_name: "PriceScoutAgent", has_gate: true },
      { agent_name: "SEOAgent", has_gate: true },
    ],
  },
};

// ─── Template options for manual "Add Template" ─────────────────────────────

const TEMPLATE_ADD_OPTIONS = Object.entries(TEMPLATE_DEFINITIONS).map(([id, tmpl]) => ({
  label: `${tmpl.icon} ${tmpl.displayName}`,
  value: id,
}));

// ─── Component ──────────────────────────────────────────────────────────────

export function MissionArchitect({
  onStartMission,
  isRunning = false,
  planTier = "Basic",
  onPipelineChange,
  hideStartButton = false,
}: MissionArchitectProps) {
  const [pipeline, setPipeline] = useState<WorkflowStep[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Notify parent whenever pipeline changes
  const updatePipeline = useCallback(
    (updater: WorkflowStep[] | ((prev: WorkflowStep[]) => WorkflowStep[])) => {
      setPipeline((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onPipelineChange?.(next);
        return next;
      });
    },
    [onPipelineChange],
  );

  // ── Preset handling ─────────────────────────────────────────────────────

  const handlePresetChange = useCallback((value: string) => {
    setSelectedPreset(value);
    if (value && PRESETS[value]) {
      updatePipeline([...PRESETS[value].steps]);
    }
  }, [updatePipeline]);

  // ── Pipeline manipulation ─────────────────────────────────────────────

  const addAgent = useCallback((agentName: string) => {
    updatePipeline((prev) => [...prev, { agent_name: agentName, has_gate: true }]);
    setSelectedPreset(""); // Clear preset when manually editing
  }, [updatePipeline]);

  const addTemplate = useCallback((templateId: string) => {
    const tmpl = TEMPLATE_DEFINITIONS[templateId];
    if (!tmpl) return;
    updatePipeline((prev) => [
      ...prev,
      { agent_name: tmpl.agentName, has_gate: true, template_id: templateId },
    ]);
    setSelectedPreset("");
    setSelectedTemplate("");
  }, [updatePipeline]);

  const removeStep = useCallback((index: number) => {
    updatePipeline((prev) => prev.filter((_, i) => i !== index));
    setSelectedPreset("");
  }, [updatePipeline]);

  const moveStep = useCallback((index: number, direction: "up" | "down") => {
    updatePipeline((prev) => {
      const newPipeline = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newPipeline.length) return prev;
      [newPipeline[index], newPipeline[targetIndex]] = [newPipeline[targetIndex], newPipeline[index]];
      return newPipeline;
    });
    setSelectedPreset("");
  }, [updatePipeline]);

  // ── Start Mission ─────────────────────────────────────────────────────

  const handleStartMission = useCallback(() => {
    if (pipeline.length === 0) return;
    onStartMission(pipeline);
  }, [pipeline, onStartMission]);

  // ── Preset options ────────────────────────────────────────────────────

  const presetOptions = [
    { label: "Choose a preset...", value: "" },
    ...Object.entries(PRESETS).map(([key, preset]) => ({
      label: preset.label,
      value: key,
    })),
  ];

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="500">
          {/* Header */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">
              Mission Architect
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Choose a ready-made preset or build a fully custom pipeline from scratch.
            </Text>
          </BlockStack>

          <Divider />

          {/* ────────────── OPTION A: Mission Presets ─────────────────────── */}
          <Box
            padding="400"
            background="bg-surface-secondary"
            borderRadius="300"
          >
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="headingMd">🎯</Text>
                <BlockStack gap="050">
                  <Text as="h3" variant="headingMd" fontWeight="bold">
                    Quick Start — Mission Presets
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Pre-built agent + template chains for common use cases. Pick one and go.
                  </Text>
                </BlockStack>
              </InlineStack>
              <Select
                label="Preset"
                labelHidden
                options={presetOptions}
                value={selectedPreset}
                onChange={handlePresetChange}
                disabled={isRunning}
              />
              {selectedPreset && PRESETS[selectedPreset] && (
                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    {PRESETS[selectedPreset].description}
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </Box>

          {/* ────────────── OR Divider ────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--p-color-border-secondary)" }} />
            <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
              OR
            </Text>
            <div style={{ flex: 1, height: "1px", background: "var(--p-color-border-secondary)" }} />
          </div>

          {/* ────────────── OPTION B: Custom Mission ─────────────────────── */}
          <Box
            padding="400"
            background="bg-surface-secondary"
            borderRadius="300"
          >
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="headingMd">🛠️</Text>
                <BlockStack gap="050">
                  <Text as="h3" variant="headingMd" fontWeight="bold">
                    Build Your Own — Custom Mission
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Add agents and templates one by one to create a bespoke pipeline.
                  </Text>
                </BlockStack>
              </InlineStack>

              {/* Agent Library */}
              <BlockStack gap="200">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Agents
                </Text>
                <InlineStack gap="200" wrap>
                  {AVAILABLE_AGENTS.map((agent) => (
                    <div key={agent.name} style={{ minWidth: "140px" }}>
                      <Button
                        onClick={() => addAgent(agent.name)}
                        disabled={isRunning}
                        size="slim"
                        icon={PlusIcon}
                      >
                        {agent.icon} {agent.displayName}
                      </Button>
                    </div>
                  ))}
                </InlineStack>
              </BlockStack>

              {/* Template Library */}
              <BlockStack gap="200">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Templates
                </Text>
                <InlineStack gap="200" blockAlign="end">
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <Select
                      label="Template"
                      labelHidden
                      options={[{ label: "Choose a template...", value: "" }, ...TEMPLATE_ADD_OPTIONS]}
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      disabled={isRunning}
                    />
                  </div>
                  <Button
                    onClick={() => selectedTemplate && addTemplate(selectedTemplate)}
                    disabled={isRunning || !selectedTemplate}
                    size="slim"
                    icon={PlusIcon}
                  >
                    Add
                  </Button>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Box>

          <Divider />

          {/* ────────────── Pipeline Canvas (shared result) ──────────────── */}
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Pipeline
              </Text>
              {pipeline.length > 0 && (
                <Badge tone="success">{pipeline.length} step{pipeline.length !== 1 ? "s" : ""}</Badge>
              )}
            </InlineStack>

            {pipeline.length === 0 ? (
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    Your pipeline is empty. Select a preset above or build a custom mission to get started.
                  </Text>
                </BlockStack>
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
                      <InlineStack align="space-between" blockAlign="center" gap="200">
                        {/* Step info */}
                        <InlineStack gap="300" blockAlign="center">
                          <Badge tone={info.color}>
                            {index + 1}
                          </Badge>
                          <BlockStack gap="050">
                            <InlineStack gap="100" blockAlign="center">
                              <Text as="span" variant="bodyMd" fontWeight="semibold">
                                {info.icon} {info.displayName}
                              </Text>
                              {info.isTemplate && (
                                <Badge tone="info" size="small">Template</Badge>
                              )}
                            </InlineStack>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {info.description}
                            </Text>
                          </BlockStack>
                        </InlineStack>

                        {/* Controls */}
                        <InlineStack gap="200" blockAlign="center">
                          {/* Reorder buttons */}
                          <InlineStack gap="100">
                            <Button
                              icon={ArrowUpIcon}
                              size="slim"
                              variant="plain"
                              onClick={() => moveStep(index, "up")}
                              disabled={index === 0 || isRunning}
                              accessibilityLabel="Move up"
                            />
                            <Button
                              icon={ArrowDownIcon}
                              size="slim"
                              variant="plain"
                              onClick={() => moveStep(index, "down")}
                              disabled={index === pipeline.length - 1 || isRunning}
                              accessibilityLabel="Move down"
                            />
                          </InlineStack>

                          {/* Remove */}
                          <Button
                            icon={DeleteIcon}
                            size="slim"
                            variant="plain"
                            tone="critical"
                            onClick={() => removeStep(index)}
                            disabled={isRunning}
                            accessibilityLabel="Remove step"
                          />
                        </InlineStack>
                      </InlineStack>
                    </Box>
                  );
                })}
              </BlockStack>
            )}
          </BlockStack>

          {/* Start Mission Button (hidden when parent provides its own) */}
          {!hideStartButton && (
            <Box paddingBlockStart="200">
              <div className="aiOptimizeCenter">
                <div className="aiOptimizeWrap">
                  <div className="aiOptimizeInner">
                    <Button
                      variant="primary"
                      size="large"
                      onClick={handleStartMission}
                      disabled={pipeline.length === 0 || isRunning}
                      loading={isRunning}
                      fullWidth
                      icon={PlayIcon}
                    >
                      🚀 Start Mission ({pipeline.length} step{pipeline.length !== 1 ? "s" : ""})
                    </Button>
                  </div>
                </div>
              </div>
            </Box>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

export type { MissionArchitectProps };
