import type { BlogArticle } from "./types";
import { aiProductDescriptionsCompared } from "./ai-product-descriptions-compared";
import { crossBorderPricingStrategy } from "./cross-border-pricing-strategy";
import { marketingJapaneseProducts } from "./marketing-japanese-products";
import { seoJapaneseShopifyGuide } from "./seo-japanese-shopify-guide";
import { translationVsLocalization } from "./translation-vs-localization";

export const articles: BlogArticle[] = [
  aiProductDescriptionsCompared,
  crossBorderPricingStrategy,
  marketingJapaneseProducts,
  seoJapaneseShopifyGuide,
  translationVsLocalization,
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(
  category?: string
): BlogArticle[] {
  if (!category || category === "all") return articles;
  return articles.filter((a) => a.category === category);
}

export { type BlogArticle, type BlogCategory } from "./types";
