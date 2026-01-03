import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs } from "react-router";
import { Form, redirect, useActionData, useLoaderData } from "react-router";

type AuthErrors = { shop?: string };
type LoaderData = { errors: AuthErrors };
type ActionData = { errors?: AuthErrors };

// Initiate OAuth from the UI, but have Shopify call back to the API so it can store the token.
export const loader = async (): Promise<LoaderData> => {
  return { errors: {} };
};

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionData> => {
  const formData = await request.formData();
  const shop = formData.get("shop")?.toString().trim();

  if (!shop) {
    return { errors: { shop: "Shop domain is required" } };
  }

  const apiInstallUrl = `https://shopify-translator-api.onrender.com/?shop=${encodeURIComponent(shop)}`;
  console.log("[Auth Login] Redirecting to API installer", { shop, apiInstallUrl });
  throw redirect(apiInstallUrl);
};

export default function Auth() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const [shop, setShop] = useState("");
  const errors = actionData?.errors ?? loaderData.errors;

  return (
    <AppProvider embedded={false}>
      <s-page>
        <Form method="post">
        <s-section heading="Log in">
          <s-text-field
            name="shop"
            label="Shop domain"
            details="example.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.currentTarget.value)}
            autocomplete="on"
            error={errors.shop}
          ></s-text-field>
          <s-button type="submit">Log in</s-button>
        </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}
