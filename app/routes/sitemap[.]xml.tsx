import type { LoaderFunctionArgs } from "react-router";
import { articles } from "../content/blog";
import { profileData } from "../content/profile";
import {
  AGANIM_SITE_URL,
  isProfileSubdomainRequest,
  PROFILE_SUBDOMAIN_URL,
} from "../utils/profileHost";

const staticPages = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/features", changefreq: "weekly", priority: "0.9" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/support", changefreq: "monthly", priority: "0.7" },
  { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
];

function renderUrl(
  site: string,
  page: {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  },
) {
  return `  <url>
    <loc>${site}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
}

export function loader({ request }: LoaderFunctionArgs) {
  const today = new Date().toISOString().slice(0, 10);

  if (isProfileSubdomainRequest(request)) {
    const profilePages = [
      {
        loc: "/",
        lastmod: today,
        changefreq: "monthly",
        priority: "1.0",
      },
      ...profileData.projects.map((project) => ({
        loc: `/projects/${project.slug}`,
        lastmod: project.date,
        changefreq: "yearly",
        priority: "0.8",
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${profilePages.map((page) => renderUrl(PROFILE_SUBDOMAIN_URL, page)).join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  }

  const blogPages = articles.map((article) => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.publishedAt,
    changefreq: "monthly",
    priority: "0.8",
  }));

  const profilePages = [
    {
      loc: "/",
      lastmod: today,
      changefreq: "monthly",
      priority: "0.9",
    },
    ...profileData.projects.map((project) => ({
      loc: `/projects/${project.slug}`,
      lastmod: project.date,
      changefreq: "yearly",
      priority: "0.7",
    })),
  ];

  const staticUrls = staticPages.map((page) =>
    renderUrl(AGANIM_SITE_URL, { ...page, lastmod: today }),
  );

  const blogUrls = blogPages.map((page) => renderUrl(AGANIM_SITE_URL, page));

  const profileUrls = profilePages.map((page) =>
    renderUrl(PROFILE_SUBDOMAIN_URL, page),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...blogUrls, ...profileUrls].join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
