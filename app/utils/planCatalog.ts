import type { TFunction } from "i18next";

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
  highlight?: boolean;
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

export function buildPlanCatalog(t: TFunction): PlanCardModel[] {
  return [
    {
      name: PLAN_FREE,
      price: "$0",
      tagline: t("planCatalog.tryEverything"),
      productLimit: t("planCatalog.products10"),
      sections: [
        {
          title: t("planCatalog.rewriter"),
          features: [
            { label: t("planCatalog.aiProductRewrite"), included: true },
            { label: t("planCatalog.keyDetailsAutoDetected"), included: true },
          ],
        },
        {
          title: t("planCatalog.seoSection"),
          features: [
            { label: t("planCatalog.seoTitleMeta"), included: true },
            { label: t("planCatalog.seoEditorPreview"), included: true },
          ],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.instagramCaptions"), included: true },
            { label: t("planCatalog.seasonalCampaigns"), included: true },
          ],
        },
        {
          title: t("planCatalog.priceScoutSection"),
          features: [{ label: t("planCatalog.competitivePricing"), included: true }],
        },
        {
          title: t("planCatalog.missionsSection"),
          features: [
            { label: t("planCatalog.fullProductLaunch"), included: true },
          ],
        },
        {
          title: t("planCatalog.imagesSection"),
          features: [
            { label: t("planCatalog.imageRefinement"), included: true },
          ],
        },
      ],
    },
    {
      name: PLAN_BASIC,
      price: "$29",
      tagline: "",
      productLimit: t("planCatalog.products50"),
      sections: [
        {
          title: t("planCatalog.rewriter"),
          features: [
            { label: t("planCatalog.aiProductRewrite"), included: true },
            { label: t("planCatalog.keyDetailsAutoDetected"), included: true },
            { label: t("planCatalog.enUnitConversion"), included: true },
          ],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.instagramCaptions"), included: true },
            { label: t("planCatalog.seasonalCampaigns"), included: true },
          ],
        },
        {
          title: t("planCatalog.missionsSection"),
          features: [
            { label: t("planCatalog.textOnlyMission"), included: true },
          ],
        },
      ],
    },
    {
      name: PLAN_STANDARD,
      price: "$79",
      tagline: t("planCatalog.standardTagline"),
      productLimit: t("planCatalog.unlimitedProducts"),
      sections: [
        {
          title: t("planCatalog.rewriter"),
          features: [
            { label: t("planCatalog.everythingInBasic"), included: true },
            { label: t("planCatalog.twelveTargetMarkets"), included: true },
            { label: t("planCatalog.brandTones"), included: true },
          ],
        },
        {
          title: t("planCatalog.seoSection"),
          features: [
            { label: t("planCatalog.seoTitleMeta"), included: true },
            { label: t("planCatalog.seoEditorPreview"), included: true },
          ],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.everythingInBasic"), included: true },
          ],
        },
        {
          title: t("planCatalog.priceScoutSection"),
          features: [{ label: t("planCatalog.competitivePricing"), included: true }],
        },
        {
          title: t("planCatalog.missionsSection"),
          features: [
            { label: t("planCatalog.fullTextPipeline"), included: true },
          ],
        },
      ],
    },
    {
      name: PLAN_PRO,
      price: "$199",
      tagline: t("planCatalog.proTagline"),
      productLimit: t("planCatalog.unlimitedProducts"),
      sections: [
        {
          title: t("planCatalog.rewriter"),
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
            { label: t("planCatalog.multiMarketBulk"), included: true, highlight: true },
            { label: t("planCatalog.priorityAiModel"), included: true },
          ],
        },
        {
          title: t("planCatalog.seoSection"),
          features: [{ label: t("planCatalog.fullSeoOptimization"), included: true }],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
            { label: t("planCatalog.visualAdGeneration"), included: true },
            { label: t("planCatalog.socialPostPreview"), included: true },
          ],
        },
        {
          title: t("planCatalog.priceScoutSection"),
          features: [
            { label: t("planCatalog.pricingAnalysis"), included: true },
            { label: t("planCatalog.autoApplyPrice"), included: true },
          ],
        },
        {
          title: t("planCatalog.missionsAutonomous"),
          features: [
            { label: t("planCatalog.fullPipelineWithImages"), included: true },
            { label: t("planCatalog.agenticWorkflows"), included: true },
            { label: t("planCatalog.publishToShopify"), included: true },
            { label: t("planCatalog.applyRecommendedPrice"), included: true },
            { label: t("planCatalog.metaIntegration"), included: true },
          ],
        },
        {
          title: t("planCatalog.imagesSection"),
          features: [
            { label: t("planCatalog.imageRefinementAllFeatures"), included: true },
          ],
        },
      ],
    },
  ];
}
