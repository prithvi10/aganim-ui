import { useEffect } from "react";
import { Grid2x2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LandingHeader,
  LandingFooter,
  Reveal,
} from "../components/LandingLayout";
import { supportMediaUrl } from "../utils/supportMedia";

/* ------------------------------------------------------------------ */
/*  Feature metadata (media paths only — text comes from i18n)         */
/* ------------------------------------------------------------------ */
const FEATURE_IDS = [
  { id: "brand-soul", media: "/support-gifs/brand-soul.mp4", heroImage: "/landing%20page/brand-soul-showcase.png" },
  { id: "rewriter-workspace", media: "/support-gifs/rewriter-workspace.mp4", heroImage: "/landing%20page/rewriter-before-after.png" },
  { id: "marketing", media: "/support-gifs/marketing-hooks-to-metafields.mp4", heroImage: "/landing%20page/marketing.png" },
  { id: "seo", media: "/support-gifs/seo-editor-ctr.mp4", heroImage: "/landing%20page/SEO.png" },
  { id: "price-scout", media: "/support-gifs/price-scout.mp4", heroImage: "/landing%20page/price-scout.png" },
  { id: "content-studio", media: "/support-gifs/content-templates.mp4", heroImage: "/landing%20page/content%20studio.png" },
  { id: "image-refinement", media: "/support-gifs/image-refinement.mp4", heroImage: "/landing%20page/Image%20refinement.png" },
  { id: "missions", media: "/support-gifs/missions-overview.mp4", heroImage: "/landing%20page/missions.png" },
  { id: "many-more-features", media: "", icon: "grid" as const },
];

const isImage = (path: string) =>
  /\.(png|jpe?g|webp|gif|svg)$/i.test(path);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function FeaturesPage() {
  const { t } = useTranslation();

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
              {t("featuresPage.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t("featuresPage.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              {t("featuresPage.subtitle")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Feature cards — alternating zigzag */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl space-y-20 px-6">
          {FEATURE_IDS.map((f, i) => {
            const even = i % 2 === 0;
            const title = t(`featuresPage.features.${f.id}.title`);
            const short = t(`featuresPage.features.${f.id}.short`);
            const highlights = t(`featuresPage.features.${f.id}.highlights`, { returnObjects: true }) as string[];

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
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : f.icon === "grid" ? (
                      <div className="flex h-[320px] w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-6 py-4">
                          <Grid2x2 className="h-8 w-8 text-fuchsia-300" />
                          <span className="text-sm font-medium tracking-wide text-slate-200">
                            {t("featuresPage.featureBundle")}
                          </span>
                        </div>
                      </div>
                    ) : isImage(f.media) ? (
                      <img
                        src={supportMediaUrl(f.media)}
                        alt={title}
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
                      {title}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-slate-300">
                      {short}
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-200">
                      {highlights.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-2">
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

      <LandingFooter />
    </div>
  );
}
