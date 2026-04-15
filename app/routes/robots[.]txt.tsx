const body = `User-agent: *
Allow: /
Allow: /features
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

Sitemap: https://aganim-ai.com/sitemap.xml
`;

export function loader() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
