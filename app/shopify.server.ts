import "@shopify/shopify-app-react-router/adapters/node";
// ----------------------------------------------------------------------
// ✅ FIX: Add this patch to prevent "Do not know how to serialize a BigInt"
// This prevents the app from crashing silently (Blank Screen).
// ----------------------------------------------------------------------
declare global {
  interface BigInt {
    toJSON(): string;
  }
}
BigInt.prototype.toJSON = function () {
  return this.toString();
};
// ----------------------------------------------------------------------
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { BillingInterval } from "@shopify/shopify-app-react-router/server";
import { trail, trailError, trailWarn } from "./utils/trail";

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
const SCOPES_RAW = requireEnv("SCOPES");
requireEnv("DATABASE_URL_UI");

const SHOPIFY_APP_URL = (() => {
  try {
    const u = new URL(SHOPIFY_APP_URL_RAW);
    // IMPORTANT: appUrl must be the ORIGIN only (no path/query/hash) or embedded auth can loop/401.
    if (u.pathname !== "/" || u.search || u.hash) {
      throw new Error(
        `[Config] SHOPIFY_APP_URL must be an origin (e.g. https://shopify-translator-ui.onrender.com) but got: ${SHOPIFY_APP_URL_RAW}`
      );
    }
    return u.origin;
  } catch (e: any) {
    throw new Error(
      `[Config] Invalid SHOPIFY_APP_URL: ${SHOPIFY_APP_URL_RAW}. ${e?.message ?? ""}`.trim()
    );
  }
})();

// Helpful startup diagnostics (do NOT log secrets)
console.log(`[Init] SHOPIFY_APP_URL: ${SHOPIFY_APP_URL}`);
console.log(`[Init] SHOPIFY_API_KEY: ${SHOPIFY_API_KEY.slice(0, 6)}…`);
console.log(`[Init] SCOPES: ${SCOPES_RAW}`);
// 1. Force Log to check DB connection
console.log("[Init] Initializing Shopify App Server...");
console.log(`[Init] Prisma Client Status: ${prisma ? 'Connected' : 'Missing'}`);
const storage = new PrismaSessionStorage(prisma);


const shopify = shopifyApp({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.October24, // Use a standard, valid version
  scopes: SCOPES_RAW.split(",").map((s) => s.trim()).filter(Boolean),
  appUrl: SHOPIFY_APP_URL,
  authPathPrefix: "/auth",
  sessionStorage: storage, // Using the Prisma storage explicitly
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  // Prefer offline tokens for server-to-server + theme widget operations
  useOnlineTokens: false,
  future: {
    // FIX 1: Disable expiring offline tokens to prevent random 401s
    expiringOfflineAccessTokens: false, 
  },
  billing: {
    [MONTHLY_PLAN_BASIC]: {
      lineItems: [{ amount: 49.0, currencyCode: 'USD', interval: BillingInterval.Every30Days }],
    },
    [MONTHLY_PLAN_STANDARD]: {
      lineItems: [{ amount: 99.0, currencyCode: 'USD', interval: BillingInterval.Every30Days }],
    },
    [MONTHLY_PLAN_PRO]: {
      lineItems: [{ amount: 199.0, currencyCode: 'USD', interval: BillingInterval.Every30Days }],
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
    hooks: {
      afterAuth: async ({ session }) => {
        // 2. Add a hook to log EXACTLY when a session is saved
        console.log(`[Hook] afterAuth: Session created for shop: ${session.shop}`);
        console.log(`[Hook] Token Type: ${session.isOnline ? "Online" : "Offline"}`);
        // This confirms the "save" happened before the redirect
        await storage.storeSession(session); 

        // 3. Sync token to backend immediately so the Theme App Proxy / widget can work.
        // The widget calls the API directly via app proxy, so the API must have a stored token.
        try {
          const backendApiUrl =
            process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
          const tokenSyncSecret =
            process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET;

          if (!tokenSyncSecret) {
            console.warn("[Hook] TOKEN_SYNC_SECRET_UI (or TOKEN_SYNC_SECRET) not set; skipping backend token sync.");
            return;
          }

          if (!session?.accessToken) {
            console.warn("[Hook] No accessToken present on session; skipping backend token sync.");
            return;
          }

          const tokenType = session.isOnline ? "online" : "offline";
          await fetch(`${backendApiUrl}/api/admin/sync-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token-Sync-Secret": tokenSyncSecret,
            },
            body: JSON.stringify({
              shop: session.shop,
              access_token: session.accessToken,
              token_type: tokenType,
              force: true,
            }),
          });
          console.log(`[Hook] ✅ Synced ${tokenType} token to backend for shop=${session.shop}`);
        } catch (e) {
          console.error("[Hook] Backend token sync failed", e);
        }
      },
    },
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
  trail(`[🔍 Trail] getOfflineAdminContext called for shop: ${shop}`);

  if (!shop) {
    trail(`[🔍 Trail] ❌ Missing shop parameter. Returning null.`);
    return null;
  }

  try {
    // 1. Check DB for session
    trail(`[🔍 Trail] Searching Prisma for offline session...`);
    const sessions = await sessionStorage.findSessionsByShop(shop);
    trail(`[🔍 Trail] Found ${sessions.length} total sessions for ${shop}`);

    // Filter for offline
    const offlineSession = sessions?.find((s) => s.isOnline === false);
    
    if (!offlineSession) {
      trail(`[🔍 Trail] ❌ No OFFLINE session found in DB.`);
      return null;
    }

    if (!offlineSession.accessToken) {
      trail(`[🔍 Trail] ❌ Offline session exists but has NO Access Token.`);
      return null;
    }

    trail(
      `[🔍 Trail] ✅ Valid Offline Session found. Token starts with: ${offlineSession.accessToken.substring(0, 10)}...`,
    );

    // 2. Validate with Shopify Helper
    trail(`[🔍 Trail] Calling shopify.unauthenticated.admin()...`);
    const { admin, session } = await shopify.unauthenticated.admin(shop);
    
    trail(`[🔍 Trail] ✅ Unauthenticated Admin Context created successfully.`);
    return { session, graphql: admin.graphql };

  } catch (err: any) {
    trailError(`[🔍 Trail] 💥 CRITICAL ERROR in getOfflineAdminContext:`, err.message);
    if (err.response) {
      trailError(`[🔍 Trail] Response Status: ${err.response.status}`);
    }
    return null;
  }
}



export async function getOfflineGraphqlClient(shop: string) {
  trail(`[🔍 Trail] getOfflineGraphqlClient wrapper called.`);
  const context = await getOfflineAdminContext(shop);
  
  if (!context) {
    trail(`[🔍 Trail] ❌ Context is null. Returning null client.`);
    return null;
  }

  const graphqlFn = context.graphql;

  const client = {
    query: async ({ data }: { data: string }) => {
      try {
        trail(`[🔍 Trail] 📡 Sending GraphQL Request (Offline Client)...`);
        const resp = await graphqlFn(data);
        const body = await resp.json();
        trail(`[🔍 Trail] ✅ GraphQL Request Success.`);
        return { body };
      } catch (error: any) {
        trailError(`[🔍 Trail] ⚠️ GraphQL Request FAILED.`);
        if (error?.response?.code === 401 || error?.message?.includes("Unauthorized")) {
           trailWarn(`[🔍 Trail] 🛑 401 Unauthorized detected. Token is likely expired.`);
           return null;
        }
        throw error;
      }
    },
  };

  return { client, session: context.session };
}