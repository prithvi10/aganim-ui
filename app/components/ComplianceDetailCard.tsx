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
  Collapsible,
  Icon,
} from "@shopify/polaris";
import { AlertTriangleIcon, CheckIcon, XSmallIcon, ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { ComplianceTrafficLight, getComplianceSeverity } from "./ComplianceTrafficLight";

interface ComplianceFlag {
  /** The compliance issue text */
  message: string;
  /** Severity level */
  severity: "critical" | "warning" | "info";
  /** The text that triggered this flag (if available) */
  problematicText?: string;
  /** Suggested fix for this issue */
  suggestion?: string;
  /** Regulation or rule reference */
  reference?: string;
}

interface ComplianceDetailCardProps {
  /** Raw flag strings from the agent */
  flags: string[];
  /** Original product content for context */
  originalContent?: string;
  /** Structured flag details (if available) */
  flagDetails?: ComplianceFlag[];
  /** Callback when user wants to auto-fix all issues */
  onAutoFix?: () => void;
  /** Callback when user ignores a specific flag */
  onIgnoreFlag?: (flagIndex: number) => void;
  /** Callback when user wants to view regulations */
  onViewRegulations?: () => void;
  /** Whether auto-fix is currently loading */
  isAutoFixing?: boolean;
}

/**
 * Parse raw flag strings into structured ComplianceFlag objects.
 * This is a best-effort parser for flags from the agent.
 */
function parseFlags(rawFlags: string[]): ComplianceFlag[] {
  const criticalKeywords = ["fda", "ftc", "illegal", "prohibited", "banned", "cure", "treat", "prevent"];
  const warningKeywords = ["may", "could", "potentially", "claim", "guarantee"];
  
  return rawFlags.map((flag) => {
    const lowerFlag = flag.toLowerCase();
    
    let severity: ComplianceFlag["severity"] = "info";
    if (criticalKeywords.some(k => lowerFlag.includes(k))) {
      severity = "critical";
    } else if (warningKeywords.some(k => lowerFlag.includes(k))) {
      severity = "warning";
    }
    
    return {
      message: flag,
      severity,
    };
  });
}

function getSeverityBadge(severity: ComplianceFlag["severity"]) {
  switch (severity) {
    case "critical":
      return <Badge tone="critical">Critical</Badge>;
    case "warning":
      return <Badge tone="attention">Warning</Badge>;
    case "info":
      return <Badge tone="info">Info</Badge>;
  }
}

export function ComplianceDetailCard({
  flags,
  originalContent,
  flagDetails,
  onAutoFix,
  onIgnoreFlag,
  onViewRegulations,
  isAutoFixing = false,
}: ComplianceDetailCardProps) {
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());
  const [showOriginalContent, setShowOriginalContent] = useState(false);
  
  const parsedFlags = flagDetails || parseFlags(flags);
  const severity = getComplianceSeverity(flags);
  
  const toggleFlagExpanded = useCallback((index: number) => {
    setExpandedFlags(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);
  
  if (flags.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h3">Compliance Check</Text>
            <ComplianceTrafficLight flags={flags} size="small" />
          </InlineStack>
          <Banner tone="success">
            <Text variant="bodyMd">
              No compliance issues detected. Your content is safe to publish.
            </Text>
          </Banner>
        </BlockStack>
      </Card>
    );
  }
  
  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">Compliance Check</Text>
          <ComplianceTrafficLight flags={flags} size="small" />
        </InlineStack>
        
        {/* Summary Banner */}
        <Banner
          tone={severity === "critical" ? "critical" : "warning"}
          title={`${flags.length} compliance ${flags.length === 1 ? "issue" : "issues"} found`}
        >
          <Text variant="bodyMd">
            {severity === "critical"
              ? "Critical violations must be resolved before publishing."
              : "Review these warnings to ensure your content meets regulations."}
          </Text>
        </Banner>
        
        <Divider />
        
        {/* Flag List */}
        <BlockStack gap="300">
          <Text variant="headingSm" as="h4">Issues Detected</Text>
          
          {parsedFlags.map((flag, index) => (
            <Box
              key={index}
              padding="300"
              borderRadius="200"
              background="bg-surface-secondary"
            >
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="start">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon
                      source={flag.severity === "critical" ? AlertTriangleIcon : AlertTriangleIcon}
                      tone={flag.severity === "critical" ? "critical" : "caution"}
                    />
                    <Text variant="bodyMd" fontWeight="semibold">
                      Issue #{index + 1}
                    </Text>
                    {getSeverityBadge(flag.severity)}
                  </InlineStack>
                  
                  <InlineStack gap="100">
                    {onIgnoreFlag && flag.severity !== "critical" && (
                      <Button
                        size="slim"
                        variant="plain"
                        onClick={() => onIgnoreFlag(index)}
                      >
                        Ignore
                      </Button>
                    )}
                    <Button
                      size="slim"
                      variant="plain"
                      icon={expandedFlags.has(index) ? ChevronUpIcon : ChevronDownIcon}
                      onClick={() => toggleFlagExpanded(index)}
                    >
                      {expandedFlags.has(index) ? "Less" : "More"}
                    </Button>
                  </InlineStack>
                </InlineStack>
                
                <Text variant="bodyMd">{flag.message}</Text>
                
                <Collapsible open={expandedFlags.has(index)} id={`flag-${index}`}>
                  <BlockStack gap="200">
                    {flag.problematicText && (
                      <Box padding="200" background="bg-surface-critical-subdued" borderRadius="100">
                        <Text variant="bodySm" tone="critical">
                          <strong>Problematic text:</strong> "{flag.problematicText}"
                        </Text>
                      </Box>
                    )}
                    {flag.suggestion && (
                      <Text variant="bodySm" tone="subdued">
                        <strong>Suggestion:</strong> {flag.suggestion}
                      </Text>
                    )}
                    {flag.reference && (
                      <Text variant="bodySm" tone="subdued">
                        <strong>Reference:</strong> {flag.reference}
                      </Text>
                    )}
                  </BlockStack>
                </Collapsible>
              </BlockStack>
            </Box>
          ))}
        </BlockStack>
        
        {/* Original Content (Collapsible) */}
        {originalContent && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Button
                variant="plain"
                onClick={() => setShowOriginalContent(!showOriginalContent)}
                icon={showOriginalContent ? ChevronUpIcon : ChevronDownIcon}
              >
                {showOriginalContent ? "Hide" : "Show"} Original Content
              </Button>
              <Collapsible open={showOriginalContent} id="original-content">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <Text variant="bodySm" tone="subdued">
                    {originalContent.slice(0, 500)}
                    {originalContent.length > 500 && "..."}
                  </Text>
                </Box>
              </Collapsible>
            </BlockStack>
          </>
        )}
        
        <Divider />
        
        {/* Action Buttons */}
        <InlineStack gap="300" align="start">
          {onAutoFix && (
            <Button
              variant="primary"
              onClick={onAutoFix}
              loading={isAutoFixing}
              icon={CheckIcon}
            >
              Auto-Fix All Issues
            </Button>
          )}
          {onViewRegulations && (
            <Button variant="plain" onClick={onViewRegulations}>
              View Regulations
            </Button>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

export type { ComplianceFlag };
