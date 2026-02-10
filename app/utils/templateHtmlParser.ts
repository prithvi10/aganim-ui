/**
 * Shared template output parsing utilities.
 *
 * Converts raw JSON / Python-dict / Python-list strings from template outputs
 * into presentable HTML for StepApproval, MissionSummary, and other components.
 */

// ─── Python-style parsers ────────────────────────────────────────────────────

/**
 * Parse a Python-style dict string (single quotes, mixed quoting) into a JS object.
 */
export function parsePythonDict(raw: string): Record<string, any> | null {
  try {
    // Replace Python single-quoted keys/values with double quotes
    let json = raw
      .replace(/'/g, '"')
      .replace(/True/g, "true")
      .replace(/False/g, "false")
      .replace(/None/g, "null");
    // Fix escaped single quotes inside double-quoted strings
    json = json.replace(/\\"/g, "'");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Parse a Python-style list string into a JS array.
 */
export function parsePythonList(raw: string): any[] | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[")) return null;
  try {
    let json = trimmed
      .replace(/'/g, '"')
      .replace(/True/g, "true")
      .replace(/False/g, "false")
      .replace(/None/g, "null");
    json = json.replace(/\\"/g, "'");
    const result = JSON.parse(json);
    return Array.isArray(result) ? result : null;
  } catch {
    return null;
  }
}

// ─── Universal JSON→HTML converter ──────────────────────────────────────────

/**
 * Convert a raw template output string (JSON, Python dict, or Python list)
 * into styled HTML. Handles all template types:
 *   Emails, Ads, FAQs, Landing Heroes, Blog Posts, Collection Descriptions, etc.
 */
export function templateOutputToHtml(raw: string): string {
  // 1. Try standard JSON
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 2. Try Python dict
    parsed = parsePythonDict(raw);
    // 3. Try Python list
    if (!parsed) {
      const arr = parsePythonList(raw);
      if (arr) {
        const looksLikeFaqs =
          arr.length > 0 && arr[0]?.question && arr[0]?.answer;
        parsed = looksLikeFaqs ? { faqs: arr } : { items: arr };
      }
    }
  }

  // Handle bare arrays from JSON.parse
  if (Array.isArray(parsed)) {
    const looksLikeFaqs =
      parsed.length > 0 && parsed[0]?.question && parsed[0]?.answer;
    parsed = looksLikeFaqs ? { faqs: parsed } : { items: parsed };
  }

  if (!parsed || typeof parsed !== "object") return raw;

  const parts: string[] = [];

  // ── Email templates (subject / preheader / body / cta_text) ──────────
  if (parsed.subject) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:14px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Subject Line</p>` +
        `<p style="margin:0;font-size:16px;font-weight:600">${parsed.subject}</p>` +
        `</div>`
    );
  }
  if (parsed.preheader) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:12px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Preheader</p>` +
        `<p style="margin:0;font-size:14px;color:#6d7175">${parsed.preheader}</p>` +
        `</div>`
    );
  }
  if (parsed.body) {
    parts.push(
      `<div style="border:1px solid #e1e3e5;border-radius:8px;padding:20px;margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Email Body</p>` +
        `<div>${parsed.body}</div>` +
        `</div>`
    );
  }
  if (parsed.cta_text) {
    parts.push(
      `<div style="text-align:center;margin:20px 0">` +
        `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${parsed.cta_text}</span>` +
        `</div>`
    );
  }

  // ── Ad copy (primary_text / headline / description / cta) ────────────
  if (parsed.primary_text) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Primary Text</p>` +
        `<p style="margin:0;font-size:15px;line-height:1.6">${parsed.primary_text}</p>` +
        `</div>`
    );
  }
  if (parsed.headline && !parsed.faqs && !parsed.subheadline) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Headline</p>` +
        `<h3 style="margin:0;font-size:18px;font-weight:700">${parsed.headline}</h3>` +
        `</div>`
    );
  }
  if (
    parsed.description &&
    typeof parsed.description === "string" &&
    !parsed.faqs &&
    !parsed.body_html
  ) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Description</p>` +
        `<div style="font-size:15px;line-height:1.6">${parsed.description}</div>` +
        `</div>`
    );
  }
  if (parsed.meta_description && !parsed.body_html && !parsed.description) {
    parts.push(
      `<div style="background:#f6f6f7;border-radius:8px;padding:12px 18px;margin-bottom:14px">` +
        `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">SEO Meta Description</p>` +
        `<p style="margin:0;font-size:14px;color:#6d7175">${parsed.meta_description}</p>` +
        `</div>`
    );
  }
  if (parsed.cta && !parsed.cta_text) {
    parts.push(
      `<div style="text-align:center;margin:20px 0">` +
        `<span style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.3px">${parsed.cta}</span>` +
        `</div>`
    );
  }

  // ── Google Ads (headlines[] / descriptions[]) ─────────────────────────
  if (Array.isArray(parsed.headlines)) {
    const rows = parsed.headlines
      .map(
        (h: string, i: number) =>
          `<li style="padding:6px 0;border-bottom:1px solid #ebebeb"><strong>H${i + 1}:</strong> ${h}</li>`
      )
      .join("");
    parts.push(
      `<div style="margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Headlines</p>` +
        `<ul style="list-style:none;padding:0;margin:0;border:1px solid #e1e3e5;border-radius:8px;padding:4px 14px">${rows}</ul>` +
        `</div>`
    );
  }
  if (Array.isArray(parsed.descriptions)) {
    const rows = parsed.descriptions
      .map(
        (d: string, i: number) =>
          `<li style="padding:6px 0;border-bottom:1px solid #ebebeb"><strong>D${i + 1}:</strong> ${d}</li>`
      )
      .join("");
    parts.push(
      `<div style="margin-bottom:14px">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Descriptions</p>` +
        `<ul style="list-style:none;padding:0;margin:0;border:1px solid #e1e3e5;border-radius:8px;padding:4px 14px">${rows}</ul>` +
        `</div>`
    );
  }
  if (parsed.path1) {
    parts.push(
      `<p style="font-size:13px;color:#6d7175">Display URL: example.com/<strong>${parsed.path1}</strong>/${parsed.path2 || ""}</p>`
    );
  }

  // ── FAQs ──────────────────────────────────────────────────────────────
  if (Array.isArray(parsed.faqs)) {
    parts.push(
      `<p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Frequently Asked Questions</p>`
    );
    parsed.faqs.forEach((f: any, idx: number) => {
      parts.push(
        `<div style="border:1px solid #e1e3e5;border-radius:8px;padding:14px 18px;margin-bottom:10px">` +
          `<h4 style="margin:0 0 6px;font-size:15px;font-weight:600">Q${idx + 1}: ${f.question}</h4>` +
          `<p style="margin:0;font-size:14px;line-height:1.5;color:#303030">${f.answer}</p>` +
          `</div>`
      );
    });
  }

  // ── Landing page hero ─────────────────────────────────────────────────
  if (parsed.headline && (parsed.subheadline || parsed.hero_description)) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Headline</p>` +
        `<h2 style="margin:0;font-size:22px;font-weight:700">${parsed.headline}</h2>` +
        `</div>`
    );
  }
  if (parsed.subheadline) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Sub-headline</p>` +
        `<p style="margin:0;font-size:16px;line-height:1.5">${parsed.subheadline}</p>` +
        `</div>`
    );
  }
  if (parsed.hero_description) {
    parts.push(
      `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
        `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">Hero Description</p>` +
        `<p style="margin:0;font-size:15px;line-height:1.6">${parsed.hero_description}</p>` +
        `</div>`
    );
  }

  // ── Blog post ─────────────────────────────────────────────────────────
  if (parsed.title && parsed.body_html) {
    parts.push(
      `<h2 style="margin:0 0 8px;font-size:22px">${parsed.title}</h2>`
    );
    if (parsed.meta_description) {
      parts.push(
        `<div style="background:#f6f6f7;border-radius:8px;padding:10px 16px;margin-bottom:14px">` +
          `<p style="margin:0;font-size:13px;color:#6d7175"><em>Meta: ${parsed.meta_description}</em></p>` +
          `</div>`
      );
    }
    parts.push(
      `<div style="font-size:15px;line-height:1.7">${parsed.body_html}</div>`
    );
    if (Array.isArray(parsed.tags) && parsed.tags.length) {
      parts.push(
        `<p style="font-size:13px;color:#6d7175;margin-top:16px">Tags: ${parsed.tags.join(", ")}</p>`
      );
    }
  }

  // ── Fallback: render all keys as labelled sections ────────────────────
  if (parts.length === 0) {
    const knownKeys = new Set([
      "subject",
      "preheader",
      "body",
      "cta_text",
      "cta",
      "primary_text",
      "headline",
      "description",
      "headlines",
      "descriptions",
      "path1",
      "path2",
      "title",
      "content",
      "body_html",
      "meta_description",
      "tags",
      "faqs",
      "subheadline",
      "hero_description",
      "items",
    ]);
    for (const [key, val] of Object.entries(parsed)) {
      if (knownKeys.has(key) || val == null) continue;
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const display =
        typeof val === "string" ? val : JSON.stringify(val, null, 2);
      parts.push(
        `<div style="border-left:3px solid #2c6ecb;padding:14px 18px;margin-bottom:14px;background:#f9fafb;border-radius:0 8px 8px 0">` +
          `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6d7175;text-transform:uppercase;letter-spacing:0.5px">${label}</p>` +
          `<div style="font-size:15px;line-height:1.5">${display}</div>` +
          `</div>`
      );
    }
  }

  return parts.join("") || raw;
}

/**
 * Strip HTML tags from a string (for plaintext copy).
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}
