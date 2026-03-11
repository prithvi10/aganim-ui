/**
 * Proxy route for /api/superadmin/* requests.
 *
 * Forwards to the backend, attaching the admin JWT from the cookie.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  getTokenFromCookies,
  getBackendBaseUrl,
} from "../utils/portal-auth.server";

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const backendBase = getBackendBaseUrl();
  const target = new URL(`${url.pathname}${url.search}`, backendBase);

  const headers = new Headers();
  const allow = new Set([
    "content-type",
    "accept",
    "accept-language",
    "user-agent",
  ]);
  for (const [k, v] of request.headers.entries()) {
    if (allow.has(k.toLowerCase())) headers.set(k, v);
  }

  // Attach admin JWT from cookie
  const token = getTokenFromCookies(request.headers.get("Cookie"));
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const resp = await fetch(target.toString(), init);

  const outHeaders = new Headers();
  const copy = new Set(["content-type", "cache-control"]);
  for (const [k, v] of resp.headers.entries()) {
    if (copy.has(k.toLowerCase())) outHeaders.set(k, v);
  }

  return new Response(resp.body, { status: resp.status, headers: outHeaders });
}

export const loader = async ({ request }: LoaderFunctionArgs) => forward(request);
export const action = async ({ request }: ActionFunctionArgs) => forward(request);
