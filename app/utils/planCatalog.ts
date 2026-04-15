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
  highlight?: boolean;
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
            { label: t("planCatalog.products10"), included: true },
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
      tagline: t("planCatalog.basicTagline"),
      productLimit: t("planCatalog.products50"),
      sections: [
        {
          title: t("planCatalog.rewriter"),
          features: [
            { label: t("planCatalog.products50"), included: true },
            { label: t("planCatalog.aiProductRewrite"), included: true },
            { label: t("planCatalog.jpValueAutoDetected"), included: true },
            { label: t("planCatalog.autoUnitConversion"), included: true },
            { label: t("planCatalog.brandTonesVariety"), included: true },
            { label: t("planCatalog.autoFaqGeneration"), included: true },
            { label: t("planCatalog.twelveGlobalMarkets"), included: true },
            { label: t("planCatalog.aiTranslatorInRewriter"), included: true },
          ],
        },
        {
          title: t("planCatalog.writingStudio"),
          features: [
            { label: t("planCatalog.writingStudioTemplates"), included: true },
          ],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.captionGeneration"), included: true },
            { label: t("planCatalog.welcomeEmail"), included: true },
            { label: t("planCatalog.abandonedCartEmail"), included: true },
            { label: t("planCatalog.googleAds"), included: true },
            { label: t("planCatalog.fbInstaAds"), included: true },
            { label: t("planCatalog.blogPosts"), included: true },
            { label: t("planCatalog.emailTemplates"), included: true },
            { label: t("planCatalog.retailCampaignInfo"), included: true },
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
            { label: t("planCatalog.unlimitedProducts"), included: true },
            { label: t("planCatalog.everythingInBasic"), included: true },
          ],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.everythingInBasic"), included: true },
            { label: t("planCatalog.visualAdGeneration"), included: true },
            { label: t("planCatalog.socialPostPreview"), included: true },
          ],
        },
        {
          title: t("planCatalog.missionsSection"),
          features: [
            { label: t("planCatalog.introToAgents"), included: true },
            { label: t("planCatalog.scenarioSpecificPipelines"), included: true },
            { label: t("planCatalog.fullLaunchPipelines"), included: true },
            { label: t("planCatalog.visualAgents"), included: true },
          ],
        },
        {
          title: t("planCatalog.imagesSection"),
          highlight: true,
          features: [
            { label: t("planCatalog.imageCredits10"), included: true },
            { label: t("planCatalog.imageRefinement"), included: true },
            { label: t("planCatalog.visualAdGeneration"), included: true },
            { label: t("planCatalog.heroImageGeneration"), included: true },
            { label: t("planCatalog.blogImageGeneration"), included: true },
            { label: t("planCatalog.collectionImageGeneration"), included: true },
          ],
        },
        {
          title: t("planCatalog.seoSection"),
          highlight: true,
          features: [
            { label: t("planCatalog.globalCompetitorRanks"), included: true },
            { label: t("planCatalog.perfectSeoGenerator"), included: true },
            { label: t("planCatalog.ctrAnalysis"), included: true },
            { label: t("planCatalog.seoEditorPreview"), included: true },
          ],
        },
        {
          title: t("planCatalog.priceScoutSection"),
          highlight: true,
          features: [
            { label: t("planCatalog.globalCompetitorPrice"), included: true },
            { label: t("planCatalog.priceRecommendation"), included: true },
          ],
        },
      ],
    },
    {
      name: PLAN_PRO,
      price: "$149",
      tagline: t("planCatalog.proTagline"),
      productLimit: t("planCatalog.unlimitedProducts"),
      sections: [
        {
          title: t("planCatalog.rewriter"),
          highlight: true,
          features: [
            { label: t("planCatalog.unlimitedProducts"), included: true },
            { label: t("planCatalog.everythingInStandard"), included: true },
            { label: t("planCatalog.multiMarketBulk"), included: true, highlight: true },
          ],
        },
        {
          title: t("planCatalog.seoSection"),
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
          ],
        },
        {
          title: t("planCatalog.marketingSection"),
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
          ],
        },
        {
          title: t("planCatalog.priceScoutSection"),
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
          ],
        },
        {
          title: t("planCatalog.missionsAutonomous"),
          highlight: true,
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
            { label: t("planCatalog.unlimitedMissions"), included: true },
            { label: t("planCatalog.bulkUploadLaunch"), included: true },
          ],
        },
        {
          title: t("planCatalog.imagesSection"),
          highlight: true,
          features: [
            { label: t("planCatalog.everythingInStandard"), included: true },
            { label: t("planCatalog.imageCredits100"), included: true },
          ],
        },
      ],
    },
  ];
}
