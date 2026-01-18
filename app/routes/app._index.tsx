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
} from "@shopify/polaris";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useMemo, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") || "";
  return { shop: shopParam };
};

export default function LandingPage() {
  const { shop } = useLoaderData<typeof loader>();
  const [lang, setLang] = useState<"en" | "jp">("en");

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
      </Layout>
    </Page>
  );
}
