import { useEffect, useMemo, useState } from "react";
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

const ALL_PLANS: Array<PlanName | "All"> = ["All", "Free", "Basic", "Standard", "Pro"];

// Optional: embed your Google Form at the end (later).
const GOOGLE_FORM_EMBED_URL = ""; // e.g. "https://docs.google.com/forms/d/e/<id>/viewform?embedded=true"
const GOOGLE_FORM_DIRECT_URL = ""; // e.g. "https://docs.google.com/forms/d/e/<id>/viewform"

function isIncludedForPlan(card: SupportCard, plan: PlanName | "All") {
  if (plan === "All") return true;
  return Boolean(card.plans?.[plan]);
}

const SUPPORT_CARDS: SupportCard[] = [
  {
    id: "rewriter-workspace",
    title: "Rewriter Workspace",
    short:
      "Generate localized drafts (title + HTML description + SEO title/meta) per market and save translations back to Shopify.",
    gifHintPath: "/support-gifs/rewriter-workspace-overview.gif",
    plans: { Basic: true, Standard: true, Pro: true },
    what: [
      "A workspace to optimize a product for global markets (per locale).",
      "Generates: title, HTML description, SEO title, meta description, and optional SEO alt text.",
      "Supports per-locale editing so you can tailor messaging and SEO to each market.",
    ],
    how: [
      "Open Rewriter and select a product.",
      "Select target market(s)/locale(s). (Basic: 1 locale. Standard/Pro: multi-locale.)",
      "Set Optimization Preferences (tone, measurements, strip irrelevant content).",
      "Click “Optimize for Global” to generate drafts.",
      "Review and edit drafts for the active locale (title, HTML, SEO fields).",
      "Optionally add Japanese Value insights to strengthen proof and differentiation.",
      "Click “Save to Shopify” to persist translations + SEO fields for that locale.",
    ],
    planMatrix: {
      title: "Plan features (Rewriter)",
      rows: [
        {
          feature:
            'AI “Optimize for Global” (draft title + HTML description + SEO title/desc)',
          Basic: "✅",
          Standard: "✅",
          Pro: "✅",
          notes: "Calls generation via UI + backend proxy/generation endpoint(s).",
        },
        {
          feature: "Rewrite markets selection (published locales)",
          Basic: "✅ (1 locale)",
          Standard: "✅ (multi)",
          Pro: "✅ (multi)",
          notes:
            "UI blocks >1 when maxLocales===1; backend blocks multi-locale for non-Standard/Pro.",
        },
        {
          feature: "Bulk multi-market generation in one click",
          Basic: "❌",
          Standard: "✅",
          Pro: "✅",
          notes:
            "Backend hard-gate: if len(target_locales)>1 then requires Standard/Pro.",
        },
        {
          feature: "Tone / Market Persona / Brand Tone selector",
          Basic: "❌ (forced Professional)",
          Standard: "✅",
          Pro: "✅",
          notes:
            "Backend + UI: Basic forces professional; Standard/Pro allow professional/luxury/minimalist/playful.",
        },
        {
          feature: "Auto-convert units to US Standard (EN only)",
          Basic: "✅",
          Standard: "✅",
          Pro: "✅",
          notes:
            "Applies when enabled + locale starts with “en”. Metric is preserved; US values are appended.",
        },
        {
          feature:
            "SEO Details editor (SEO title + meta description + SERP preview + char guidance)",
          Basic: "✅",
          Standard: "✅",
          Pro: "✅",
          notes: "Editable per locale; saved back to Shopify.",
        },
        {
          feature:
            "Save to Shopify (title/body_html translations + SEO fields where supported)",
          Basic: "✅",
          Standard: "✅",
          Pro: "✅",
          notes:
            "Uses digests + translations register for non-primary locales; safer ordering to avoid digest invalidation.",
        },
        {
          feature:
            "Key Details (Nuance) / “Verified Japanese Value Detected” panel",
          Basic: "✅",
          Standard: "✅",
          Pro: "✅",
          notes:
            "Driven by backend discovered_values; can append footer and persist as metafield.",
        },
        {
          feature:
            "Auto-reset cached context/drafts when product description changes",
          Basic: "✅",
          Standard: "✅",
          Pro: "✅",
          notes:
            "Uses description hash metafields to detect manual changes vs app writes; resets stale context/drafts.",
        },
      ],
    },
    troubleshooting: [
      {
        symptom: "I can’t select multiple locales.",
        cause:
          "Basic supports 1 locale per run, or additional markets aren’t published in Shopify.",
        fixes: [
          "Publish additional markets/locales in Shopify settings.",
          "Upgrade to Standard/Pro for multi-locale and bulk runs.",
        ],
      },
      {
        symptom: "Save failed or content didn’t show up in Shopify.",
        cause:
          "Translation digests can become invalid if product content changes during save.",
        fixes: [
          "Avoid editing the same product in Shopify while saving from the app.",
          "Re-run Optimize and try Save again.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does this overwrite my original product content?",
        a: "It saves translations for selected locale(s) and related SEO fields. Your primary content remains the reference unless you intentionally update it.",
      },
      {
        q: "Can I edit output before saving?",
        a: "Yes—title, description HTML, and SEO fields are editable before saving.",
      },
    ],
  },

  {
    id: "theme-editor",
    title: "Theme Editor",
    short:
      "Enable the theme extension/app embed and preview storefront behavior in Shopify’s Theme Editor (Customize).",
    gifHintPath: "/support-gifs/theme-editor-enable-embed.gif",
    plans: { Free: true, Basic: true, Standard: true, Pro: true },
    what: [
      "A storefront setup step: enable the app’s theme extension (app embed/block) so you can preview behavior in a live theme context.",
      "Useful for verifying that your markets/locales load correctly and the widget renders on product pages.",
    ],
    how: [
      "In Shopify Admin: Online Store → Themes → Customize.",
      "Open App embeds (or add the app block in your product template).",
      "Enable the Cross-Border AI embed/block.",
      "Save the theme and preview a product page.",
    ],
    troubleshooting: [
      {
        symptom: "The widget can’t load markets/locales.",
        cause:
          "Markets aren’t published, or the storefront/proxy setup can’t authenticate or reach the server.",
        fixes: [
          "Publish markets/locales in Shopify settings.",
          "Open the admin app once to ensure the shop is fully authenticated/synced.",
          "If you see signature errors, verify App Proxy configuration and secret.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Theme Editor required to use Rewriter?",
        a: "No—Rewriter works in the admin app. Theme Editor is for storefront preview and theme features.",
      },
    ],
  },

  {
    id: "seo",
    title: "SEO",
    short:
      "Edit SEO title/meta with SERP preview, apply CTR best practices, use competitor intel (Standard/Pro), and follow recommendations.",
    gifHintPath: "/support-gifs/seo-editor-ctr.gif",
    plans: { Basic: true, Standard: true, Pro: true },
    what: [
      "SEO Details lets you edit SEO Title + Meta Description per locale and preview how it may appear in Google.",
      "All plans can receive recommendations; Standard/Pro can also enrich generation with competitor SERP context (best-effort).",
    ],
    how: [
      "Run Optimize in Rewriter.",
      "Open SEO Details for the active locale.",
      "Edit SEO title and meta description while watching preview and length guidance.",
      "Save to Shopify to persist SEO fields for that locale.",
    ],
    sections: [
      {
        title: "3.1 Improve CTR (click-through rate)",
        body: [
          "Lead with the primary keyword + clear product type.",
          "Add one strong differentiator (material, craft detail, outcome) without stuffing keywords.",
          "Keep it readable: titles ~70 chars, meta descriptions ~160 chars to avoid truncation.",
        ],
      },
      {
        title: "3.2 Competitor info (Standard/Pro)",
        body: [
          "Standard/Pro can pull a small set of top Google results for a product keyword (product name + category).",
          "This is used as context to guide copy and highlight differentiators (without copying).",
          "If SERP integration is unavailable, competitor info may not appear (best-effort enrichment).",
        ],
      },
      {
        title: "3.3 Recommendations (all plans)",
        body: [
          "Recommendations are guidance only (no auto-overwrite).",
          "Includes competitive edge and buyer intent strategy suggestions based only on facts present in your description.",
          "If the system cannot be confident without inventing facts, it may return empty recommendations—add real specifics and re-run.",
        ],
      },
    ],
    troubleshooting: [
      {
        symptom: "Competitor info doesn’t show up.",
        cause:
          "Competitor enrichment is Standard/Pro and depends on SERP integration availability.",
        fixes: [
          "Confirm you’re on Standard/Pro.",
          "Treat competitor info as best-effort; you can still use SEO editor + recommendations without it.",
        ],
      },
      {
        symptom: "Recommendations are blank or too generic.",
        cause:
          "Sparse source descriptions produce weaker recommendations (the system avoids inventing facts).",
        fixes: [
          "Add authentic details (materials, what’s included, dimensions, care, origin/craft).",
          "Re-run Optimize and review recommendations again.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will SEO edits change my product title on the page?",
        a: "No—SEO title/meta are separate fields used for search snippets and sharing previews (theme/search behavior may vary).",
      },
      {
        q: "Do I have to accept recommendations?",
        a: "No—recommendations are optional guidance. You control what is saved.",
      },
    ],
  },

  {
    id: "japanese-value",
    title: "Japanese Value",
    short:
      "Surface verified Japanese nuance/craft details and add them into your description as proof and differentiation.",
    gifHintPath: "/support-gifs/japanese-value-add-to-description.gif",
    plans: { Basic: true, Standard: true, Pro: true },
    what: [
      "Highlights craftsmanship/cultural nuance detected from the source text and explains why it matters to global buyers.",
      "Designed to strengthen credibility without making up claims.",
    ],
    how: [
      "Run Optimize in Rewriter.",
      "Open Japanese Value / Key Details panel.",
      "Review evidence + explanation + suggested footer lines.",
      "Insert the insight into your description and Save to Shopify.",
    ],
    troubleshooting: [
      {
        symptom: "No insights detected.",
        cause:
          "The source text doesn’t include clear craft/provenance/unique detail signals.",
        fixes: [
          "Add authentic details (materials, origin, method, care, what’s included).",
          "Re-run Optimize to re-detect nuance.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will it invent cultural claims?",
        a: "It is designed not to. If a detail isn’t present, it shouldn’t be introduced as fact.",
      },
    ],
  },

  {
    id: "optimization-preferences",
    title: "Optimization Preferences",
    short:
      "Control tone, measurements, and content cleanup so output matches your brand and avoids common localization mistakes.",
    gifHintPath: "/support-gifs/optimization-preferences.gif",
    plans: { Basic: true, Standard: true, Pro: true },
    what: [
      "Preferences that influence generation before you save to Shopify.",
      "Includes: tone (Standard/Pro), EN measurement conversions, and irrelevant content stripping.",
    ],
    how: [
      "Choose tone before Optimize (Standard/Pro).",
      "Enable auto-convert units for English locales if needed.",
      "Keep irrelevant-content stripping on for most stores; disable only when you intentionally include policy blocks in product descriptions.",
      "Optimize, review, and regenerate if needed.",
    ],
    sections: [
      {
        title: "5.1 Tones of rewriters",
        body: [
          "Basic: Professional tone only.",
          "Standard/Pro: Professional, Luxury, Minimalist, Playful.",
          "Use tone to match brand identity while keeping facts unchanged.",
        ],
      },
      {
        title: "5.2 Measurements (EN only)",
        body: [
          "When enabled for English locales, the app keeps metric values and appends US equivalents (when available).",
          "If the source has no measurable units, there may be nothing to convert.",
        ],
      },
      {
        title: "5.3 Irrelevant content strip",
        body: [
          "Removes non-product boilerplate so the model focuses on product facts and selling points.",
          "If you want policy content, prefer storing it in theme sections/pages rather than product descriptions.",
        ],
      },
    ],
    troubleshooting: [
      {
        symptom: "Tone selector is disabled.",
        cause: "Basic forces Professional tone.",
        fixes: ["Upgrade to Standard/Pro to unlock additional tones."],
      },
      {
        symptom: "No conversions appear.",
        cause:
          "Conversions apply to English locales and only if the source contains measurable units.",
        fixes: [
          "Run for an `en-*` locale.",
          "Ensure the description includes dimensions/weight/volume units.",
        ],
      },
      {
        symptom: "It removed content I wanted to keep.",
        cause: "Stripping may remove policy/boilerplate blocks.",
        fixes: [
          "Disable stripping and re-run Optimize.",
          "Or move policy content outside product descriptions (theme sections/pages).",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I keep irrelevant content strip on?",
        a: "Yes for most stores. Turn it off only if your product description intentionally includes required policy text that must remain.",
      },
    ],
  },

  {
    id: "multi-locale-editor",
    title: "Multi locale editor",
    short:
      "Edit drafts per locale and save translations safely (Basic: 1 locale at a time; Standard/Pro: multi-locale + bulk).",
    gifHintPath: "/support-gifs/multi-locale-edit-save.gif",
    plans: { Basic: true, Standard: true, Pro: true },
    what: [
      "Per-locale editing and saving flow so each market gets tailored copy and SEO.",
      "Standard/Pro can generate multiple locales in one run; Basic runs one locale at a time.",
    ],
    how: [
      "Select a locale tab/market.",
      "Edit title, description HTML, and SEO fields for that locale.",
      "Save to Shopify for that locale.",
      "Repeat for other locales (or bulk-generate on Standard/Pro).",
    ],
    troubleshooting: [
      {
        symptom: "I saw a digest/hash error during save.",
        cause:
          "Shopify translation registration can fail if primary content changes mid-save.",
        fixes: [
          "Avoid editing primary content in Shopify while saving translations.",
          "Re-run Optimize and Save again.",
        ],
      },
      {
        symptom: "Drafts/context reset unexpectedly.",
        cause:
          "The app detected manual content changes and reset cached drafts to avoid stale writes.",
        fixes: ["Re-run Optimize using the updated Shopify description."],
      },
    ],
    faqs: [
      {
        q: "Why is Basic limited to one locale per run?",
        a: "Multi-locale and bulk workflows are Standard/Pro features to support higher volume optimization across markets.",
      },
    ],
  },

  {
    id: "marketing",
    title: "Marketing",
    short:
      "Generate Instagram hooks/captions/hashtags, overlay suggestions, and seasonal campaign ideas; cache outputs to metafields to avoid repeat calls.",
    gifHintPath: "/support-gifs/marketing-hooks-to-metafields.gif",
    plans: { Basic: true, Standard: true, Pro: true },
    what: [
      "Product Marketing workspace generates social-ready marketing copy for a selected product.",
      "Outputs can be cached to Shopify metafields so you can reuse them without regenerating every time.",
    ],
    how: [
      "Open Marketing and select a product.",
      "Generate Instagram hooks/captions + hashtags.",
      "Review variations and pick the best fit for your brand.",
      "Generate overlay suggestions for short-form video (reels).",
      "Save outputs to Shopify metafields (for caching/reuse).",
      "Use Seasonal Campaign to get an upcoming campaign idea and optional seasonal caption copy.",
    ],
    sections: [
      {
        title: "7.1 Seasonal Campaigns",
        body: [
          "Creates an upcoming seasonal hook + campaign concept + suggested discount code direction.",
          "Use “Re-check” to refresh ideas when you need new angles.",
        ],
      },
      {
        title: "7.2 Caption generator",
        body: [
          "Generates hooks, captions, hashtags, and overlay suggestions.",
          "Caching keeps your app fast and reduces repeated generation cost.",
        ],
      },
    ],
    troubleshooting: [
      {
        symptom: "Generate button is disabled / content looks cached.",
        cause: "Fresh cached outputs exist in Shopify metafields.",
        fixes: [
          "If available, use re-check/regenerate behavior.",
          "Update the product description to refresh context and generate again.",
        ],
      },
      {
        symptom: "Seasonal output looks generic.",
        cause: "Not enough product differentiation in the source.",
        fixes: [
          "Add specific differentiators (materials, use case, bundle contents).",
          "Re-check Seasonal Campaign.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where are marketing results stored?",
        a: "They can be saved to Shopify product metafields so you can reuse them and avoid repeated generation.",
      },
    ],
  },

  {
    id: "dashboard",
    title: "Dashboard",
    short:
      "Monitor plan, usage, active markets, locked features, and authentication/connection health.",
    gifHintPath: "/support-gifs/dashboard-overview.gif",
    plans: { Free: true, Basic: true, Standard: true, Pro: true },
    what: [
      "A quick operational view of what’s happening in your store and what’s unlocked.",
      "Helps you track usage, markets configured, and whether an upgrade would unlock needed capabilities.",
    ],
    how: [
      "Check total optimized/usage to understand your pace.",
      "Review active markets count to confirm markets are enabled.",
      "Use locked feature sections as an upgrade roadmap.",
      "If you see an auth error, reconnect and retry.",
    ],
    troubleshooting: [
      {
        symptom: "Authentication error / reconnect banner.",
        cause: "Backend sync/auth issue for the shop session.",
        fixes: [
          "Reconnect (re-auth) and return to the dashboard.",
          "Retry the action after re-auth completes.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does Dashboard change store content?",
        a: "No—Dashboard is informational. It helps you decide what to do next.",
      },
    ],
  },
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
  return (
    <div className={styles.tableWrap} role="region" aria-label="Plan feature table">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Basic</th>
            <th>Standard</th>
            <th>Pro</th>
            <th>Notes</th>
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
  const [plan, setPlan] = useState<PlanName | "All">("All");

  const filtered = useMemo(() => {
    return SUPPORT_CARDS.filter((c) => isIncludedForPlan(c, plan));
  }, [plan]);

  const indexLinks = useMemo(() => {
    return SUPPORT_CARDS.filter((c) => isIncludedForPlan(c, plan)).map((c) => ({
      id: c.id,
      title: c.title,
    }));
  }, [plan]);

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

  return (
    <main id="top" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden />
            <div>
              <div className={styles.kicker}>Help Center</div>
              <h1 className={styles.h1}>Support</h1>
              <p className={styles.subtitle}>
                Feature guides, plan availability, troubleshooting, and FAQs for Cross-Border AI.
              </p>
            </div>
          </div>

          <div className={styles.controls}>
            <div className={styles.planWrap}>
              <div className={styles.label}>Plan filter</div>
              <div className={styles.planTabs} role="tablist" aria-label="Plan filter">
                {ALL_PLANS.map((p) => {
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
                      {p}
                    </button>
                  );
                })}
              </div>
              <div className={styles.planHint}>
                Tip: Keep “All” for public browsing, or filter to a plan to see what’s included.
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.h2}>Feature docs</h2>
          <p className={styles.sectionSub}>
            Each feature below includes plan availability, step-by-step usage, and common fixes.
          </p>
        </div>

        <div className={styles.contentLayout}>
          <aside className={styles.indexNav} aria-label="Support index">
            <div className={styles.indexTitle}>Index</div>
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
                            title={on ? `Included in ${p}` : `Not included in ${p}`}
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
                      <div className={styles.panelTitle}>GIF demo</div>
                      <div className={styles.gifBox}>
                        <div className={styles.gifText}>
                          Add a GIF later at <code>{c.gifHintPath}</code>
                        </div>
                        <div className={styles.gifHint}>
                          Keep it ~10–25s, cropped, and show the happy path.
                        </div>
                      </div>
                    </div>

                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>What</div>
                      <ul className={styles.ul}>
                        {c.what.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.panel}>
                      <div className={styles.panelTitle}>How</div>
                      <ol className={styles.ol}>
                        {c.how.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ol>
                    </div>

                    {c.sections?.length ? (
                      <div className={styles.panel}>
                        <div className={styles.panelTitle}>Deep dive</div>
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
                      <div className={styles.panelTitle}>Troubleshooting</div>
                      <div className={styles.troubleshoot}>
                        {c.troubleshooting.map((t) => (
                          <details key={t.symptom} className={styles.details}>
                            <summary className={styles.summary}>
                              <span className={styles.summaryTitle}>{t.symptom}</span>
                            </summary>
                            <div className={styles.detailsBody}>
                              <div className={styles.kv}>
                                <div className={styles.k}>Likely cause</div>
                                <div className={styles.v}>{t.cause}</div>
                              </div>
                              <div className={styles.kv}>
                                <div className={styles.k}>Fix</div>
                                <div className={styles.v}>
                                  <ul className={styles.ulCompact}>
                                    {t.fixes.map((f) => (
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
                      <div className={styles.panelTitle}>FAQs</div>
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
                        <div className={styles.panelTitle}>Notes</div>
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
                      Back to top
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
          <h2 className={styles.h2}>Still need help?</h2>
          <p className={styles.sectionSub}>
            If you contact us, include: shop domain, plan, feature, locale, screenshots, and steps to reproduce.
          </p>
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
              <div className={styles.formTitle}>Add your Google Form</div>
              <div className={styles.formText}>
                Set <code>GOOGLE_FORM_EMBED_URL</code> and <code>GOOGLE_FORM_DIRECT_URL</code> in this file.
              </div>
              <div className={styles.formText}>
                Suggested fields: shop domain, plan, feature, locale, expected result, actual result, screenshots, steps.
              </div>
            </div>
          )}

          {GOOGLE_FORM_DIRECT_URL ? (
            <div className={styles.formFooter}>
              Prefer a new tab?{" "}
              <a className={styles.link} href={GOOGLE_FORM_DIRECT_URL} target="_blank" rel="noreferrer">
                Open the form
              </a>
              .
            </div>
          ) : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerNote}>
            © {new Date().getFullYear()} Cross-Border AI. Support content is updated regularly.
          </div>
        </div>
      </footer>
    </main>
  );
}