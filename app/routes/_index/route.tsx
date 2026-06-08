import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, redirect } from "react-router";
import React, { useEffect } from "react";
import {
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  Search,
  Megaphone,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  LandingHeader,
  LandingFooter,
  Reveal,
} from "../../components/LandingLayout";
import { FAQ } from "../../components/FAQ";

const SITE_URL = "https://aganim-ai.com";
const OG_IMAGE = `${SITE_URL}/og-banner.png`;

export const meta: MetaFunction = () => {
  const title = "Aganim AI — AI Growth Engine for Global E-commerce | Shopify App";
  const description =
    "Aganim AI is a Shopify app that uses AI to translate and localize your online store for cross-border e-commerce. Rewrite product listings, optimize SEO metadata, generate marketing content, and analyze competitor pricing across 12+ global markets.";

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: SITE_URL + "/" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_URL },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:site_name", content: "Aganim AI" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    const backendApiUrl =
      process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";
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
const Hero = () => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
  <section id="hero" aria-label="Hero" className="relative overflow-hidden pt-28">
    <div className="absolute inset-0 -z-10">
      <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-400/20 blur-[120px]" />
    </div>
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Reveal>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">
          <Sparkles className="h-4 w-4 text-fuchsia-200" />
          {t("landing.hero.eyebrow")}
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {t("landing.hero.title")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-200">
          {t("landing.hero.subtitle")}
        </p>
      </Reveal>
      <Reveal className="relative flex items-center justify-center">
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1200px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="relative h-[340px] w-[300px] sm:h-[380px] sm:w-[340px]"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front face - App Logo */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-fuchsia-500/30 via-slate-900 to-sky-500/30 shadow-2xl"
              style={{
                backfaceVisibility: "hidden",
                boxShadow: "0 25px 50px -12px rgba(217, 70, 239, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <motion.img
                src="/Icon-final.png"
                alt="Aganim AI — AI-powered cross-border e-commerce app for Shopify"
                className="h-40 w-40 sm:h-48 sm:w-48 drop-shadow-2xl"
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
            {/* Back face - Features Dashboard */}
            <div
              className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 p-5 shadow-2xl"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "0 24px 80px rgba(15,23,42,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">{t("landing.hero.globalLaunch")}</div>
                <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
                  {t("landing.hero.organicLift")}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">{t("landing.hero.brandSoul")}</p>
                      <p className="text-sm text-white">{t("landing.hero.identityTone")}</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-fuchsia-300" />
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 w-full rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">{t("landing.hero.rewriter")}</p>
                      <p className="text-sm text-white">{t("landing.hero.localizedCopy")}</p>
                    </div>
                    <svg className="h-5 w-5 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">{t("landing.hero.missions")}</p>
                      <p className="text-sm text-white">{t("landing.hero.automatedPipelines")}</p>
                    </div>
                    <Zap className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 w-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-300" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="absolute -bottom-6 right-0 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -top-6 left-0 h-20 w-20 rounded-full bg-sky-500/20 blur-3xl" />
        </div>
      </Reveal>
    </div>
  </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Shopify Showcase (simplified — no Shopee tab)                      */
/* ------------------------------------------------------------------ */
const ShopifyShowcase = () => {
  const { t } = useTranslation();

  const channelItems = [
    {
      titleKey: "landing.shopify.localizedTitles",
      descKey: "landing.shopify.localizedTitlesDesc",
    },
    {
      titleKey: "landing.shopify.seoMetadata",
      descKey: "landing.shopify.seoMetadataDesc",
    },
    {
      titleKey: "landing.shopify.qaLoop",
      descKey: "landing.shopify.qaLoopDesc",
    },
  ];

  return (
  <section id="solutions" aria-label="Shopify integration" className="scroll-mt-28 py-24">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              {t("landing.shopify.builtFor")}
            </p>
          </div>
          <a
            href="https://apps.shopify.com/aganim"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <span className="absolute -inset-[2px] overflow-hidden rounded-full">
              <motion.span
                className="absolute inset-[-100%] h-[300%] w-[300%]"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #10b981 120deg, #34d399 180deg, #86efac 240deg, transparent 300deg, transparent 360deg)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </span>
            <span className="absolute inset-0 rounded-full bg-slate-900" />
            <svg viewBox="0 0 109.5 124.5" className="relative h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M74.7,14.8c0,0-1.4,0.4-3.7,1.1c-0.4-1.3-1-2.8-1.8-4.4c-2.6-5-6.5-7.7-11.1-7.7c0,0,0,0,0,0 c-0.3,0-0.6,0-1,0.1c-0.1-0.2-0.3-0.3-0.4-0.5c-2-2.2-4.6-3.2-7.7-3.1c-6,0.2-12,4.5-16.8,12.2c-3.4,5.4-6,12.2-6.7,17.5 c-6.9,2.1-11.7,3.6-11.8,3.7c-3.5,1.1-3.6,1.2-4,4.5C9.1,41.2,0,110.7,0,110.7l75.1,13V14.6C74.9,14.6,74.8,14.7,74.7,14.8z M57.2,20.2c-4,1.2-8.4,2.6-12.7,3.9c1.2-4.7,3.6-9.4,6.4-12.5c1.1-1.1,2.6-2.4,4.3-3.2C57,12.5,57.3,17.1,57.2,20.2z M49.1,4.3 c1.4,0,2.6,0.3,3.6,0.9c-1.6,0.8-3.2,2.1-4.7,3.6c-3.8,4.1-6.7,10.5-7.9,16.6c-3.6,1.1-7.2,2.2-10.5,3.2 C31.7,18.8,39.8,4.6,49.1,4.3z M37.4,59.3c0.4,6.4,17.3,7.8,18.3,22.9c0.7,11.9-6.3,20-16.4,20.6c-12.2,0.8-18.9-6.4-18.9-6.4 l2.6-11c0,0,6.7,5.1,12.1,4.7c3.5-0.2,4.8-3.1,4.7-5.1c-0.5-8.4-14.3-7.9-15.2-21.7c-0.7-11.6,6.9-23.4,23.7-24.4 c6.5-0.4,9.8,1.2,9.8,1.2l-3.8,14.4c0,0-4.3-2-9.4-1.6C37.4,53.5,37.3,58.2,37.4,59.3z M61.2,19c0-2.6-0.4-6.3-1.6-9.5 c4.1,0.8,6.1,5.4,6.9,8.1C64.6,18.1,62.8,18.6,61.2,19z"/>
              <path d="M78.1,123.9l31.4-7.8c0,0-13.5-91.3-13.6-91.9c-0.1-0.6-0.6-1-1.1-1c-0.5,0-9.3-0.2-9.3-0.2s-5.4-5.2-7.4-7.2 V123.9z"/>
            </svg>
            <span className="relative">{t("landing.shopify.getOnAppStore")}</span>
          </a>
        </div>
      </Reveal>
      <Reveal className="mt-10">
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-950 p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              Shopify
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {t("landing.shopify.heading")}
            </h2>
            <p className="text-slate-300">
              {t("landing.shopify.description")}
            </p>
            <div className="grid gap-3 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-fuchsia-300" />
                {t("landing.shopify.feature1")}
              </div>
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-sky-300" />
                {t("landing.shopify.feature2")}
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-emerald-300" />
                {t("landing.shopify.feature3")}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              {t("landing.shopify.liveChannelView")}
            </div>
            <div className="mt-4 space-y-4">
              {channelItems.map((item) => (
                <div
                  key={item.titleKey}
                  className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {t(item.titleKey)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{t(item.descKey)}</p>
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
const FeatureGrid = () => {
  const { t } = useTranslation();

  const previewFeatures = [
    { key: "brandSoul", icon: BrandSoulIcon },
    { key: "aiRewriter", icon: RewriterIcon },
    { key: "missions", icon: Zap },
    { key: "seo", icon: Target },
    { key: "priceScout", icon: Search },
    { key: "marketing", icon: Megaphone },
  ];

  return (
  <section id="features" aria-label="Features" className="scroll-mt-28 py-24">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            {t("landing.features.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-base text-slate-300">
            {t("landing.features.subtitle")}
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {previewFeatures.map((f) => (
          <Reveal
            key={f.key}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-lg"
          >
            {f.icon && <f.icon className="h-7 w-7 text-fuchsia-300" />}
            <h3 className="mt-4 text-xl font-semibold text-white">
              {t(`landing.features.${f.key}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t(`landing.features.${f.key}.desc`)}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 text-center">
        <Link
          to="/features"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
        >
          {t("landing.features.seeAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Pricing (matches planCatalog.ts)                                   */
/* ------------------------------------------------------------------ */
const Pricing = () => {
  const { t } = useTranslation();

  const tierKeys = ["free", "basic", "standard", "pro"] as const;
  const highlightTier = "standard";

  return (
    <section id="pricing" aria-label="Pricing" className="scroll-mt-28 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              {t("landing.pricing.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {t("landing.pricing.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              {t("landing.pricing.subtitle")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tierKeys.map((key) => {
            const isHighlight = key === highlightTier;
            const badge = t(`landing.pricing.${key}.badge`, { defaultValue: "" });
            const features = t(`landing.pricing.${key}.features`, { returnObjects: true }) as string[];

            return (
            <Reveal
              key={key}
              className={`relative flex flex-col rounded-3xl border ${
                isHighlight
                  ? "border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/20 via-slate-950 to-slate-950"
                  : "border-white/10 bg-white/5"
              } p-6 shadow-lg`}
            >
              {badge && (
                <div
                  className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                    isHighlight ? "bg-fuchsia-500" : "bg-sky-500"
                  }`}
                >
                  {badge}
                </div>
              )}
              <h3 className="text-xl font-semibold text-white">{t(`landing.pricing.${key}.name`)}</h3>
              <p className="mt-1 text-xs text-slate-400">{t(`landing.pricing.${key}.productLimit`)}</p>
              <p className="mt-2 text-sm text-slate-300">{t(`landing.pricing.${key}.description`)}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">
                  {t(`landing.pricing.${key}.price`)}
                </span>
                <span className="text-sm text-slate-400">{t(`landing.pricing.${key}.period`)}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-200">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Structured Data (JSON-LD)                                          */
/* ------------------------------------------------------------------ */
const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Aganim AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}`,
  image: OG_IMAGE,
  description:
    "AI-powered Shopify app for cross-border e-commerce translation, localization, SEO optimization, competitive pricing intelligence, and marketing content generation.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "10 products, 1-week trial with full feature access",
    },
    {
      "@type": "Offer",
      price: "20",
      priceCurrency: "USD",
      name: "Basic",
      description: "50 products/month, professional writing studio",
    },
    {
      "@type": "Offer",
      price: "33",
      priceCurrency: "USD",
      name: "Standard",
      description:
        "Unlimited products, SEO optimizer, Price Scout, visual ads, agentic missions",
    },
    {
      "@type": "Offer",
      price: "65",
      priceCurrency: "USD",
      name: "Pro",
      description:
        "Unlimited products and missions, 100 image credits, bulk upload",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Aganim AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aganim AI is a Shopify app that uses AI to translate and localize your online store for cross-border e-commerce. It rewrites product listings, optimizes SEO metadata, generates marketing content, and analyzes competitor pricing across 12+ global markets — all while preserving your brand identity through its Brand Soul engine.",
      },
    },
    {
      "@type": "Question",
      name: "How does Aganim AI translate my Shopify store?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aganim AI uses its Brand Soul engine to understand your brand identity (archetype, tone, power words, cultural touchpoints), then generates localized product titles, descriptions, SEO metadata, and marketing content for each target market. Translations are saved directly back to your Shopify store as locale-specific content.",
      },
    },
    {
      "@type": "Question",
      name: "What languages does Aganim AI support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aganim AI supports 12 global markets including English (US), Japanese, Traditional Chinese (Taiwan), Korean, German, French, Spanish, Italian, Portuguese (Brazil), Thai, Vietnamese, and Simplified Chinese. Each market gets culturally adapted content, not just direct translation.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Aganim AI cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aganim AI offers four pricing tiers: Free ($0, 10 products for 1 week), Basic ($20/month, 50 products), Standard ($33/month, unlimited products with SEO and pricing intelligence), and Pro ($65/month, unlimited everything plus 100 image credits).",
      },
    },
    {
      "@type": "Question",
      name: "What are Agentic Missions in Aganim AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Agentic Missions are multi-agent AI pipelines that chain together Rewriter, SEO, Marketing, Pricing, Image Refinement, and Visual Marketing into automated workflows. You can use preset mission templates or build custom pipelines, with results automatically saved to your Shopify store.",
      },
    },
    {
      "@type": "Question",
      name: "Does Aganim AI work with the Shopify App Store?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Aganim AI is available on the Shopify App Store. It integrates directly with your Shopify admin as an embedded app, reading your product catalog and writing localized content, translations, SEO metadata, and marketing assets back to your store.",
      },
    },
  ],
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <LandingHeader />

      <main className="space-y-10">
        <Hero />
        <ShopifyShowcase />
        <FeatureGrid />
        <Pricing />
        <FAQ />
      </main>

      <LandingFooter />
    </div>
  );
}
