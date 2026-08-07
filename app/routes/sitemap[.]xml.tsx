import { articles } from "../content/blog";
import { profileData } from "../content/profile";

const SITE = "https://aganim-ai.com";

const staticPages = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/features", changefreq: "weekly", priority: "0.9" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/support", changefreq: "monthly", priority: "0.7" },
  { loc: "/profile", changefreq: "monthly", priority: "0.7" },
  { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
];

export function loader() {
  const today = new Date().toISOString().slice(0, 10);

  const blogPages = articles.map((article) => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.publishedAt,
    changefreq: "monthly",
    priority: "0.8",
  }));

  const profilePages = profileData.projects.map((project) => ({
    loc: `/profile/projects/${project.slug}`,
    lastmod: project.date,
    changefreq: "yearly",
    priority: "0.6",
  }));

  const staticUrls = staticPages.map(
    (p) => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  );

  const blogUrls = blogPages.map(
    (p) => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  );

  const profileUrls = profilePages.map(
    (p) => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
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
