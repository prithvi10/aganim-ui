import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { MetaFunction } from "react-router";
import {
  StarIcon,
  EditIcon,
  SearchIcon,
  SocialAdIcon,
  ChartVerticalIcon,
  HomeIcon,
  ImageIcon,
  NoteIcon,
  SettingsIcon,
  GlobeIcon,
  ImportIcon,
} from "@shopify/polaris-icons";
import styles from "../styles/support.module.css";
import { LandingHeader, LandingFooter } from "../components/LandingLayout";

export const meta: MetaFunction = () => {
  return [
    { title: "Support | Aganim AI" },
    {
      name: "description",
      content:
        "Support docs for Aganim AI: feature guides, troubleshooting, FAQs, and contact.",
    },
  ];
};

type Troubleshoot = {
  symptom: string;
  cause: string;
  fixes: string[];
};

type Faq = { q: string; a: string };

type SupportCard = {
  id: string;
  title: string;
  short: string;
  demoPath: string;
  icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  iconImage?: string;

  what: string[];
  how: string[];

  sections?: Array<{
    title: string;
    body: string[];
  }>;

  planMatrix?: {
    title: string;
    rows: Array<{
      feature: string;
      Basic: string;
      Standard: string;
      Pro: string;
      notes: string;
    }>;
  };

  troubleshooting: Troubleshoot[];
  faqs: Faq[];
  notes?: string[];
};

const CARD_META: Array<{
  id: string;
  demoPath: string;
  icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  iconImage?: string;
}> = [
  { id: "brand-soul", demoPath: "/support-gifs/brand-soul.mp4", iconImage: "/landing%20page/Brand%20soul%20logo.png" },
  { id: "rewriter-workspace", demoPath: "/support-gifs/rewriter-workspace.mp4", icon: EditIcon },
  { id: "writing-studio", demoPath: "/support-gifs/writing-studio.png", icon: EditIcon },
  { id: "content-templates", demoPath: "/support-gifs/content-templates.mp4", icon: NoteIcon },
  { id: "image-refinement", demoPath: "/support-gifs/image-refinement.mp4", icon: ImageIcon },
  { id: "seo", demoPath: "/support-gifs/seo-editor-ctr.mp4", icon: ChartVerticalIcon },
  { id: "japanese-value", demoPath: "/support-gifs/japanese-value-add-to-description.mp4", icon: StarIcon },
  { id: "optimization-preferences", demoPath: "/support-gifs/optimization-preferences.mp4", icon: SettingsIcon },
  { id: "multi-locale-editor", demoPath: "/support-gifs/multi-locale-edit-save.mp4", icon: GlobeIcon },
  { id: "marketing", demoPath: "/support-gifs/marketing-hooks-to-metafields.mp4", icon: SocialAdIcon },
  { id: "price-scout", demoPath: "/support-gifs/price-scout.mp4", icon: SearchIcon },
  { id: "missions", demoPath: "/support-gifs/missions-overview.mp4", icon: StarIcon },
  { id: "bulk-upload", demoPath: "/support-gifs/bulk-upload.mp4", icon: ImportIcon },
  { id: "dashboard", demoPath: "/support-gifs/dashboard-overview.mp4", icon: HomeIcon },
];

function Table({
  rows,
}: {
  rows: Array<{
    feature: string;
    Basic: string;
    Standard: string;
    Pro: string;
    notes: string;
  }>;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.tableWrap} role="region" aria-label="Plan feature table">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("support.tableFeature")}</th>
            <th>Basic</th>
            <th>Standard</th>
            <th>Pro</th>
            <th>{t("support.tableNotes")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature}>
              <td className={styles.tFeature}>{r.feature}</td>
              <td className={styles.tCenter}>{r.Basic}</td>
              <td className={styles.tCenter}>{r.Standard}</td>
              <td className={styles.tCenter}>{r.Pro}</td>
              <td className={styles.tNotes}>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardIcon({ card }: { card: SupportCard }) {
  if (card.iconImage) {
    return <img src={card.iconImage} alt="" className={styles.featureIconImg} />;
  }
  const Ic = card.icon;
  if (Ic) {
    return (
      <div className={styles.featureIconSvg}>
        <Ic />
      </div>
    );
  }
  return null;
}

