import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  Link,
  InlineStack,
  Divider,
  Banner,
  Box,
} from "@shopify/polaris";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { GetStartedGuide } from "../components/GetStartedGuide";
import { BrandSoulWizard } from "../components/BrandSoulWizard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";
  const backendApiUrl =
    process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";

  let planName = "Free";
  let brandStatus = "idle";
  let brandSummary = "";
  let brandUpdatedAt: string | null = null;
  let brandLastError: string | null = null;

  try {
    const u = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shopParam)}`);
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      const eff = String(data?.effective_plan_name || data?.plan_name || "").trim();
      if (eff) planName = eff;
    }
  } catch {
    // best-effort
  }

  try {
    const s = await fetch(`${backendApiUrl}/api/admin/brand-context/status?shop=${encodeURIComponent(shopParam)}`);
    if (s.ok) {
      const data: any = await s.json().catch(() => ({}));
      brandStatus = String(data?.status || "idle");
      brandSummary = String(data?.summary || "").trim();
      brandUpdatedAt = data?.updated_at || null;
      brandLastError = data?.last_error ? String(data?.last_error) : null;
    }
  } catch {
    // best-effort
  }

  return {
    shop: shopParam,
    host,
    backendApiUrl,
    planName,
    brandStatus,
    brandSummary,
    brandUpdatedAt,
    brandLastError,
  };
};

export default function LandingPage() {
  const {
    shop,
    host,
    backendApiUrl,
    planName,
    brandStatus,
    brandSummary,
    brandUpdatedAt,
    brandLastError,
  } = useLoaderData<typeof loader>();
  const [lang, setLang] = useState<"en" | "jp">("en");
  const [brandWizardOpen, setBrandWizardOpen] = useState(false);
  const [brandStatusState, setBrandStatusState] = useState(brandStatus);
  const [brandSummaryState, setBrandSummaryState] = useState(brandSummary);
  const [brandUpdatedState, setBrandUpdatedState] = useState<string | null>(brandUpdatedAt);
  const [brandErrorState, setBrandErrorState] = useState<string | null>(brandLastError);

  const shopSlug = shop.replace(".myshopify.com", "");
  const themeEditorUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/themes/current/editor`
    : "https://admin.shopify.com/";

  const productRewriterUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/products/123`
    : "https://admin.shopify.com/";

  const bulkRewriterUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/products`
    : "https://admin.shopify.com/";

  const workspaceUrl = shopSlug
    ? `https://admin.shopify.com/store/${shopSlug}/apps/crossborderagent/app/rewriter`
    : "https://admin.shopify.com/";

  const t = useMemo(() => {
    return lang === "jp"
      ? {
          toggle: "English",
          title: "越境 AI",
          subtitle:
            "商品情報を世界に通用するマーケティング文に変換します。",
          welcome: "ようこそ",
          howTo: "使い方（準備中）",
          openWorkspace: "ワークスペースを開く（リライター）",
          openThemeEditor: "テーマエディタを開く（ウィジェット設定）",
          openProductRewriter: "商品リライターを開く",
          openBulkRewriter: "一括リライトを開く",
          noteWorkspace: "※ ここからリライターのワークスペースを開きます。",
          noteProductId: "※ いまはデモとして Product ID=123 を開きます。",
          noteBulk: "※ 一括リライトは準備中（いまは商品一覧を開きます）。",
        }
      : {
          toggle: "日本語",
          title: "Cross-Border AI",
          subtitle:
            "Transform product info into a world-class marketing copy.",
          welcome: "Welcome",
          howTo: "How to use (coming soon)",
          openWorkspace: "Open Rewriter Workspace",
          openThemeEditor: "Open Theme Editor (Widget Settings)",
          openProductRewriter: "Open Product Rewriter",
          openBulkRewriter: "Open Bulk Rewriter",
          noteWorkspace: "Opens the Rewriter workspace (side-by-side editor).",
          noteProductId: "Note: currently opens a demo Product ID=123.",
          noteBulk: "Note: bulk rewrite is not implemented yet (opens Products list).",
        };
  }, [lang]);

  useEffect(() => {
    setBrandStatusState(brandStatus);
    setBrandSummaryState(brandSummary);
    setBrandUpdatedState(brandUpdatedAt);
    setBrandErrorState(brandLastError);
  }, [brandStatus, brandSummary, brandUpdatedAt, brandLastError]);

  useEffect(() => {
    if (brandStatusState !== "running") return;
    let active = true;
    const poll = async () => {
      try {
        const resp = await fetch(
          `${backendApiUrl}/api/admin/brand-context/status?shop=${encodeURIComponent(shop)}`,
        );
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        if (!active) return;
        setBrandStatusState(String(data?.status || "idle"));
        setBrandSummaryState(String(data?.summary || "").trim());
        setBrandUpdatedState(data?.updated_at || null);
        setBrandErrorState(data?.last_error ? String(data?.last_error) : null);
      } catch {
        // best-effort
      }
    };
    const id = window.setInterval(poll, 10000);
    poll();
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [brandStatusState, backendApiUrl, shop]);

  return (
    <Page title="Cross-Border AI">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "var(--p-space-500)" }}>
              <BlockStack gap="500">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack align="start" blockAlign="center" gap="400">
                    <img
                      src="/Icon-final.png"
                      alt={t.title}
                      style={{ width: 56, height: 56 }}
                    />
                    <BlockStack gap="100">
                      <Text as="h1" variant="headingXl">
                        {t.title}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {t.subtitle}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <Button
                    variant="plain"
                    onClick={() => setLang((prev) => (prev === "en" ? "jp" : "en"))}
                  >
                    {t.toggle}
                  </Button>
                </InlineStack>

                <Divider />

                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    {t.welcome}
                  </Text>

                  <div>
                    <Link url="#" removeUnderline>
                      {t.howTo}
                    </Link>
                  </div>

                  <BlockStack gap="200">
                    <Button
                      onClick={() => {
                        window.open(workspaceUrl, "_top");
                      }}
                    >
                      {t.openWorkspace}
                    </Button>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.noteWorkspace}
                    </Text>

                    <Button
                      onClick={() => {
                        // Shopify admin cannot be iframed; escape the embedded iframe.
                        window.open(themeEditorUrl, "_top");
                      }}
                    >
                      {t.openThemeEditor}
                    </Button>

                    <Button
                      onClick={() => {
                        window.open(productRewriterUrl, "_top");
                      }}
                    >
                      {t.openProductRewriter}
                    </Button>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.noteProductId}
                    </Text>

                    <Button
                      onClick={() => {
                        window.open(bulkRewriterUrl, "_top");
                      }}
                    >
                      {t.openBulkRewriter}
                    </Button>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.noteBulk}
                    </Text>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <GetStartedGuide shop={shop} host={host} />
            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingMd">
                        Brand Soul
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Capture your brand story when you're ready.
                      </Text>
                    </BlockStack>
                    <Button variant="primary" onClick={() => setBrandWizardOpen(true)}>
                      Open Wizard
                    </Button>
                  </InlineStack>

                  {brandStatusState === "running" ? (
                    <Banner tone="info">
                      Generating brand intelligence… please check after a while.
                    </Banner>
                  ) : null}
                  {brandStatusState === "failed" ? (
                    <Banner tone="critical">
                      Brand intelligence failed. Please retry in the wizard.
                    </Banner>
                  ) : null}
                  {brandErrorState ? (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {brandErrorState}
                    </Text>
                  ) : null}

                  {brandSummaryState ? (
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Latest summary
                        </Text>
                        <Text as="p" variant="bodyMd">
                          {brandSummaryState}
                        </Text>
                        {brandUpdatedState ? (
                          <Text as="span" variant="bodySm" tone="subdued">
                            Updated: {new Date(brandUpdatedState).toLocaleDateString()}
                          </Text>
                        ) : null}
                      </BlockStack>
                    </Box>
                  ) : (
                    <Banner tone="info">
                      Add your Brand Soul to unlock richer storytelling in Optimize.
                    </Banner>
                  )}
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <BrandSoulWizard
        open={brandWizardOpen}
        onClose={() => setBrandWizardOpen(false)}
        onComplete={() => {
          setBrandStatusState("running");
        }}
        backendApiUrl={backendApiUrl}
        planName={String(planName)}
      />
    </Page>
  );
}
