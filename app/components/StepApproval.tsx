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
  TextField,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  RefreshIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EditIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback, useEffect, useMemo } from "react";
import { RichTextEditor, HtmlPreview } from "./RichTextEditor";
import { TEMPLATE_DEFINITIONS } from "./MissionArchitect";
import { templateOutputToHtml } from "../utils/templateHtmlParser";
import "../styles/optimize-button.css";

const LOCALE_CURRENCY: Record<string, string> = {
  ja: "¥", ko: "₩", "zh-TW": "NT$", "zh-CN": "¥", th: "฿", pt: "R$",
};

const LOCALE_MARKET: Record<string, string> = {
  en: "US", ja: "JP", ko: "KR", "zh-TW": "TW", "zh-CN": "CN", th: "TH", pt: "BR",
  fr: "FR", de: "DE", es: "ES",
};

const REFINEMENT_THEME_LABELS: Record<string, string> = {
  clean: "Clean Studio",
  lifestyle: "Lifestyle Scene",
  natural: "Natural & Organic",
  premium: "Premium Luxury",
  seasonal: "Seasonal",
  minimalist: "Minimalist",
  informative: "Informative",
  ai_choice: "Leave it to AI",
};

export interface AgentOutput {
  // Copywriter outputs
  draft_content?: string;
  draft_title?: string;
  discovered_values?: Array<{ name: string; value: string; source?: string }>;
  
  // Marketing outputs
  seo_title?: string;
  seo_description?: string;
  seo_alt_text?: string;
  seo_insights?: Record<string, unknown>;
  seo_recommendations?: Record<string, unknown>;
  ctr_check?: { score?: number; suggestions?: string[] };
  serp_insights?: Array<{ title?: string; snippet?: string; link?: string; position?: number }>;
  social_hooks?: Array<{ 
    type?: string;
    caption?: string; 
    hashtags?: string[];
    overlay?: string;
    copy_text?: string;
  }>;
  seasonal_campaign?: Record<string, unknown>;
  
  // Template outputs
  template_id?: string;
  
  // PriceScout outputs
  pricing_analysis?: {
    recommended_price?: number;
    price_position?: string;
    confidence?: number;
    competitors?: Array<{ name?: string; price?: number }>;
    reasoning?: string;
    currency?: string;
  };
  
  // Compliance outputs
  compliance_flags?: string[];

  // Mission-level metadata
  target_locale?: string;
  refinement_theme?: string;
}

interface StepApprovalProps {
  agentName: string;
  stepIndex: number;
  totalSteps: number;
  status: "idle" | "running" | "awaiting_approval" | "completed" | "skipped" | "error";
  output?: AgentOutput;
  isLoading?: boolean;
  error?: string;
  onContinue: () => void;
  /** Called when user wants to regenerate with feedback (opens modal for RewriterAgent) */
  onRegenerate: () => void;
  /** Called for plain re-run without feedback modal (for non-Rewriter agents) */
  onPlainRegenerate?: () => void;
  onSkip: () => void;
  /** Callback when user edits output fields (e.g., draft_title, draft_content) */
  onOutputChange?: (field: string, value: string) => void;
  /** 
   * Whether this agent supports feedback-based refinement (default: false).
   * When true, clicking "Regenerate" opens a feedback modal.
   * When false, clicking "Regenerate" does a plain re-run immediately.
   */
  supportsFeedback?: boolean;
  /** Ordered list of agent class names in the actual workflow */
  workflowAgents?: string[];
  /** Custom content rendered between header and action buttons (replaces output preview) */
  children?: React.ReactNode;
}

function getAgentDisplayName(agentName: string): string {
  switch (agentName) {
    case "RewriterAgent":
    case "CopywriterAgent":  // Backward compat
      return "Rewriter";
    case "SEOAgent":
      return "SEO Optimization";
    case "MarketingAgent":
      return "Social Media Marketing";
    case "PriceScoutAgent":
      return "Pricing Analysis";
    case "ImageRefinementAgent":
      return "Image Refinement";
    case "VisualMarketingAgent":
      return "Visual Marketing";
    default:
      return agentName.replace("Agent", "");
  }
}

