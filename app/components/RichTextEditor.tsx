import {
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Select,
  Text,
} from "@shopify/polaris";
import {
  LinkIcon,
  ListBulletedIcon,
  ListNumberedIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@shopify/polaris-icons";
import { useCallback, useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  /** Label shown above the editor */
  label: string;
  /** Current HTML value */
  value: string;
  /** Callback when content changes */
  onChange: (html: string) => void;
  /** Editor height in pixels */
  height?: number;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Help text shown below the editor */
  helpText?: string;
}

/**
 * A Shopify-like rich text editor with HTML support.
 * 
 * Features:
 * - Bold, Italic, Underline formatting
 * - Paragraph, Heading, Subheading block types
 * - Bulleted and numbered lists
 * - Link insertion
 * - Proper HTML rendering
 */
export function RichTextEditor({
  label,
  value,
  onChange,
  height = 200,
  disabled = false,
  helpText,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [blockType, setBlockType] = useState<"p" | "h2" | "h3">("p");

  // Keep the editor showing rendered HTML without forcing cursor jumps while typing
  useEffect(() => {
    if (!ref.current) return;
    if (isFocused) return;
    if (ref.current.innerHTML === value) return;
    ref.current.innerHTML = value || "";
  }, [value, isFocused]);

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      if (disabled) return;
      try {
        document.execCommand(command, false, commandValue);
        if (ref.current) onChange(ref.current.innerHTML);
      } catch {
        // no-op
      }
    },
    [onChange, disabled]
  );

  const applyBlockType = useCallback(
    (next: "p" | "h2" | "h3") => {
      if (disabled) return;
      setBlockType(next);
      // Make Enter create <p> blocks (closer to Shopify's editor behavior)
      try {
        document.execCommand("defaultParagraphSeparator", false, "p");
      } catch {
        // no-op
      }
      // Apply format block to current selection
      const tag = next === "p" ? "p" : next;
      exec("formatBlock", tag);
    },
    [exec, disabled]
  );

  const insertLink = useCallback(() => {
    if (disabled) return;
    const url = window.prompt("Enter URL");
    if (!url) return;
    exec("createLink", url);
  }, [exec, disabled]);

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" fontWeight="semibold">
        {label}
      </Text>

      {/* Shopify-like typography for headings/lists inside the editor surface */}
      <style>
        {`
          .shopifyRte h2 { font-size: 28px; line-height: 34px; font-weight: 700; margin: 0 0 14px; }
          .shopifyRte h3 { font-size: 22px; line-height: 28px; font-weight: 700; margin: 18px 0 10px; }
          .shopifyRte h4 { font-size: 18px; line-height: 24px; font-weight: 650; margin: 14px 0 8px; }
          .shopifyRte p  { margin: 0 0 12px; }
          .shopifyRte ul, .shopifyRte ol { margin: 0 0 12px 20px; padding: 0; }
          .shopifyRte li { margin: 4px 0; }
          .shopifyRte hr { margin: 16px 0; }
          .shopifyRte table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .shopifyRte th, .shopifyRte td { border: 1px solid #d0d0d0; padding: 10px 12px; vertical-align: top; }
          .shopifyRte th { background: #f6f6f7; font-weight: 650; text-align: left; width: 36%; }
          .shopifyRte a { color: var(--p-color-text-interactive); text-decoration: underline; }
          .shopifyRte strong, .shopifyRte b { font-weight: 700; }
          .shopifyRte em, .shopifyRte i { font-style: italic; }
          .shopifyRte u { text-decoration: underline; }
        `}
      </style>

      <Box
        borderColor="border"
        borderWidth="025"
        borderRadius="200"
        background="bg-surface"
      >
        {/* Toolbar (Shopify-like) */}
        <Box padding="200" background="bg-surface-secondary">
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "nowrap",
              overflowX: "auto",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <div style={{ minWidth: 128, maxWidth: 170, flex: "0 0 auto" }}>
              <Select
                label=""
                labelHidden
                options={[
                  { label: "Paragraph", value: "p" },
                  { label: "Heading", value: "h2" },
                  { label: "Subheading", value: "h3" },
                ]}
                value={blockType}
                onChange={(v) => applyBlockType(v as "p" | "h2" | "h3")}
                disabled={disabled}
              />
            </div>

            <ButtonGroup>
              <Button
                size="micro"
                accessibilityLabel="Bold"
                icon={TextBoldIcon}
                onClick={() => exec("bold")}
                disabled={disabled}
              />
              <Button
                size="micro"
                accessibilityLabel="Italic"
                icon={TextItalicIcon}
                onClick={() => exec("italic")}
                disabled={disabled}
              />
              <Button
                size="micro"
                accessibilityLabel="Underline"
                icon={TextUnderlineIcon}
                onClick={() => exec("underline")}
                disabled={disabled}
              />
            </ButtonGroup>

            <ButtonGroup>
              <Button
                size="micro"
                accessibilityLabel="Bulleted list"
                icon={ListBulletedIcon}
                onClick={() => exec("insertUnorderedList")}
                disabled={disabled}
              />
              <Button
                size="micro"
                accessibilityLabel="Numbered list"
                icon={ListNumberedIcon}
                onClick={() => exec("insertOrderedList")}
                disabled={disabled}
              />
            </ButtonGroup>

            <Button
              size="micro"
              accessibilityLabel="Insert link"
              icon={LinkIcon}
              onClick={insertLink}
              disabled={disabled}
            />
          </div>
        </Box>
        <Divider />

        {/* Editor surface */}
        <div
          ref={ref}
          className="shopifyRte"
          contentEditable={!disabled}
          suppressContentEditableWarning
          onFocus={() => {
            if (disabled) return;
            setIsFocused(true);
            try {
              document.execCommand("defaultParagraphSeparator", false, "p");
            } catch {
              // no-op
            }
          }}
          onBlur={() => setIsFocused(false)}
          onInput={() => {
            if (ref.current && !disabled) onChange(ref.current.innerHTML);
          }}
          style={{
            padding: 16,
            minHeight: height,
            maxHeight: height,
            overflowY: "auto",
            // Match Shopify Admin editor feel (typography + spacing)
            fontSize: 16,
            lineHeight: "24px",
            fontFamily: "var(--p-font-family-sans)",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.7 : 1,
          }}
        />
      </Box>

      {helpText && (
        <Text as="p" variant="bodySm" tone="subdued">
          {helpText}
        </Text>
      )}
    </BlockStack>
  );
}

