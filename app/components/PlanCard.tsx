import { Card, Box, Text, BlockStack, InlineStack, Badge, ExceptionList } from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import type { ReactNode } from "react";

import type { PlanCardModel } from "../utils/planCatalog";

export function PlanCard({
  plan,
  isCurrent,
  graceActive,
  cta,
  height = 480,
}: {
  plan: PlanCardModel;
  isCurrent: boolean;
  graceActive: boolean;
  cta: ReactNode;
  height?: number;
}) {
  return (
    <Card>
      <div style={{ height, padding: "var(--p-space-400)" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header (fixed) */}
          <div>
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">
                <InlineStack gap="200" align="space-between">
                  <span>{plan.name}</span>
                  {isCurrent ? (
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="success">Active</Badge>
                      {graceActive ? <Badge tone="info">Grace</Badge> : null}
                    </InlineStack>
                  ) : null}
                </InlineStack>
              </Text>
              <Text as="p" variant="heading2xl" fontWeight="bold">
                {plan.price}
                <Text as="span" variant="bodyMd" fontWeight="regular">
                  /month
                </Text>
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {plan.rewrites}
              </Text>
            </BlockStack>
          </div>

          {/* Features (scrollable) */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2 }}>
            <BlockStack gap="200">
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Rewriter
                  </Text>
                  <BlockStack gap="100">
                    {plan.rewriterFeatures.map((feature) => (
                      <ExceptionList
                        key={`rewriter-${plan.name}-${feature}`}
                        items={[
                          {
                            icon: CheckIcon,
                            description: feature,
                          },
                        ]}
                      />
                    ))}
                  </BlockStack>
                </BlockStack>
              </Box>

              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Marketing
                  </Text>
                  <BlockStack gap="100">
                    {plan.marketingFeatures.map((feature) => (
                      <ExceptionList
                        key={`marketing-${plan.name}-${feature}`}
                        items={[
                          {
                            icon: CheckIcon,
                            description: feature,
                          },
                        ]}
                      />
                    ))}
                  </BlockStack>
                </BlockStack>
              </Box>

              {plan.otherFeatures.length ? (
                <BlockStack gap="100">
                  <Text as="h3" variant="headingSm">
                    Other
                  </Text>
                  {plan.otherFeatures.map((feature) => (
                    <ExceptionList
                      key={`other-${plan.name}-${feature}`}
                      items={[
                        {
                          icon: CheckIcon,
                          description: feature,
                        },
                      ]}
                    />
                  ))}
                </BlockStack>
              ) : null}
            </BlockStack>
          </div>

          {/* CTA (fixed to bottom) */}
          <div style={{ paddingTop: 16, marginTop: "auto" }}>{cta}</div>
        </div>
      </div>
    </Card>
  );
}

