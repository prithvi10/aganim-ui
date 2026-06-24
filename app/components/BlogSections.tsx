import type { ArticleSection } from "../content/blog/types";

function TextBlock({ content }: { content: string }) {
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function HeadingBlock({
  level,
  content,
}: {
  level: 2 | 3;
  content: string;
}) {
  if (level === 2) {
    return (
      <h2 className="mt-16 mb-6 border-l-2 border-fuchsia-400 pl-4 text-2xl font-semibold text-white sm:text-3xl">
        {content}
      </h2>
    );
  }
  return (
    <h3 className="mt-10 mb-4 text-xl font-semibold text-white sm:text-2xl">
      {content}
    </h3>
  );
}

function ImageBlock({
  src,
  alt,
  caption,
  width = "wide",
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: "full" | "wide" | "narrow";
}) {
  const widthClass =
    width === "full"
      ? "max-w-[1100px]"
      : width === "wide"
        ? "max-w-[900px]"
        : "max-w-[720px]";

  return (
    <figure className={`mx-auto my-10 ${widthClass}`}>
      <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40 transition-transform duration-300 hover:scale-[1.005]">
        <img
          src={src}
          alt={alt}
          className="h-auto w-full"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm italic text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ComparisonBlock({
  beforeLabel,
  afterLabel,
  beforeImage,
  afterImage,
  beforeAlt,
  afterAlt,
  caption,
}: {
  beforeLabel: string;
  afterLabel: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  caption?: string;
}) {
  return (
    <figure className="mx-auto my-12 max-w-[900px]">
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="mb-3 inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">
            {beforeLabel}
          </span>
          <div className="overflow-hidden rounded-lg">
            <img
              src={beforeImage}
              alt={beforeAlt}
              className="h-auto w-full"
              loading="lazy"
            />
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-8 w-px bg-gradient-to-b from-red-400/50 to-emerald-400/50" />
          <span className="mx-3 text-xs font-medium text-slate-400">↓</span>
          <div className="h-8 w-px bg-gradient-to-b from-red-400/50 to-emerald-400/50" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="mb-3 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
            {afterLabel}
          </span>
          <div className="overflow-hidden rounded-lg">
            <img
              src={afterImage}
              alt={afterAlt}
              className="h-auto w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-4 text-center text-sm italic text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function CalloutBlock({
  content,
  variant = "info",
}: {
  content: string;
  variant?: "info" | "tip" | "warning" | "stat";
}) {
  const styles = {
    info: "border-sky-400 from-sky-500/10 to-sky-400/5",
    tip: "border-emerald-400 from-emerald-500/10 to-emerald-400/5",
    warning: "border-amber-400 from-amber-500/10 to-amber-400/5",
    stat: "border-fuchsia-400 from-fuchsia-500/10 to-fuchsia-400/5",
  };

  return (
    <div
      className={`my-8 rounded-r-xl border-l-4 bg-gradient-to-r p-6 ${styles[variant]}`}
    >
      <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
        {content}
      </p>
    </div>
  );
}

function TableBlock({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
}) {
  return (
    <figure className="my-10 overflow-x-auto">
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white/10">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 font-semibold text-white"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-white/[0.03]" : ""}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-3 ${
                      cell === "✓"
                        ? "font-medium text-emerald-400"
                        : cell === "×"
                          ? "text-red-400/60"
                          : cell.startsWith("△")
                            ? "text-amber-300"
                            : "text-slate-300"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm italic text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function CTABlock({
  title,
  body,
  buttonText,
  buttonUrl,
}: {
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
}) {
  return (
    <div className="my-14 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 text-center shadow-xl sm:p-10">
      <h3 className="text-xl font-semibold text-white sm:text-2xl">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-300 sm:text-base">
        {body}
      </p>
      <a
        href={buttonUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-full bg-fuchsia-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-500/25"
      >
        {buttonText}
      </a>
    </div>
  );
}

function FAQBlock({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="my-14">
      <div className="space-y-6">
        {items.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-white/10 bg-white/[0.03] transition-colors open:bg-white/[0.05]"
          >
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-white sm:text-base">
              {item.question}
              <span className="ml-4 shrink-0 text-slate-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="px-6 pb-5 text-sm leading-relaxed text-slate-300">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function ListBlock({
  style,
  items,
}: {
  style: "numbered" | "bullet" | "icon";
  items: { label: string; body: string }[];
}) {
  return (
    <div className="my-8 space-y-5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/15 text-sm font-bold text-fuchsia-300">
            {style === "numbered" ? i + 1 : style === "bullet" ? "•" : "→"}
          </div>
          <div className="pt-0.5">
            <p className="font-medium text-white">{item.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-relaxed">
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlogSectionRenderer({
  section,
}: {
  section: ArticleSection;
}) {
  switch (section.type) {
    case "text":
      return <TextBlock content={section.content} />;
    case "heading":
      return <HeadingBlock level={section.level} content={section.content} />;
    case "image":
      return (
        <ImageBlock
          src={section.src}
          alt={section.alt}
          caption={section.caption}
          width={section.width}
        />
      );
    case "comparison":
      return (
        <ComparisonBlock
          beforeLabel={section.beforeLabel}
          afterLabel={section.afterLabel}
          beforeImage={section.beforeImage}
          afterImage={section.afterImage}
          beforeAlt={section.beforeAlt}
          afterAlt={section.afterAlt}
          caption={section.caption}
        />
      );
    case "callout":
      return <CalloutBlock content={section.content} variant={section.variant} />;
    case "table":
      return (
        <TableBlock
          headers={section.headers}
          rows={section.rows}
          caption={section.caption}
        />
      );
    case "cta":
      return (
        <CTABlock
          title={section.title}
          body={section.body}
          buttonText={section.buttonText}
          buttonUrl={section.buttonUrl}
        />
      );
    case "faq":
      return <FAQBlock items={section.items} />;
    case "list":
      return <ListBlock style={section.style} items={section.items} />;
    default:
      return null;
  }
}
