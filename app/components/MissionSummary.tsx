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
  LockIcon,
  HashtagIcon,
  ClockIcon,
  AlertTriangleIcon,
} from "@shopify/polaris-icons";
import { ComplianceTrafficLight, getComplianceSeverity } from "./ComplianceTrafficLight";

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
  
  // Compliance actions
  if (state.compliance_flags !== undefined) {
    const flagCount = state.compliance_flags.length;
    const severity = getComplianceSeverity(state.compliance_flags);
    actions.push({
      icon: LockIcon,
      title: "Compliance Checked",
      description: flagCount === 0
        ? "No compliance issues detected"
        : `${flagCount} ${flagCount === 1 ? "issue" : "issues"} found (${severity})`,
      success: flagCount === 0,
    });
  }
  
  return actions;
}

export function MissionSummary({
  state,
  onPublish,
  onDiscard,
  onEdit,
  isPublishing = false,
}: MissionSummaryProps) {
  const completedActions = getCompletedActions(state);
  const complianceFlags = state.compliance_flags || [];
  const complianceSeverity = getComplianceSeverity(complianceFlags);
  const hasBlockingIssues = complianceSeverity === "critical";
  
  const isSuccess = state.status === "COMPLETED";
  const isError = state.status === "ERROR";
  const isComplianceReview = state.status === "COMPLIANCE_REVIEW";
  
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
              {isError
                ? "Mission Failed"
                : isComplianceReview
                ? "Review Required"
                : "Mission Complete"}
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
        
        {/* Compliance Warning */}
        {hasBlockingIssues && (
          <Banner tone="critical" title="Critical Compliance Issues">
            <Text variant="bodyMd">
              This content has critical compliance violations that must be resolved before publishing.
            </Text>
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
        
        {/* Compliance Status */}
        {complianceFlags !== undefined && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">Compliance Status</Text>
              <ComplianceTrafficLight
                flags={complianceFlags}
                size="large"
                showDetails={complianceFlags.length > 0 && complianceFlags.length <= 3}
              />
            </BlockStack>
          </>
        )}
        
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
                          onClick={() => {
                            const text = hook.copy_text || hook.caption || "";
                            navigator.clipboard.writeText(text);
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
        
        {/* Action Buttons */}
        <InlineStack gap="300" align="start">
          <Button
            variant="primary"
            onClick={onPublish}
            loading={isPublishing}
            disabled={hasBlockingIssues}
            icon={CheckCircleIcon}
          >
            {hasBlockingIssues ? "Fix Issues to Publish" : "Publish to Shopify"}
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
        
        {hasBlockingIssues && (
          <Text variant="bodySm" tone="subdued">
            Resolve critical compliance issues before publishing, or edit the content manually.
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

export type { MissionState };
