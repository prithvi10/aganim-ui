import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Box,
  Divider,
  Banner,
  Icon,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  EditIcon,
  SearchIcon,
  HashtagIcon,
  ClockIcon,
  AlertTriangleIcon,
  ClipboardIcon,
} from "@shopify/polaris-icons";
import { useState, useMemo, useCallback } from "react";
import { TEMPLATE_DEFINITIONS } from "./MissionArchitect";
import { templateOutputToHtml, stripHtml } from "../utils/templateHtmlParser";
import { ImageCarousel, type CarouselSlide } from "./VisualStepCard";
import { InstaPreview } from "./InstaPreview";

interface MissionState {
  product_id: string;
  shop_id: string;
  plan_tier: string;
  status: string;
  draft_content?: string;
  draft_title?: string;
  seo_title?: string;
  seo_description?: string;
  seo_alt_text?: string;
  seo_insights?: {
    lsi_keywords_used?: string[];
  };
  pricing_analysis?: {
    recommended_price?: number;
    price_position?: string;
    confidence?: number;
    reasoning?: string;
    competitors?: Array<{
      name: string;
      price: number;
    }>;
  };
  compliance_flags?: string[];
  discovered_values?: Array<{
    label?: string;
    evidence?: string;
  }>;
  social_hooks?: Array<{
    type: string;
    caption: string;
    hashtags?: string[];
    overlay?: string;
    copy_text?: string;
  }>;
  logs?: string[];
  error_message?: string;
  accumulated_usage?: {
    total_tokens?: number;
    call_count?: number;
  };
  is_adhoc?: boolean;
  requested_agents?: string[];
  agent_outputs?: Record<string, Record<string, unknown>>;
  workflow_config?: Array<{ agent_name: string; has_gate: boolean; template_id?: string }>;
  workflow_agents?: string[];
  // Visual agent fields (Pro tier)
  visual_assets?: {
    refined_url?: string | null;
    ad_url?: string | null;
    original_image_url?: string | null;
  } | null;
}

interface MissionSummaryProps {
  /** The final mission state from the agent workflow */
  state: MissionState;
  /** Callback when user clicks "Publish to Shopify" */
  onPublish: () => void;
  /** Callback when user clicks "Discard" */
  onDiscard: () => void;
  /** Callback when user wants to edit individual fields */
  onEdit?: () => void;
  /** Whether publish action is loading */
  isPublishing?: boolean;
}

/**
 * Get completed actions based on state
 */
function getCompletedActions(state: MissionState): Array<{
  icon: typeof CheckCircleIcon;
  title: string;
  description: string;
  success: boolean;
}> {
  const actions: Array<{
    icon: typeof CheckCircleIcon;
    title: string;
    description: string;
    success: boolean;
  }> = [];
  
  // Rewriter actions
  if (state.draft_content) {
    actions.push({
      icon: EditIcon,
      title: "Content Generated",
      description: state.draft_title
        ? `New title and description created (${state.draft_content.length} chars)`
        : `New description created (${state.draft_content.length} chars)`,
      success: true,
    });
  }
  
  // Value Discovery
  if (state.discovered_values && state.discovered_values.length > 0) {
    actions.push({
      icon: SearchIcon,
      title: "Values Discovered",
      description: `Found ${state.discovered_values.length} unique selling points`,
      success: true,
    });
  }
  
  // SEO Agent actions (separate from Marketing)
  if (state.seo_title || state.seo_description) {
    const seoItems = [];
    if (state.seo_title) seoItems.push("title");
    if (state.seo_description) seoItems.push("meta description");
    if (state.seo_alt_text) seoItems.push("alt-text");
    
    actions.push({
      icon: SearchIcon,
      title: "SEO Optimized",
      description: `Generated SEO ${seoItems.join(", ")}${
        state.seo_insights?.lsi_keywords_used
          ? ` with ${state.seo_insights.lsi_keywords_used.length} keywords`
          : ""
      }`,
      success: true,
    });
  }
  
  // Marketing Agent actions (social hooks only)
  if (state.social_hooks && state.social_hooks.length > 0) {
    actions.push({
      icon: HashtagIcon,
      title: "Marketing Captions Generated",
      description: `${state.social_hooks.length} social media captions ready for Instagram/TikTok`,
      success: true,
    });
  }
  
  // Template outputs
  const templateCount = Object.values(state.agent_outputs || {}).filter(
    (v) => v?.template_id
  ).length;
  if (templateCount > 0) {
    actions.push({
      icon: EditIcon,
      title: "Template Content Generated",
      description: `${templateCount} template output${templateCount > 1 ? "s" : ""} ready (scroll down to copy)`,
      success: true,
    });
  }
  
  // Visual assets
  if (state.visual_assets?.refined_url) {
    const assetCount = [
      state.visual_assets.refined_url,
      state.visual_assets.ad_url,
    ].filter(Boolean).length;
    actions.push({
      icon: EditIcon,
      title: "Visual Assets Generated",
      description: `${assetCount} AI-generated image${assetCount > 1 ? "s" : ""} (refined product added to Shopify)`,
      success: true,
    });
  }

  // Pricing actions
  if (state.pricing_analysis) {
    const { recommended_price, price_position, confidence, competitors } = state.pricing_analysis;
    actions.push({
      icon: SearchIcon,
      title: "Price Analysis Complete",
      description: recommended_price
        ? `Recommended $${recommended_price.toFixed(2)} (${confidence || 0}% confidence, ${competitors?.length || 0} competitors analyzed)`
        : `Position: ${price_position || "Unknown"}`,
      success: true,
    });
  }
  
  return actions;
}

