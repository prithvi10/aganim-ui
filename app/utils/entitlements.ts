import type { PlanName } from "./planCatalog";
import { PLAN_FREE, PLAN_BASIC, PLAN_STANDARD, PLAN_PRO } from "./planCatalog";

export type Entitlements = Record<string, unknown>;
export type FeatureUsageEntry = { used: number; limit: number };
export type FeatureUsageMap = Record<string, FeatureUsageEntry>;

const FEATURE_MIN_TIER: Record<string, PlanName> = {
  seo: PLAN_STANDARD,
  price_scout: PLAN_STANDARD,
  image_refinement_adhoc: PLAN_STANDARD,
  ad_image_generation: PLAN_STANDARD,
  social_post_preview: PLAN_FREE,
  autonomous: PLAN_PRO,
  apply_price: PLAN_FREE,
  multi_locale_bulk: PLAN_PRO,
};

export function canAccess(ent: Entitlements | undefined, feature: string): boolean {
  if (!ent) return false;
  return Boolean(ent[feature]);
}

export function getRequiredTier(feature: string): PlanName {
  return FEATURE_MIN_TIER[feature] ?? PLAN_PRO;
}

export function isFeatureLocked(
  ent: Entitlements | undefined,
  feature: string,
): { locked: boolean; tier: PlanName } {
  const locked = !canAccess(ent, feature);
  return { locked, tier: getRequiredTier(feature) };
}

export function planRank(name: string | undefined): number {
  const n = (name ?? "").trim().toLowerCase();
  if (n === "pro") return 3;
  if (n === "standard") return 2;
  if (n === "basic") return 1;
  return 0;
}

export function formatUsage(
  entry: FeatureUsageEntry | undefined,
  isLifetime: boolean = false,
): string {
  if (!entry) return "";
  const { used, limit } = entry;
  if (limit === -1) return "Unlimited";
  if (limit === 0) return "Not available";
  const remaining = Math.max(0, limit - used);
  if (isLifetime) return `${remaining} / ${limit} remaining`;
  return `${used} / ${limit} this month`;
}

export function derivePlanFlags(planName: string | undefined) {
  const name = (planName ?? "Free").trim();
  return {
    isFreePlan: name === PLAN_FREE,
    isBasicPlan: name === PLAN_BASIC,
    isStandardPlan: name === PLAN_STANDARD,
    isProPlan: name === PLAN_PRO,
    isStandardPlus: name === PLAN_STANDARD || name === PLAN_PRO,
  };
}
