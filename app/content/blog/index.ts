import type { BlogArticle } from "./types";
import { aiProductDescriptionsCompared } from "./ai-product-descriptions-compared";

export const articles: BlogArticle[] = [
  aiProductDescriptionsCompared,
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
