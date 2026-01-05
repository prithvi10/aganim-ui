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
// 1. Force Log to check DB connection
console.log("[Init] Initializing Shopify App Server...");
console.log(`[Init] Prisma Client Status: ${prisma ? 'Connected' : 'Missing'}`);
const storage = new PrismaSessionStorage(prisma);

const shopify = shopifyApp({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.October24, // Use a standard, valid version
  scopes: process.env.SCOPES?.split(","),
  appUrl: SHOPIFY_APP_URL,
  authPathPrefix: "/auth",
  sessionStorage: storage, // Using the Prisma storage explicitly
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
    hooks: {
      afterAuth: async ({ session }) => {
        // 2. Add a hook to log EXACTLY when a session is saved
        console.log(`[Hook] afterAuth: Session created for shop: ${session.shop}`);
        console.log(`[Hook] Token Type: ${session.isOnline ? "Online" : "Offline"}`);
        // This confirms the "save" happened before the redirect
        await storage.storeSession(session); 
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
  console.log(`[🔍 Trail] getOfflineAdminContext called for shop: ${shop}`);

  if (!shop) {
    console.log(`[🔍 Trail] ❌ Missing shop parameter. Returning null.`);
    return null;
  }

  try {
    // 1. Check DB for session
    console.log(`[🔍 Trail] Searching Prisma for offline session...`);
    const sessions = await sessionStorage.findSessionsByShop(shop);
    console.log(`[🔍 Trail] Found ${sessions.length} total sessions for ${shop}`);

    // Filter for offline
    const offlineSession = sessions?.find((s) => s.isOnline === false);
    
    if (!offlineSession) {
      console.log(`[🔍 Trail] ❌ No OFFLINE session found in DB.`);
      return null;
    }

    if (!offlineSession.accessToken) {
      console.log(`[🔍 Trail] ❌ Offline session exists but has NO Access Token.`);
      return null;
    }

    console.log(`[🔍 Trail] ✅ Valid Offline Session found. Token starts with: ${offlineSession.accessToken.substring(0, 10)}...`);

    // 2. Validate with Shopify Helper
    console.log(`[🔍 Trail] Calling shopify.unauthenticated.admin()...`);
    const { admin, session } = await shopify.unauthenticated.admin(shop);
    
    console.log(`[🔍 Trail] ✅ Unauthenticated Admin Context created successfully.`);
    return { session, graphql: admin.graphql };

  } catch (err: any) {
    console.error(`[🔍 Trail] 💥 CRITICAL ERROR in getOfflineAdminContext:`, err.message);
    if (err.response) {
      console.error(`[🔍 Trail] Response Status: ${err.response.status}`);
    }
    return null;
  }
}



export async function getOfflineGraphqlClient(shop: string) {
  console.log(`[🔍 Trail] getOfflineGraphqlClient wrapper called.`);
  const context = await getOfflineAdminContext(shop);
  
  if (!context) {
    console.log(`[🔍 Trail] ❌ Context is null. Returning null client.`);
    return null;
  }

  const graphqlFn = context.graphql;

  const client = {
    query: async ({ data }: { data: string }) => {
      try {
        console.log(`[🔍 Trail] 📡 Sending GraphQL Request (Offline Client)...`);
        const resp = await graphqlFn(data);
        const body = await resp.json();
        console.log(`[🔍 Trail] ✅ GraphQL Request Success.`);
        return { body };
      } catch (error: any) {
        console.error(`[🔍 Trail] ⚠️ GraphQL Request FAILED.`);
        if (error?.response?.code === 401 || error?.message?.includes("Unauthorized")) {
           console.warn(`[🔍 Trail] 🛑 401 Unauthorized detected. Token is likely expired.`);
           return null;
        }
        throw error;
      }
    },
  };

  return { client, session: context.session };
}