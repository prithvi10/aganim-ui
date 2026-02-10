import {
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  Button,
  Icon,
} from '@shopify/polaris';
import {
  NoteIcon,
  EmailIcon,
  SocialPostIcon,
  BlogIcon,
  TargetIcon,
} from '@shopify/polaris-icons';

export type Template = {
  id: string;
  name: string;
  category: 'product' | 'marketing';
  agent_type: 'rewriter' | 'marketing';
  description: string;
  output_format: string;
  inputs: Array<{
    name: string;
    label: string;
    required: boolean;
    input_type: string;
    description: string;
  }>;
};

type TemplateGalleryProps = {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  category?: 'product' | 'marketing' | null;
};

const getTemplateIcon = (templateId: string) => {
  if (templateId.includes('email')) return EmailIcon;
  if (templateId.includes('social') || templateId.includes('tiktok')) return SocialPostIcon;
  if (templateId.includes('blog')) return BlogIcon;
  if (templateId.includes('ad')) return TargetIcon;
  return NoteIcon;
};

export function TemplateGallery({
  templates,
  onSelectTemplate,
  category,
}: TemplateGalleryProps) {
  const filteredTemplates = category
    ? templates.filter((t) => t.category === category)
    : templates;

  // Compute columns: fit all cards in one row, min 1 max 6
  const colCount = Math.max(1, Math.min(filteredTemplates.length, 6));

  return (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h2">
        Content Templates
      </Text>
      <InlineGrid columns={{ xs: 1, sm: 2, md: Math.min(colCount, 3), lg: colCount }} gap="400">
        {filteredTemplates.map((template) => {
          const IconComponent = getTemplateIcon(template.id);

          return (
            <Card key={template.id}>
              <BlockStack gap="300">
                <InlineStack gap="100" blockAlign="center" wrap={false}>
                  <Icon source={IconComponent} tone="base" />
                  <Text variant="headingSm" as="h3">
                    {template.name}
                  </Text>
                </InlineStack>

                <Text as="p" tone="subdued" variant="bodySm">
                  {template.description}
                </Text>

                <Button
                  variant="primary"
                  onClick={() => onSelectTemplate(template)}
                  fullWidth
                >
                  Use Template
                </Button>
              </BlockStack>
            </Card>
          );
        })}
      </InlineGrid>
    </BlockStack>
  );
}