function getAgentIcon(agentName: string): string {
  switch (agentName) {
    case "RewriterAgent":
    case "CopywriterAgent":  // Backward compat
      return "✏️";
    case "SEOAgent":
      return "🔍";
    case "MarketingAgent":
      return "📱";
    case "PriceScoutAgent":
      return "💰";
    case "ImageRefinementAgent":
      return "✨";
    case "VisualMarketingAgent":
      return "📸";
    default:
      return "🤖";
  }
}

function getAgentDescription(agentName: string): string {
  switch (agentName) {
    case "RewriterAgent":
    case "CopywriterAgent":  // Backward compat
      return "Generated optimized product title and description with brand context";
    case "SEOAgent":
      return "Created SEO metadata, analyzed competitors, and validated CTR score";
    case "MarketingAgent":
      return "Generated social media captions and hooks for Instagram/TikTok";
    case "PriceScoutAgent":
      return "Analyzed market pricing and provided recommendations";
    default:
      return "Processed your product data";
  }
}

/**
 * Google Search Engine Preview Card (matches Rewriter exactly)
 */
function SearchEnginePreview({
  title,
  url,
  snippet,
  rank,
  isYours,
}: {
  title: string;
  url: string;
  snippet: string;
  rank?: number;
  isYours?: boolean;
}) {
  return (
    <div
      style={{
        border: isYours 
          ? "2px solid var(--p-color-border-success)" 
          : "1px solid var(--p-color-border-secondary)",
        borderRadius: 8,
        padding: 12,
        background: "var(--p-color-bg-surface)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rank && (
          <div
            style={{
              fontSize: 11,
              color: "var(--p-color-text-subdued)",
              marginBottom: 2,
            }}
          >
            #{rank} on Google
          </div>
        )}
        <div
          style={{
            color: "#1a0dab",
            fontSize: 16,
            lineHeight: "20px",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={title}
        >
          {title || "SEO title preview…"}
        </div>
        <div
          style={{
            color: "#006621",
            fontSize: 13,
            lineHeight: "16px",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            whiteSpace: "normal",
            maxWidth: "100%",
          }}
        >
          {url}
        </div>
        <div 
          style={{ 
            color: "#4b5563", 
            fontSize: 13, 
            lineHeight: "18px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {snippet || "Meta description preview…"}
        </div>
      </div>
    </div>
  );
}

/**
 * CTR Score Display driven by server-side ctr_check data.
 * Falls back gracefully when the SEO agent hasn't returned ctr_check yet.
 */
function CTRScoreDisplay({
  ctrCheck,
}: {
  ctrCheck?: {
    pain_present?: boolean;
    solution_present?: boolean;
    trust_present?: boolean;
    score?: number;
    suggestions?: string[];
  };
}) {
  if (!ctrCheck) return null;

  const Light = ({ active }: { active: boolean }) => (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: 999,
        display: "inline-block",
        background: active ? "var(--p-color-bg-fill-success)" : "var(--p-color-bg-fill-critical)",
        boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.6) inset",
      }}
    />
  );

  const Row = ({ label, active, hint }: { label: string; active: boolean; hint: string }) => (
    <InlineStack align="space-between" blockAlign="center">
      <InlineStack gap="200" blockAlign="center">
        <Light active={active} />
        <Text as="span" variant="bodySm">{label}</Text>
      </InlineStack>
      <Text as="span" variant="bodySm" tone="subdued">{hint}</Text>
    </InlineStack>
  );

  return (
    <BlockStack gap="200">
      <Row
        label="PST Check"
        active={ctrCheck.pain_present || false}
        hint={ctrCheck.pain_present ? "✓ OK" : "Add a problem/question"}
      />
      <Row
        label="Solution"
        active={ctrCheck.solution_present || false}
        hint={ctrCheck.solution_present ? "✓ OK" : "Add benefit + spec"}
      />
      <Row
        label="Brand Trust"
        active={ctrCheck.trust_present || false}
        hint={ctrCheck.trust_present ? "✓ OK" : "Add trust signals"}
      />
      {ctrCheck.score !== undefined && (
        <InlineStack align="space-between" blockAlign="center">
          <Text as="span" variant="bodySm" fontWeight="semibold">CTR Score</Text>
          <Badge tone={ctrCheck.score >= 0.7 ? "success" : ctrCheck.score >= 0.4 ? "warning" : "critical"}>
            {Math.round(ctrCheck.score * 100)}%
          </Badge>
        </InlineStack>
      )}
    </BlockStack>
  );
}

/**
 * Subtle green checkmark component for showing completion status
 */
function CompletionCheckmark({ label, completed }: { label: string; completed: boolean }) {
  return (
    <InlineStack gap="200" blockAlign="center">
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: completed ? "var(--p-color-bg-fill-success)" : "var(--p-color-bg-surface-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {completed && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 6L5 8.5L9.5 4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <Text
        as="span"
        variant="bodySm"
        tone={completed ? "success" : "subdued"}
      >
        {label}
      </Text>
    </InlineStack>
  );
}

export function StepApproval({
  agentName,
  stepIndex,
  totalSteps,
  status,
  output,
  isLoading,
  error,
  onContinue,
  onRegenerate,
  onPlainRegenerate,
  onSkip,
  onOutputChange,
  supportsFeedback = false,
  workflowAgents,
  children,
}: StepApprovalProps) {
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(output?.draft_title || "");
  const [editedContent, setEditedContent] = useState(output?.draft_content || "");
  
  // SEO editing state
  const [isEditingSeo, setIsEditingSeo] = useState(false);
  const [editedSeoTitle, setEditedSeoTitle] = useState(output?.seo_title || "");
  const [editedSeoDescription, setEditedSeoDescription] = useState(output?.seo_description || "");
  
  const toggleOutput = useCallback(() => setShowFullOutput((prev) => !prev), []);
  
  // Sync edited values when output changes
  useEffect(() => {
    if (output?.draft_title) setEditedTitle(output.draft_title);
    if (output?.draft_content) setEditedContent(output.draft_content);
  }, [output?.draft_title, output?.draft_content]);
  
  // Sync SEO values when output changes
  useEffect(() => {
    if (output?.seo_title) setEditedSeoTitle(output.seo_title);
    if (output?.seo_description) setEditedSeoDescription(output.seo_description);
  }, [output?.seo_title, output?.seo_description]);
  
  const handleTitleChange = useCallback((value: string) => {
    setEditedTitle(value);
    onOutputChange?.("draft_title", value);
  }, [onOutputChange]);
  
  const handleContentChange = useCallback((value: string) => {
    setEditedContent(value);
    onOutputChange?.("draft_content", value);
  }, [onOutputChange]);
  
  const handleSeoTitleChange = useCallback((value: string) => {
    setEditedSeoTitle(value);
    onOutputChange?.("seo_title", value);
  }, [onOutputChange]);
  
  const handleSeoDescriptionChange = useCallback((value: string) => {
    setEditedSeoDescription(value);
    onOutputChange?.("seo_description", value);
  }, [onOutputChange]);
  
  // Template-aware display: use template info when available
  const templateId = output?.template_id;
  const templateDef = templateId ? TEMPLATE_DEFINITIONS[templateId] : undefined;
  const baseDisplayName = templateDef ? templateDef.displayName : getAgentDisplayName(agentName);
  const themeLabel = (agentName === "ImageRefinementAgent" && output?.refinement_theme)
    ? REFINEMENT_THEME_LABELS[output.refinement_theme] || null
    : null;
  const displayName = themeLabel ? `${baseDisplayName} — ${themeLabel}` : baseDisplayName;
  const icon = templateDef ? templateDef.icon : getAgentIcon(agentName);
  const description = templateDef ? templateDef.description : getAgentDescription(agentName);
  const isLastStep = stepIndex === totalSteps - 1;
  
  // Determine badge based on status
  const getBadge = () => {
    switch (status) {
      case "idle":
        return <Badge>Pending</Badge>;
      case "running":
        return <Badge tone="attention" progress="partiallyComplete">Running</Badge>;
      case "awaiting_approval":
        return null;
      case "completed":
        return <Badge tone="success" icon={CheckCircleIcon}>Approved</Badge>;
      case "skipped":
        return <Badge tone="info">Skipped</Badge>;
      case "error":
        return <Badge tone="critical">Failed</Badge>;
      default:
        return null;
    }
  };
  
  // Render agent-specific output preview
  const renderOutputPreview = () => {
    if (!output) return null;
    
    // ── Template step: parse JSON into rich HTML ────────────────────
    if (output.template_id && output.draft_content) {
      const parsedHtml = templateOutputToHtml(output.draft_content);
      return (
        <BlockStack gap="400">
          {output.draft_title && (
            <BlockStack gap="100">
              <Text as="span" variant="bodySm" fontWeight="semibold">Generated Title:</Text>
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <Text as="p" variant="headingMd">{output.draft_title}</Text>
              </Box>
            </BlockStack>
          )}
          <HtmlPreview
            label="Generated Content"
            value={parsedHtml}
            height={showFullOutput ? 400 : 200}
          />
          {parsedHtml.length > 500 && (
            <InlineStack align="center">
              <Button
                variant="plain"
                onClick={toggleOutput}
                icon={showFullOutput ? ChevronDownIcon : ChevronRightIcon}
              >
                {showFullOutput ? "Show Less" : "Show Full Content"}
              </Button>
            </InlineStack>
          )}
        </BlockStack>
      );
    }
    
    switch (agentName) {
      case "RewriterAgent":
      case "CopywriterAgent":  // Backward compat
        return (
          <BlockStack gap="400">
            {/* Edit Mode Toggle */}
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone={isEditing ? "attention" : "info"}>
                  {isEditing ? "Editing Mode" : "Preview Mode"}
                </Badge>
                <Text as="span" variant="bodySm" tone="subdued">
                  {isEditing 
                    ? "Make changes using the rich text editor below" 
                    : "Review how your content will appear on the product page"}
                </Text>
              </InlineStack>
              <Button
                variant={isEditing ? "primary" : "secondary"}
                onClick={() => setIsEditing(!isEditing)}
                icon={EditIcon}
              >
                {isEditing ? "Done Editing" : "Edit Content"}
              </Button>
            </InlineStack>
            
            {/* Title Field */}
            {(output.draft_title || isEditing) && (
              <Box>
                {isEditing ? (
                  <TextField
                    label="Product Title"
                    value={editedTitle}
                    onChange={handleTitleChange}
                    autoComplete="off"
                    helpText="Edit the generated title before saving"
                  />
                ) : (
                  <BlockStack gap="100">
                <Text as="span" variant="bodySm" fontWeight="semibold">Generated Title:</Text>
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <Text as="p" variant="headingMd">{output.draft_title}</Text>
                    </Box>
                  </BlockStack>
                )}
              </Box>
            )}
            
            {/* Description Field - Rich Text Editor */}
            {(output.draft_content || isEditing) && (
              <Box>
                {isEditing ? (
                  <RichTextEditor
                    label="Product Description"
                    value={editedContent}
                    onChange={handleContentChange}
                    height={300}
                    helpText="Use the toolbar to format your content. Changes will be saved automatically."
                  />
                ) : (
                  <HtmlPreview
                    label="Generated Description (Preview)"
                    value={output.draft_content || ""}
                    height={showFullOutput ? 400 : 200}
                  />
                )}
              </Box>
            )}
            
            {/* Show More/Less Toggle */}
            {!isEditing && output.draft_content && output.draft_content.length > 500 && (
              <InlineStack align="center">
                <Button
                  variant="plain"
                  onClick={toggleOutput}
                  icon={showFullOutput ? ChevronDownIcon : ChevronRightIcon}
                >
                  {showFullOutput ? "Show Less" : "Show Full Description"}
                </Button>
              </InlineStack>
            )}
            
            {/* Completion Checkmarks - What Was Done */}
            <Divider />
            <Box>
              <Text as="span" variant="bodySm" fontWeight="semibold">Optimization Completed:</Text>
              <Box paddingBlockStart="200">
                <BlockStack gap="150">
                  <CompletionCheckmark
                    label="Title optimized for target market"
                    completed={!!output.draft_title}
                  />
                  <CompletionCheckmark
                    label="Description rewritten with cultural context"
                    completed={!!output.draft_content}
                  />
                  <CompletionCheckmark
                    label="Brand voice and tone applied"
                    completed={!!output.draft_content}
                  />
                  <CompletionCheckmark
                    label="Cultural values discovered and incorporated"
                    completed={(output.discovered_values?.length || 0) > 0}
                  />
                </BlockStack>
              </Box>
            </Box>
          </BlockStack>
        );
        
      case "SEOAgent":
        return (
          <BlockStack gap="500">
            {/* Edit Mode Toggle */}
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone={isEditingSeo ? "attention" : "info"}>
                  {isEditingSeo ? "Editing Mode" : "Preview Mode"}
                </Badge>
                <Text as="span" variant="bodySm" tone="subdued">
                  {isEditingSeo 
                    ? "Edit your SEO title and description below" 
                    : "Review how your product will appear in search results"}
                </Text>
              </InlineStack>
              <Button
                variant={isEditingSeo ? "primary" : "secondary"}
                onClick={() => setIsEditingSeo(!isEditingSeo)}
                icon={EditIcon}
              >
                {isEditingSeo ? "Done Editing" : "Edit SEO"}
              </Button>
            </InlineStack>

            {/* Editable SEO Fields */}
            {isEditingSeo && (
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="400">
                  <TextField
                    label="SEO Title"
                    value={editedSeoTitle}
                    onChange={handleSeoTitleChange}
                    autoComplete="off"
                    helpText={`${editedSeoTitle.length}/60 characters recommended`}
                    maxLength={70}
                  />
                  <TextField
                    label="SEO Description"
                    value={editedSeoDescription}
                    onChange={handleSeoDescriptionChange}
                    autoComplete="off"
                    multiline={3}
                    helpText={`${editedSeoDescription.length}/160 characters recommended`}
                    maxLength={200}
                  />
                </BlockStack>
              </Box>
            )}

            {/* Two-column layout for SEO */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {/* Left Column: Top 3 Google Ranks */}
              <div style={{ flex: "1 1 300px", minWidth: 280 }}>
                <BlockStack gap="300">
                  <Text as="h4" variant="headingSm" fontWeight="semibold">
                    Top 3 Ranks on Google Search
                  </Text>
                  <BlockStack gap="200">
                    {output.serp_insights && output.serp_insights.length > 0 ? (
                      output.serp_insights.slice(0, 3).map((s, i) => (
                        <SearchEnginePreview
                          key={`comp-${i}`}
                          title={s.title || "—"}
                          url={s.link || ""}
                          snippet={s.snippet || "No description available"}
                          rank={s.position || i + 1}
                        />
                      ))
                    ) : (
                      <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                        <Text as="p" tone="subdued">
                          Competitor data currently unavailable.
                        </Text>
                      </Box>
                    )}
                  </BlockStack>
                </BlockStack>
              </div>

              {/* Right Column: Your Product (Real-time Preview) */}
              <div style={{ flex: "1 1 300px", minWidth: 280 }}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">
                      Your Product (Preview)
                    </Text>
                    <InlineStack gap="100">
                      {output.target_locale && LOCALE_MARKET[output.target_locale] && (
                        <Badge tone="info">
                          Optimized for {LOCALE_MARKET[output.target_locale]} Search
                        </Badge>
                      )}
                      <Badge tone="success">Optimized</Badge>
                    </InlineStack>
                  </InlineStack>
                  <SearchEnginePreview
                    title={editedSeoTitle || "Your SEO Title"}
                    url="https://yourstore.myshopify.com"
                    snippet={editedSeoDescription || "Your SEO description will appear here..."}
                    isYours
                  />
                </BlockStack>
              </div>
            </div>

            {/* CTR Optimization Score */}
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h4" variant="headingSm" fontWeight="semibold">
                    CTR Optimization Score
                  </Text>
                  {output.target_locale && LOCALE_MARKET[output.target_locale] && (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: "18px",
                        borderRadius: 999,
                        background: "var(--p-color-bg-fill-success)",
                        color: "#fff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Optimized for {LOCALE_MARKET[output.target_locale]} Search
                    </span>
                  )}
                </InlineStack>
                
                <CTRScoreDisplay ctrCheck={output.ctr_check} />
              </BlockStack>
            </Box>
          </BlockStack>
        );

      case "MarketingAgent":
        return (
          <BlockStack gap="400">
            {/* Social Media Captions */}
            {output.social_hooks && output.social_hooks.length > 0 ? (
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm" fontWeight="semibold">
                  Social Media Captions
                </Text>
                <BlockStack gap="200">
                  {output.social_hooks.map((hook, i) => (
                    <Box 
                      key={i} 
                      padding="300" 
                      background="bg-surface" 
                      borderRadius="200"
                      borderColor="border"
                      borderWidth="025"
                    >
                      <BlockStack gap="150">
                        <InlineStack align="space-between" blockAlign="center">
                          <Badge tone="info">{hook.type || "Caption"}</Badge>
                          <Button
                            variant="plain"
                            size="slim"
                            onClick={async () => {
                              try {
                                const text = hook.copy_text || hook.caption || "";
                                if (text) {
                                  await navigator.clipboard.writeText(text);
                                }
                              } catch (err) {
                                console.error("Failed to copy to clipboard:", err);
                                // Fallback for older browsers
                                const text = hook.copy_text || hook.caption || "";
                                if (text) {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = text;
                                  textArea.style.position = "fixed";
                                  textArea.style.opacity = "0";
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  try {
                                    document.execCommand("copy");
                                  } catch (fallbackErr) {
                                    console.error("Fallback copy failed:", fallbackErr);
                                  }
                                  document.body.removeChild(textArea);
                                }
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </InlineStack>
                        <Text as="p" variant="bodyMd">{hook.caption}</Text>
                        {hook.hashtags && hook.hashtags.length > 0 && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {hook.hashtags.join(" ")}
                          </Text>
                        )}
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              </BlockStack>
            ) : (
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200" align="center">
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    No social media captions generated yet.
                  </Text>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        );
        
      case "PriceScoutAgent": {
        const pa = output.pricing_analysis;
        const currencySymbol = pa?.currency
          || (output.target_locale && LOCALE_CURRENCY[output.target_locale])
          || "$";
        return (
          <BlockStack gap="300">
            {pa && (
              <>
                {pa.recommended_price && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Recommended Price:</Text>
                    <Badge tone="success">
                      {`${currencySymbol}${pa.recommended_price.toFixed(2)}`}
                    </Badge>
                  </InlineStack>
                )}
                {pa.price_position && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Market Position:</Text>
                    <Badge>{pa.price_position}</Badge>
                  </InlineStack>
                )}
                {pa.confidence !== undefined && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Confidence:</Text>
                    <Badge tone={pa.confidence >= 0.7 ? "success" : "warning"}>
                      {`${Math.round(pa.confidence * 100)}%`}
                    </Badge>
                  </InlineStack>
                )}
                {pa.reasoning && (
                  <Box>
                    <Text as="span" variant="bodySm" fontWeight="semibold">Reasoning:</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{pa.reasoning}</Text>
                  </Box>
                )}
              </>
            )}
          </BlockStack>
        );
      }

      case "VisualAgent":
      case "Visual":
        // Visual output is shown in the VisualStepCard carousel, not here
        return null;
        
      default:
        return (
          <Box>
            <Text as="p" variant="bodySm" tone="subdued">
              {JSON.stringify(output, null, 2).slice(0, 200)}...
            </Text>
          </Box>
        );
    }
  };
  
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="headingLg">{icon}</Text>
              <BlockStack gap="050">
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  Step {stepIndex + 1}: {displayName}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {description}
                </Text>
              </BlockStack>
            </InlineStack>
            {getBadge()}
          </InlineStack>
          
          {/* Error Banner */}
          {error && (
            <Banner tone="critical" title="Error">
              <Text as="p" variant="bodySm">{error}</Text>
            </Banner>
          )}
          
          {/* Custom content (e.g. Visual agent carousel + InstaPreview) */}
          {status === "awaiting_approval" && children && (
            <>
              <Divider />
              {children}
            </>
          )}

          {/* Output Preview (when awaiting approval, and no custom children) */}
          {status === "awaiting_approval" && !children && output && (
            <>
              <Divider />
              <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                {renderOutputPreview()}
              </Box>
            </>
          )}
          
          {/* Action Buttons (when awaiting approval) */}
          {status === "awaiting_approval" && (
            <>
              <Divider />
              <BlockStack gap="300">
                <Text as="p" variant="bodySm" tone="subdued">
                  Review the output above. Choose an action to proceed:
                </Text>
                <InlineStack gap="200" align="start">
                  <div className="cursorApproveWrap">
                    <div className="cursorApproveInner">
                      <Button
                        variant="primary"
                        onClick={onContinue}
                        loading={isLoading}
                        icon={CheckCircleIcon}
                      >
                        {isLastStep ? "Complete & Finish" : "Approve & Continue"}
                      </Button>
                    </div>
                  </div>
                  {supportsFeedback ? (
                    /* RewriterAgent: "Refine" button opens feedback modal */
                    <Button
                      onClick={onRegenerate}
                      loading={isLoading}
                      icon={RefreshIcon}
                    >
                      Refine with Feedback
                    </Button>
                  ) : (
                    /* Other agents: plain "Regenerate" does immediate re-run */
                    <Button
                      onClick={onPlainRegenerate || onRegenerate}
                      loading={isLoading}
                      icon={RefreshIcon}
                    >
                      Regenerate
                    </Button>
                  )}
                  <Button
                    variant="plain"
                    onClick={onSkip}
                    loading={isLoading}
                  >
                    Skip
                  </Button>
                </InlineStack>
                {!isLastStep && workflowAgents && stepIndex + 1 < workflowAgents.length && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    Next: {getAgentDisplayName(workflowAgents[stepIndex + 1])}
                  </Text>
                )}
              </BlockStack>
            </>
          )}
          
          {/* Running state */}
          {status === "running" && (
            <Box>
              <InlineStack gap="200" blockAlign="center">
                <div className="spinner" />
                <Text as="span" variant="bodySm" tone="subdued">
                  {displayName} is working...
                </Text>
              </InlineStack>
            </Box>
          )}
          
          {/* Completed state - show output */}
          {status === "completed" && output && (
            <Box paddingBlockStart="200">
              {renderOutputPreview()}
            </Box>
          )}
          
          {/* Skipped state */}
          {status === "skipped" && (
            <Text as="p" variant="bodySm" tone="subdued">
              This step was skipped.
            </Text>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
