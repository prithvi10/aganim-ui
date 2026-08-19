export type ProfileSeriesPart = {
  href: string;
  part: string;
  title: string;
};

export type ProfileStudySeries = {
  name: string;
  summary: string;
  tags: string[];
  featuredImage: string;
  parts: ProfileSeriesPart[];
};

export type ProfileSeriesBlog = ProfileSeriesPart & {
  summary: string;
  tags: string[];
  featuredImage: string;
  seriesName: string;
};

export const profileStudySeries: ProfileStudySeries[] = [
  {
    name: "Deep Learning",
    summary:
      "A three-part guide from a single neuron to modern frontier LLMs — backpropagation, CNNs, the Transformer rebuilt block by block, and the architectures behind Claude, Gemini, and GPT.",
    tags: ["Deep Learning", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-foundations.png",
    parts: [
      {
        href: "/deep-learning/foundations-of-deep-learning.html",
        part: "Part 1",
        title: "Foundations of Deep Learning",
      },
      {
        href: "/deep-learning/the-transformer-deep-dive.html",
        part: "Part 2",
        title: "The Transformer, Deep Dive",
      },
      {
        href: "/deep-learning/modern-frontier-llms.html",
        part: "Part 3",
        title: "Modern Frontier LLMs",
      },
    ],
  },
  {
    name: "LLMOps",
    summary:
      "A six-part guide to running LLMs in production — evaluation, open models, serving infrastructure, RAG and agents, and the monitoring and guardrails that keep systems reliable.",
    tags: ["LLMOps", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-llmops.png",
    parts: [
      {
        href: "/deep-learning/llmops-1-foundations.html",
        part: "Part 1",
        title: "Foundations & the LLMOps Lifecycle",
      },
      {
        href: "/deep-learning/llmops-2-evaluation.html",
        part: "Part 2",
        title: "Evaluation & Testing",
      },
      {
        href: "/deep-learning/llmops-3-open-models.html",
        part: "Part 3",
        title: "Open Models: MoE, Reasoning & Fine-tuning",
      },
      {
        href: "/deep-learning/llmops-4-serving.html",
        part: "Part 4",
        title: "Serving & Inference Infrastructure",
      },
      {
        href: "/deep-learning/llmops-5-rag-agents.html",
        part: "Part 5",
        title: "RAG & Agentic Systems",
      },
      {
        href: "/deep-learning/llmops-6-monitoring.html",
        part: "Part 6",
        title: "Monitoring, Guardrails & Cost",
      },
    ],
  },
];

export const profileSeriesBlogs: ProfileSeriesBlog[] = profileStudySeries.flatMap(
  (series) =>
    series.parts.map((part) => ({
      ...part,
      summary: series.summary,
      tags: series.tags,
      featuredImage: series.featuredImage,
      seriesName: series.name,
    })),
);

export const studySeriesTags = ["All", "Deep Learning", "LLMOps"] as const;
