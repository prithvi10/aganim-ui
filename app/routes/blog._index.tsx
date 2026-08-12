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

// Standalone long-form technical series, served as self-contained HTML pages
// from /public/deep-learning. Not part of the typed BlogArticle system.
type SeriesEntry = {
  part: string;
  title: string;
  blurb: string;
  href: string;
  minutes: number;
};

const DEEP_LEARNING_SERIES: SeriesEntry[] = [
  {
    part: "Part 1",
    title: "Foundations of Deep Learning",
    blurb:
      "The ideas behind every LLM — from a single neuron to backprop, CNNs, RNNs, and the first glimpse of attention.",
    href: "/deep-learning/foundations-of-deep-learning.html",
    minutes: 18,
  },
  {
    part: "Part 2",
    title: "The Transformer, Deep Dive",
    blurb:
      "Attention, encoders, and decoders — the 2017 architecture rebuilt block by block, with the math and the intuition.",
    href: "/deep-learning/the-transformer-deep-dive.html",
    minutes: 22,
  },
  {
    part: "Part 3",
    title: "Modern Frontier LLMs",
    blurb:
      "From the Transformer to Claude, Gemini, and GPT — RoPE, RMSNorm, SwiGLU, GQA, MoE, alignment, and scaling laws.",
    href: "/deep-learning/modern-frontier-llms.html",
    minutes: 26,
  },
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
    <div className="theme-scope min-h-screen bg-slate-950 text-white">
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

      {/* Deep Learning technical series */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <div className="mb-8 border-t border-white/10 pt-14">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Series · by Prithviraj Pawar
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Deep Learning, from the neuron to frontier LLMs
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              A three-part deep dive that builds modern language models up from
              first principles — intuition first, then the math, then the
              architecture behind systems like Claude, Gemini, and GPT.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {DEEP_LEARNING_SERIES.map((entry) => (
            <Reveal key={entry.href}>
              <a
                href={entry.href}
                className="group flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg hover:shadow-fuchsia-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300">
                    {entry.part}
                  </span>
                  <span className="text-xs text-slate-500">
                    {entry.minutes} min read
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {entry.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                  {entry.blurb}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-fuchsia-300 transition-colors group-hover:text-fuchsia-200">
                  Read {entry.part.toLowerCase()}
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