/**
 * Extract template outputs from agent_outputs for display in summary.
 */
function getTemplateOutputs(
  state: MissionState,
): Array<{ key: string; templateId: string; templateName: string; icon: string; content: string; html: string }> {
  const outputs = state.agent_outputs || {};
  const results: Array<{ key: string; templateId: string; templateName: string; icon: string; content: string; html: string }> = [];

  for (const [key, val] of Object.entries(outputs)) {
    const templateId = val?.template_id as string | undefined;
    if (!templateId) continue;
    const draftContent = (val?.draft_content as string) || "";
    if (!draftContent) continue;
    const def = TEMPLATE_DEFINITIONS[templateId];
    results.push({
      key,
      templateId,
      templateName: def?.displayName || templateId,
      icon: def?.icon || "📄",
      content: draftContent,
      html: templateOutputToHtml(draftContent),
    });
  }

  return results;
}

/**
 * Copyable template output card.
 */
function TemplateOutputCard({
  icon,
  templateName,
  html,
  rawContent,
}: {
  icon: string;
  templateName: string;
  html: string;
  rawContent: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // Try to copy the HTML for rich paste, fallback to plaintext
      const plainText = stripHtml(html);
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        const blob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = stripHtml(html);
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [html]);

  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text as="span" variant="headingMd">{icon}</Text>
            <Text as="span" variant="headingSm" fontWeight="semibold">{templateName}</Text>
          </InlineStack>
          <Button
            variant="secondary"
            size="slim"
            icon={ClipboardIcon}
            onClick={handleCopy}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </Button>
        </InlineStack>
        <Box borderRadius="200" background="bg-surface" padding="300">
          <div
            style={{ fontSize: "14px", lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Box>
      </BlockStack>
    </Box>
  );
}

export function MissionSummary({
  state,
  onPublish,
  onDiscard,
  onEdit,
  isPublishing = false,
}: MissionSummaryProps) {
  const completedActions = getCompletedActions(state);
  const templateOutputs = useMemo(() => getTemplateOutputs(state), [state]);
  
  const isSuccess = state.status === "COMPLETED";
  const isError = state.status === "ERROR";
  
  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Icon
              source={isError ? AlertTriangleIcon : CheckCircleIcon}
              tone={isError ? "critical" : "success"}
            />
            <Text variant="headingMd" as="h2">
              {isError ? "Mission Failed" : "Mission Complete"}
            </Text>
          </InlineStack>
          
          {state.is_adhoc && state.requested_agents && (
            <Badge tone="info">
              Ad-hoc: {state.requested_agents.join(", ")}
            </Badge>
          )}
        </InlineStack>
        
        {/* Error Banner */}
        {isError && state.error_message && (
          <Banner tone="critical" title="An error occurred">
            <Text variant="bodyMd">{state.error_message}</Text>
          </Banner>
        )}
        
        <Divider />
        
        {/* Completed Actions */}
        <BlockStack gap="300">
          <Text variant="headingSm" as="h3">What We Did</Text>
          
          <BlockStack gap="300">
            {completedActions.map((action, index) => (
              <InlineStack key={index} gap="300" blockAlign="start" wrap={false}>
                <Box minWidth="20px">
                  <Icon
                    source={action.icon}
                    tone={action.success ? "success" : "caution"}
                  />
                </Box>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="semibold">
                    {action.title}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    {action.description}
                  </Text>
                </BlockStack>
              </InlineStack>
            ))}
          </BlockStack>
        </BlockStack>
        
        {/* Pricing Recommendation */}
        {state.pricing_analysis?.reasoning && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">Pricing Recommendation</Text>
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  {state.pricing_analysis.recommended_price && (
                    <InlineStack gap="200" blockAlignment="center">
                      <Text variant="bodyMd" fontWeight="semibold">Suggested Price:</Text>
                      <Badge tone="success" size="large">
                        ${state.pricing_analysis.recommended_price.toFixed(2)}
                      </Badge>
                      {state.pricing_analysis.confidence !== undefined && (
                        <Badge tone={state.pricing_analysis.confidence >= 0.7 ? "success" : "warning"}>
                          {Math.round(state.pricing_analysis.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </InlineStack>
                  )}
                  <Text variant="bodySm" tone="subdued">
                    {state.pricing_analysis.reasoning}
                  </Text>
                </BlockStack>
              </Box>
            </BlockStack>
          </>
        )}
        
        {/* Social Media Captions */}
        {state.social_hooks && state.social_hooks.length > 0 && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">Social Media Captions</Text>
              <Text variant="bodySm" tone="subdued">
                Ready-to-use captions for your social media marketing
              </Text>
              <BlockStack gap="200">
                {state.social_hooks.map((hook, i) => (
                  <Box 
                    key={i} 
                    padding="300" 
                    background="bg-surface-secondary" 
                    borderRadius="200"
                  >
                    <BlockStack gap="150">
                      <InlineStack align="space-between" blockAlignment="center">
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
                          Copy to Clipboard
                        </Button>
                      </InlineStack>
                      <Text variant="bodyMd">{hook.caption}</Text>
                      {hook.hashtags && hook.hashtags.length > 0 && (
                        <Text variant="bodySm" tone="subdued">
                          {hook.hashtags.join(" ")}
                        </Text>
                      )}
                    </BlockStack>
                  </Box>
                ))}
              </BlockStack>
            </BlockStack>
          </>
        )}
        
        {/* Template Outputs (Blog posts, Emails, Ads, FAQs, etc.) */}
        {templateOutputs.length > 0 && (
          <>
            <Divider />
            <BlockStack gap="300">
              <Text variant="headingSm" as="h3">Generated Content</Text>
              <Text variant="bodySm" tone="subdued">
                Template outputs from this mission — copy any content below
              </Text>
              <BlockStack gap="300">
                {templateOutputs.map((t) => (
                  <TemplateOutputCard
                    key={t.key}
                    icon={t.icon}
                    templateName={t.templateName}
                    html={t.html}
                    rawContent={t.content}
                  />
                ))}
              </BlockStack>
            </BlockStack>
          </>
        )}

        {/* Visual Assets Gallery */}
        {state.visual_assets?.ad_url && (
          <>
            <Divider />
            <BlockStack gap="300">
              <Text variant="headingSm" as="h3">Generated Marketing Ad</Text>
              <Text variant="bodySm" tone="subdued">
                Your marketing ad is ready. Download the image or copy the caption to post on social media.
              </Text>

              {/* Instagram Preview */}
              <InstaPreview
                imageUrl={state.visual_assets.ad_url}
                caption={state.social_hooks?.[0]?.caption || ""}
                brandName={state.shop_id?.replace(".myshopify.com", "") || undefined}
              />
            </BlockStack>
          </>
        )}

        {/* Usage Stats */}
        {state.accumulated_usage && (
          <>
            <Divider />
            <InlineStack gap="400" align="start">
              <InlineStack gap="100" blockAlign="center">
                <Icon source={ClockIcon} tone="subdued" />
                <Text variant="bodySm" tone="subdued">
                  {state.accumulated_usage.call_count || 0} AI calls
                </Text>
              </InlineStack>
              <Text variant="bodySm" tone="subdued">
                {state.accumulated_usage.total_tokens?.toLocaleString() || 0} tokens used
              </Text>
            </InlineStack>
          </>
        )}
        
        <Divider />
        
        {/* Status & Action Buttons */}
        {isSuccess ? (
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="success" size="large">✓ Published to Shopify</Badge>
              <Text variant="bodySm" tone="subdued">
                All changes have been saved
              </Text>
            </InlineStack>
            <Button onClick={onDiscard}>
              Done
            </Button>
          </InlineStack>
        ) : (
          <InlineStack gap="300" align="start">
            <Button
              variant="primary"
              onClick={onPublish}
              loading={isPublishing}
              icon={CheckCircleIcon}
            >
              Publish to Shopify
            </Button>
            
            {onEdit && (
              <Button variant="secondary" onClick={onEdit} icon={EditIcon}>
                Edit Fields
              </Button>
            )}
            
            <Button variant="plain" tone="critical" onClick={onDiscard}>
              Discard Changes
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}

export type { MissionState };
