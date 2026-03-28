import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

function getBackendBaseUrl(): string {
  return (
    process.env.BACKEND_API_URL?.trim() ||
    "https://aganim-api.onrender.com"
  );
}

function filterForwardHeaders(headers: Headers): Headers {
  const out = new Headers();
  // Forward only safe, relevant headers. The backend will validate Shopify proxy signature
  // from the query params, so we mainly need content headers.
  const allow = new Set([
    "content-type",
    "accept",
    "accept-language",
    "authorization",
    "user-agent",
    "x-shopify-shop-domain",
  ]);
  for (const [k, v] of headers.entries()) {
    if (allow.has(k.toLowerCase())) out.set(k, v);
  }
  return out;
}

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const backendBase = getBackendBaseUrl();

  // Forward the exact path + query string to the backend API host.
  const target = new URL(`${url.pathname}${url.search}`, backendBase);

  const init: RequestInit = {
    method: request.method,
    headers: filterForwardHeaders(request.headers),
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const resp = await fetch(target.toString(), init);

  // Copy response headers conservatively
  const outHeaders = new Headers();
  const copy = new Set(["content-type", "cache-control"]);
  for (const [k, v] of resp.headers.entries()) {
    if (copy.has(k.toLowerCase())) outHeaders.set(k, v);
  }

  return new Response(resp.body, { status: resp.status, headers: outHeaders });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return forward(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return forward(request);
};


