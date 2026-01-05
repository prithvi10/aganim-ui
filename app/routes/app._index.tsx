import { Page, Layout, Card, Text, BlockStack, Button, Link, InlineStack } from "@shopify/polaris";
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

  const t = useMemo(() => {
    return lang === "jp"
      ? {
          toggle: "English",
          welcome: "ようこそ",
          howTo: "使い方（準備中）",
          openThemeEditor: "テーマエディタを開く（ウィジェット設定）",
        }
      : {
          toggle: "日本語",
          welcome: "Welcome",
          howTo: "How to use (coming soon)",
          openThemeEditor: "Open Theme Editor (Widget Settings)",
        };
  }, [lang]);

  return (
    <Page title="Cross-Border AI">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "var(--p-space-500)" }}>
              <BlockStack gap="400">
                <InlineStack align="end">
                  <Button
                    variant="plain"
                    onClick={() => setLang((prev) => (prev === "en" ? "jp" : "en"))}
                  >
                    {t.toggle}
                  </Button>
                </InlineStack>

                <Text as="h2" variant="headingXl">
                  {t.welcome}
                </Text>

                <div>
                  <Link url="#" removeUnderline>
                    {t.howTo}
                  </Link>
                </div>

                <div>
                  <Button
                    onClick={() => {
                      // Shopify admin cannot be iframed; escape the embedded iframe.
                      window.open(themeEditorUrl, "_top");
                    }}
                  >
                    {t.openThemeEditor}
                  </Button>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
