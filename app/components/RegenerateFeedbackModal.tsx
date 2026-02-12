import {
  Modal,
  Text,
  TextField,
  BlockStack,
  Banner,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

interface RegenerateFeedbackModalProps {
  open: boolean;
  agentName: string;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  isLoading?: boolean;
}

function getAgentDisplayName(agentName: string | null | undefined): string {
  if (!agentName) return "Agent";
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

function getPlaceholderText(agentName: string | null | undefined): string {
  switch (agentName) {
    case "RewriterAgent":
    case "CopywriterAgent":  // Backward compat
      return "e.g., Make the description more casual and mention the sustainability aspect...";
    case "SEOAgent":
      return "e.g., Focus on different keywords, target 'luxury ceramics' instead...";
    case "MarketingAgent":
      return "e.g., Focus more on TikTok-style captions with trending hashtags...";
    case "PriceScoutAgent":
      return "e.g., Consider lower price points, this is a budget-friendly product...";
    case "ComplianceAgent":
      return "e.g., We have FDA approval for this claim, please re-check...";
    default:
      return "Provide specific instructions for regeneration...";
  }
}

function getHelpText(agentName: string | null | undefined): string {
  switch (agentName) {
    case "RewriterAgent":
    case "CopywriterAgent":  // Backward compat
      return "Tell the Rewriter what to change about the title or description. Be specific about tone, style, or content you want different.";
    case "SEOAgent":
      return "Guide the SEO agent on target keywords, search intent, or competitor positioning you want to emphasize.";
    case "MarketingAgent":
      return "Guide the Marketing agent on social media platform focus or caption style you want to emphasize.";
    case "PriceScoutAgent":
      return "Provide context about your pricing strategy, target market, or competitive positioning.";
    case "ComplianceAgent":
      return "Explain any certifications, approvals, or context that may resolve compliance flags.";
    default:
      return "Provide feedback to help the agent improve its output.";
  }
}

export function RegenerateFeedbackModal({
  open,
  agentName,
  onClose,
  onSubmit,
  isLoading,
}: RegenerateFeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  
  const handleFeedbackChange = useCallback((value: string) => {
    setFeedback(value);
  }, []);
  
  const handleSubmit = useCallback(() => {
    onSubmit(feedback);
    setFeedback(""); // Clear for next use
  }, [feedback, onSubmit]);
  
  const handleClose = useCallback(() => {
    setFeedback("");
    onClose();
  }, [onClose]);
  
  const displayName = getAgentDisplayName(agentName);
  
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Regenerate ${displayName} Output`}
      primaryAction={{
        content: feedback.trim() ? "Regenerate with Feedback" : "Regenerate Without Feedback",
        onAction: handleSubmit,
        loading: isLoading,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
          disabled: isLoading,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Banner tone="info">
            <Text as="p" variant="bodySm">
              {getHelpText(agentName)}
            </Text>
          </Banner>
          
          <TextField
            label="Feedback (optional)"
            value={feedback}
            onChange={handleFeedbackChange}
            multiline={4}
            placeholder={getPlaceholderText(agentName)}
            autoComplete="off"
            helpText="Leave empty to regenerate with the same inputs, or provide specific instructions."
          />
          
          <Text as="p" variant="bodySm" tone="subdued">
            The agent will consider your feedback when generating new output.
            You can skip providing feedback if you just want a fresh attempt.
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
