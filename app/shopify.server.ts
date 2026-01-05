import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { BillingInterval } from "@shopify/shopify-app-react-router/server";

export const MONTHLY_PLAN_BASIC = 'Basic';
export const MONTHLY_PLAN_STANDARD = 'Standard';
export const MONTHLY_PLAN_PRO = 'Pro';

// ... (Your Env validation code remains the same) ...
function requireEnv(name: string): string {
  const val = process.env[name]?.trim();
  if (!val) throw new Error(`[Config] Missing required env var: ${name}`);
  return val;
}
const SHOPIFY_API_KEY = requireEnv("SHOPIFY_API_KEY");
const SHOPIFY_API_SECRET = requireEnv("SHOPIFY_API_SECRET");
const SHOPIFY_APP_URL_RAW = requireEnv("SHOPIFY_APP_URL");
requireEnv("DATABASE_URL_UI");

const SHOPIFY_APP_URL = (() => {
  try { return new URL(SHOPIFY_APP_URL_RAW).origin; } 
  catch { throw new Error(`[Config] Invalid SHOPIFY_APP_URL: ${SHOPIFY_APP_URL_RAW}`); }
})();

const shopify = shopifyApp({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.October24, // Use a standard, valid version
  scopes: process.env.SCOPES?.split(","),
  appUrl: SHOPIFY_APP_URL,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  useOnlineTokens: true,
  future: {
    // FIX 1: Disable expiring offline tokens to prevent random 401s
    expiringOfflineAccessTokens: false, 
  },
  billing: {
    [MONTHLY_PLAN_BASIC]: {
      lineItems: [{ amount: 9.90, currencyCode: 'USD', interval: BillingInterval.Every30Days }],
    },
    [MONTHLY_PLAN_STANDARD]: {
      lineItems: [{ amount: 29.90, currencyCode: 'USD', interval: BillingInterval.Every30Days }],
    },
    [MONTHLY_PLAN_PRO]: {
      lineItems: [{ amount: 69.90, currencyCode: 'USD', interval: BillingInterval.Every30Days }],
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

/**
 * Retrieve an offline session for a shop.
 */
export async function getOfflineAdminContext(shop: string) {
  if (!shop) return null;

  try {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    // FIX 2: Sort by date to get the most recent offline session if multiple exist
    const offlineSession = sessions
      ?.filter((s) => s.isOnline === false)
      .sort((a, b) => (b.expires?.getTime() ?? 0) - (a.expires?.getTime() ?? 0))[0];

    if (!offlineSession || !offlineSession.accessToken) {
      console.log(`[Auth] No offline session found in DB for ${shop}`);
      return null;
    }

    const { admin, session } = await shopify.unauthenticated.admin(shop);
    return { session, graphql: admin.graphql };
  } catch (err) {
    console.error("Master Key fetch failed (handled):", err);
    return null;
  }
}

/**
 * Helper to fetch offline client AND handle 401s gracefully.
 */
export async function getOfflineGraphqlClient(shop: string) {
  const context = await getOfflineAdminContext(shop);
  if (!context) return null;

  const graphqlFn = context.graphql;

  // FIX 3: Safe Wrapper that swallows 401s
  const client = {
    query: async ({ data }: { data: string }) => {
      try {
        const resp = await graphqlFn(data);
        const body = await resp.json();
        return { body };
      } catch (error: any) {
        // If the token is invalid (401), we return NULL so the Loader knows to re-auth
        if (error?.response?.code === 401 || error?.message?.includes("Unauthorized")) {
          console.warn(`[GraphQL] 401 Unauthorized for ${shop}. Token is dead.`);
          return null; // The loader will see this null body and trigger re-auth
        }
        throw error; // Throw other errors (syntax, server, etc.)
      }
    },
  };

  return { client, session: context.session };
}