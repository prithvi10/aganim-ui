import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Modal,
  Text,
} from "@shopify/polaris";

type Props = {
  shop: string;
  host: string;
};

function shopSlugFromDomain(shop: string) {
  return String(shop || "").replace(".myshopify.com", "");
}

export function GetStartedGuide({ shop, host }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (host) p.set("host", host);
    if (shop) p.set("shop", shop);
    return p.toString();
  }, [host, shop]);

  const nav = useCallback(
    (path: string) => (qs ? `${path}?${qs}` : path),
    [qs],
  );

  const shopSlug = shopSlugFromDomain(shop);
  const themeEditorUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/themes/current/editor?context=apps`
    : "https://admin.shopify.com/";

  const steps = useMemo(
    () => [
      {
        title: "Step 1: Product actions",
        subtitle: "Start with Rewriter or Marketing",
        imageSrc: "/guide-step-1.png",
        body: "Pick what you want to do first. You can always come back and follow the rest of the steps.",
        actions: [
          { label: "Open Rewriter", onClick: () => navigate(nav("/app/rewriter")) },
          { label: "Open Marketing", onClick: () => navigate(nav("/app/marketing")) },
        ],
      },
      {
        title: "Step 2: Rewriter workspace",
        subtitle: "Choose a product and market",
        imageSrc: "/guide-step-2.png",
        body: "Open Rewriter, pick a product, and select your target market(s).",
        actions: [{ label: "Open Rewriter", onClick: () => navigate(nav("/app/rewriter")) }],
      },
      {
        title: "Step 3: Optimize with Rewriter",
        subtitle: "Generate localized copy + SEO",
        imageSrc: "/guide-step-3.png",
        body: "Click “Optimize for Global” to generate drafts and SEO details, then save to Shopify.",
        actions: [{ label: "Go to Rewriter", onClick: () => navigate(nav("/app/rewriter")) }],
      },
      {
        title: "Step 4: Product Marketing workspace",
        subtitle: "Create social hooks / captions",
        imageSrc: "/guide-step-4.png",
        body: "Use Marketing to generate Instagram-ready hooks and save them to metafields.",
        actions: [{ label: "Open Marketing", onClick: () => navigate(nav("/app/marketing")) }],
      },
      {
        title: "Step 5: Theme Editor (Live view)",
        subtitle: "Enable app embed and preview storefront",
        imageSrc: "/guide-step-5.png",
        body: "Open the Theme Editor, enable the app embed, and preview storefront localization live.",
        actions: [
          {
            label: "Open Theme Editor",
            onClick: () => window.open(themeEditorUrl, "_top"),
          },
        ],
      },
      {
        title: "Step 6: Dashboard",
        subtitle: "Monitor usage + plan features",
        imageSrc: "/guide-step-6.png",
        body: "Use Dashboard to see your plan, usage, and what’s unlocked.",
        actions: [{ label: "Open Dashboard", onClick: () => navigate(nav("/app/dashboard")) }],
      },
    ],
    [navigate, nav, themeEditorUrl],
  );

  const current = steps[activeIndex];
  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(steps.length - 1, i + 1));
  }, [steps.length]);
  const goBack = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  return (
    <>
      <Card>
        <Box padding="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              Get started guide
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Learn how to use Cross-Border AI with a quick step-by-step guide.
            </Text>
            <div>
              <Button variant="primary" onClick={() => setOpen(true)}>
                Open guide
              </Button>
            </div>
          </BlockStack>
        </Box>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Get started with Cross-Border AI"
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Box>
              <img
                src={current?.imageSrc}
                alt={current?.subtitle || "Guide step"}
                style={{
                  width: "100%",
                  maxHeight: 360,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--p-color-border-secondary)",
                }}
              />
              <Text as="p" variant="bodySm" tone="subdued">
                Put an image at <code>/public{String(current?.imageSrc || "")}</code>
              </Text>
            </Box>

            <BlockStack gap="100">
              <Text as="h3" variant="headingMd">
                {current?.title}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {current?.subtitle}
              </Text>
            </BlockStack>

            <Text as="p" variant="bodyMd">
              {current?.body}
            </Text>

            <InlineStack gap="200">
              {(current?.actions || []).map((a) => (
                <Button
                  key={a.label}
                  variant="primary"
                  onClick={() => {
                    setOpen(false);
                    a.onClick();
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </InlineStack>

            {/* Footer (matches screenshot layout: step count + next) */}
            <div style={{ paddingTop: 8 }}>
              <InlineStack align="space-between" blockAlign="center">
                <Button variant="tertiary" disabled={activeIndex === 0} onClick={goBack}>
                  Back
                </Button>
                <Text as="p" variant="bodySm" tone="subdued">
                  {`${activeIndex + 1} of ${steps.length}`}
                </Text>
                <Button
                  variant="primary"
                  disabled={activeIndex >= steps.length - 1}
                  onClick={goNext}
                >
                  Next
                </Button>
              </InlineStack>
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

