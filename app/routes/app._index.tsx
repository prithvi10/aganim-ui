// @ts-nocheck
import { useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";

// Declare Polaris Web Component tags so TSX recognizes them as intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
      "s-page": any;
      "s-button": any;
      "s-text": any;
      "s-layout": any;
      "s-layout-section": any;
      "s-card": any;
      "s-progress-bar": any;
      "s-badge": any;
      "s-resource-list": any;
      "s-resource-item": any;
    }
  }
}

type Lang = "en" | "jp";
type PlanKey = "starter" | "growth" | "pro";

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Cross-Border AI",
    subtitle: "Optimize product copy for every market in minutes.",
    usageTitle: "Sync Credits Used",
    pricingTitle: "Plans & Pricing",
    recommended: "Recommended",
    starter: "Starter",
    growth: "Growth",
    pro: "Pro",
    supportTitle: "Need help?",
    supportCta: "Contact Support",
    docs: "View Documentation",
    langToggle: "日本語 / EN",
  },
  jp: {
    title: "越境AI / Cross-Border AI",
    subtitle: "数分で各市場向けの商品コピーを最適化。",
    usageTitle: "同期クレジット利用状況",
    pricingTitle: "プランと価格",
    recommended: "おすすめ",
    starter: "スターター",
    growth: "グロース",
    pro: "プロ",
    supportTitle: "サポートが必要ですか？",
    supportCta: "サポートに連絡",
    docs: "ドキュメントを見る",
    langToggle: "JP / EN",
  },
};

const PLANS: Array<{ key: PlanKey; price: string; features: string[]; recommended?: boolean }> = [
  { key: "starter", price: "$9.90", features: ["200 Syncs", "Core Localization AI"] },
  { key: "growth", price: "$29.90", features: ["1,000 Syncs", "Market Personas"], recommended: true },
  { key: "pro", price: "$69.90", features: ["10,000 Syncs", "Bulk Multi-Market", "Streaming"] },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const app = useAppBridge();
  const [lang, setLang] = useState<Lang>("en");
  const strings = useMemo(() => STRINGS[lang], [lang]);

  // mock usage
  const used = 4200;
  const quota = 10000;
  const percent = Math.min(100, Math.round((used / quota) * 100));

  const onToggleLang = () => setLang((prev) => (prev === "en" ? "jp" : "en"));

  const triggerBilling = async (planKey: PlanKey) => {
    try {
      const token = await getSessionToken(app as any);
      const formData = new FormData();
      formData.append("plan", planKey === "starter" ? "Basic" : planKey === "growth" ? "Standard" : "Pro");

      const resp = await fetch("/app/plans", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      });

      if (resp.status === 401) {
        const reauth = resp.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");
        if (reauth) {
          window.location.href = reauth;
          return;
        }
      }

      if (resp.redirected) {
        window.location.href = resp.url;
        return;
      }

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Billing request failed", resp.status, text);
      }
    } catch (err) {
      console.error("Billing error", err);
    }
  };

  return (
    <s-page heading={strings.title}>
      <s-button slot="primary-action" onClick={onToggleLang} variant="tertiary">
        {strings.langToggle}
      </s-button>
      <s-text as="p" variant="bodyMd" tone="subdued">
        {strings.subtitle}
      </s-text>

      <s-layout>
        <s-layout-section>
          <s-card rounded="true">
            <s-text as="h3" variant="headingMd">{strings.usageTitle}</s-text>
            <s-text as="p" variant="bodyMd" tone="subdued">{used} / {quota} credits</s-text>
            <div style={{ marginTop: "12px" }}>
              <s-progress-bar progress={percent}></s-progress-bar>
            </div>
          </s-card>
        </s-layout-section>

        <s-layout-section variant="oneHalf">
          <s-card rounded="true">
            <s-text as="h3" variant="headingMd">{strings.pricingTitle}</s-text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "12px" }}>
              {PLANS.map((plan) => (
                <s-card key={plan.key} padding="tight" rounded="true" background="surface">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <s-text as="h4" variant="headingMd">
                      {strings[plan.key]}
                    </s-text>
                    {plan.recommended && (
                      <s-badge tone="info">{strings.recommended}</s-badge>
                    )}
                  </div>
                  <s-text as="p" variant="headingLg" tone="subdued" style={{ marginTop: "4px" }}>
                    {plan.price}
                  </s-text>
                  <s-resource-list>
                    {plan.features.map((f) => (
                      <s-resource-item key={f}>
                        <s-text>{f}</s-text>
                      </s-resource-item>
                    ))}
                  </s-resource-list>
                  <s-button variant="primary" full-width="true" onClick={() => triggerBilling(plan.key)}>
                    {strings[plan.key]}
                  </s-button>
                </s-card>
              ))}
            </div>
          </s-card>
        </s-layout-section>

        <s-layout-section>
          <s-card rounded="true">
            <s-text as="h3" variant="headingMd">{strings.supportTitle}</s-text>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
              <s-button variant="primary" onClick={() => window.open("mailto:support@crossborder.ai", "_blank")}>
                {strings.supportCta}
              </s-button>
              <s-button variant="tertiary" onClick={() => window.open("https://docs.crossborder.ai", "_blank")}>
                {strings.docs}
              </s-button>
            </div>
          </s-card>
        </s-layout-section>
      </s-layout>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
