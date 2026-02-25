import { Icon, InlineStack, Text } from "@shopify/polaris";
import { LockIcon } from "@shopify/polaris-icons";

type Props = {
  tierName: string;
};

export function PlanGateBadge({ tierName }: Props) {
  return (
    <InlineStack gap="100" blockAlign="center" wrap={false}>
      <div style={{ color: "var(--p-color-icon-magic)" }}>
        <Icon source={LockIcon} />
      </div>
      <Text as="span" variant="bodySm" tone="magic">
        {tierName}
      </Text>
    </InlineStack>
  );
}
