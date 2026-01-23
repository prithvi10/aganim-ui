import type { ReactNode } from "react";
import { Banner, BlockStack, Button, Icon, InlineStack, Text } from "@shopify/polaris";
import { LockIcon } from "@shopify/polaris-icons";

type Props = {
  /** e.g. "Standard Plan Feature" / "Pro Plan Feature" */
  title: string;
  /** Main description shown under the title */
  description: ReactNode;
  /** Optional CTA */
  ctaLabel?: string;
  ctaUrl?: string;
  /** Banner tone */
  tone?: "info" | "warning" | "critical" | "success";
};

export function LockedFeatureNotice({
  title,
  description,
  ctaLabel,
  ctaUrl,
  tone = "info",
}: Props) {
  return (
    <Banner tone={tone}>
      <BlockStack gap="200">
        <InlineStack gap="200" blockAlign="center">
          <Icon source={LockIcon} tone="magic" />
          <Text as="p" variant="bodyMd">
            <strong>{title}:</strong> {description}
          </Text>
        </InlineStack>
        {ctaLabel && ctaUrl ? (
          <div>
            <Button url={ctaUrl} variant="primary">
              {ctaLabel}
            </Button>
          </div>
        ) : null}
      </BlockStack>
    </Banner>
  );
}

