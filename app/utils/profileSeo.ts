import type { MetaDescriptor } from "react-router";
import type { ProfileData, ProfileProject } from "../content/profile/types";

export const PROFILE_SITE_URL = "https://aganim-ai.com";
export const PROFILE_OG_IMAGE = `${PROFILE_SITE_URL}/profile/avatar.jpg`;

const PUBLISHER_NAME = "Aganim AI";
const PUBLISHER_LOGO = `${PROFILE_SITE_URL}/Icon-final.png`;

export const PROFILE_INDEX_TITLE =
  "Prithviraj Pawar — Engineering Leader | Portfolio & Projects";

export const PROFILE_INDEX_DESCRIPTION =
  "Professional profile of Prithviraj Pawar, an engineering leader with experience at PayPay and Rakuten. Explore projects in artificial intelligence, machine learning, robotics, and quantitative technical analysis.";

export const PROFILE_INDEX_KEYWORDS = [
  "Prithviraj Pawar",
  "engineering leader",
  "PayPay",
  "Rakuten",
  "artificial intelligence",
  "machine learning",
  "robotics",
  "technical analysis",
  "Georgia Tech",
  "software engineering",
].join(", ");

function profileUrl(path: string) {
  return `${PROFILE_SITE_URL}${path}`;
}

function hreflangLinks(path: string): MetaDescriptor[] {
  const url = profileUrl(path);
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

export function buildProfileIndexMeta(): MetaDescriptor[] {
  const path = "/profile";
  const url = profileUrl(path);

  return [
    { title: PROFILE_INDEX_TITLE },
    { name: "description", content: PROFILE_INDEX_DESCRIPTION },
    { name: "keywords", content: PROFILE_INDEX_KEYWORDS },
    { name: "author", content: "Prithviraj Pawar" },
    { tagName: "link", rel: "canonical", href: url },
    ...hreflangLinks(path),
    ...openGraphMeta({
      title: PROFILE_INDEX_TITLE,
      description: PROFILE_INDEX_DESCRIPTION,
      url,
      image: PROFILE_OG_IMAGE,
      type: "profile",
    }),
    ...twitterMeta({
      title: PROFILE_INDEX_TITLE,
      description: PROFILE_INDEX_DESCRIPTION,
      image: PROFILE_OG_IMAGE,
    }),
  ];
}

export function buildProfileProjectMeta(project: ProfileProject): MetaDescriptor[] {
  const title = `${project.title} | Prithviraj Pawar`;
  const description = project.summary;
  const path = `/profile/projects/${project.slug}`;
  const url = profileUrl(path);
  const image = profileUrl(project.featuredImage);
  const keywords = [project.title, ...project.tags, "Prithviraj Pawar", "project"].join(
    ", ",
  );

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "author", content: "Prithviraj Pawar" },
    { tagName: "link", rel: "canonical", href: url },
    ...hreflangLinks(path),
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

export function buildProfileBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: profileUrl(item.path),
    })),
  };
}

export function buildProfilePageSchema(profile: ProfileData) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: PROFILE_INDEX_TITLE,
    description: PROFILE_INDEX_DESCRIPTION,
    url: profileUrl("/profile"),
    inLanguage: "en",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.role,
      email: profile.email,
      image: profileUrl(profile.avatar),
      url: profileUrl("/profile"),
      sameAs: [profile.social.github, profile.social.linkedin],
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

export function buildProfileWebPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: PROFILE_INDEX_TITLE,
    description: PROFILE_INDEX_DESCRIPTION,
    url: profileUrl("/profile"),
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: PUBLISHER_NAME,
      url: PROFILE_SITE_URL,
    },
  };
}

export function buildProfileProjectsItemListSchema(profile: ProfileData) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Projects by Prithviraj Pawar",
    itemListElement: profile.projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: project.title,
      url: profileUrl(`/profile/projects/${project.slug}`),
    })),
  };
}

export function buildProfileProjectArticleSchema(project: ProfileProject) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.summary,
    image: profileUrl(project.featuredImage),
    datePublished: project.date,
    dateModified: project.date,
    author: {
      "@type": "Person",
      name: "Prithviraj Pawar",
      url: profileUrl("/profile"),
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: PROFILE_SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: PUBLISHER_LOGO,
      },
    },
    keywords: project.tags.join(", "),
    inLanguage: "en",
    mainEntityOfPage: profileUrl(`/profile/projects/${project.slug}`),
  };
}

export function buildProfileIndexSchemas(profile: ProfileData) {
  return [
    buildProfileBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Profile", path: "/profile" },
    ]),
    buildProfilePageSchema(profile),
    buildProfileWebPageSchema(),
    buildProfileProjectsItemListSchema(profile),
  ];
}

export function buildProfileProjectSchemas(project: ProfileProject) {
  return [
    buildProfileProjectArticleSchema(project),
    buildProfileBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Profile", path: "/profile" },
      { name: project.title, path: `/profile/projects/${project.slug}` },
    ]),
  ];
}
