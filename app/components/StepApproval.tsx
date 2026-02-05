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
  Collapsible,
  Link,
  TextField,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  RefreshIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EditIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback, useEffect } from "react";
import { RichTextEditor, HtmlPreview } from "./RichTextEditor";

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
  serp_insights?: Array<{ title?: string; url?: string; position?: number }>;
  social_hooks?: Array<{ 
    type?: string;
    caption?: string; 
    hashtags?: string[];
    overlay?: string;
    copy_text?: string;
  }>;
  seasonal_campaign?: Record<string, unknown>;
  
  // PriceScout outputs
  pricing_analysis?: {
    recommended_price?: number;
    price_position?: string;
    confidence?: number;
    competitors?: Array<{ name?: string; price?: number }>;
    reasoning?: string;
  };
  
  // Compliance outputs
  compliance_flags?: string[];
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
  onRegenerate: () => void;
  onSkip: () => void;
  /** Callback when user edits output fields (e.g., draft_title, draft_content) */
  onOutputChange?: (field: string, value: string) => void;
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
    case "ComplianceAgent":
      return "Compliance Check";
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
    case "ComplianceAgent":
      return "🛡️";
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
    case "ComplianceAgent":
      return "Checked content for regulatory compliance issues";
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
 * CTR Score Display with traffic light indicators (matches Rewriter exactly)
 */
