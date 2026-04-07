/**
 * Support / features pages reference videos under `/support-gifs/...`.
 * Those files must live in `public/support-gifs/` so Vite copies them into
 * `build/client/` and react-router-serve can serve them before the app router.
 *
 * Optional: set VITE_SUPPORT_GIFS_BASE_URL (e.g. https://cdn.example.com)
 * to serve the same paths from a CDN (full URL = base + path).
 */
export function supportMediaUrl(path: string): string {
  if (!path) return "";
  const raw = import.meta.env.VITE_SUPPORT_GIFS_BASE_URL;
  const base = typeof raw === "string" ? raw.replace(/\/$/, "") : "";
  if (base && path.startsWith("/support-gifs")) {
    return `${base}${path}`;
  }
  return path;
}
