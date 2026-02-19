import { BlockStack, Select, Text } from "@shopify/polaris";

export interface AdStyle {
  id: string;
  label: string;
  description: string;
}

const AD_STYLES: AdStyle[] = [
  { id: "aesthetic", label: "Aesthetic", description: "Soft pastels, minimalist, clean" },
  { id: "trendy", label: "Trendy", description: "Bold colors, geometric, pop" },
  { id: "nature", label: "Nature", description: "Earth tones, botanical, organic" },
  { id: "ingredients", label: "Ingredients", description: "Related items around product" },
  { id: "luxury", label: "Luxury", description: "Dark moody, spotlight, metallic" },
  { id: "studio", label: "Studio", description: "Clean white, professional lighting" },
  { id: "seasonal", label: "Seasonal", description: "Holiday decorations, festive" },
  { id: "lifestyle", label: "Lifestyle", description: "Real-world setting (home, cafe)" },
  { id: "flat_lay", label: "Flat Lay", description: "Top-down arrangement with props" },
  { id: "gradient", label: "Gradient", description: "Modern gradient, centered" },
];

const OPTIONS = AD_STYLES.map((s) => ({
  label: `${s.label} — ${s.description}`,
  value: s.id,
}));

interface AdStyleSelectorProps {
  selected: string;
  onChange: (styleId: string) => void;
  disabled?: boolean;
}

export function AdStyleSelector({ selected, onChange, disabled }: AdStyleSelectorProps) {
  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Ad Style
      </Text>
      <Select
        label="Ad Style"
        labelHidden
        options={OPTIONS}
        value={selected}
        onChange={onChange}
        disabled={disabled}
      />
    </BlockStack>
  );
}

export { AD_STYLES };
