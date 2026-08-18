import type { ProfileData, ProfileProject } from "./types";

import cognitiveScienceMd from "./projects/cognitive-science.md?raw";
import roboticsMd from "./projects/robotics.md?raw";
import mlStrategyMd from "./projects/ml-strategy.md?raw";
import manualStrategyMd from "./projects/manual-strategy.md?raw";

export const profileData: ProfileData = {
  name: "Prithviraj Pawar",
  role: "Engineering Leader",
  organizations: [
    { name: "PayPay Corporation", url: "https://paypay.ne.jp/" },
    { name: "Georgia Institute of Technology", url: "https://www.gatech.edu/" },
  ],
  education: [
    {
      course: "Georgia Institute of Technology",
      institution: "Master of Science - Computer Science (Machine Learning specialization) - 2024",
    },
    {
      course: "Savitribai Phule Pune University (formerly University of Pune)",
      institution: "Bachelor in Computer Engineering - 2017",
    },
  ],
  bio: "Engineering leader specializing in Agentic AI who has shipped multiple AI systems to production, from organization's enterprise platforms to my own deployed products. I help companies design, build, and govern AI that actually works at scale.",
  email: "prithviraj10pawar@gmail.com",
  social: {
    github: "https://github.com/prithvi10",
    linkedin: "https://www.linkedin.com/in/prithviraj-pawar-69058ab5/",
  },
  avatar: "/profile/avatar.jpg",
  experiences: [
    {
      title: "Engineering leader - AI and Backend",
      company: "PayPay Corporation",
      location: "Tokyo, Japan",
      dateStart: "2023-01-05",
      dateEnd: "",
      description:
        "Managing multiple teams focusing on the core payments platform and Agentic AI platforms that improve productivity, growth, and quality of products at PayPay.",
    },
    {
      title: "Software Engineering / Leadership",
      company: "Rakuten Inc.",
      location: "Tokyo, Japan",
      dateStart: "2017-10-01",
      dateEnd: "2022-12-31",
    },
    {
      title: "Research Intern",
      company: "NTT Data",
      location: "Tokyo, Japan",
      dateStart: "2016-05-01",
      dateEnd: "2016-07-01",
    },
  ],
  projects: [
    {
      slug: "cognitive-science",
      title: "A comparison of Deep Learning and human vision",
      summary:
        "This is a comparison study of deep learning algorithms like Convolutional Neural Networks and Vision transformers with human vision in terms of performance and architecture. It analyses these algorithms with the lens of cognitive science.",
      tags: ["Artificial Intelligence", "Cognitive Science", "Deep Learning"],
      date: "2023-12-13",
      featuredImage: "/profile/projects/cognitive-science/featured.jpg",
      linkedinUrl: "https://www.linkedin.com/in/prithviraj-pawar-69058ab5/",
      markdownFile: "cognitive-science",
      assetBase: "/profile/projects/cognitive-science",
    },
    {
      slug: "robotics",
      title: "Robotics AI Techniques",
      summary:
        "This blog explains about various robotics projects and learnings. It is based on the curriculum of RAIT course offered by Georgia Tech",
      tags: ["Robotics", "Artificial Intelligence"],
      date: "2022-07-21",
      featuredImage: "/profile/projects/robotics/featured.jpg",
      linkedinUrl: "https://www.linkedin.com/in/prithviraj-pawar-69058ab5/",
      markdownFile: "robotics",
      assetBase: "/profile/projects/robotics",
    },
    {
      slug: "ml-strategy",
      title: "Using Random Forest to build a stock portfolio",
      summary: "This project builds a Random Forest to improve the portfolio returns.",
      tags: ["Machine Learning", "Random Forest"],
      date: "2022-05-10",
      featuredImage: "/profile/projects/ml-strategy/featured.jpg",
      linkedinUrl: "https://www.linkedin.com/in/prithviraj-pawar-69058ab5/",
      markdownFile: "ml-strategy",
      assetBase: "/profile/projects/ml-strategy",
    },
    {
      slug: "manual-strategy",
      title: "Technical analysis of US Stock market",
      summary:
        "This project performs technical analysis on stock market data of US stock market. It answers the standard question ; Can we beat the stock market by taking intelligent positions to maximize the profits?",
      tags: ["Technical Analysis", "Stock market"],
      date: "2022-05-10",
      featuredImage: "/profile/projects/manual-strategy/featured.jpg",
      linkedinUrl: "https://www.linkedin.com/in/prithviraj-pawar-69058ab5/",
      markdownFile: "manual-strategy",
      assetBase: "/profile/projects/manual-strategy",
    },
  ],
};

const projectMarkdown: Record<string, string> = {
  "cognitive-science": cognitiveScienceMd,
  robotics: roboticsMd,
  "ml-strategy": mlStrategyMd,
  "manual-strategy": manualStrategyMd,
};

export const projectTags = [
  "All",
  "Machine Learning",
  "Technical Analysis",
  "Robotics",
  "Artificial Intelligence",
] as const;

export function getProjectBySlug(slug: string): ProfileProject | undefined {
  return profileData.projects.find((project) => project.slug === slug);
}

export function getProjectMarkdown(slug: string): string | undefined {
  return projectMarkdown[slug];
}

export function formatExperienceDate(
  dateStart: string,
  dateEnd: string,
): string {
  const start = new Date(dateStart);
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  if (!dateEnd) {
    return `${startLabel} – Present`;
  }

  const end = new Date(dateEnd);
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

function escapeMarkdownAngleBrackets(markdown: string): string {
  const lines = markdown.split("\n");
  let inCodeFence = false;

  return lines
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("```")) {
        inCodeFence = !inCodeFence;
        return line;
      }
      if (inCodeFence) {
        return line;
      }
      return line.replace(/</g, "&lt;");
    })
    .join("\n");
}

export function prepareProjectMarkdown(
  rawMarkdown: string,
  assetBase: string,
): string {
  const withoutFrontmatter = rawMarkdown.replace(/^---[\s\S]*?---\s*/, "");

  const withLinks = withoutFrontmatter
    .replace(
      /\{%\s*staticref\s+"[^"]+"\s*%\}\s*([\s\S]*?)\{%\s*\/staticref\s*%\}/gi,
      (_, label: string) => `[${label.trim()}](/profile/uploads/cogsci.pdf)`,
    )
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, alt, src: string) => {
        if (/^https?:\/\//.test(src) || src.startsWith("/")) {
          return match;
        }
        return `![${alt}](${assetBase}/${src.replace(/^\.\//, "")})`;
      },
    );

  return escapeMarkdownAngleBrackets(withLinks);
}
