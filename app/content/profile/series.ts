export type ProfileSeriesBlog = {
  href: string;
  title: string;
  summary: string;
  tags: string[];
  featuredImage: string;
  part: string;
  seriesName: string;
};

export const profileSeriesBlogs: ProfileSeriesBlog[] = [
  {
    href: "/deep-learning/foundations-of-deep-learning.html",
    part: "Part 1",
    seriesName: "Deep Learning",
    title: "Foundations of Deep Learning",
    summary:
      "The ideas behind every LLM — from a single neuron to backpropagation, CNNs, RNNs, and the first glimpse of attention.",
    tags: ["Deep Learning", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-foundations.png",
  },
  {
    href: "/deep-learning/the-transformer-deep-dive.html",
    part: "Part 2",
    seriesName: "Deep Learning",
    title: "The Transformer, Deep Dive",
    summary:
      "Attention, encoders, and decoders — the 2017 architecture rebuilt block by block, with the math and the intuition.",
    tags: ["Deep Learning", "Artificial Intelligence"],
    featuredImage: "/deep-learning/cover-transformer.png",
  },
  {
    href: "/deep-learning/modern-frontier-llms.html",
    part: "Part 3",
    seriesName: "Deep Learning",
    title: "Modern Frontier LLMs",
    summary:
      "From the Transformer to Claude, Gemini, and GPT — RoPE, RMSNorm, SwiGLU, GQA, MoE, alignment, and scaling laws.",
    tags: ["Deep Learning", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-frontier.png",
  },
  {
    href: "/deep-learning/llmops-1-foundations.html",
    part: "Part 1",
    seriesName: "LLMOps",
    title: "Foundations & the LLMOps Lifecycle",
    summary:
      "Normal software gives the same answer every time. An LLM does not. This is the discipline for building reliable products anyway.",
    tags: ["LLMOps", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-llmops.png",
  },
  {
    href: "/deep-learning/llmops-2-evaluation.html",
    part: "Part 2",
    seriesName: "LLMOps",
    title: "Evaluation & Testing",
    summary:
      "How to measure whether an answer is good when there is no single correct wording — judges, golden datasets, and CI for prompts.",
    tags: ["LLMOps", "Artificial Intelligence"],
    featuredImage: "/deep-learning/cover-llmops.png",
  },
  {
    href: "/deep-learning/llmops-3-open-models.html",
    part: "Part 3",
    seriesName: "LLMOps",
    title: "Open Models: MoE, Reasoning & Fine-tuning",
    summary:
      "Mixture-of-Experts, reasoning models, quantization, and LoRA/QLoRA — owning the weights and specializing models on your hardware.",
    tags: ["LLMOps", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-llmops.png",
  },
  {
    href: "/deep-learning/llmops-4-serving.html",
    part: "Part 4",
    seriesName: "LLMOps",
    title: "Serving & Inference Infrastructure",
    summary:
      "From a model file on disk to a fast, streamed answer — the KV cache, PagedAttention, batching, and the full request path.",
    tags: ["LLMOps", "Artificial Intelligence"],
    featuredImage: "/deep-learning/cover-llmops.png",
  },
  {
    href: "/deep-learning/llmops-5-rag-agents.html",
    part: "Part 5",
    seriesName: "LLMOps",
    title: "RAG & Agentic Systems",
    summary:
      "Giving the model live knowledge and hands — retrieval, embeddings, vector search, tools, and MCP.",
    tags: ["LLMOps", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-llmops.png",
  },
  {
    href: "/deep-learning/llmops-6-monitoring.html",
    part: "Part 6",
    seriesName: "LLMOps",
    title: "Monitoring, Guardrails & Cost",
    summary:
      "Watching, protecting, and paying for LLMs in production — observability, guardrails, and closing the lifecycle loop.",
    tags: ["LLMOps", "Artificial Intelligence"],
    featuredImage: "/deep-learning/cover-llmops.png",
  },
];

export const studySeriesTags = ["All", "Deep Learning", "LLMOps"] as const;
