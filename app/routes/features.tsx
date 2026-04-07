import { Link } from "react-router";
import { useEffect } from "react";
import { ArrowRight, Grid2x2 } from "lucide-react";
import {
  LandingHeader,
  LandingFooter,
  Reveal,
} from "../components/LandingLayout";
import { supportMediaUrl } from "../utils/supportMedia";

/* ------------------------------------------------------------------ */
/*  Feature data (sourced from en.json support.cards.*)                */
/* ------------------------------------------------------------------ */
const FEATURES: Array<{
  id: string;
  title: string;
  short: string;
  highlights: string[];
  media: string;
  heroImage?: string;
  icon?: "grid";
}> = [
  {
    id: "brand-soul",
    title: "Brand Soul",
    short:
      "Define your brand identity — archetype, tone, power words, banned phrases, and cultural touchpoints — to power all AI-generated content.",
    highlights: [
      "Archetype & tone configuration",
      "Power words and banned phrases",
      "Cultural touchpoints per market",
      "Powers all downstream AI features",
    ],
    media: "/support-gifs/brand-soul.mp4",
    heroImage: "/landing%20page/brand-soul-showcase.png",
  },
  {
    id: "rewriter-workspace",
    title: "AI Rewriter",
    short:
      "Generate localized drafts (title + HTML description + SEO title/meta) per market and save translations back to Shopify.",
    highlights: [
      "AI product rewrite (title + description)",
      "Key Details auto-detected",
      "EN unit conversion (metric + US)",
      "Save directly to Shopify",
    ],
    media: "/support-gifs/rewriter-workspace.mp4",
    heroImage: "/landing%20page/rewriter-before-after.png",
  },
  {
    id: "marketing",
    title: "Marketing",
    short:
      "Generate social media captions, ad copy, seasonal campaigns, email templates, and hero images — with optional Meta autonomous publishing.",
    highlights: [
      "Instagram/TikTok captions + hashtags",
      "Ad banners and hero images",
      "Seasonal retail campaign calendar",
      "Meta (FB/IG) autonomous publishing (Pro)",
    ],
    media: "/support-gifs/marketing-hooks-to-metafields.mp4",
    heroImage: "/landing%20page/marketing.png",
  },
  {
    id: "seo",
    title: "SEO",
    short:
      "Edit SEO title/meta with SERP preview, apply CTR best practices, use competitor intel (Standard/Pro), and follow recommendations.",
    highlights: [
      "SEO title + meta description editor",
      "Live SERP preview",
      "Competitor intel & CTR best practices",
      "AI-powered recommendations",
    ],
    media: "/support-gifs/seo-editor-ctr.mp4",
    heroImage: "/landing%20page/SEO.png",
  },
  {
    id: "price-scout",
    title: "Price Scout",
    short:
      "Analyze competitor pricing from Google search results and get AI-powered pricing recommendations.",
    highlights: [
      "SERP-based competitor price analysis",
      "AI-powered pricing recommendations",
      "Auto-apply price to Shopify (Pro)",
      "Category and market-aware pricing",
    ],
    media: "/support-gifs/price-scout.mp4",
    heroImage: "/landing%20page/price-scout.png",
  },
  {
    id: "content-studio",
    title: "Content Studio",
    short:
      "Your all-in-one creative workspace — write high-quality blogs, generate cinematic hero sections, create polished collections, and produce Product FAQs with AI-powered templates and your brand voice.",
    highlights: [
      "Write high-quality brand blog posts with AI hero images",
      "Generate hero sections with cinematic banners",
      "Create high-quality collection pages with descriptions",
      "Product FAQ generation from product details",
      "Image Refinement built-in",
    ],
    media: "/support-gifs/content-templates.mp4",
    heroImage: "/landing%20page/content%20studio.png",
  },
  {
    id: "image-refinement",
    title: "Image Refinement",
    short:
      "AI-powered product photo cleanup — remove text, refine backgrounds, and save polished images back to Shopify.",
    highlights: [
      "Remove overlay text and watermarks",
      "Clean studio background replacement",
      "100% product fidelity preservation",
      "Auto-save to Shopify media library",
    ],
    media: "/support-gifs/image-refinement.mp4",
    heroImage: "/landing%20page/Image%20refinement.png",
  },
  {
    id: "missions",
    title: "Missions",
    short:
      "Run multi-agent AI pipelines that chain Rewriter, SEO, Marketing, Pricing, Image Refinement, and Visual Marketing into automated workflows.",
    highlights: [
      "Preset missions for every plan tier",
      "Custom pipeline builder (any agent combo)",
      "Auto-flow or step-by-step approval",
      "Results saved to Shopify automatically",
    ],
    media: "/support-gifs/missions-overview.mp4",
    heroImage: "/landing%20page/missions.png",
  },
  {
    id: "many-more-features",
    title: "Many More Features",
    short:
      "Beyond core workflows, unlock additional growth tools across localization, compliance, publishing control, and operations.",
    highlights: [
      "Global Locale Hub: edit and publish across 12 markets",
      "Japanese Value: evidence-backed cultural/craft detail extraction",
      "Brand Soul memory across rewriter, templates, and campaigns",
      "Content Templates: FAQ, Hero, Blog, and Collection generation",
      "Step-by-step or autonomous Missions execution flows",
      "Usage, credits, and plan controls from Dashboard",
    ],
    media: "",
    icon: "grid",
  },
];

const isImage = (path: string) =>
  /\.(png|jpe?g|webp|gif|svg)$/i.test(path);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function FeaturesPage() {
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

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-sky-400/20 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Feature stack
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Everything you need to sell globally.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              From brand identity to autonomous pipelines — a complete AI
              toolkit for localizing, optimizing, and marketing your Shopify
              products across 12 markets.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Feature cards — alternating zigzag */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl space-y-20 px-6">
          {FEATURES.map((f, i) => {
            const even = i % 2 === 0;
            return (
              <Reveal key={f.id}>
                <div
                  className={`grid items-center gap-8 lg:grid-cols-2 ${
                    even ? "" : "lg:[direction:rtl]"
                  }`}
                >
                  {/* Media */}
                  <div
                    className={`overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl ${
                      even ? "" : "lg:[direction:ltr]"
                    }`}
                  >
                    {f.heroImage ? (
                      <img
                        src={f.heroImage}
                        alt={f.title}
                        className="h-full w-full object-cover"
                      />
                    ) : f.icon === "grid" ? (
                      <div className="flex h-[320px] w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-6 py-4">
                          <Grid2x2 className="h-8 w-8 text-fuchsia-300" />
                          <span className="text-sm font-medium tracking-wide text-slate-200">
                            Feature Bundle
                          </span>
                        </div>
                      </div>
                    ) : isImage(f.media) ? (
                      <img
                        src={supportMediaUrl(f.media)}
                        alt={f.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={supportMediaUrl(f.media)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className={even ? "" : "lg:[direction:ltr]"}>
                    <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                      {f.title}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-slate-300">
                      {f.short}
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-200">
                      {f.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
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
                Start free, scale globally. All these features are included out
                of the box — upgrade for higher limits and advanced automations.
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
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