function CTRScoreDisplay({
  seoTitle,
  seoDescription,
  ctrScore,
}: {
  seoTitle: string;
  seoDescription: string;
  ctrScore?: number;
}) {
  const titleLen = seoTitle.length;
  const descLower = seoDescription.toLowerCase();
  
  // PST (Problem-Solution-Trust) Check
  const problemWords = ["tired", "struggling", "problem", "frustrated", "looking for", "need a", "wish"];
  const hasProblemSignal = seoDescription.includes("?") || problemWords.some((w) => descLower.includes(w));
  
  // Brand Trust Check
  const hasBrandTrust =
    /japan/i.test(seoDescription) ||
    /handcrafted/i.test(seoDescription) ||
    /free shipping/i.test(seoDescription) ||
    /authentic/i.test(seoDescription) ||
    /artisan/i.test(seoDescription);
  
  // Determine tones
  const pstTone: "green" | "yellow" | "red" = hasProblemSignal
    ? "green"
    : /shop now|discover|order|buy/i.test(seoDescription)
      ? "yellow"
      : "red";
  const trustTone: "green" | "yellow" | "red" = hasBrandTrust
    ? "green"
    : /premium|quality|original/i.test(seoDescription)
      ? "yellow"
      : "red";
  const lenTone: "green" | "yellow" | "red" =
    titleLen > 50 && titleLen < 70
      ? "green"
      : titleLen >= 45 && titleLen <= 75
        ? "yellow"
        : "red";
  
  const colorFor = (t: "green" | "yellow" | "red") =>
    t === "green"
      ? "var(--p-color-bg-fill-success)"
      : t === "yellow"
        ? "var(--p-color-bg-fill-warning)"
        : "var(--p-color-bg-fill-critical)";
  
  const Light = ({ tone }: { tone: "green" | "yellow" | "red" }) => (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: 999,
        display: "inline-block",
        background: colorFor(tone),
        boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.6) inset",
      }}
    />
  );
  
  const Row = ({
    label,
    tone,
    hint,
  }: {
    label: string;
    tone: "green" | "yellow" | "red";
    hint: string;
  }) => (
    <InlineStack align="space-between" blockAlign="center">
      <InlineStack gap="200" blockAlign="center">
        <Light tone={tone} />
        <Text as="span" variant="bodySm">{label}</Text>
      </InlineStack>
      <Text as="span" variant="bodySm" tone="subdued">{hint}</Text>
    </InlineStack>
  );
  
  return (
    <BlockStack gap="200">
      <Row 
        label="PST Check" 
        tone={pstTone} 
        hint={hasProblemSignal ? "✓ OK" : "Add a problem/question"} 
      />
      <Row
        label="Brand Trust"
        tone={trustTone}
        hint={hasBrandTrust ? "✓ OK" : 'Add trust signals'}
      />
      <Row 
        label="Title Length" 
        tone={lenTone} 
        hint={`${titleLen}/70 chars`} 
      />
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
  onSkip,
  onOutputChange,
}: StepApprovalProps) {
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(output?.draft_title || "");
  const [editedContent, setEditedContent] = useState(output?.draft_content || "");
  const toggleOutput = useCallback(() => setShowFullOutput((prev) => !prev), []);
  
  // Sync edited values when output changes
  useEffect(() => {
    if (output?.draft_title) setEditedTitle(output.draft_title);
    if (output?.draft_content) setEditedContent(output.draft_content);
  }, [output?.draft_title, output?.draft_content]);
  
  const handleTitleChange = useCallback((value: string) => {
    setEditedTitle(value);
    onOutputChange?.("draft_title", value);
  }, [onOutputChange]);
  
  const handleContentChange = useCallback((value: string) => {
    setEditedContent(value);
    onOutputChange?.("draft_content", value);
  }, [onOutputChange]);
  
  const displayName = getAgentDisplayName(agentName);
  const icon = getAgentIcon(agentName);
  const description = getAgentDescription(agentName);
  const isLastStep = stepIndex === totalSteps - 1;
  
  // Determine badge based on status
  const getBadge = () => {
    switch (status) {
      case "idle":
        return <Badge>Pending</Badge>;
      case "running":
        return <Badge tone="attention" progress="partiallyComplete">Running</Badge>;
      case "awaiting_approval":
        return <Badge tone="warning">Awaiting Your Decision</Badge>;
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
            
            {/* Discovered Values */}
            {output.discovered_values && output.discovered_values.length > 0 && (
              <Box>
                <Text as="span" variant="bodySm" fontWeight="semibold">Discovered Cultural Values:</Text>
                <Box paddingBlockStart="200">
                  <InlineStack gap="200" wrap>
                  {output.discovered_values.slice(0, 5).map((v, i) => (
                    <Badge key={i} tone="info">{`${v.name}: ${v.value}`}</Badge>
                  ))}
                </InlineStack>
                </Box>
              </Box>
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
                          url={s.url || "https://example.com"}
                          snippet={"Competitor listing"}
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

              {/* Right Column: Your Product */}
              <div style={{ flex: "1 1 300px", minWidth: 280 }}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">
                      Your Product (Preview)
                    </Text>
                    <Badge tone="success">Optimized</Badge>
                  </InlineStack>
                  <SearchEnginePreview
                    title={output.seo_title || "Your SEO Title"}
                    url="https://yourstore.myshopify.com"
                    snippet={output.seo_description || "Your SEO description will appear here..."}
                    isYours
                  />
                </BlockStack>
              </div>
            </div>

            {/* CTR Optimization Score */}
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h4" variant="headingSm" fontWeight="semibold">
                    CTR Optimization Score
                  </Text>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: "var(--p-color-bg-fill-success)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Optimized for US Search
                  </span>
                </InlineStack>
                
                <CTRScoreDisplay
                  seoTitle={output.seo_title || ""}
                  seoDescription={output.seo_description || ""}
                  ctrScore={output.ctr_check?.score}
                />
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
                            onClick={() => {
                              const text = hook.copy_text || hook.caption || "";
                              navigator.clipboard.writeText(text);
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
        
      case "PriceScoutAgent":
        return (
          <BlockStack gap="300">
            {output.pricing_analysis && (
              <>
                {output.pricing_analysis.recommended_price && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Recommended Price:</Text>
                    <Badge tone="success">
                      {`$${output.pricing_analysis.recommended_price.toFixed(2)}`}
                    </Badge>
                  </InlineStack>
                )}
                {output.pricing_analysis.price_position && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Market Position:</Text>
                    <Badge>{output.pricing_analysis.price_position}</Badge>
                  </InlineStack>
                )}
                {output.pricing_analysis.confidence !== undefined && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Confidence:</Text>
                    <Badge tone={output.pricing_analysis.confidence >= 0.7 ? "success" : "warning"}>
                      {`${Math.round(output.pricing_analysis.confidence * 100)}%`}
                    </Badge>
                  </InlineStack>
                )}
                {output.pricing_analysis.reasoning && (
                  <Box>
                    <Text as="span" variant="bodySm" fontWeight="semibold">Reasoning:</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{output.pricing_analysis.reasoning}</Text>
                  </Box>
                )}
              </>
            )}
          </BlockStack>
        );
        
      case "ComplianceAgent":
        return (
          <BlockStack gap="300">
            {output.compliance_flags && output.compliance_flags.length > 0 ? (
              <Box>
                <Banner tone="warning" title="Compliance Issues Found">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      These issues were found in the <strong>generated content</strong>. 
                      Please review and edit before publishing.
                    </Text>
                  <BlockStack gap="100">
                    {output.compliance_flags.map((flag, i) => (
                      <Text key={i} as="p" variant="bodySm">• {flag}</Text>
                    ))}
                    </BlockStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Tip: Use the Copywriter step's "Edit Content" button to modify the generated 
                      description and remove any problematic claims before finalizing.
                    </Text>
                  </BlockStack>
                </Banner>
              </Box>
            ) : (
              <Banner tone="success" title="Compliance Check Passed">
                <Text as="p" variant="bodySm">No compliance issues detected in your content.</Text>
              </Banner>
            )}
          </BlockStack>
        );
        
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
          
          {/* Output Preview (when awaiting approval) */}
          {status === "awaiting_approval" && output && (
            <>
              <Divider />
              <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="span" variant="bodySm" fontWeight="semibold">
                      Agent Output
                    </Text>
                    <Button
                      variant="plain"
                      onClick={toggleOutput}
                      icon={showFullOutput ? ChevronDownIcon : ChevronRightIcon}
                    >
                      {showFullOutput ? "Show Less" : "Show More"}
                    </Button>
                  </InlineStack>
                  
                  <Collapsible open={true} id="output-preview">
                    {renderOutputPreview()}
                  </Collapsible>
                </BlockStack>
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
                  <Button
                    variant="primary"
                    onClick={onContinue}
                    loading={isLoading}
                    icon={CheckCircleIcon}
                  >
                    {isLastStep ? "Complete & Finish" : "Approve & Continue"}
                  </Button>
                  <Button
                    onClick={onRegenerate}
                    loading={isLoading}
                    icon={RefreshIcon}
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant="plain"
                    onClick={onSkip}
                    loading={isLoading}
                  >
                    Skip
                  </Button>
                </InlineStack>
                {!isLastStep && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    Next: {getAgentDisplayName(
                           (agentName === "RewriterAgent" || agentName === "CopywriterAgent") ? "SEOAgent" : 
                           agentName === "SEOAgent" ? "MarketingAgent" :
                           agentName === "MarketingAgent" ? "PriceScoutAgent" : "")}
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
          
          {/* Completed state (minimal) */}
          {status === "completed" && output && (
            <Box>
              <Link onClick={toggleOutput}>
                {showFullOutput ? "Hide output" : "View output"}
              </Link>
              <Collapsible open={showFullOutput} id="completed-output">
                <Box paddingBlockStart="200">
                  {renderOutputPreview()}
                </Box>
              </Collapsible>
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
