import { BlockStack, DropZone, Text, Button } from "@shopify/polaris";
import { useCallback, useState } from "react";

interface ProductImageUploaderProps {
  shopifyImageUrl?: string;
  productTitle: string;
  onCustomImage: (file: File | null) => void;
  disabled?: boolean;
}

export function ProductImageUploader({
  shopifyImageUrl,
  productTitle,
  onCustomImage,
  disabled,
}: ProductImageUploaderProps) {
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = useCallback(
    (_: File[], acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setCustomPreview(URL.createObjectURL(file));
      setFileName(file.name);
      onCustomImage(file);
    },
    [onCustomImage],
  );

  const handleRemove = useCallback(() => {
    if (customPreview) URL.revokeObjectURL(customPreview);
    setCustomPreview(null);
    setFileName(null);
    onCustomImage(null);
  }, [customPreview, onCustomImage]);

  const displayUrl = customPreview || shopifyImageUrl;

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Product Image
      </Text>

      {displayUrl ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #e1e3e5",
              background: "#fafafa",
            }}
          >
            <img
              src={displayUrl}
              alt={productTitle}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
          <Text as="p" variant="bodySm" tone="subdued">
            {customPreview ? `Custom: ${fileName}` : "From Shopify"}
          </Text>
          {customPreview && (
            <Button size="slim" onClick={handleRemove} variant="plain" tone="critical">
              Remove custom image
            </Button>
          )}
        </div>
      ) : (
        <div
          style={{
            width: "200px",
            height: "200px",
            borderRadius: "10px",
            background: "#f6f6f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <Text as="p" variant="bodySm" tone="subdued">
            No image available
          </Text>
        </div>
      )}

      <DropZone
        accept="image/*"
        type="image"
        onDrop={handleDrop}
        disabled={disabled}
        allowMultiple={false}
        variableHeight
      >
        <div style={{ padding: "12px", textAlign: "center" }}>
          <BlockStack gap="100" inlineAlign="center">
            <Text as="p" variant="bodySm">
              {shopifyImageUrl
                ? "Drop a custom image to replace the Shopify image"
                : "Drop or click to upload a product image"}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              PNG, JPG, or WebP up to 10 MB
            </Text>
          </BlockStack>
        </div>
      </DropZone>
    </BlockStack>
  );
}
