import type { LoaderFunctionArgs } from "react-router";
import { Link, redirect } from "react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Layers,
  LineChart,
  Sparkles,
  Zap,
  Globe,
  ShieldCheck,
  Search,
  Megaphone,
  Target,
} from "lucide-react";
import {
  LandingHeader,
  LandingFooter,
  Reveal,
} from "../../components/LandingLayout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
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
      if (e instanceof Response) throw e;
    }

    url.pathname = "/app";
    throw redirect(`${url.pathname}${url.search}`);
  }

  return null;
};

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
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
          translations — purpose-built for Shopify merchants selling worldwide.
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
                    <p className="text-xs text-slate-400">Brand Soul</p>
                    <p className="text-sm text-white">Identity & Tone</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-fuchsia-300" />
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Rewriter</p>
                    <p className="text-sm text-white">Localized Copy</p>
                  </div>
                  <Globe className="h-5 w-5 text-sky-300" />
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Missions</p>
                    <p className="text-sm text-white">Automated Pipelines</p>
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

/* ------------------------------------------------------------------ */
/*  Shopify Showcase (simplified — no Shopee tab)                      */
/* ------------------------------------------------------------------ */
const ShopifyShowcase = () => (
  <section id="solutions" className="scroll-mt-28 py-24">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Built for Shopify
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              SEO competitor benchmarking built for Shopify themes.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Track the top ranking pages, mirror winning metadata, and deploy
              translations directly into theme app embeds without touching your
              code.
            </p>
          </div>
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <span className="rounded-full bg-white px-4 py-2 text-slate-900">
              Shopify
            </span>
          </div>
        </div>
      </Reveal>
      <Reveal className="mt-10">
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-950 p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              Shopify
            </div>
            <h3 className="text-2xl font-semibold text-white">
              End-to-end localization across 12 markets.
            </h3>
            <p className="text-slate-300">
              Rewrite product listings in brand-safe copy, inject LSI keywords,
              optimize SEO metadata, and publish translations — all from one
              workspace.
            </p>
            <div className="grid gap-3 text-sm text-slate-200">
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
                  desc: "Context-aware, brand-safe rewrites.",
                },
                {
                  title: "SEO Metadata",
                  desc: "LSI enrichment + competitor mirroring.",
                },
                {
                  title: "QA Loop",
                  desc: "Multi-agent validation workflow.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
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

/* ------------------------------------------------------------------ */
/*  Brand Soul icon — heart + DNA helix, matching the reference image  */
/* ------------------------------------------------------------------ */
const BrandSoulIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 21 C12 21 3 15 3 8.5 C3 5.5 5.5 3 8.5 3 C10.2 3 11.7 3.8 12 5 C12.3 3.8 13.8 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 15 12 21 12 21Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  AI Rewriter icon — writing pencil with AI sparkle                  */
/* ------------------------------------------------------------------ */
const RewriterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Large 4-point sparkle — top-left */}
    <path
      d="M8 4 L10 10 L16 12 L10 14 L8 20 L6 14 L0 12 L6 10 Z"
      fill="currentColor"
    />
    {/* Small 4-point sparkle — below-left of the large one */}
    <path
      d="M3 22 L4 24.5 L6.5 25.5 L4 26.5 L3 29 L2 26.5 L-0.5 25.5 L2 24.5 Z"
      fill="#38bdf8"
    />
    {/* Pencil — solid filled, tilted right */}
    <g transform="translate(18, 2) rotate(20)">
      {/* Pencil body */}
      <rect x="0" y="0" width="7" height="22" rx="1" fill="currentColor" />
      {/* Pencil tip */}
      <path d="M0 22 L3.5 29 L7 22 Z" fill="currentColor" />
      {/* Tip accent — lighter point */}
      <path d="M2 24 L3.5 28 L5 24 Z" fill="#38bdf8" />
      {/* Band near top */}
      <rect x="0" y="3" width="7" height="1.5" fill="rgba(255,255,255,0.25)" />
      {/* Small check/tick mark on pencil body */}
      <path d="M2 12 L3.2 13.5 L5.5 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Feature Grid (6 preview cards)                                     */
