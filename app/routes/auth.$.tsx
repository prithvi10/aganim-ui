
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Ensure installs from the UI domain still route Shopify to the API callback so the API stores the token.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  try {
    console.log("[Auth Route] authenticate.admin start", { shop });
    await authenticate.admin(request);
    console.log("[Auth Route] authenticate.admin success", { shop });
    return null;
  } catch (err) {
    console.warn("[Auth Route] authenticate.admin failed, redirecting to API install", { shop, error: (err as Error)?.message });
    if (shop) {
      const apiInstallUrl = `https://shopify-translator-api.onrender.com/?shop=${encodeURIComponent(shop)}`;
      console.log("[Auth Route] redirect -> API installer", { apiInstallUrl, shop });
      throw redirect(apiInstallUrl);
    }
    throw err;
  }
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
