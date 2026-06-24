export type BlogCategory =
  | "seo"
  | "localization"
  | "pricing"
  | "marketing"
  | "ai-tools";

export interface FAQItem {
  question: string;
  answer: string;
}

export type SectionType =
  | "text"
  | "heading"
  | "image"
  | "comparison"
  | "callout"
  | "table"
  | "cta"
  | "faq"
  | "list";

export interface TextSection {
  type: "text";
  content: string;
}

export interface HeadingSection {
  type: "heading";
  level: 2 | 3;
  content: string;
}

export interface ImageSection {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  width?: "full" | "wide" | "narrow";
}

export interface ComparisonSection {
  type: "comparison";
  beforeLabel: string;
  afterLabel: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  caption?: string;
}

export interface CalloutSection {
  type: "callout";
  content: string;
  variant?: "info" | "tip" | "warning" | "stat";
}

export interface TableSection {
  type: "table";
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface CTASection {
  type: "cta";
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
}

export interface FAQSection {
  type: "faq";
  items: FAQItem[];
}

export interface ListItem {
  label: string;
  body: string;
}

export interface ListSection {
  type: "list";
  style: "numbered" | "bullet" | "icon";
  items: ListItem[];
}

export type ArticleSection =
  | TextSection
  | HeadingSection
  | ImageSection
  | ComparisonSection
  | CalloutSection
  | TableSection
  | CTASection
  | FAQSection
  | ListSection;

export interface LocalizedContent {
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  heroAlt: string;
  tldr: string;
  sections: ArticleSection[];
  faq: FAQItem[];
}

export interface BlogArticle {
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  category: BlogCategory;
  readingTime: { en: number; ja: number };
  heroImage: string;
  ogImage: string;
  content: {
    en: LocalizedContent;
    ja: LocalizedContent;
  };
}
