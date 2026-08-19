import type { MetaDescriptor } from "react-router";
import type { ProfileData, ProfileProject } from "../content/profile/types";
import {
  AGANIM_SITE_URL,
  type ProfileSeoContext,
  getProfileSeoContext,
  profileHomePath,
  profileProjectPath,
} from "./profileHost";

const PUBLISHER_NAME = "Aganim AI";

export const PROFILE_INDEX_TITLE =
  "Prithviraj Pawar — Enterprise AI Engineering Leader";

export const PROFILE_INDEX_DESCRIPTION =
  "Multiple production AI systems shipped. Enterprise AI engineering leader specializing in Agentic AI and MCP — helping companies turn AI from experiments into reliable, governed systems that create real business value.";

export const PROFILE_INDEX_KEYWORDS = [
  "Prithviraj Pawar",
  "enterprise AI",
  "engineering leader",
  "Agentic AI",
  "Model Context Protocol",
  "MCP",
  "PayPay",
  "Rakuten",
  "artificial intelligence",
  "machine learning",
  "Georgia Tech",
].join(", ");

function absoluteUrl(ctx: ProfileSeoContext, path: string) {
  return `${ctx.origin}${path}`;
}

function profileOgImage(ctx: ProfileSeoContext) {
  return absoluteUrl(ctx, "/profile/avatar.jpg");
}

function publisherLogo(ctx: ProfileSeoContext) {
  return `${AGANIM_SITE_URL}/Icon-final.png`;
}

function hreflangLinks(ctx: ProfileSeoContext, path: string): MetaDescriptor[] {
  const url = absoluteUrl(ctx, path);
  return [
    { tagName: "link", rel: "alternate", hrefLang: "en", href: url },
    { tagName: "link", rel: "alternate", hrefLang: "x-default", href: url },
  ];
}

function openGraphMeta(options: {
  title: string;
  description: string;
  url: string;
  image: string;
  type: "website" | "profile" | "article";
}): MetaDescriptor[] {
  return [
    { property: "og:type", content: options.type },
    { property: "og:url", content: options.url },
    { property: "og:title", content: options.title },
    { property: "og:description", content: options.description },
    { property: "og:image", content: options.image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:site_name", content: PUBLISHER_NAME },
  ];
}

function twitterMeta(options: {
  title: string;
  description: string;
  image: string;
}): MetaDescriptor[] {
  return [
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: options.title },
    { name: "twitter:description", content: options.description },
    { name: "twitter:image", content: options.image },
  ];
}

function resolveProfileSeoContext(
  requestOrContext?: Request | ProfileSeoContext,
): ProfileSeoContext {
  if (!requestOrContext) return getProfileSeoContext();
  if ("isSubdomain" in requestOrContext) return requestOrContext;
  return getProfileSeoContext(requestOrContext);
}

export function buildProfileIndexMeta(
  requestOrContext?: Request | ProfileSeoContext,
): MetaDescriptor[] {
  const ctx = resolveProfileSeoContext(requestOrContext);
  const path = profileHomePath(ctx.isSubdomain);
  const url = absoluteUrl(ctx, path);
  const image = profileOgImage(ctx);

  return [
    { title: PROFILE_INDEX_TITLE },
    { name: "description", content: PROFILE_INDEX_DESCRIPTION },
    { name: "keywords", content: PROFILE_INDEX_KEYWORDS },
    { name: "author", content: "Prithviraj Pawar" },
    { tagName: "link", rel: "canonical", href: url },
    ...hreflangLinks(ctx, path),
    ...openGraphMeta({
      title: PROFILE_INDEX_TITLE,
      description: PROFILE_INDEX_DESCRIPTION,
      url,
      image,
      type: "profile",
    }),
    ...twitterMeta({
      title: PROFILE_INDEX_TITLE,
      description: PROFILE_INDEX_DESCRIPTION,
      image,
    }),
  ];
}

