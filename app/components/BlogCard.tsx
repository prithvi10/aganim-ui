import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { BlogArticle } from "../content/blog/types";

const categoryColors: Record<string, string> = {
  seo: "bg-sky-500/20 text-sky-300",
  localization: "bg-emerald-500/20 text-emerald-300",
  pricing: "bg-amber-500/20 text-amber-300",
  marketing: "bg-fuchsia-500/20 text-fuchsia-300",
  "ai-tools": "bg-violet-500/20 text-violet-300",
};

export function BlogCard({
  article,
  featured = false,
}: {
  article: BlogArticle;
  featured?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ja" ? "ja" : "en";
  const content = article.content[lang];

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    lang === "ja" ? "ja-JP" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  if (featured) {
    return (
      <Link
        to={`/blog/${article.slug}`}
        className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-fuchsia-500/5"
      >
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={article.heroImage}
              alt={content.heroAlt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center p-8 lg:p-10">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[article.category] || "bg-white/10 text-slate-300"}`}
              >
                {t(`blog.categories.${article.category}`)}
              </span>
              <span className="text-xs text-slate-500">{formattedDate}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              {content.title}
            </h2>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {content.subtitle}
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-fuchsia-300 transition-colors group-hover:text-fuchsia-200">
              {t("blog.readMore")}
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
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg hover:shadow-fuchsia-500/5"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={article.heroImage}
          alt={content.heroAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[article.category] || "bg-white/10 text-slate-300"}`}
          >
            {t(`blog.categories.${article.category}`)}
          </span>
          <span className="text-xs text-slate-500">
            {t("blog.readingTime", {
              minutes: article.readingTime[lang],
            })}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white">
          {content.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-400">
          {content.subtitle}
        </p>
        <span className="mt-4 text-xs text-slate-500">{formattedDate}</span>
      </div>
    </Link>
  );
}
