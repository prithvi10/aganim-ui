import { Badge, Box, BlockStack, InlineStack, Text, Icon, Tooltip } from "@shopify/polaris";
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon, InfoIcon } from "@shopify/polaris-icons";

export type ComplianceSeverity = "safe" | "warning" | "critical";

interface ComplianceTrafficLightProps {
  /** List of compliance flags/violations */
  flags: string[];
  /** Whether to show the flag details below the indicator */
  showDetails?: boolean;
  /** Callback when "View Details" is clicked */
  onViewDetails?: () => void;
  /** Size of the traffic light - "small" for inline, "large" for prominent display */
  size?: "small" | "large";
}

/**
 * Determine the severity level based on compliance flags.
 * - 0 flags = Safe (Green)
 * - 1-2 non-critical flags = Warning (Yellow)
 * - 3+ flags or any critical flag = Critical (Red)
 */
function determineSeverity(flags: string[]): ComplianceSeverity {
  if (flags.length === 0) return "safe";
  
  // Check for critical keywords in flags
  const criticalKeywords = ["fda", "ftc", "illegal", "prohibited", "banned", "lawsuit", "liability"];
  const hasCritical = flags.some(flag => 
    criticalKeywords.some(keyword => flag.toLowerCase().includes(keyword))
  );
  
  if (hasCritical || flags.length >= 3) return "critical";
  return "warning";
}

function getStatusConfig(severity: ComplianceSeverity) {
  switch (severity) {
    case "safe":
      return {
        tone: "success" as const,
        icon: CheckCircleIcon,
        label: "Safe",
        description: "No compliance issues detected",
        color: "#008060",
      };
    case "warning":
      return {
        tone: "attention" as const,
        icon: AlertTriangleIcon,
        label: "Warning",
        description: "Minor compliance issues found",
        color: "#B98900",
      };
    case "critical":
      return {
        tone: "critical" as const,
        icon: XCircleIcon,
        label: "Critical",
        description: "Serious compliance violations detected",
        color: "#D72C0D",
      };
  }
}

export function ComplianceTrafficLight({
  flags,
  showDetails = false,
  onViewDetails,
  size = "small",
}: ComplianceTrafficLightProps) {
  const severity = determineSeverity(flags);
  const config = getStatusConfig(severity);
  
  if (size === "small") {
    return (
      <Tooltip content={config.description}>
        <Badge tone={config.tone} icon={config.icon}>
          {config.label}
          {flags.length > 0 && ` (${flags.length})`}
        </Badge>
      </Tooltip>
    );
  }
  
  // Large size - prominent display
  return (
    <Box
      padding="400"
      borderRadius="200"
      background={
        severity === "safe" ? "bg-surface-success" :
        severity === "warning" ? "bg-surface-warning" :
        "bg-surface-critical"
      }
    >
      <BlockStack gap="300" align="center">
        <InlineStack gap="200" align="center">
          <Icon source={config.icon} tone={config.tone} />
          <Text variant="headingMd" as="h3">
            {config.label}
          </Text>
        </InlineStack>
        
        <Text variant="bodyMd" tone="subdued" alignment="center">
          {config.description}
        </Text>
        
        {flags.length > 0 && (
          <Badge tone={config.tone}>
            {flags.length} {flags.length === 1 ? "issue" : "issues"} found
          </Badge>
        )}
        
        {showDetails && flags.length > 0 && (
          <BlockStack gap="200">
            {flags.slice(0, 3).map((flag, index) => (
              <InlineStack key={index} gap="100" align="start">
                <Icon source={InfoIcon} tone="subdued" />
                <Text variant="bodySm" tone="subdued">
                  {flag}
                </Text>
              </InlineStack>
            ))}
            {flags.length > 3 && (
              <Text variant="bodySm" tone="subdued">
                +{flags.length - 3} more...
              </Text>
            )}
          </BlockStack>
        )}
        
        {onViewDetails && flags.length > 0 && (
          <button
            onClick={onViewDetails}
            style={{
              background: "none",
              border: "none",
              color: config.color,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "14px",
            }}
          >
            View All Details
          </button>
        )}
      </BlockStack>
    </Box>
  );
}

/**
 * Utility function to get compliance severity from flags.
 * Useful for external components that need to check severity.
 */
export function getComplianceSeverity(flags: string[]): ComplianceSeverity {
  return determineSeverity(flags);
}

/**
 * Utility function to check if flags contain critical violations.
 */
export function hasCriticalViolations(flags: string[]): boolean {
  return determineSeverity(flags) === "critical";
}
