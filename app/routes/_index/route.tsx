import type { LoaderFunctionArgs } from "react-router";
import { Link, redirect } from "react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Layers,
  LineChart,
  Sparkles,
  Zap,
  Globe,
  ShieldCheck,
} from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    // Shopify loads the app at the configured application_url (origin), so embedded loads land on `/`.
    // We run the reinstall "pathfinder" HERE (one-time entry), then send the merchant to:
    // - /app/dashboard (paid grace OR free with credits)
    // - /app/pricing?returning_paid=1 (expired paid)
    // - /app/pricing (free no credits)
    const backendApiUrl =
      process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
    try {
      const resp = await fetch(
        `${backendApiUrl}/api/admin/reinstall-path?shop=${encodeURIComponent(shop)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        const to = String(data?.redirect_to || "").trim() || "/app";
        const target = new URL(to, url.origin);
        for (const [k, v] of url.searchParams.entries()) {
          if (!target.searchParams.has(k)) target.searchParams.set(k, v);
        }
        throw redirect(`${target.pathname}${target.search}`);
      }
    } catch (e) {
      // ignore and fall back
    }

    url.pathname = "/app";
    throw redirect(`${url.pathname}${url.search}`);
  }

  return null;
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: "easeOut" },
  viewport: { once: true, amount: 0.3 },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
};

const Reveal = ({ children, className }: RevealProps) => (
  <motion.div {...fadeUp} className={className}>
    {children}
  </motion.div>
);

const Hero = () => (
  <section id="hero" className="relative overflow-hidden pt-28">
    <div className="absolute inset-0 -z-10">
      <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-400/20 blur-[120px]" />
    </div>
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Reveal>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">
          <Sparkles className="h-4 w-4 text-fuchsia-200" />
          Global growth intelligence
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          The AI Growth Engine for Global E-commerce.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-200">
          Localized storytelling, competitive SEO intelligence, and brand-aware
          translations for Shopify, Shopee, and beyond.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Your Global Journey
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
          >
            View Pricing
          </a>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span className="rounded-full border border-white/10 px-3 py-1">
            Brand-safe RAG
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            Multi-agent SEO loops
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            Shopify theme embeds
          </span>
        </div>
      </Reveal>
      <Reveal className="relative">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/10 p-6 shadow-2xl">
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.6)]"
            style={{
              transform: "perspective(1200px) rotateX(6deg) rotateY(-8deg)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Global Launch</div>
              <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
                +42% organic lift
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Shopify</p>
                    <p className="text-sm text-white">SEO Benchmarking</p>
                  </div>
                  <LineChart className="h-5 w-5 text-sky-300" />
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Shopee</p>
                    <p className="text-sm text-white">Localized Listings</p>
                  </div>
                  <Globe className="h-5 w-5 text-fuchsia-300" />
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Enterprise</p>
                    <p className="text-sm text-white">Bulk API Localization</p>
                  </div>
                  <Zap className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 w-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-300" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 right-10 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </div>
      </Reveal>
    </div>
  </section>
);

const ChannelShowcase = () => {
  const [activeTab, setActiveTab] = useState<"shopify" | "enterprise">("shopify");

  return (
    <section id="solutions" className="scroll-mt-28 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Multi-channel ready
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                One engine, every marketplace.
              </h2>
              <p className="mt-4 max-w-2xl text-base text-slate-300">
                Switch between platforms to see how Cross-Border AI adapts
                workflows, metadata, and SEO strategy for each channel.
              </p>
            </div>
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab("shopify")}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === "shopify"
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Shopify
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("enterprise")}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === "enterprise"
                    ? "bg-white text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Shopee / Enterprise
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-300">
                  Coming soon
                </span>
              </button>
            </div>
          </div>
        </Reveal>
        <Reveal className="mt-10">
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-950 p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {activeTab === "shopify" ? "Shopify" : "Shopee / Enterprise"}
              </div>
              <h3 className="text-2xl font-semibold text-white">
                {activeTab === "shopify"
                  ? "SEO competitor benchmarking built for Shopify themes."
                  : "Bulk, high-speed API localization for catalog-scale teams."}
              </h3>
              <p className="text-slate-300">
                {activeTab === "shopify"
                  ? "Track the top ranking pages, mirror winning metadata, and deploy translations directly into theme app embeds without touching your code."
                  : "Queue tens of thousands of SKUs, sync localized catalogs to marketplaces, and orchestrate workflows through secured enterprise APIs."}
              </p>
              <div className="grid gap-3 text-sm text-slate-200">
                {activeTab === "shopify" ? (
                  <>
                    <div className="flex items-center gap-3">
                      <LineChart className="h-5 w-5 text-sky-300" />
                      SERP analysis with geo-intent clustering.
                    </div>
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-fuchsia-300" />
                      Theme app embeds for localized PDPs.
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-300" />
                      Guardrails for brand-safe translations.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-amber-300" />
                      Async pipelines with retry-safe batching.
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-sky-300" />
                      Multi-lingual listings in minutes, not weeks.
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-300" />
                      Secure audit logs and compliance controls.
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Live channel view
              </div>
              <div className="mt-4 space-y-4">
                {[
                  {
                    title: "Localized Titles",
                    desc:
                      activeTab === "shopify"
                        ? "Context-aware, brand-safe rewrites."
                        : "Bulk API translations with brand guardrails.",
                  },
                  {
                    title: "SEO Metadata",
                    desc:
                      activeTab === "shopify"
                        ? "LSI enrichment + competitor mirroring."
                        : "Regional SEO keyword overlays.",
                  },
                  {
                    title: "QA Loop",
                    desc:
                      activeTab === "shopify"
                        ? "Multi-agent validation workflow."
                        : "Enterprise QA automation hooks.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const FeatureGrid = () => (
  <section id="features" className="scroll-mt-28 py-24">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Feature stack
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            AI systems tuned for global growth.
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Build durable rankings and consistent brand voice, no matter the
            language or channel.
          </p>
        </div>
      </Reveal>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Strategic RAG",
            desc: "Learns your brand history to write authentic copy.",
            icon: Sparkles,
          },
          {
            title: "SERP Intelligence",
            desc: "Outrank US competitors by mirroring the winners.",
            icon: LineChart,
          },
          {
            title: "Dual-Engine Precision",
            desc: "One AI for creativity, one AI for technical specs.",
            icon: Layers,
          },
        ].map((feature) => (
          <Reveal
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-lg"
          >
            <feature.icon className="h-7 w-7 text-fuchsia-300" />
            <h3 className="mt-4 text-xl font-semibold text-white">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-slate-300">{feature.desc}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

type PricingTier = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

const Pricing = () => {
  const tiers: PricingTier[] = [
    {
      name: "Basic",
      price: "$79",
      description: "For emerging brands testing new regions.",
      features: [
        "Localized product titles & descriptions",
        "LSI keyword injection",
        "RAG brand memory (lite)",
        "Multi-channel export (Shopify)",
      ],
    },
    {
      name: "Standard",
      price: "$199",
      description: "Best Value for scaling multi-store growth.",
      features: [
        "Full SERP intelligence suite",
        "Multi-agent SEO loops",
        "Brand-safe RAG + QA workflow",
        "Theme app embeds & sync",
      ],
      highlight: true,
    },
    {
      name: "Pro",
      price: "$449",
      description: "For enterprise localization teams.",
      features: [
        "Bulk API localization",
        "Advanced multi-agent validation",
        "Competitive SEO benchmarking",
        "Dedicated growth strategist",
      ],
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-28 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Choose the plan that matches your expansion.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Transparent pricing with SEO features included in every tier.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Reveal
              key={tier.name}
              className={`relative rounded-3xl border ${
                tier.highlight
                  ? "border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/20 via-slate-950 to-slate-950"
                  : "border-white/10 bg-white/5"
              } p-6 shadow-lg`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 right-6 rounded-full bg-fuchsia-500 px-3 py-1 text-xs font-semibold text-white">
                  Best Value
                </div>
              )}
              <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{tier.description}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-slate-400">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tier.highlight
                    ? "bg-white text-slate-900 hover:-translate-y-0.5"
                    : "border border-white/20 text-white hover:border-white/60"
                }`}
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-24">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-fuchsia-500/20 via-slate-900/80 to-sky-500/20 p-10 text-center">
          <div className="absolute inset-0 -z-10 opacity-60">
            <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-fuchsia-400/30 blur-[90px]" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-sky-400/30 blur-[100px]" />
          </div>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Ready to launch everywhere?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200">
            Start with Shopify today, then expand into Shopee and enterprise
            channels as we roll out new integrations.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:-translate-y-0.5"
            >
              Start Your Global Journey
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
            >
              Explore Features
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default function App() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-sm font-semibold">
            <img
              src="/Icon-final.png"
              alt="Cross-Border AI"
              className="h-8 w-8"
            />
            Cross-Border AI
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#solutions" className="transition hover:text-white">
              Solutions
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </nav>
          <Link
            to="/login"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/60"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="space-y-10">
        <Hero />
        <ChannelShowcase />
        <FeatureGrid />
        <Pricing />
        <CTASection />
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Cross-Border AI. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/support" className="transition hover:text-white">
              Support
            </Link>
            <Link to="/privacy-policy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/login" className="transition hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
