export const PLAN_FREE = "Free" as const;
export const PLAN_BASIC = "Basic" as const;
export const PLAN_STANDARD = "Standard" as const;
export const PLAN_PRO = "Pro" as const;

export type PlanName =
  | typeof PLAN_FREE
  | typeof PLAN_BASIC
  | typeof PLAN_STANDARD
  | typeof PLAN_PRO;

export type PlanFeature = {
  label: string;
  included: boolean;
};

export type PlanSection = {
  title: string;
  subtitle?: string;
  features: PlanFeature[];
};

export type PlanCardModel = {
  name: PlanName;
  price: string;
  tagline: string;
  productLimit: string;
  sections: PlanSection[];
};

export const PLAN_CATALOG: PlanCardModel[] = [
  {
    name: PLAN_FREE,
    price: "$0",
    tagline: "Try everything, limited access",
    productLimit: "10 products (1 week trial)",
    sections: [
      {
        title: "Rewriter",
        features: [
          { label: "AI product rewrite (title + description)", included: true },
          { label: "Key Details auto-detected", included: true },
        ],
      },
      {
        title: "SEO",
        features: [
          { label: "SEO title + meta description", included: true },
          { label: "SEO editor + preview", included: true },
        ],
      },
      {
        title: "Marketing",
        features: [
          { label: "Instagram captions + hashtags", included: true },
          { label: "Seasonal campaign ideas", included: true },
        ],
      },
      {
        title: "Price Scout",
        features: [{ label: "Competitive pricing analysis", included: true }],
      },
      {
        title: "Missions",
        features: [
          { label: "Full product launch (incl. images)", included: true },
        ],
      },
      {
        title: "Images",
        features: [
          { label: "Image refinement", included: true },
        ],
      },
    ],
  },
  {
    name: PLAN_BASIC,
    price: "$29",
    tagline: "",
    productLimit: "50 products / month",
    sections: [
      {
        title: "Rewriter",
        features: [
          { label: "AI product rewrite (title + description)", included: true },
          { label: "Key Details auto-detected", included: true },
          { label: "EN unit conversion (metric + US)", included: true },
        ],
      },
      {
        title: "Marketing",
        features: [
          { label: "Instagram captions + hashtags", included: true },
          { label: "Seasonal campaign ideas", included: true },
        ],
      },
      {
        title: "Missions",
        features: [
          { label: "Text-only mission (Rewriter + Marketing)", included: true },
        ],
      },
    ],
  },
  {
    name: PLAN_STANDARD,
    price: "$79",
    tagline: "",
    productLimit: "Unlimited products",
    sections: [
      {
        title: "Rewriter",
        features: [
          { label: "Everything in Basic", included: true },
          { label: "Multi-market (multiple locales)", included: true },
          { label: "Brand tones: Luxury / Minimalist / Playful", included: true },
        ],
      },
      {
        title: "SEO",
        features: [
          { label: "SEO title + meta description", included: true },
          { label: "SEO editor + preview", included: true },
        ],
      },
      {
        title: "Marketing",
        features: [
          { label: "Everything in Basic", included: true },
        ],
      },
      {
        title: "Price Scout",
        features: [{ label: "Competitive pricing analysis", included: true }],
      },
      {
        title: "Missions",
        features: [
          { label: "Full text pipeline (no image agents)", included: true },
        ],
      },
    ],
  },
  {
    name: PLAN_PRO,
    price: "$199",
    tagline: "",
    productLimit: "Unlimited products",
    sections: [
      {
        title: "Rewriter",
        features: [
          { label: "Everything in Standard", included: true },
          { label: "Priority AI model", included: true },
        ],
      },
      {
        title: "SEO",
        features: [{ label: "Full SEO optimization", included: true }],
      },
      {
        title: "Marketing",
        features: [
          { label: "Everything in Standard", included: true },
          { label: "Visual Ad generation", included: true },
          { label: "Social Post preview", included: true },
        ],
      },
      {
        title: "Price Scout",
        features: [
          { label: "Pricing analysis", included: true },
          { label: "Auto-apply price to Shopify", included: true },
        ],
      },
      {
        title: "Missions & Autonomous",
        features: [
          { label: "Full pipeline with image agents", included: true },
          { label: "Agentic workflows", included: true },
          { label: "Publish to Shopify", included: true },
          { label: "Apply recommended price", included: true },
          { label: "Meta (Facebook/Instagram) integration", included: true },
        ],
      },
      {
        title: "Images",
        features: [
          { label: "Image refinement across all features", included: true },
        ],
      },
    ],
  },
];
