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
    <s-page>
      <style>
        {`
          .cb-container { max-width: 1200px; margin: 0 auto; padding: 24px; font-family: -apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif; color: #1c1c1c; }
          .cb-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
          .cb-title { font-size: 28px; font-weight: 700; margin: 0; }
          .cb-sub { font-size: 16px; color: #5c5f62; margin-top: 4px; max-width: 720px; }
          .cb-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; align-items: start; }
          .cb-card { background: #fff; border: 1px solid #dfe3e8; border-radius: 12px; padding: 20px; box-shadow: 0 1px 0 rgba(22,29,37,0.05); }
          .cb-card h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
          .cb-card p { margin: 4px 0 0; color: #5c5f62; }
          .cb-usage { margin-top: 12px; }
          .cb-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 12px; }
          .cb-plan { padding: 16px; }
          .cb-plan header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
          .cb-price { font-size: 20px; font-weight: 700; margin: 4px 0 10px; color: #202223; }
          .cb-features s-text { display: block; margin: 2px 0; }
          .cb-support { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
          .cb-usage-meta { display: flex; justify-content: space-between; font-size: 14px; color: #5c5f62; }
        `}
      </style>

      <div className="cb-container">
        <div className="cb-hero">
          <div>
            <h1 className="cb-title">{strings.title}</h1>
            <p className="cb-sub">{strings.subtitle}</p>
          </div>
          <s-button variant="tertiary" onClick={onToggleLang}>
            {strings.langToggle}
          </s-button>
        </div>

        <div className="cb-grid">
          <div className="cb-card">
            <h3>{strings.usageTitle}</h3>
            <div className="cb-usage-meta">
              <span>{used} / {quota} credits</span>
              <span>{percent}%</span>
            </div>
            <div className="cb-usage">
              <s-progress-bar progress={percent}></s-progress-bar>
            </div>
          </div>

          <div className="cb-card">
            <h3>{strings.supportTitle}</h3>
            <div className="cb-support">
              <s-button variant="primary" onClick={() => window.open("mailto:support@crossborder.ai", "_blank")}>
                {strings.supportCta}
              </s-button>
              <s-button variant="tertiary" onClick={() => window.open("https://docs.crossborder.ai", "_blank")}>
                {strings.docs}
              </s-button>
            </div>
          </div>
        </div>

        <div className="cb-card" style={{ marginTop: "20px" }}>
          <h3>{strings.pricingTitle}</h3>
          <div className="cb-pricing-grid">
            {PLANS.map((plan) => (
              <s-card key={plan.key} padding="tight" rounded="true" background="surface" className="cb-plan">
                <header>
                  <s-text variant="headingMd">{strings[plan.key]}</s-text>
                  {plan.recommended && (
                    <s-badge tone="info">{strings.recommended}</s-badge>
                  )}
                </header>
                <div className="cb-price">{plan.price}</div>
                <div className="cb-features">
                  {plan.features.map((f) => (
                    <s-text key={f}>{f}</s-text>
                  ))}
                </div>
                <s-button variant="primary" full-width="true" onClick={() => triggerBilling(plan.key)}>
                  {strings[plan.key]}
                </s-button>
              </s-card>
            ))}
          </div>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
