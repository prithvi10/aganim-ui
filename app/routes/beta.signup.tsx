import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
  Box,
} from "@shopify/polaris";
import { LandingHeader, LandingFooter } from "../components/LandingLayout";

const BACKEND_URL = process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { valid: false, error: "No invite token provided" };
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/beta/signup/${token}`);
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { valid: false, error: data.detail || "Invalid or expired invite link" };
    }
    const data = await resp.json();
    return { valid: true, token, ...data };
  } catch {
    return { valid: false, error: "Unable to validate invite. Please try again." };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const token = formData.get("token") as string;
  const body = {
    store_name: formData.get("store_name") as string,
    contact_email: formData.get("contact_email") as string,
    shop_domain: formData.get("shop_domain") as string,
    product_category: formData.get("product_category") as string,
    target_markets: formData.get("target_markets") as string,
    purpose: formData.get("purpose") as string,
  };

  try {
    const resp = await fetch(`${BACKEND_URL}/api/beta/signup/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: data.detail || "Signup failed" };
    }
    return { success: true, ...data };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
};

export default function BetaSignup() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [shopDomain, setShopDomain] = useState(loaderData?.shop_domain || "");
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState("");
  const [purpose, setPurpose] = useState("");

  const result = fetcher.data as any;
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (result?.success && result?.install_url) {
      const timer = setTimeout(() => {
        window.location.href = result.install_url;
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!loaderData?.valid) {
    return (
      <div>
        <LandingHeader />
        <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px" }}>
          <Card>
            <BlockStack gap="400">
              <Banner tone="critical">
                この招待リンクは無効、または期限切れです。
              </Banner>
              <Text as="p" variant="bodyMd">
                問題がある場合は、support@aganim-ai.com までお問い合わせください。
              </Text>
            </BlockStack>
          </Card>
        </div>
        <LandingFooter />
      </div>
    );
  }

  if (result?.success) {
    return (
      <div>
        <LandingHeader />
        <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px" }}>
          <Card>
            <BlockStack gap="400">
              <Banner tone="success" title="Aganim ベータ版へようこそ！">
                登録が完了しました。数秒後にアプリのインストール画面へ移動します。
              </Banner>
              <Text as="p" variant="bodyMd">
                インストール後、6週間すべてのPro機能を無料でご利用いただけます。
              </Text>
              <Button variant="primary" url={result.install_url}>
                ShopifyにAganimをインストール
              </Button>
            </BlockStack>
          </Card>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div>
      <LandingHeader />
      <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 20px" }}>
        <BlockStack gap="600">
          <BlockStack gap="200">
            <Text as="h1" variant="headingXl">Aganim AI ベータ版に参加する</Text>
            <Text as="p" variant="bodyLg" tone="subdued">
              6週間、Pro機能をすべて無料でご利用いただけます。AIリライト、SEO最適化、
              マーケティングコピー、画像生成など、制限なし。
            </Text>
          </BlockStack>

          {result?.error && (
            <Banner tone="critical">{result.error}</Banner>
          )}

          <Card>
            <fetcher.Form method="post">
              <input type="hidden" name="token" value={token} />
              <FormLayout>
                <TextField
                  label="ストア名"
                  name="store_name"
                  value={storeName}
                  onChange={setStoreName}
                  placeholder="ストア名またはブランド名"
                  autoComplete="organization"
                  requiredIndicator
                />
                <TextField
                  label="メールアドレス"
                  name="contact_email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  requiredIndicator
                />
                <TextField
                  label="Shopifyストアドメイン"
                  name="shop_domain"
                  value={shopDomain}
                  onChange={setShopDomain}
                  placeholder="your-store.myshopify.com"
                  autoComplete="off"
                  helpText=".myshopify.com ドメイン（例: my-store.myshopify.com）"
                />
                <Select
                  label="商品カテゴリ"
                  name="product_category"
                  options={[
                    { label: "カテゴリを選択", value: "" },
                    { label: "コスメ・美容", value: "cosmetics" },
                    { label: "ハンドメイド・工芸", value: "crafts" },
                    { label: "食品・飲料", value: "food" },
                    { label: "ファッション・アパレル", value: "fashion" },
                    { label: "ホーム・インテリア", value: "home" },
                    { label: "家電・電子機器", value: "electronics" },
                    { label: "その他", value: "other" },
                  ]}
                  value={category}
                  onChange={setCategory}
                />
                <Select
                  label="ターゲット市場"
                  name="target_markets"
                  options={[
                    { label: "ターゲット市場を選択", value: "" },
                    { label: "アメリカ", value: "us" },
                    { label: "ヨーロッパ", value: "eu" },
                    { label: "東南アジア", value: "sea" },
                    { label: "韓国", value: "kr" },
                    { label: "中国・台湾", value: "cn" },
                    { label: "グローバル（複数地域）", value: "global" },
                  ]}
                  value={markets}
                  onChange={setMarkets}
                />
                <TextField
                  label="Aganimで実現したいこと"
                  name="purpose"
                  value={purpose}
                  onChange={setPurpose}
                  multiline={3}
                  placeholder="例: 商品ページを英語に翻訳して海外のお客様にアピールしたい..."
                  autoComplete="off"
                />
                <Button
                  variant="primary"
                  submit
                  loading={isSubmitting}
                  disabled={!storeName || !email}
                  fullWidth
                >
                  ベータ版に登録する
                </Button>
              </FormLayout>
            </fetcher.Form>
          </Card>

          <Box padding="400">
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              登録により、利用規約とプライバシーポリシーに同意したものとみなされます。
              Proアクセスはインストールから6週間有効です。
            </Text>
          </Box>
        </BlockStack>
      </div>
      <LandingFooter />
    </div>
  );
}
