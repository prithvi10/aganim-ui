# Support demo media

Place demo videos and images here so they are available at `/support-gifs/<filename>` in dev and production.

- **Build**: Vite copies everything in `public/` into the client build output; `react-router-serve` serves those files as static assets before React Router runs.
- **If you see** `No route matches URL "/support-gifs/..."` **in production**: the file is missing from this folder at build time (or use `VITE_SUPPORT_GIFS_BASE_URL` to point to a CDN — see `app/utils/supportMedia.ts`).

### Expected filenames (see `app/routes/support.tsx` `CARD_META`)

- `brand-soul.mp4`, `rewriter-workspace.mp4`, `writing-studio.png`, `content-templates.mp4`, `image-refinement.mp4`, `seo-editor-ctr.mp4`, etc.
- `dashboard-overview.mp4` — add this file and set `demoPath` on the dashboard card in `support.tsx` if you disabled it because the asset was missing.

Large binaries are often stored with **Git LFS** or on a CDN instead of committing to git.
