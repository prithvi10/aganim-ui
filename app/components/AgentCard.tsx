import { Card, Box, Text, BlockStack, InlineStack, Badge, ProgressBar, Spinner } from "@shopify/polaris";
import { CheckCircleIcon, AlertTriangleIcon, ClockIcon, PlayIcon } from "@shopify/polaris-icons";

export type AgentStatus = "idle" | "thinking" | "done" | "failed";

interface AgentCardProps {
  agentName: string;
  status: AgentStatus;
  logs?: string[];
  output?: {
    title?: string;
    description?: string;
    pricing?: {
      recommended_price?: number;
      price_position?: string;
      confidence?: number;
    };
    compliance?: {
      has_violations?: boolean;
      flags?: string[];
      severity?: string;
    };
  };
  duration?: number; // in milliseconds
}

function getStatusBadge(status: AgentStatus) {
  switch (status) {
    case "idle":
      return <Badge tone="info" icon={ClockIcon}>Waiting</Badge>;
    case "thinking":
      return <Badge tone="attention" icon={PlayIcon} progress="partiallyComplete">Working</Badge>;
    case "done":
      return <Badge tone="success" icon={CheckCircleIcon}>Complete</Badge>;
    case "failed":
      return <Badge tone="critical" icon={AlertTriangleIcon}>Failed</Badge>;
  }
}

function getAgentDescription(agentName: string): string {
  switch (agentName.toLowerCase()) {
    case "rewriter":
    case "copywriter":  // Backward compat
      return "Generates optimized product copy with brand context";
    case "seo":
      return "Optimizes SEO metadata and analyzes CTR";
    case "marketing":
      return "Creates social media captions and hooks";
    case "pricescout":
      return "Analyzes competitor pricing for recommendations";
    case "compliance":
      return "Checks content for regulatory compliance";
    default:
      return "Processing...";
  }
}

export function AgentCard({ agentName, status, logs = [], output, duration }: AgentCardProps) {
  const isActive = status === "thinking";
  
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                {agentName}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {getAgentDescription(agentName)}
              </Text>
            </BlockStack>
            {getStatusBadge(status)}
          </InlineStack>

          {/* Progress indicator for active state */}
          {isActive && (
            <Box>
              <InlineStack gap="200" blockAlign="center">
                <Spinner size="small" />
                <Text as="span" variant="bodySm" tone="subdued">
                  Processing...
                </Text>
              </InlineStack>
              <Box paddingBlockStart="200">
                <ProgressBar progress={50} size="small" tone="highlight" />
              </Box>
            </Box>
          )}

          {/* Output display for completed agents */}
          {status === "done" && output && (
            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
              <BlockStack gap="200">
                {/* Rewriter output */}
                {output.title && (
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Generated Title:</Text>
                    <Text as="p" variant="bodyMd">{output.title}</Text>
                  </BlockStack>
                )}

                {/* Price Scout output */}
                {output.pricing && (
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Pricing Analysis:</Text>
                    <InlineStack gap="200">
                      {output.pricing.recommended_price && (
                        <Badge tone="info">
                          Recommended: ${output.pricing.recommended_price.toFixed(2)}
                        </Badge>
                      )}
                      {output.pricing.price_position && (
                        <Badge>
                          Position: {output.pricing.price_position}
                        </Badge>
                      )}
                      {output.pricing.confidence !== undefined && (
                        <Badge tone={output.pricing.confidence > 0.7 ? "success" : "warning"}>
                          Confidence: {Math.round(output.pricing.confidence * 100)}%
                        </Badge>
                      )}
                    </InlineStack>
                  </BlockStack>
                )}

                {/* Compliance output */}
                {output.compliance && (
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" fontWeight="semibold">Compliance Check:</Text>
                    <InlineStack gap="200">
                      <Badge tone={output.compliance.has_violations ? "critical" : "success"}>
                        {output.compliance.has_violations ? "Issues Found" : "Passed"}
                      </Badge>
                      {output.compliance.severity && (
                        <Badge tone={
                          output.compliance.severity === "high" ? "critical" :
                          output.compliance.severity === "medium" ? "warning" : "info"
                        }>
                          Severity: {output.compliance.severity}
                        </Badge>
                      )}
                    </InlineStack>
                    {output.compliance.flags && output.compliance.flags.length > 0 && (
                      <Box paddingBlockStart="100">
                        <BlockStack gap="100">
                          {output.compliance.flags.slice(0, 3).map((flag, i) => (
                            <Text key={i} as="p" variant="bodySm" tone="critical">
                              • {flag}
                            </Text>
                          ))}
                          {output.compliance.flags.length > 3 && (
                            <Text as="p" variant="bodySm" tone="subdued">
                              +{output.compliance.flags.length - 3} more issues
                            </Text>
                          )}
                        </BlockStack>
                      </Box>
                    )}
                  </BlockStack>
                )}
              </BlockStack>
            </Box>
          )}

          {/* Failure display */}
          {status === "failed" && (
            <Box background="bg-surface-critical" padding="300" borderRadius="200">
              <Text as="p" variant="bodySm" tone="critical">
                Agent failed to complete. Check logs for details.
              </Text>
            </Box>
          )}

          {/* Logs (collapsible in real implementation) */}
          {logs.length > 0 && (
            <Box>
              <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                Activity Log ({logs.length})
              </Text>
              <Box paddingBlockStart="100">
                <BlockStack gap="050">
                  {logs.slice(-3).map((log, i) => (
                    <Text key={i} as="p" variant="bodySm" tone="subdued">
                      {log}
                    </Text>
                  ))}
                </BlockStack>
              </Box>
            </Box>
          )}

          {/* Duration */}
          {duration && status === "done" && (
            <Text as="p" variant="bodySm" tone="subdued">
              Completed in {(duration / 1000).toFixed(1)}s
            </Text>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
