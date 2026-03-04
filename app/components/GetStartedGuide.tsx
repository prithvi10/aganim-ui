import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
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
  open?: boolean;
  onClose?: () => void;
};

function shopSlugFromDomain(shop: string) {
  return String(shop || "").replace(".myshopify.com", "");
}

export function GetStartedGuide({ shop, host, open: controlledOpen, onClose: controlledOnClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Use controlled props if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

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

  const steps = useMemo(
    () => [
      {
        title: t("components.step1ProductActions"),
        subtitle: t("components.step1Subtitle"),
        imageSrc: "/guide-step-1.png",
        body: t("components.step1Body"),
        actions: [
          { label: `🚀 ${t("components.optimizeAll")}`, onClick: () => navigate(nav("/app/optimize")), primary: true },
          { label: t("components.openRewriter"), onClick: () => navigate(nav("/app/rewriter")) },
          { label: t("components.openMarketing"), onClick: () => navigate(nav("/app/marketing")) },
        ],
      },
      {
        title: t("components.step2RewriterWorkspace"),
        subtitle: t("components.step2Subtitle"),
        imageSrc: "/guide-step-2.png",
        body: t("components.step2Body"),
        actions: [{ label: t("components.openRewriter"), onClick: () => navigate(nav("/app/rewriter")) }],
      },
      {
        title: t("components.step3OptimizeWithRewriter"),
        subtitle: t("components.step3Subtitle"),
        imageSrc: "/guide-step-3.png",
        body: t("components.step3Body"),
        actions: [{ label: t("components.goToRewriter"), onClick: () => navigate(nav("/app/rewriter")) }],
      },
      {
        title: t("components.step4ProductMarketing"),
        subtitle: t("components.step4Subtitle"),
        imageSrc: "/guide-step-4.png",
        body: t("components.step4Body"),
        actions: [{ label: t("components.openMarketing"), onClick: () => navigate(nav("/app/marketing")) }],
      },
      {
        title: t("components.step5Dashboard"),
        subtitle: t("components.step5Subtitle"),
        imageSrc: "/guide-step-6.png",
        body: t("components.step6Body"),
        actions: [{ label: t("components.openDashboard"), onClick: () => navigate(nav("/app/dashboard")) }],
      },
    ],
    [navigate, nav, t],
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
      {controlledOpen === undefined && (
        <Card>
          <Box padding="400">
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {t("components.getStartedGuide")}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {t("components.learnHowToUse")}
              </Text>
              <div>
                <Button variant="primary" onClick={() => setInternalOpen(true)}>
                  {t("components.openGuide")}
                </Button>
              </div>
            </BlockStack>
          </Box>
        </Card>
      )}

      <Modal
        open={open}
        onClose={handleClose}
        title={t("components.getStartedWithCbai")}
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
              {(current?.actions || []).map((a: { label: string; onClick: () => void; primary?: boolean }) => (
                <Button
                  key={a.label}
                  variant={a.primary ? "primary" : "secondary"}
                  onClick={() => {
                    handleClose();
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
                  {t("components.back")}
                </Button>
                <Text as="p" variant="bodySm" tone="subdued">
                  {`${activeIndex + 1} ${t("components.of")} ${steps.length}`}
                </Text>
                <Button
                  variant="primary"
                  disabled={activeIndex >= steps.length - 1}
                  onClick={goNext}
                >
                  {t("components.next")}
                </Button>
              </InlineStack>
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

