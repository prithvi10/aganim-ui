import type { LoaderFunctionArgs } from "react-router";
import {
  AGANIM_SITE_URL,
  isProfileSubdomainRequest,
  PROFILE_SUBDOMAIN_URL,
} from "../utils/profileHost";

const mainSiteBody = `User-agent: *
Allow: /
Allow: /features
Allow: /blog
Allow: /blog/
Allow: /support
Allow: /privacy-policy
Allow: /terms-of-service
Disallow: /app/
Disallow: /portal/
Disallow: /auth/
Disallow: /webhooks/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

Sitemap: ${AGANIM_SITE_URL}/sitemap.xml
`;

const profileSubdomainBody = `User-agent: *
Allow: /
Allow: /projects/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

Sitemap: ${PROFILE_SUBDOMAIN_URL}/sitemap.xml
`;

export function loader({ request }: LoaderFunctionArgs) {
  const body = isProfileSubdomainRequest(request)
    ? profileSubdomainBody
    : mainSiteBody;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
