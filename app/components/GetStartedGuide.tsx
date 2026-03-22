import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Modal,
  Text,
} from "@shopify/polaris";
import {
  StarIcon,
  EditIcon,
  SocialAdIcon,
  SearchIcon,
  ChartVerticalIcon,
  AutomationIcon,
  HomeIcon,
} from "@shopify/polaris-icons";

type Props = {
  shop: string;
  host: string;
  open?: boolean;
  onClose?: () => void;
  onOpenBrandSoul?: () => void;
};

export function GetStartedGuide({
  shop,
  host,
  open: controlledOpen,
  onClose: controlledOnClose,
  onOpenBrandSoul,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const stepIcons = [StarIcon, EditIcon, SocialAdIcon, ChartVerticalIcon, SearchIcon, AutomationIcon, HomeIcon];

  const steps = useMemo(
    () => [
      {
        title: t("components.guideBrandSoulTitle"),
        subtitle: t("components.guideBrandSoulSubtitle"),
        body: t("components.guideBrandSoulBody"),
        imageSrc: "/onboarding/guide-brand-soul.png",
        actions: [
          {
            label: t("components.openBrandSoul"),
            onClick: () => onOpenBrandSoul?.(),
            primary: true,
          },
        ],
      },
      {
        title: t("components.guideWritingStudioTitle"),
        subtitle: t("components.guideWritingStudioSubtitle"),
        body: t("components.guideWritingStudioBody"),
        imageSrc: "/onboarding/guide-writing-studio.png",
        actions: [
          { label: t("components.openWritingStudio"), onClick: () => navigate(nav("/app/writing-studio")), primary: true },
        ],
      },
      {
        title: t("components.guideMarketingTitle"),
        subtitle: t("components.guideMarketingSubtitle"),
        body: t("components.guideMarketingBody"),
        imageSrc: "/onboarding/guide-marketing.png",
        actions: [
          { label: t("components.openMarketing"), onClick: () => navigate(nav("/app/marketing")), primary: true },
        ],
      },
      {
        title: t("components.guideSeoTitle"),
        subtitle: t("components.guideSeoSubtitle"),
        body: t("components.guideSeoBody"),
        imageSrc: "/onboarding/guide-seo.png",
        actions: [
          { label: t("components.openSeo"), onClick: () => navigate(nav("/app/seo")), primary: true },
        ],
      },
      {
        title: t("components.guidePriceScoutTitle"),
        subtitle: t("components.guidePriceScoutSubtitle"),
        body: t("components.guidePriceScoutBody"),
        imageSrc: "/onboarding/guide-price-scout.png",
        actions: [
          { label: t("components.openPriceScout"), onClick: () => navigate(nav("/app/pricing")), primary: true },
        ],
      },
      {
        title: t("components.guidePipelinesTitle"),
        subtitle: t("components.guidePipelinesSubtitle"),
        body: t("components.guidePipelinesBody"),
        imageSrc: "/onboarding/guide-pipelines.png",
        actions: [
          { label: t("components.openPipelines"), onClick: () => navigate(nav("/app/optimize")), primary: true },
        ],
      },
      {
        title: t("components.guideDashboardTitle"),
        subtitle: t("components.guideDashboardSubtitle"),
        body: t("components.guideDashboardBody"),
        imageSrc: "/onboarding/guide-dashboard.png",
        actions: [
          { label: t("components.openDashboard"), onClick: () => navigate(nav("/app/dashboard")), primary: true },
        ],
      },
    ],
    [navigate, nav, t, onOpenBrandSoul],
  );

  const current = steps[activeIndex];
  const CurrentIcon = stepIcons[activeIndex];

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
      >
        <Modal.Section>
          <BlockStack gap="300">
            {current?.imageSrc ? (
              <div style={{ textAlign: "center" }}>
                <img
                  src={current.imageSrc}
                  alt={current.subtitle || "Guide step"}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    display: "inline-block",
                    borderRadius: 12,
                  }}
                />
              </div>
            ) : (
              <Box
                padding="500"
                background="bg-surface-secondary"
                borderRadius="300"
              >
                <InlineStack align="center">
                  <div style={{ transform: "scale(2.5)" }}>
                    <Icon source={CurrentIcon} tone="base" />
                  </div>
                </InlineStack>
              </Box>
            )}

            <BlockStack gap="100">
              <InlineStack gap="200" blockAlign="center">
                <div style={{ display: "flex", alignItems: "center" }}>
                  {activeIndex === 0 ? (
                    <img src="/landing%20page/Brand%20soul%20logo.png" alt="Brand Soul" style={{ width: 24, height: 24, objectFit: "contain" }} />
                  ) : (
                    <Icon source={CurrentIcon} tone="base" />
                  )}
                </div>
                <Text as="h3" variant="headingLg">
                  {current?.title}
                </Text>
              </InlineStack>
              <Text as="p" variant="bodyMd" tone="subdued">
                {current?.subtitle}
              </Text>
            </BlockStack>

            <Text as="p" variant="bodyMd">
              {current?.body}
            </Text>

            <InlineStack gap="200" align="center">
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

            {/* Step dots */}
            <InlineStack align="center" gap="100">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    width: idx === activeIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: idx === activeIndex
                      ? "var(--p-color-bg-fill-brand)"
                      : "var(--p-color-bg-fill-secondary)",
                  }}
                  aria-label={`Step ${idx + 1}`}
                />
              ))}
            </InlineStack>

            {/* Navigation footer */}
            <div style={{ paddingTop: 4 }}>
              <InlineStack align="space-between" blockAlign="center">
                <Button variant="tertiary" disabled={activeIndex === 0} onClick={goBack}>
                  {t("components.back")}
                </Button>
                <Text as="p" variant="bodySm" tone="subdued">
                  {`${activeIndex + 1} ${t("components.of")} ${steps.length}`}
                </Text>
                {activeIndex < steps.length - 1 ? (
                  <Button variant="primary" onClick={goNext}>
                    {t("components.next")}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleClose}>
                    Done
                  </Button>
                )}
              </InlineStack>
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

