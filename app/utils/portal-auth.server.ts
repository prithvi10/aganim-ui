/**
 * Server-side auth utilities for the Admin Portal.
 *
 * Stores the admin JWT in an httpOnly cookie and provides
 * helpers to read / clear it.
 */

const COOKIE_NAME = "portal_token";

function getBackendBaseUrl(): string {
  return (
    process.env.BACKEND_API_URL?.trim() ||
    "https://shopify-translator-api.onrender.com"
  );
}

export { getBackendBaseUrl };

/** Extract the JWT from the cookie header string. */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? match.slice(COOKIE_NAME.length + 1) : null;
}

/** Build a Set-Cookie header to store the JWT. */
export function buildSetCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24}`;
}

/** Build a Set-Cookie header to clear the JWT. */
export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Parse a JWT payload without verification (expiry check only). */
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );
    return payload;
  } catch {
    return null;
  }
}

/**
 * Require a valid portal JWT. If missing or expired, redirects to /portal/login.
 * Returns the token string for passing to backend API calls.
 */
export function requirePortalAuth(request: Request): string {
  const cookie = request.headers.get("Cookie");
  const token = getTokenFromCookies(cookie);

  if (!token) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/portal/login" },
    });
  }

  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/portal/login" },
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/portal/login",
        "Set-Cookie": buildClearCookie(),
      },
    });
  }

  return token;
}
