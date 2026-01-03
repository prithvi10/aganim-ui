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

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  // Use online tokens so embedded admin actions (like billing) have a valid session
  useOnlineTokens: true,
  future: {
    expiringOfflineAccessTokens: true
  },
  billing: {
    [MONTHLY_PLAN_BASIC]: {
      lineItems: [
        {
          amount: 9.90,
          currencyCode: 'USD',
          interval: BillingInterval.Every30Days,
        }
      ],
    },
    [MONTHLY_PLAN_STANDARD]: {
      lineItems: [
        {
          amount: 29.90,
          currencyCode: 'USD',
          interval: BillingInterval.Every30Days,
        }
      ],
    },
    [MONTHLY_PLAN_PRO]: {
      lineItems: [
        {
          amount: 69.90,
          currencyCode: 'USD',
          interval: BillingInterval.Every30Days,
        }
      ],
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

/**
 * Retrieve an offline session for a shop and return a GraphQL client bound to it.
 * Uses the unauthenticated.admin helper to get a Master Key session (offline token).
 */
export async function getOfflineAdminContext(shop: string) {
  if (!shop) return null;

  try {
    // Uses the stored offline token from DB automatically
    const { admin, session } = await shopify.unauthenticated.admin(shop);
    return { graphql: admin.graphql, session };
  } catch (err) {
    console.error(`❌ Master Key fetch failed for ${shop}:`, err);
    return null;
  }
}

/**
 * Lightweight helper to fetch the offline GraphQL client + session.
 */
export async function getOfflineGraphqlClient(shop: string) {
  const context = await getOfflineAdminContext(shop);
  return context ? { client: context.graphql, session: context.session } : null;
}
