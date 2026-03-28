import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';

function getBackendBaseUrl(): string {
  return (
    process.env.BACKEND_API_URL?.trim() || 'https://aganim-api.onrender.com'
  );
}

function filterForwardHeaders(headers: Headers): Headers {
  const out = new Headers();
  const allow = new Set([
    'content-type',
    'accept',
    'accept-language',
    'authorization',
    'user-agent',
    'x-shopify-shop-domain',
  ]);
  for (const [k, v] of headers.entries()) {
    if (allow.has(k.toLowerCase())) out.set(k, v);
  }
  return out;
}

async function forwardToAgent(request: Request): Promise<Response> {
  const backendBase = getBackendBaseUrl();
  const target = new URL('/apps/cross-border/agent', backendBase);

  const init: RequestInit = {
    method: request.method,
    headers: filterForwardHeaders(request.headers),
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const targetUrl = target.toString();
  let resp: Response;
  try {
    resp = await fetch(targetUrl, init);
  } catch (e: any) {
    // Common during local dev when the remote backend restarts or a corporate proxy closes sockets.
    const msg =
      e?.cause?.code ||
      e?.code ||
      e?.message ||
      'Upstream fetch failed';
    return new Response(
      JSON.stringify({
        detail: `Agent proxy error: ${msg}`,
        upstream: targetUrl,
      }),
      {status: 502, headers: {'Content-Type': 'application/json'}},
    );
  }

  const outHeaders = new Headers();
  const copy = new Set(['content-type', 'cache-control']);
  for (const [k, v] of resp.headers.entries()) {
    if (copy.has(k.toLowerCase())) outHeaders.set(k, v);
  }

  return new Response(resp.body, {status: resp.status, headers: outHeaders});
}

export const loader = async ({request}: LoaderFunctionArgs) => {
  return forwardToAgent(request);
};

export const action = async ({request}: ActionFunctionArgs) => {
  return forwardToAgent(request);
};