/* ------------------------------------------------------------------ */
const PREVIEW_FEATURES: Array<{
  title: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: "Brand Soul",
    desc: "Define your brand identity — archetype, tone, power words, banned phrases, and cultural touchpoints — to power all AI-generated content.",
    icon: BrandSoulIcon,
  },
  {
    title: "AI Rewriter",
    desc: "Generate localized drafts (title + HTML description + SEO title/meta) per market and save translations back to Shopify.",
    icon: RewriterIcon,
  },
  {
    title: "Missions",
    desc: "Run multi-agent AI pipelines that chain Rewriter, SEO, Marketing, Pricing, Image Refinement, and Visual Marketing into automated workflows.",
    icon: Zap,
  },
  {
    title: "SEO",
    desc: "Edit SEO title/meta with SERP preview, apply CTR best practices, use competitor intel, and follow recommendations.",
    icon: Target,
  },
  {
    title: "Price Scout",
    desc: "Analyze competitor pricing from Google search results and get AI-powered pricing recommendations.",
    icon: Search,
  },
  {
    title: "Marketing",
    desc: "Generate social media captions, ad copy, seasonal campaigns, email templates, and hero images — with optional Meta autonomous publishing.",
    icon: Megaphone,
  },
];

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
            language or market.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PREVIEW_FEATURES.map((f) => (
          <Reveal
            key={f.title}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-lg"
          >
            {f.icon && <f.icon className="h-7 w-7 text-fuchsia-300" />}
            <h3 className="mt-4 text-xl font-semibold text-white">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {f.desc}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 text-center">
        <Link
          to="/features"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
        >
          See All Features
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Pricing (matches planCatalog.ts)                                   */
/* ------------------------------------------------------------------ */
type PricingTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  productLimit: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
};

const Pricing = () => {
  const tiers: PricingTier[] = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Try everything, limited access.",
      productLimit: "10 products (1 week trial)",
      features: [
        "AI product rewrite (title + description)",
        "SEO title + meta description",
        "Instagram captions + hashtags",
        "Competitive pricing analysis",
        "Full product launch mission",
        "Image refinement",
      ],
    },
    {
      name: "Basic",
      price: "$29",
      period: "/ month",
      description: "For emerging brands testing new regions.",
      productLimit: "50 products / month",
      features: [
        "AI rewrite + Key Details auto-detected",
        "EN unit conversion (metric + US)",
        "Instagram captions + hashtags",
        "Seasonal campaign ideas",
        "Text-only mission (Rewriter + Marketing)",
      ],
    },
    {
      name: "Standard",
      price: "$79",
      period: "/ month",
      description: "Full toolkit, one market at a time.",
      productLimit: "Unlimited products",
      features: [
        "Everything in Basic",
        "12 target markets (single locale per rewrite)",
        "Brand tones: Luxury / Minimalist / Playful",
        "SEO editor + SERP preview",
        "Competitive pricing analysis",
        "Full text pipeline missions",
      ],
      badge: "Best Value",
      highlight: true,
    },
    {
      name: "Pro",
      price: "$199",
      period: "/ month",
      description: "Go global — bulk-generate for all 12 markets at once.",
      productLimit: "Unlimited products",
      features: [
        "Everything in Standard",
        "Multi-market bulk generation (all 12 locales)",
        "Visual Ad generation + Social Post preview",
        "Auto-apply price to Shopify",
        "Image refinement across all features",
        "Agentic workflows + Publish to Shopify",
        "Meta (Facebook/Instagram) integration",
      ],
      badge: "Most Popular",
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
              Start free and scale as you grow. SEO, marketing, and missions
              included in every tier.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <Reveal
              key={tier.name}
              className={`relative flex flex-col rounded-3xl border ${
                tier.highlight
                  ? "border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/20 via-slate-950 to-slate-950"
                  : "border-white/10 bg-white/5"
              } p-6 shadow-lg`}
            >
              {tier.badge && (
                <div
                  className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                    tier.highlight ? "bg-fuchsia-500" : "bg-sky-500"
                  }`}
                >
                  {tier.badge}
                </div>
              )}
              <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-1 text-xs text-slate-400">{tier.productLimit}</p>
              <p className="mt-2 text-sm text-slate-300">{tier.description}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-slate-400">{tier.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
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
                {tier.name === "Free" ? "Start Free" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */
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
            Start free, scale globally. Localize products, optimize SEO, and
            automate marketing — all from one Shopify app.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:-translate-y-0.5"
            >
              Start Your Global Journey
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
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
      <LandingHeader />

      <main className="space-y-10">
        <Hero />
        <ShopifyShowcase />
        <FeatureGrid />
        <Pricing />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
