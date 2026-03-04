import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  InlineStack,
  MediaCard,
  Modal,
  ProgressBar,
  Select,
  Text,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

type Props = {
  shop: string;
  host: string;
  backendApiUrl: string;
  initialStep: number;
  initialFinished: boolean;
  defaultTargetLocale?: string;
};

const LOCALE_OPTIONS = ["en", "zh-TW", "ko", "de", "fr", "es", "it", "pt", "th", "vi", "zh-CN"] as const;

async function postOnboardingStep(
  backendApiUrl: string,
  shop: string,
  step: number,
  finished?: boolean,
) {
  await fetch(`${backendApiUrl}/api/onboarding/update_step?shop=${encodeURIComponent(shop)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step,
      ...(finished ? { is_onboarding_finished: true } : {}),
    }),
  });
}

function clampStep(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return Math.floor(n);
}

export function OnboardingSheet({
  shop,
  host,
  backendApiUrl,
  initialStep,
  initialFinished,
  defaultTargetLocale = "en",
}: Props) {
  const { t } = useTranslation();
  const app = useAppBridge();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState<boolean>(!initialFinished);
  const [step, setStep] = useState<number>(clampStep(initialStep));
  const [finished, setFinished] = useState<boolean>(Boolean(initialFinished));
  const [busy, setBusy] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<string>(defaultTargetLocale);

  const done = useMemo(() => {
    const s = clampStep(step);
    return {
      s0: s >= 1,
      s1: s >= 2,
      s2: s >= 3,
      s3: s >= 4,
      s4: s >= 4 || finished,
      completedCount: [s >= 1, s >= 2, s >= 3, s >= 4, finished].filter(Boolean).length,
    };
  }, [step, finished]);

  const progress = Math.round((done.completedCount / 5) * 100);
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

  const chooseProduct = useCallback(async () => {
    setBusy(true);
    try {
      // App Bridge v4 provides `resourcePicker` on the app instance (shape varies by runtime).
      const picker = (app as any)?.resourcePicker;
      if (typeof picker !== "function") {
        // Fall back to rewriter page (it still has an internal product list).
        navigate(nav("/app/rewriter"));
        return;
      }

      const result = await picker({ type: "product", multiple: false });
      const selection =
        (Array.isArray(result) ? result : null) ||
        (Array.isArray(result?.selection) ? result.selection : null) ||
        (Array.isArray(result?.selected) ? result.selected : null) ||
        (Array.isArray(result?.resources) ? result.resources : null) ||
        [];
      const first = selection?.[0];
      const productId = String(first?.id || first?.gid || "");
      if (!productId) {
        navigate(nav("/app/rewriter"));
        return;
      }

      const p = new URLSearchParams(qs);
      p.set("productId", productId);
      navigate(`/app/rewriter?${p.toString()}`);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, [app, navigate, nav, qs]);

  const saveTargetLocale = useCallback(async () => {
    setBusy(true);
    try {
      const resp = await fetch(`${backendApiUrl}/api/admin/default-target-locale`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, locale: selectedLocale }),
      });
      if (resp.ok) {
        await postOnboardingStep(backendApiUrl, shop, 1);
        setStep((s) => Math.max(s, 1));
      }
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  }, [backendApiUrl, shop, selectedLocale]);

  const tryMarketing = useCallback(async () => {
    setBusy(true);
    try {
      await postOnboardingStep(backendApiUrl, shop, 3);
      setStep((s) => Math.max(s, 3));
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
    navigate(nav("/app/marketing"));
    setOpen(false);
  }, [backendApiUrl, navigate, nav, shop]);

  const finishSetup = useCallback(async () => {
    setBusy(true);
    try {
      await postOnboardingStep(backendApiUrl, shop, 4, true);
      setStep(4);
      setFinished(true);
      setOpen(false);
    } finally {
      setBusy(false);
    }
    navigate(nav("/app/dashboard"));
  }, [backendApiUrl, navigate, nav, shop]);

  if (finished) return null;

  const isHome =
    location?.pathname === "/app" || location?.pathname === "/app/";
  const showMinimized = isHome && !open && !busy;

  return (
    <>
      {showMinimized ? (
        <div
          style={{
            position: "fixed",
            top: 72,
            right: 16,
            zIndex: 600,
            width: 320,
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <div
            style={{
              background: "var(--p-color-bg-surface)",
              border: "1px solid var(--p-color-border)",
              borderRadius: 12,
              boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
              padding: 12,
            }}
          >
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="headingSm">
                  {t("onboarding.setup")}
                </Text>
                <Badge tone="info">{`${progress}%`}</Badge>
              </InlineStack>
              <ProgressBar progress={progress} size="small" />
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  {t("onboarding.finishOnboarding")}
                </Text>
                <Button variant="primary" size="slim" onClick={() => setOpen(true)}>
                  {t("onboarding.continue")}
                </Button>
              </InlineStack>
            </BlockStack>
          </div>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("onboarding.gettingStarted")}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  {t("onboarding.onboarding")}
                </Text>
                <Badge tone="info">{`${progress}%`}</Badge>
              </InlineStack>
              <ProgressBar progress={progress} size="small" />
            </BlockStack>

            {/* Step 0: Select target market */}
            {step < 1 && (
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingSm">
                      {t("onboarding.selectTargetMarket")}
                    </Text>
                    {done.s0 ? (
                      <Badge tone="success">{t("onboarding.done")}</Badge>
                    ) : (
                      <Badge tone="attention">{t("onboarding.next")}</Badge>
                    )}
                  </InlineStack>
                  <Text as="p" variant="bodyMd">
                    {t("onboarding.selectTargetMarketDesc")}
                  </Text>
                  <Select
                    label={t("onboarding.targetMarket")}
                    options={LOCALE_OPTIONS.map((loc) => ({
                      label: t(`localeLabels.${loc}`),
                      value: loc,
                    }))}
                    value={selectedLocale}
                    onChange={setSelectedLocale}
                  />
                  <Button
                    variant="primary"
                    onClick={saveTargetLocale}
                    loading={busy}
                    disabled={busy}
                  >
                    {t("onboarding.confirm")}
                  </Button>
                </BlockStack>
              </Box>
            )}

            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingSm">
                    Step 1: {t("onboarding.step1Localize")}
                  </Text>
                  {done.s1 ? (
                    <Badge tone="success">{t("onboarding.done")}</Badge>
                  ) : (
                    <Badge tone="attention">{t("onboarding.next")}</Badge>
                  )}
                </InlineStack>
                <Box>
                  <img
                    src="/onboarding-localize-first-product.gif"
                    alt="Localize your first product demo"
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    (Add a looping GIF at{" "}
                    <code>/public/onboarding-localize-first-product.gif</code>)
                  </Text>
                </Box>
                <Text as="p" variant="bodyMd">
                  {t("onboarding.step1Desc")}
                </Text>
                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={chooseProduct}
                    loading={busy}
                    disabled={busy}
                  >
                    {t("onboarding.chooseProduct")}
                  </Button>
                  <Button
                    onClick={() => navigate(nav("/app/rewriter"))}
                    disabled={busy}
                  >
                    {t("onboarding.openRewriter")}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>

            <MediaCard
              title={`Step 2: ${t("onboarding.step2SocialHook")}`}
              description={t("onboarding.step2Desc")}
              primaryAction={{
                content: t("onboarding.openCaptionGen"),
                onAction: tryMarketing,
                loading: busy,
              }}
            >
              <Box padding="200">
                <img
                  src="/onboarding-social-hook.gif"
                  alt="Caption generator demo"
                  style={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  (Add a looping GIF at{" "}
                  <code>/public/onboarding-social-hook.gif</code>)
                </Text>
              </Box>
            </MediaCard>

            <Box padding="300" borderRadius="200" background="bg-surface-secondary">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">
                  Step 4: {t("onboarding.step4Dashboard")}
                </Text>
                {done.s4 ? (
                  <Badge tone="success">{t("onboarding.done")}</Badge>
                ) : (
                  <Badge tone="info">{t("onboarding.finish")}</Badge>
                )}
              </InlineStack>
              <Box paddingBlockStart="200">
                <Button
                  variant="primary"
                  onClick={finishSetup}
                  loading={busy}
                  disabled={busy}
                >
                  {t("onboarding.goToDashboard")}
                </Button>
              </Box>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

