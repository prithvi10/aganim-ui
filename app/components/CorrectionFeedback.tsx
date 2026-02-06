import { useState, useCallback } from "react";
import { Card, Box, Text, BlockStack, InlineStack, Button, TextField, Banner, Badge } from "@shopify/polaris";

interface CorrectionFeedbackProps {
  agentRole: string;
  originalOutput: string;
  productId?: string;
  apiBaseUrl: string;
  authToken?: string;
  onSubmitted?: () => void;
}

export function CorrectionFeedback({
  agentRole,
  originalOutput,
  productId,
  apiBaseUrl,
  authToken,
  onSubmitted,
}: CorrectionFeedbackProps) {
  const [correctedText, setCorrectedText] = useState(originalOutput);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = correctedText !== originalOutput;

  const handleSubmit = useCallback(async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/corrections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          agent_role: agentRole,
          original_output: originalOutput,
          user_correction: correctedText,
          product_id: productId,
          context_metadata: {
            submitted_at: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit correction: ${response.statusText}`);
      }

      setSubmitted(true);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit correction");
    } finally {
      setIsSubmitting(false);
    }
  }, [hasChanges, correctedText, originalOutput, agentRole, productId, apiBaseUrl, authToken, onSubmitted]);

  const handleReset = useCallback(() => {
    setCorrectedText(originalOutput);
    setError(null);
  }, [originalOutput]);

  if (submitted) {
    return (
      <Card>
        <Box padding="400">
          <Banner tone="success" title="Feedback Submitted">
            <p>
              Thank you for your correction! The AI will learn from this feedback
              to improve future generations.
            </p>
          </Banner>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h3" variant="headingMd">
                Improve AI Output
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Edit the generated content to help the {agentRole} agent learn
              </Text>
            </BlockStack>
            <Badge tone={hasChanges ? "attention" : "info"}>
              {hasChanges ? "Modified" : "No changes"}
            </Badge>
          </InlineStack>

          {/* Error banner */}
          {error && (
            <Banner tone="critical" title="Submission Failed">
              <p>{error}</p>
            </Banner>
          )}

          {/* Original output (read-only) */}
          <Box background="bg-surface-secondary" padding="300" borderRadius="200">
            <BlockStack gap="200">
              <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                Original Output
              </Text>
              <Text as="p" variant="bodyMd">
                {originalOutput.length > 500
                  ? originalOutput.slice(0, 500) + "..."
                  : originalOutput}
              </Text>
            </BlockStack>
          </Box>

          {/* Editable correction */}
          <TextField
            label="Your Correction"
            value={correctedText}
            onChange={setCorrectedText}
            multiline={6}
            autoComplete="off"
            helpText="Make any changes you'd like to see in future generations"
          />

          {/* Diff indicator */}
          {hasChanges && (
            <Box background="bg-surface-success" padding="200" borderRadius="200">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success">Changes Detected</Badge>
                <Text as="span" variant="bodySm">
                  Your corrections will be saved to improve future AI outputs for your store.
                </Text>
              </InlineStack>
            </Box>
          )}

          {/* Actions */}
          <InlineStack gap="200" align="end">
            <Button onClick={handleReset} disabled={!hasChanges || isSubmitting}>
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!hasChanges}
            >
              Submit Feedback
            </Button>
          </InlineStack>

          {/* Privacy note */}
          <Text as="p" variant="bodySm" tone="subdued">
            Your corrections are stored securely and only used to improve AI outputs
            for your store. They are never shared with other merchants.
          </Text>
        </BlockStack>
      </Box>
    </Card>
  );
}
