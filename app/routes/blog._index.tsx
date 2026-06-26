import { useState } from "react";
import type { MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import { LandingHeader, LandingFooter, Reveal } from "../components/LandingLayout";
import { BlogCard } from "../components/BlogCard";
import { articles } from "../content/blog";
import type { BlogCategory } from "../content/blog/types";

const SITE_URL = "https://aganim-ai.com";

export const meta: MetaFunction = () => {
  const title = "Insights — Cross-Border E-Commerce Guides | Aganim AI";
  const description =
    "Practical guides for Shopify merchants selling globally. Learn about AI product descriptions, international SEO, competitive pricing, and marketing content automation.";

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/blog` },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${SITE_URL}/blog` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: "Aganim AI" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
};

const CATEGORIES: Array<"all" | BlogCategory> = [
  "all",
  "localization",
  "seo",
  "pricing",
  "marketing",
];

export default function BlogIndex() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered =
    activeCategory === "all"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Aganim AI Insights",
            description:
              "Cross-border e-commerce guides for Shopify merchants",
            url: `${SITE_URL}/blog`,
            publisher: {
              "@type": "Organization",
              name: "Aganim AI",
              url: SITE_URL,
            },
          }),
        }}
      />
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-sky-400/15 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Aganim AI
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t("blog.title")}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25"
                  : "border border-white/10 text-slate-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {t(`blog.categories.${cat}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {featured && (
          <Reveal>
            <BlogCard article={featured} featured />
          </Reveal>
        )}

        {rest.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <Reveal key={article.slug}>
                <BlogCard article={article} />
              </Reveal>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="py-20 text-center text-slate-400">
            No articles in this category yet.
          </p>
        )}
      </section>

      <LandingFooter />
    </div>
  );
}
