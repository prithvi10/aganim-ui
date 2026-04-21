# Aganim AI — Frontend

The embedded Shopify app frontend for [Aganim AI](https://aganim-ai.com), an AI growth engine for cross-border e-commerce. Built with React Router 7, Shopify App Bridge v4, and Polaris v13.

## Architecture

```
app/
  routes/              # File-based routing (React Router 7)
    _index/            # Public landing page
    app.*.tsx           # Embedded Shopify admin pages
    portal.*.tsx        # Super-admin portal
    features.tsx        # Public features page
    support.tsx         # Public support/docs page
    privacy-policy.tsx  # Legal
    terms-of-service.tsx
    sitemap[.]xml.tsx   # Dynamic sitemap (server-rendered)
    robots[.]txt.tsx    # Dynamic robots.txt
  components/          # Shared React components
  locales/             # i18n (English & Japanese)
  utils/               # Helpers, entitlements, plan catalog
  styles/              # CSS modules
extensions/
  product-ai-action/   # Shopify Admin Action extension
public/                # Static assets (images, videos, llms.txt)
prisma/                # Session storage schema
```

## Features

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/app` | Usage stats, onboarding, quick actions |
| Brand Soul | `/app/brand-voice` | Brand identity engine (archetype, tone, power words) |
| AI Rewriter | `/app/rewriter` | Localized product title + description generation |
| Writing Studio | `/app/writing-studio` | Full product editing workspace |
| Image Refinement | `/app/writing-studio/image-refinement` | AI-enhanced product imagery |
| SEO | `/app/seo` | SEO title/meta editor with SERP preview & CTR analysis |
| Price Scout | `/app/pricing` | Competitor pricing analysis with AI recommendations |
| Marketing | `/app/marketing` | Social captions, ad copy, campaigns, email templates |
| Digital Marketing | `/app/marketing/digital` | Hero image + social post generation |
| Campaigns | `/app/marketing/campaigns` | Seasonal retail campaigns |
| Content Templates | `/app/content-templates` | Reusable content templates |
| Plans | `/app/plans` | Subscription management (Free / Basic / Standard / Pro) |
| Compliance | `/app/compliance` | GDPR data management |

## Tech Stack

- **Framework:** React Router 7 (SSR + file-based routing)
- **UI:** Shopify Polaris v13, Tailwind CSS, Framer Motion
- **3D:** React Three Fiber (landing page)
- **i18n:** i18next (English, Japanese)
- **Auth:** Shopify App Bridge v4 (embedded OAuth)
- **Session Storage:** Prisma + PostgreSQL
- **Error Tracking:** Sentry
- **Deployment:** Docker on Render

## Prerequisites

- Node.js >= 20.19
- Shopify CLI (`npm install -g @shopify/cli@latest`)
- PostgreSQL (local via Docker Compose or remote)
- Shopify Partner account + development store

## Local Development

```bash
# Install dependencies
npm install

# Start Postgres
docker compose up -d

# Run the app (starts Shopify CLI dev server)
npm run dev
```

Press **P** in the terminal to open the app URL and install on your dev store.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SHOPIFY_API_KEY` | Shopify app client ID |
| `SHOPIFY_API_SECRET` | Shopify app secret |
| `DATABASE_URL_UI` | PostgreSQL connection string for session storage |
| `BACKEND_API_URL` | Aganim API base URL |
| `TOKEN_SYNC_SECRET_UI` | Shared secret for server-to-server auth with API |
| `SENTRY_DSN` | Sentry DSN for error tracking (optional) |
| `ENVIRONMENT` | `production` or `development` |

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start
```

The Dockerfile builds the app, copies public assets into `build/client/`, and runs via `react-router-serve`.

## Webhooks

Configured in `shopify.app.toml`:

- `app/uninstalled` — cleanup on uninstall
- `app/scopes_update` — scope change handling
- `app_subscriptions/update` — billing sync
- GDPR compliance (`customers/data_request`, `customers/redact`, `shop/redact`)

Deploy webhooks to Shopify:

```bash
npx shopify app deploy
```

## SEO

Public pages (`/`, `/features`, `/support`, `/privacy-policy`, `/terms-of-service`) include:
- Open Graph + Twitter Card meta tags
- Canonical `<link>` tags pointing to `https://aganim-ai.com`
- Structured data (JSON-LD Organization schema)
- Dynamic `sitemap.xml` and `robots.txt` served via route handlers
- `llms.txt` / `llms-full.txt` for AI crawler context

## License

Proprietary. All rights reserved.
