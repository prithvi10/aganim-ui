import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useTranslation } from "react-i18next";
import { LandingHeader, LandingFooter, Reveal } from "../components/LandingLayout";
import { BlogSectionRenderer } from "../components/BlogSections";
import { getArticleBySlug, articles } from "../content/blog";
import { BlogCard } from "../components/BlogCard";

const SITE_URL = "https://aganim-ai.com";

export function loader({ params }: LoaderFunctionArgs) {
  const article = getArticleBySlug(params.slug || "");
  if (!article) {
    throw new Response("Not found", { status: 404 });
  }
  return { article };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.article) {
    return [{ title: "Article Not Found | Aganim AI" }];
  }

  const article = data.article;
  const en = article.content.en;
  const ja = article.content.ja;

  return [
    { title: en.metaTitle },
    { name: "description", content: en.metaDescription },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/blog/${article.slug}` },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "en",
      href: `${SITE_URL}/blog/${article.slug}`,
    },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "ja",
      href: `${SITE_URL}/blog/${article.slug}`,
    },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "x-default",
      href: `${SITE_URL}/blog/${article.slug}`,
    },
    { property: "og:type", content: "article" },
    { property: "og:url", content: `${SITE_URL}/blog/${article.slug}` },
    { property: "og:title", content: en.metaTitle },
    { property: "og:description", content: en.metaDescription },
    { property: "og:image", content: article.ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:site_name", content: "Aganim AI" },
    { property: "article:published_time", content: article.publishedAt },
    { property: "article:author", content: "Aganim AI" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: en.metaTitle },
    { name: "twitter:description", content: en.metaDescription },
    { name: "twitter:image", content: article.ogImage },
    { name: "keywords", content: `${ja.metaTitle}, ${en.metaTitle}` },
  ];
};

const categoryColors: Record<string, string> = {
  seo: "bg-sky-500/20 text-sky-300",
  localization: "bg-emerald-500/20 text-emerald-300",
  pricing: "bg-amber-500/20 text-amber-300",
  marketing: "bg-fuchsia-500/20 text-fuchsia-300",
  "ai-tools": "bg-violet-500/20 text-violet-300",
};

export default function BlogArticlePage() {
  const { article } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ja" ? "ja" : "en";
  const content = article.content[lang];

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    lang === "ja" ? "ja-JP" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const relatedArticles = articles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="theme-scope min-h-screen bg-slate-950 text-white">
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: content.title,
            description: content.metaDescription,
            image: article.heroImage,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt || article.publishedAt,
            author: {
              "@type": "Organization",
              name: "Aganim AI",
              url: SITE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "Aganim AI",
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/Icon-final.png`,
              },
            },
            inLanguage: lang,
            mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
          }),
        }}
      />

      {/* FAQ Schema */}
      {content.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: content.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      )}

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${SITE_URL}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: content.title,
                item: `${SITE_URL}/blog/${article.slug}`,
              },
            ],
          }),
        }}
      />

      <LandingHeader />

      {/* Hero Image */}
      <section className="pt-24 pb-0">
        <div className="mx-auto max-w-[1100px] px-6">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
              <img
                src={article.heroImage}
                alt={content.heroAlt}
                className="w-full h-auto object-contain"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Article Header */}
      <section className="pt-10 pb-0">
        <div className="mx-auto max-w-[720px] px-6">
          <Reveal>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[article.category] || "bg-white/10 text-slate-300"}`}
              >
                {t(`blog.categories.${article.category}`)}
              </span>
              <span className="text-xs text-slate-500">{formattedDate}</span>
              <span className="text-xs text-slate-500">
                · {t("blog.readingTime", { minutes: article.readingTime[lang] })}
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {content.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              {content.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* TL;DR */}
      <section className="pt-8 pb-0">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="rounded-xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/5 p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
              TL;DR
            </p>
            <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
              {content.tldr}
            </p>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <article className="pt-8 pb-16">
        <div className="mx-auto max-w-[720px] px-6">
          <div className="space-y-6">
            {content.sections.map((section, i) => (
              <BlogSectionRenderer key={i} section={section} />
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        {content.faq.length > 0 && (
          <div className="mx-auto mt-16 max-w-[720px] px-6">
            <h2 className="mb-8 border-l-2 border-fuchsia-400 pl-4 text-2xl font-semibold text-white sm:text-3xl">
              {t("blog.faqTitle")}
            </h2>
            <BlogSectionRenderer
              section={{ type: "faq", items: content.faq }}
            />
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-8 text-2xl font-semibold text-white">
              {t("blog.relatedArticles")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((a) => (
                <BlogCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <LandingFooter />
    </div>
  );
}
