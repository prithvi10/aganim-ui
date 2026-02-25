import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { BlockStack, Button, Card, Box, Icon, InlineStack, Text } from "@shopify/polaris";
import { LockIcon } from "@shopify/polaris-icons";

type Props = {
  title: string;
  description: ReactNode;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function LockedFeatureNotice({
  title,
  description,
  ctaLabel,
  ctaUrl,
}: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">{title}</Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            {description}
          </Text>
          {ctaLabel && ctaUrl ? (
            <div>
              <Button onClick={() => navigate(ctaUrl)} variant="primary" icon={LockIcon}>
                {ctaLabel}
              </Button>
            </div>
          ) : null}
        </BlockStack>
      </Box>
    </Card>
  );
}
