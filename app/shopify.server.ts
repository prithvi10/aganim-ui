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
 * This lets us call Admin APIs without relying on the current online session.
 */
export async function getOfflineAdminContext(shop: string) {
  if (!shop) return null;

  try {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    const offlineSession = sessions?.find((s) => s.isOnline === false);
    if (!offlineSession) return null;

    // The GraphQL client can live under either shopify.clients or shopify.api.clients depending on SDK shape
    const GraphqlClient =
      (shopify as any)?.clients?.Graphql ||
      (shopify as any)?.api?.clients?.Graphql;

    if (!GraphqlClient) {
      console.error("Shopify Graphql client is unavailable on shopify.clients or shopify.api.clients");
      return null;
    }

    const graphql = new GraphqlClient({ session: offlineSession });
    return { session: offlineSession, graphql };
  } catch (err) {
    console.error("Failed to build offline admin context", err);
    return null;
  }
}

/**
 * Lightweight helper to fetch the offline GraphQL client + session.
 */
export async function getOfflineGraphqlClient(shop: string) {
  if (!shop) return null;

  try {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    const offlineSession = sessions?.find((s) => s.isOnline === false);
    if (!offlineSession) return null;

    const GraphqlClient = (shopify as any)?.clients?.Graphql;
    if (!GraphqlClient) {
      console.error("Shopify Graphql client is unavailable on shopify.clients");
      return null;
    }

    const client = new GraphqlClient({ session: offlineSession });
    return { client, session: offlineSession };
  } catch (err) {
    console.error("Failed to build offline GraphQL client", err);
    return null;
  }
}
