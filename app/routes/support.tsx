import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MetaFunction } from "react-router";
import styles from "../styles/support.module.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Support | Cross-Border AI" },
    {
      name: "description",
      content:
        "Support docs for Cross-Border AI: feature guides, plan availability, troubleshooting, FAQs, and contact.",
    },
  ];
};

type PlanName = "Free" | "Basic" | "Standard" | "Pro";

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
  gifHintPath: string;
  plans: Partial<Record<PlanName, boolean>>;

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

const PLAN_TABS: Array<PlanName | "All"> = ["All", "Free", "Basic", "Standard", "Pro"];

const GOOGLE_FORM_EMBED_URL = "";
const GOOGLE_FORM_DIRECT_URL = "";

function isIncludedForPlan(card: SupportCard, plan: PlanName | "All") {
  if (plan === "All") return true;
  return Boolean(card.plans?.[plan]);
}

const CARD_META: Array<{
  id: string;
  gifHintPath: string;
  plans: Partial<Record<PlanName, boolean>>;
}> = [
  { id: "brand-soul", gifHintPath: "/support-gifs/brand-soul.gif", plans: { Free: true, Basic: true, Standard: true, Pro: true } },
  { id: "rewriter-workspace", gifHintPath: "/support-gifs/rewriter-workspace-overview.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "writing-studio", gifHintPath: "/support-gifs/writing-studio.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "content-templates", gifHintPath: "/support-gifs/content-templates.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "image-refinement", gifHintPath: "/support-gifs/image-refinement.gif", plans: { Pro: true } },
  { id: "seo", gifHintPath: "/support-gifs/seo-editor-ctr.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "japanese-value", gifHintPath: "/support-gifs/japanese-value-add-to-description.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "optimization-preferences", gifHintPath: "/support-gifs/optimization-preferences.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "multi-locale-editor", gifHintPath: "/support-gifs/multi-locale-edit-save.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "marketing", gifHintPath: "/support-gifs/marketing-hooks-to-metafields.gif", plans: { Basic: true, Standard: true, Pro: true } },
  { id: "price-scout", gifHintPath: "/support-gifs/price-scout.gif", plans: { Standard: true, Pro: true } },
  { id: "missions", gifHintPath: "/support-gifs/missions-overview.gif", plans: { Free: true, Basic: true, Standard: true, Pro: true } },
  { id: "dashboard", gifHintPath: "/support-gifs/dashboard-overview.gif", plans: { Free: true, Basic: true, Standard: true, Pro: true } },
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

export default function SupportPage() {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<PlanName | "All">("All");

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

  const filtered = useMemo(() => {
    return allCards.filter((c) => isIncludedForPlan(c, plan));
  }, [allCards, plan]);

  const indexLinks = useMemo(() => {
    return filtered.map((c) => ({ id: c.id, title: c.title }));
  }, [filtered]);

  useEffect(() => {
    const openFromHash = () => {
      const raw = window.location.hash || "";
      const id = decodeURIComponent(raw.replace("#", "")).trim();
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const getPlanLabel = (p: PlanName | "All"): string => {
    if (p === "All") return t("support.planAll");
    return p;
  };

  return (
    <main id="top" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden />
            <div>
              <div className={styles.kicker}>{t("support.helpCenter")}</div>
              <h1 className={styles.h1}>{t("support.pageTitle")}</h1>
              <p className={styles.subtitle}>{t("support.subtitle")}</p>
            </div>
          </div>

          <div className={styles.controls}>
            <div className={styles.planWrap}>
              <div className={styles.label}>{t("support.planFilter")}</div>
              <div className={styles.planTabs} role="tablist" aria-label={t("support.planFilter")}>
                {PLAN_TABS.map((p) => {
                  const active = p === plan;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={active ? styles.planTabActive : styles.planTab}
                      onClick={() => setPlan(p)}
                      role="tab"
                      aria-selected={active}
                    >
                      {getPlanLabel(p)}
                    </button>
                  );
                })}
              </div>
              <div className={styles.planHint}>{t("support.planHint")}</div>
            </div>
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
                <a key={l.id} href={`#${l.id}`} className={styles.indexLink}>
                  {l.title}
                </a>
              ))}
            </div>
          </aside>

          <div className={styles.stack}>
            {filtered.map((c) => (
              <details key={c.id} id={c.id} className={styles.feature}>
                <summary className={styles.featureSummary}>
                  <div className={styles.featureHeader}>
                    <div>
                      <h3 className={styles.h3}>{c.title}</h3>
                      <p className={styles.featureShort}>{c.short}</p>
                    </div>

                    <div className={styles.badges} aria-label="Plan availability">
                      {(["Free", "Basic", "Standard", "Pro"] as PlanName[]).map((p) => {
                        const on = Boolean(c.plans?.[p]);
                        return (
                          <span
                            key={p}
                            className={on ? styles.badgeOn : styles.badgeOff}
                            title={on ? `${p} ✓` : `${p} ✗`}
                          >
                            {p}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </summary>

                <div className={styles.featureBody}>
                  <div className={styles.featureGrid}>
                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.gifDemo")}</div>
                      <div className={styles.gifBox}>
                        <div className={styles.gifText}>
                          {t("support.addGifLater")} <code>{c.gifHintPath}</code>
                        </div>
                        <div className={styles.gifHint}>{t("support.gifHint")}</div>
                      </div>
                    </div>

                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.whatLabel")}</div>
                      <ul className={styles.ul}>
                        {c.what.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.howLabel")}</div>
                      <ol className={styles.ol}>
                        {c.how.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ol>
                    </div>

                    {c.sections?.length ? (
                      <div className={styles.panel}>
                        <div className={styles.panelTitle}>{t("support.deepDive")}</div>
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
                      </div>
                    ) : null}

                    {c.planMatrix ? (
                      <div className={styles.panelWide}>
                        <div className={styles.panelTitle}>{c.planMatrix.title}</div>
                        <Table rows={c.planMatrix.rows} />
                      </div>
                    ) : null}

                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.troubleshootingLabel")}</div>
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
                    </div>

                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>{t("support.faqsLabel")}</div>
                      <div className={styles.faqs}>
                        {c.faqs.map((f) => (
                          <details key={f.q} className={styles.details}>
                            <summary className={styles.summary}>{f.q}</summary>
                            <div className={styles.detailsBody}>{f.a}</div>
                          </details>
                        ))}
                      </div>
                    </div>

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
                  </div>

                  <div className={styles.backToTop}>
                    <a className={styles.link} href="#top">
                      {t("support.backToTop")}
                    </a>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="contact">
        <div className={styles.sectionHeader}>
          <h2 className={styles.h2}>{t("support.stillNeedHelp")}</h2>
          <p className={styles.sectionSub}>{t("support.contactInfo")}</p>
        </div>

        <div className={styles.panel}>
          {GOOGLE_FORM_EMBED_URL ? (
            <iframe
              title="Support form"
              src={GOOGLE_FORM_EMBED_URL}
              className={styles.formFrame}
              loading="lazy"
            />
          ) : (
            <div className={styles.formPlaceholder}>
              <div className={styles.formTitle}>{t("support.addFormTitle")}</div>
              <div className={styles.formText}>{t("support.addFormText")}</div>
              <div className={styles.formText}>{t("support.addFormFields")}</div>
            </div>
          )}

          {GOOGLE_FORM_DIRECT_URL ? (
            <div className={styles.formFooter}>
              {t("support.preferNewTab")}{" "}
              <a className={styles.link} href={GOOGLE_FORM_DIRECT_URL} target="_blank" rel="noreferrer">
                {t("support.openTheForm")}
              </a>
              .
            </div>
          ) : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerNote}>
            © {new Date().getFullYear()} {t("support.copyright")}
          </div>
        </div>
      </footer>
    </main>
  );
}