export default function SupportPage() {
  const { t } = useTranslation();

  const allCards = useMemo<SupportCard[]>(() => {
    return CARD_META.map((meta) => {
      const c = t(`support.cards.${meta.id}`, { returnObjects: true }) as Record<string, unknown>;
      return {
        ...meta,
        title: (c?.title as string) ?? meta.id,
        short: (c?.short as string) ?? "",
        what: (c?.what as string[]) ?? [],
        how: (c?.how as string[]) ?? [],
        sections: c?.sections as SupportCard["sections"],
        planMatrix: c?.planMatrix as SupportCard["planMatrix"],
        troubleshooting: (c?.troubleshooting as Troubleshoot[]) ?? [],
        faqs: (c?.faqs as Faq[]) ?? [],
        notes: c?.notes as string[],
      };
    });
  }, [t]);

  const indexLinks = useMemo(() => {
    return allCards.map((c) => ({ id: c.id, title: c.title }));
  }, [allCards]);

  useEffect(() => {
    const openFromHash = () => {
      const raw = window.location.hash || "";
      const id = decodeURIComponent(raw.replace("#", "")).trim();
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
      }
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LandingHeader />
      <main id="top" className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div>
              <h1 className={styles.h1}>{t("support.pageTitle")}</h1>
              <p className={styles.subtitle}>{t("support.subtitle")}</p>
            </div>
          </div>
        </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.h2}>{t("support.featureDocs")}</h2>
          <p className={styles.sectionSub}>{t("support.featureDocsDesc")}</p>
        </div>

        <div className={styles.contentLayout}>
          <aside className={styles.indexNav} aria-label={t("support.index")}>
            <div className={styles.indexTitle}>{t("support.index")}</div>
            <div className={styles.indexList}>
              {indexLinks.map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  className={styles.indexLink}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(l.id);
                    if (!el) return;
                    if (el instanceof HTMLDetailsElement) el.open = true;
                    el.scrollIntoView({ block: "start", behavior: "smooth" });
                    window.history.replaceState(null, "", `#${l.id}`);
                  }}
                >
                  {l.title}
                </a>
              ))}
            </div>
          </aside>

          <div className={styles.stack}>
            {allCards.map((c) => (
              <details key={c.id} id={c.id} className={styles.feature}>
                <summary className={styles.featureSummary}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureTitleRow}>
                      <div className={styles.featureIcon}>
                        <CardIcon card={c} />
                      </div>
                      <h3 className={styles.h3}>{c.title}</h3>
                    </div>
                    <p className={styles.featureShort}>{c.short}</p>
                  </div>
                </summary>

                <div className={styles.featureBody}>
                  {/* Demo — full width (video or image) */}
                  {c.demoPath && (
                  <div className={styles.panel}>
                    {/\.(png|jpe?g|webp|gif|svg)$/i.test(c.demoPath) ? (
                      <img
                        src={c.demoPath}
                        alt={c.title}
                        className={styles.demoVideo}
                      />
                    ) : (
                      <video
                        src={c.demoPath}
                        loop
                        muted
                        playsInline
                        controls
                        className={styles.demoVideo}
                      />
                    )}
                  </div>
                  )}

                  {/* Guide — What + How + Deep Dive merged */}
                  <div className={styles.panel}>
                    <div className={styles.panelTitle}>{t("support.guideLabel")}</div>

                    {c.what.length > 0 && (
                      <>
                        <div className={styles.subTitle}>{t("support.whatLabel")}</div>
                        <ul className={styles.ul}>
                          {c.what.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {c.how.length > 0 && (
                      <>
                        <div className={styles.subTitle}>{t("support.howLabel")}</div>
                        <ol className={styles.ol}>
                          {c.how.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ol>
                      </>
                    )}

                    {c.sections?.length ? (
                      <>
                        <div className={styles.subTitle}>{t("support.deepDive")}</div>
                        <div className={styles.deepDive}>
                          {c.sections.map((s) => (
                            <div key={s.title} className={styles.deepBlock}>
                              <div className={styles.deepTitle}>{s.title}</div>
                              <ul className={styles.ul}>
                                {s.body.map((b) => (
                                  <li key={b}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Plan Matrix (if present) */}
                  {c.planMatrix ? (
                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{c.planMatrix.title}</div>
                      <Table rows={c.planMatrix.rows} />
                    </div>
                  ) : null}

                  {/* Issues & FAQs — Troubleshooting + FAQ merged */}
                  {(c.troubleshooting.length > 0 || c.faqs.length > 0) && (
                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.issuesAndFaqs")}</div>

                      {c.troubleshooting.length > 0 && (
                        <>
                          <div className={styles.subTitle}>{t("support.troubleshootingLabel")}</div>
                          <div className={styles.troubleshoot}>
                            {c.troubleshooting.map((ts) => (
                              <details key={ts.symptom} className={styles.details}>
                                <summary className={styles.summary}>
                                  <span className={styles.summaryTitle}>{ts.symptom}</span>
                                </summary>
                                <div className={styles.detailsBody}>
                                  <div className={styles.kv}>
                                    <div className={styles.k}>{t("support.likelyCause")}</div>
                                    <div className={styles.v}>{ts.cause}</div>
                                  </div>
                                  <div className={styles.kv}>
                                    <div className={styles.k}>{t("support.fix")}</div>
                                    <div className={styles.v}>
                                      <ul className={styles.ulCompact}>
                                        {ts.fixes.map((f) => (
                                          <li key={f}>{f}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                        </>
                      )}

                      {c.faqs.length > 0 && (
                        <>
                          <div className={styles.subTitle}>{t("support.faqsLabel")}</div>
                          <div className={styles.faqs}>
                            {c.faqs.map((f) => (
                              <details key={f.q} className={styles.details}>
                                <summary className={styles.summary}>{f.q}</summary>
                                <div className={styles.detailsBody}>{f.a}</div>
                              </details>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Notes (if present) */}
                  {c.notes?.length ? (
                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.notesLabel")}</div>
                      <ul className={styles.ul}>
                        {c.notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className={styles.backToTop}>
                    <a
                      className={styles.link}
                      href="#top"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById("top");
                        if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
                        window.history.replaceState(null, "", "#top");
                      }}
                    >
                      {t("support.backToTop")}
                    </a>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      </main>
      <LandingFooter />
    </div>
  );
}