/**
 * Read-only HTML preview component that renders HTML like it will appear on the product page.
 */
export function HtmlPreview({
  label,
  value,
  height = 150,
}: {
  label: string;
  value: string;
  height?: number;
}) {
  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" fontWeight="semibold">
        {label}
      </Text>

      {/* Same Shopify-like typography */}
      <style>
        {`
          .shopifyRtePreview h2 { font-size: 28px; line-height: 34px; font-weight: 700; margin: 0 0 14px; }
          .shopifyRtePreview h3 { font-size: 22px; line-height: 28px; font-weight: 700; margin: 18px 0 10px; }
          .shopifyRtePreview h4 { font-size: 18px; line-height: 24px; font-weight: 650; margin: 14px 0 8px; }
          .shopifyRtePreview p  { margin: 0 0 12px; }
          .shopifyRtePreview ul, .shopifyRtePreview ol { margin: 0 0 12px 20px; padding: 0; }
          .shopifyRtePreview li { margin: 4px 0; }
          .shopifyRtePreview hr { margin: 16px 0; }
          .shopifyRtePreview table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .shopifyRtePreview th, .shopifyRtePreview td { border: 1px solid #d0d0d0; padding: 10px 12px; vertical-align: top; }
          .shopifyRtePreview th { background: #f6f6f7; font-weight: 650; text-align: left; width: 36%; }
          .shopifyRtePreview a { color: var(--p-color-text-interactive); text-decoration: underline; }
          .shopifyRtePreview strong, .shopifyRtePreview b { font-weight: 700; }
          .shopifyRtePreview em, .shopifyRtePreview i { font-style: italic; }
          .shopifyRtePreview u { text-decoration: underline; }
        `}
      </style>

      <Box
        borderColor="border"
        borderWidth="025"
        borderRadius="200"
        background="bg-surface-secondary"
        padding="400"
      >
        <div
          className="shopifyRtePreview"
          style={{
            minHeight: height,
            maxHeight: height,
            overflowY: "auto",
            fontSize: 16,
            lineHeight: "24px",
            fontFamily: "var(--p-font-family-sans)",
          }}
          dangerouslySetInnerHTML={{ __html: value || "<p>No content</p>" }}
        />
      </Box>
    </BlockStack>
  );
}

export default RichTextEditor;
