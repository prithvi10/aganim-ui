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
  Text,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

type Props = {
  shop: string;
  host: string;
  backendApiUrl: string;
  initialStep: number;
  initialFinished: boolean;
};

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
  if (n > 4) return 4;
  return Math.floor(n);
}

export function OnboardingSheet({
  shop,
  host,
  backendApiUrl,
  initialStep,
  initialFinished,
}: Props) {
  const app = useAppBridge();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState<boolean>(!initialFinished);
  const [step, setStep] = useState<number>(clampStep(initialStep));
  const [finished, setFinished] = useState<boolean>(Boolean(initialFinished));
  const [busy, setBusy] = useState(false);

  const done = useMemo(() => {
    const s = clampStep(step);
    return {
      s1: s >= 1,
      s2: s >= 2,
      s3: s >= 3,
      s4: s >= 4 || finished,
      completedCount: [s >= 1, s >= 2, s >= 3, s >= 4 || finished].filter(Boolean).length,
    };
  }, [step, finished]);

  const progress = Math.round((done.completedCount / 4) * 100);
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
                  Setup
                </Text>
                <Badge tone="info">{`${progress}%`}</Badge>
              </InlineStack>
              <ProgressBar progress={progress} size="small" />
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Finish onboarding to unlock storefront + marketing.
                </Text>
                <Button variant="primary" size="slim" onClick={() => setOpen(true)}>
                  Continue
                </Button>
              </InlineStack>
            </BlockStack>
          </div>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Getting started"
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Onboarding
                </Text>
                <Badge tone="info">{`${progress}%`}</Badge>
              </InlineStack>
              <ProgressBar progress={progress} size="small" />
            </BlockStack>

            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingSm">
                    Step 1: Localize your first product
                  </Text>
                  {done.s1 ? (
                    <Badge tone="success">Done</Badge>
                  ) : (
                    <Badge tone="attention">Next</Badge>
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
                  Choose a product, then click “Optimize for Global” in the
                  Rewriter. This step completes automatically after your first
                  successful rewrite.
                </Text>
                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={chooseProduct}
                    loading={busy}
                    disabled={busy}
                  >
                    Choose Product
                  </Button>
                  <Button
                    onClick={() => navigate(nav("/app/rewriter"))}
                    disabled={busy}
                  >
                    Open Rewriter
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>

            <MediaCard
              title="Step 2: Create your first Social Hook"
              description="Generate Instagram-ready hooks from a product and save them to metafields."
              primaryAction={{
                content: "Open Caption Generator",
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
                  Step 4: Dashboard
                </Text>
                {done.s4 ? (
                  <Badge tone="success">Done</Badge>
                ) : (
                  <Badge tone="info">Finish</Badge>
                )}
              </InlineStack>
              <Box paddingBlockStart="200">
                <Button
                  variant="primary"
                  onClick={finishSetup}
                  loading={busy}
                  disabled={busy}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

