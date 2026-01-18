export const PLAN_FREE = "Free" as const;
export const PLAN_BASIC = "Basic" as const;
export const PLAN_STANDARD = "Standard" as const;
export const PLAN_PRO = "Pro" as const;

export type PlanName =
  | typeof PLAN_FREE
  | typeof PLAN_BASIC
  | typeof PLAN_STANDARD
  | typeof PLAN_PRO;

export type PlanCardModel = {
  name: PlanName;
  price: string;
  rewrites: string;
  rewriterFeatures: string[];
  marketingFeatures: string[];
  otherFeatures: string[];
};

export const PLAN_CATALOG: PlanCardModel[] = [
  {
    name: PLAN_FREE,
    price: "$0",
    rewrites: "10 lifetime credits",
    rewriterFeatures: [
      "AI product rewrite (title + description)",
      "SEO details (title + meta description)",
      "SEO editor + preview",
      "1 market at a time (1 locale)",
    ],
    marketingFeatures: [
      "Instagram captions + hashtags",
      "Seasonal campaign ideas + caption",
    ],
    otherFeatures: [],
  },
  {
    name: PLAN_BASIC,
    price: "$49",
    rewrites: "50 rewrites / month",
    rewriterFeatures: [
      "AI product rewrite (title + description)",
      "SEO details (title + meta description)",
      "SEO editor + preview",
      "Key Details (Nuance) auto-detected",
      "EN unit conversion (metric + US)",
      "1 market at a time (1 locale)",
    ],
    marketingFeatures: [
      "Instagram captions + hashtags",
      "Seasonal campaign ideas + caption",
    ],
    otherFeatures: [],
  },
  {
    name: PLAN_STANDARD,
    price: "$99",
    rewrites: "100 rewrites / month",
    rewriterFeatures: [
      "Everything in Basic (Rewriter)",
      "Multi-market (multiple locales per run)",
      "Brand tones: Luxury / Minimalist / Playful",
      "Bulk market optimization",
    ],
    marketingFeatures: ["Everything in Basic (Marketing)"],
    otherFeatures: [],
  },
  {
    name: PLAN_PRO,
    price: "$199",
    rewrites: "Unlimited rewrites",
    rewriterFeatures: ["Everything in Standard (Rewriter)", "Unlimited bulk multi-market"],
    marketingFeatures: ["Everything in Standard (Marketing)"],
    otherFeatures: ["Priority AI (GPT‑5)"],
  },
];