export function buildProfileProjectMeta(
  project: ProfileProject,
  requestOrContext?: Request | ProfileSeoContext,
): MetaDescriptor[] {
  const ctx = resolveProfileSeoContext(requestOrContext);
  const title = `${project.title} | Prithviraj Pawar`;
  const description = project.summary;
  const path = profileProjectPath(ctx.isSubdomain, project.slug);
  const url = absoluteUrl(ctx, path);
  const image = absoluteUrl(ctx, project.featuredImage);
  const keywords = [project.title, ...project.tags, "Prithviraj Pawar", "project"].join(
    ", ",
  );

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "author", content: "Prithviraj Pawar" },
    { tagName: "link", rel: "canonical", href: url },
    ...hreflangLinks(ctx, path),
    ...openGraphMeta({
      title,
      description,
      url,
      image,
      type: "article",
    }),
    { property: "article:published_time", content: project.date },
    { property: "article:author", content: "Prithviraj Pawar" },
    {
      property: "article:section",
      content: project.tags[0] || "Projects",
    },
    ...twitterMeta({ title, description, image }),
  ];
}

function buildProfileBreadcrumbSchema(
  ctx: ProfileSeoContext,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(ctx, item.path),
    })),
  };
}

function buildProfilePageSchema(profile: ProfileData, ctx: ProfileSeoContext) {
  const home = profileHomePath(ctx.isSubdomain);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: PROFILE_INDEX_TITLE,
    description: PROFILE_INDEX_DESCRIPTION,
    url: absoluteUrl(ctx, home),
    inLanguage: "en",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.role,
      email: profile.email,
      image: absoluteUrl(ctx, profile.avatar),
      url: absoluteUrl(ctx, home),
      sameAs: [profile.social.github, profile.social.linkedin, profile.hashnodeUrl].filter(Boolean),
      alumniOf: profile.education.map((item) => ({
        "@type": "EducationalOrganization",
        name: item.course,
      })),
      worksFor: profile.organizations.map((org) => ({
        "@type": "Organization",
        name: org.name,
        url: org.url,
      })),
    },
  };
}

function buildProfileWebPageSchema(ctx: ProfileSeoContext) {
  const home = profileHomePath(ctx.isSubdomain);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: PROFILE_INDEX_TITLE,
    description: PROFILE_INDEX_DESCRIPTION,
    url: absoluteUrl(ctx, home),
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: ctx.isSubdomain ? "Prithviraj Pawar" : PUBLISHER_NAME,
      url: ctx.origin,
    },
  };
}

function buildProfileProjectsItemListSchema(
  profile: ProfileData,
  ctx: ProfileSeoContext,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Projects by Prithviraj Pawar",
    itemListElement: profile.projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: project.title,
      url: absoluteUrl(ctx, profileProjectPath(ctx.isSubdomain, project.slug)),
    })),
  };
}

function buildProfileProjectArticleSchema(
  project: ProfileProject,
  ctx: ProfileSeoContext,
) {
  const home = profileHomePath(ctx.isSubdomain);
  const projectPath = profileProjectPath(ctx.isSubdomain, project.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.summary,
    image: absoluteUrl(ctx, project.featuredImage),
    datePublished: project.date,
    dateModified: project.date,
    author: {
      "@type": "Person",
      name: "Prithviraj Pawar",
      url: absoluteUrl(ctx, home),
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: AGANIM_SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: publisherLogo(ctx),
      },
    },
    keywords: project.tags.join(", "),
    inLanguage: "en",
    mainEntityOfPage: absoluteUrl(ctx, projectPath),
  };
}

export function buildProfileIndexSchemas(
  profile: ProfileData,
  requestOrContext?: Request | ProfileSeoContext,
) {
  const ctx = resolveProfileSeoContext(requestOrContext);
  const home = profileHomePath(ctx.isSubdomain);

  return [
    buildProfileBreadcrumbSchema(ctx, [
      { name: "Home", path: home },
    ]),
    buildProfilePageSchema(profile, ctx),
    buildProfileWebPageSchema(ctx),
    buildProfileProjectsItemListSchema(profile, ctx),
  ];
}

export function buildProfileProjectSchemas(
  project: ProfileProject,
  requestOrContext?: Request | ProfileSeoContext,
) {
  const ctx = resolveProfileSeoContext(requestOrContext);
  const home = profileHomePath(ctx.isSubdomain);
  const projectPath = profileProjectPath(ctx.isSubdomain, project.slug);

  return [
    buildProfileProjectArticleSchema(project, ctx),
    buildProfileBreadcrumbSchema(ctx, [
      { name: "Home", path: home },
      { name: project.title, path: projectPath },
    ]),
  ];
}
