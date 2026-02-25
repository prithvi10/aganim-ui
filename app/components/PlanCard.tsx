import { Card, Box, Text, BlockStack, InlineStack, Badge, Collapsible, ExceptionList } from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { useState, useCallback, type ReactNode } from "react";

import type { PlanCardModel, PlanFeature, PlanSection } from "../utils/planCatalog";
import "../styles/plan-card.css";

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <ExceptionList
      items={[
        {
          icon: CheckIcon,
          description: feature.label as unknown as string,
        },
      ]}
    />
  );
}

function ExpandableSection({ section, planName }: { section: PlanSection; planName: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="300">
      <div
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(); }}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        <Text as="h3" variant="headingMd">
          {section.title}
        </Text>
      </div>
      <Collapsible open={open} id={`${planName}-${section.title}`}>
        <div style={{ paddingTop: 10 }}>
          <BlockStack gap="200">
            {section.features.map((feature) => (
              <FeatureRow
                key={`${planName}-${section.title}-${feature.label}`}
                feature={feature}
              />
            ))}
          </BlockStack>
        </div>
      </Collapsible>
    </Box>
  );
}

export function PlanCard({
  plan,
  isCurrent,
  graceActive,
  extraBadges,
  priceNode,
  cta,
  accentClass,
}: {
  plan: PlanCardModel;
  isCurrent: boolean;
  graceActive: boolean;
  extraBadges?: ReactNode;
  priceNode?: ReactNode;
  cta: ReactNode;
  accentClass?: string;
}) {
  return (
    <div className={`plan-card-stretch ${accentClass ? "plan-card-accent " + accentClass : ""}`}>
      <Card>
        <div style={{ padding: "var(--p-space-500)", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
          {/* Header */}
          <div>
            <BlockStack gap="300">
              <Text as="h2" variant="headingXl">
                <InlineStack gap="200" align="space-between">
                  <span>{plan.name}</span>
                  {isCurrent || extraBadges ? (
                    <InlineStack gap="200" blockAlign="center">
                      {isCurrent ? <Badge tone="success">Active</Badge> : null}
                      {isCurrent && graceActive ? <Badge tone="info">Grace</Badge> : null}
                      {extraBadges}
                    </InlineStack>
                  ) : null}
                </InlineStack>
              </Text>
              {priceNode ? (
                priceNode
              ) : (
                <Text as="p" variant="heading3xl" fontWeight="bold">
                  {plan.price}
                  {plan.price !== "$0" ? (
                    <Text as="span" variant="bodyLg" fontWeight="regular">
                      /month
                    </Text>
                  ) : null}
                </Text>
              )}
              {plan.tagline ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {plan.tagline}
                </Text>
              ) : null}
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                {plan.productLimit}
              </Text>
            </BlockStack>
          </div>

          {/* Sections */}
          <div style={{ flex: 1, marginTop: 16 }}>
            <BlockStack gap="300">
              {plan.sections.map((section) => (
                <ExpandableSection
                  key={`${plan.name}-${section.title}`}
                  section={section}
                  planName={plan.name}
                />
              ))}
            </BlockStack>
          </div>

          {/* CTA */}
          <div style={{ paddingTop: 20, marginTop: "auto" }}>{cta}</div>
        </div>
      </Card>
    </div>
  );
}
