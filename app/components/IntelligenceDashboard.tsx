import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Box,
  Divider,
  List,
  Button,
} from '@shopify/polaris';
import { useCallback } from 'react';

export type StrategicIntelligence = {
  archetype: string;
  archetype_confidence?: number;
  secondary_archetype?: string | null;
  tonal_guardrails: {
    formality_level: string;
    energy_level: string;
    humor_tolerance: string;
    technical_depth: string;
    emotional_register: string;
  };
  linguistic_rules: {
    sentence_style: string;
    person_voice: string;
    active_passive_preference: string;
    jargon_handling: string;
  };
  power_words: string[];
  banned_phrases: string[];
  core_value_props: string[];
  differentiators: string[];
  origin_story_hooks: string[];
  cultural_touchpoints: string[];
  extraction_reasoning?: string;
};

type IntelligenceDashboardProps = {
  intelligence: StrategicIntelligence | null;
  updatedAt: string | null;
  onExtract?: () => void;
  isLoading?: boolean;
};

export function IntelligenceDashboard({
  intelligence,
  updatedAt,
  onExtract,
  isLoading = false,
}: IntelligenceDashboardProps) {
  const formatArchetype = useCallback((archetype: string) => {
    return archetype
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  if (!intelligence) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            Brand Intelligence
          </Text>
          <Text as="p" tone="subdued">
            No strategic intelligence extracted yet. Extract intelligence from your brand
            context to enable brand-enforced content generation.
          </Text>
          {onExtract && (
            <Button variant="primary" onClick={onExtract} loading={isLoading}>
              Extract Intelligence
            </Button>
          )}
        </BlockStack>
      </Card>
    );
  }

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h2">
              Brand Intelligence
            </Text>
            {updatedAt && (
              <Text as="p" tone="subdued" variant="bodySm">
                Updated {new Date(updatedAt).toLocaleDateString()}
              </Text>
            )}
          </InlineStack>

          <Divider />

          {/* Archetype */}
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">
              Brand Archetype
            </Text>
            <InlineStack gap="200">
              <Badge tone="info">{formatArchetype(intelligence.archetype)}</Badge>
              {intelligence.archetype_confidence && (
                <Text as="span" tone="subdued" variant="bodySm">
                  {Math.round(intelligence.archetype_confidence * 100)}% confidence
                </Text>
              )}
            </InlineStack>
            {intelligence.secondary_archetype && (
              <Text as="p" tone="subdued" variant="bodySm">
                Secondary: {formatArchetype(intelligence.secondary_archetype)}
              </Text>
            )}
          </BlockStack>

          <Divider />

          {/* Tonal Guardrails */}
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">
              Tonal Guardrails
            </Text>
            <List type="bullet">
              <List.Item>Formality: {intelligence.tonal_guardrails.formality_level}</List.Item>
              <List.Item>Energy: {intelligence.tonal_guardrails.energy_level}</List.Item>
              <List.Item>Emotion: {intelligence.tonal_guardrails.emotional_register}</List.Item>
              <List.Item>Technical Depth: {intelligence.tonal_guardrails.technical_depth}</List.Item>
            </List>
          </BlockStack>

          <Divider />

          {/* Power Words */}
          {intelligence.power_words && intelligence.power_words.length > 0 && (
            <>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  Power Words
                </Text>
                <InlineStack gap="100" wrap>
                  {intelligence.power_words.slice(0, 10).map((word, idx) => (
                    <Badge key={idx} tone="success">
                      {word}
                    </Badge>
                  ))}
                </InlineStack>
              </BlockStack>
              <Divider />
            </>
          )}

          {/* Banned Phrases */}
          {intelligence.banned_phrases && intelligence.banned_phrases.length > 0 && (
            <>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  Banned Phrases
                </Text>
                <InlineStack gap="100" wrap>
                  {intelligence.banned_phrases.slice(0, 10).map((phrase, idx) => (
                    <Badge key={idx} tone="critical">
                      {phrase}
                    </Badge>
                  ))}
                </InlineStack>
              </BlockStack>
              <Divider />
            </>
          )}

          {/* Value Propositions */}
          {intelligence.core_value_props && intelligence.core_value_props.length > 0 && (
            <>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  Core Value Propositions
                </Text>
                <List type="bullet">
                  {intelligence.core_value_props.map((prop, idx) => (
                    <List.Item key={idx}>{prop}</List.Item>
                  ))}
                </List>
              </BlockStack>
              <Divider />
            </>
          )}

          {/* Cultural Touchpoints */}
          {intelligence.cultural_touchpoints && intelligence.cultural_touchpoints.length > 0 && (
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">
                Cultural Touchpoints
              </Text>
              <List type="bullet">
                {intelligence.cultural_touchpoints.map((touchpoint, idx) => (
                  <List.Item key={idx}>{touchpoint}</List.Item>
                ))}
              </List>
            </BlockStack>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
