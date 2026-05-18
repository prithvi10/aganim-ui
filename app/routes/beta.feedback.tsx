import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useState } from "react";
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
  ChoiceList,
} from "@shopify/polaris";

const BACKEND_URL = process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { valid: false, error: "No token provided" };
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/beta/feedback/${token}`);
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { valid: false, error: data.detail || "Invalid or expired link" };
    }
    const data = await resp.json();
    return { valid: true, token, ...data };
  } catch {
    return { valid: false, error: "Unable to validate link. Please try again." };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const token = formData.get("token") as string;
  const body = {
    feedback_score: Number(formData.get("feedback_score")) || null,
    favorite_features: formData.get("favorite_features") as string,
    frustration: formData.get("frustration") as string,
    willingness_to_pay: formData.get("willingness_to_pay") as string,
    testimonial: formData.get("testimonial") as string,
    comments: formData.get("comments") as string,
  };

  try {
    const resp = await fetch(`${BACKEND_URL}/api/beta/feedback/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: data.detail || "Submission failed" };
    }
    return { success: true, ...data };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
};

export default function BetaFeedback() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [score, setScore] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [frustration, setFrustration] = useState("");
  const [wtp, setWtp] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [comments, setComments] = useState("");

  const result = fetcher.data as any;
  const isSubmitting = fetcher.state !== "idle";

  if (!loaderData?.valid) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f6f7" }}>
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e1e3e5", padding: "16px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/Icon-final.png" alt="Aganim AI" style={{ height: 32, width: 32 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#202223" }}>Aganim AI</span>
          </div>
        </header>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
          <Card>
            <BlockStack gap="400">
              <Banner tone="critical">
                このリンクは無効、または期限切れです。
              </Banner>
              <Text as="p" variant="bodyMd">
                問題がある場合は、support@aganim-ai.com までお問い合わせください。
              </Text>
            </BlockStack>
          </Card>
        </div>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f6f7" }}>
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e1e3e5", padding: "16px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/Icon-final.png" alt="Aganim AI" style={{ height: 32, width: 32 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#202223" }}>Aganim AI</span>
          </div>
        </header>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
          <Card>
            <BlockStack gap="400">
              <Banner tone="success" title="ありがとうございます！">
                フィードバックを受け付けました。今後の開発に反映させていただきます。
              </Banner>
              <Text as="p" variant="bodyMd">
                引き続きAganimをご活用ください。
              </Text>
            </BlockStack>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f7" }}>
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e1e3e5", padding: "16px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/Icon-final.png" alt="Aganim AI" style={{ height: 32, width: 32 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "#202223" }}>Aganim AI</span>
        </div>
      </header>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
        <BlockStack gap="600">
          <BlockStack gap="200">
            <Text as="h1" variant="headingXl">ベータテスト フィードバック</Text>
            <Text as="p" variant="bodyLg" tone="subdued">
              Aganimのご利用ありがとうございます。2分ほどで完了するアンケートにご協力ください。
              いただいたご意見は今後の開発に直接反映いたします。
            </Text>
          </BlockStack>

          {result?.error && (
            <Banner tone="critical">{result.error}</Banner>
          )}

          <Card>
            <fetcher.Form method="post">
              <input type="hidden" name="token" value={token} />
              <FormLayout>
                <Select
                  label="総合満足度"
                  name="feedback_score"
                  options={[
                    { label: "評価を選択", value: "" },
                    { label: "5 — とても満足", value: "5" },
                    { label: "4 — 満足", value: "4" },
                    { label: "3 — 普通", value: "3" },
                    { label: "2 — やや不満", value: "2" },
                    { label: "1 — 不満", value: "1" },
                  ]}
                  value={score}
                  onChange={setScore}
                />

                <input
                  type="hidden"
                  name="favorite_features"
                  value={features.join(", ")}
                />
                <ChoiceList
                  title="最も価値を感じた機能（複数選択可）"
                  allowMultiple
                  choices={[
                    { label: "商品コンテンツの翻訳・リライト", value: "translate" },
                    { label: "商品画像のリファイン", value: "images" },
                    { label: "マーケティングコピー生成", value: "marketing" },
                    { label: "SEO対策・検索順位向上", value: "seo" },
                    { label: "市場データによる価格分析", value: "pricing" },
                    { label: "Full Launch パイプライン", value: "pipeline" },
                  ]}
                  selected={features}
                  onChange={setFeatures}
                />

                <TextField
                  label="最も不満に感じた点"
                  name="frustration"
                  value={frustration}
                  onChange={setFrustration}
                  placeholder="改善してほしい機能や不具合など..."
                  autoComplete="off"
                  multiline={3}
                />

                <Select
                  label="ベータ終了後、有料プランをご利用いただけますか？"
                  name="willingness_to_pay"
                  options={[
                    { label: "回答を選択", value: "" },
                    { label: "はい、利用したい", value: "yes" },
                    { label: "検討中", value: "maybe" },
                    { label: "いいえ、利用しない", value: "no" },
                  ]}
                  value={wtp}
                  onChange={setWtp}
                />

                <TextField
                  label="推薦コメント（任意）"
                  name="testimonial"
                  value={testimonial}
                  onChange={setTestimonial}
                  placeholder="Aganimを他のマーチャントにおすすめするコメントがあればお聞かせください..."
                  autoComplete="off"
                  multiline={2}
                  helpText="いただいた推薦コメントはマーケティング素材に使用させていただく場合があります"
                />

                <TextField
                  label="その他のご意見・ご要望（任意）"
                  name="comments"
                  value={comments}
                  onChange={setComments}
                  placeholder="自由にお書きください..."
                  autoComplete="off"
                  multiline={3}
                />

                <Button
                  variant="primary"
                  submit
                  loading={isSubmitting}
                  fullWidth
                >
                  フィードバックを送信
                </Button>
              </FormLayout>
            </fetcher.Form>
          </Card>

          <Box padding="400">
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              ご回答は匿名で処理され、サービス改善のためにのみ使用されます。
            </Text>
          </Box>
        </BlockStack>
      </div>
    </div>
  );
}
