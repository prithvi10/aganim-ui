import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type ProfileMarkdownProps = {
  content: string;
};

const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-16 mb-6 border-l-2 border-fuchsia-400 pl-4 text-2xl font-semibold text-white sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-10 mb-4 text-xl font-semibold text-white sm:text-2xl">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-8 mb-3 text-lg font-semibold text-white">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-relaxed">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 list-decimal space-y-2 pl-6 text-slate-300">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-sky-300 underline decoration-sky-300/40 underline-offset-4 transition hover:text-sky-200"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-white/20 pl-4 italic text-slate-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-200">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-fuchsia-200">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-4">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/5 text-white">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-3 align-top">{children}</td>,
  tr: ({ children }) => (
    <tr className="border-b border-white/5 last:border-0">{children}</tr>
  ),
  img: ({ src, alt, title }) => (
    <figure className="my-10">
      <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40">
        <img
          src={src}
          alt={alt || ""}
          className="h-auto w-full"
          loading="lazy"
        />
      </div>
      {(alt || title) && (
        <figcaption className="mt-3 text-center text-sm italic text-slate-400">
          {title || alt}
        </figcaption>
      )}
    </figure>
  ),
  hr: () => <hr className="my-10 border-white/10" />,
};

export function ProfileMarkdown({ content }: ProfileMarkdownProps) {
  return (
    <div className="profile-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
