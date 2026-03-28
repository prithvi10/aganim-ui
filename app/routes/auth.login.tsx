import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { AppProvider, Page, Card, Text, BlockStack, TextField, Button, Banner } from "@shopify/polaris";
import { login } from "../shopify.server";
import { loginErrorMessage } from "./login";
import { trail } from "../utils/trail";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  trail("[🔍 Trail] 🔑 Login Page Loader Hit");
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  trail("[🔍 Trail] 🚀 Login Form Submitted");
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <div style={{display: 'flex', justifyContent: 'center', marginTop: '50px'}}>
      <div style={{width: '400px'}}>
        <AppProvider i18n={{}}>
          <Page>
            <Card>
              <BlockStack gap="400">
                <Text as="h1" variant="headingMd">Log in to Aganim AI</Text>
                {errors.shop && <Banner tone="critical"><p>{errors.shop}</p></Banner>}
                <Form method="post">
                  <BlockStack gap="400">
                    <TextField
                      label="Shop domain"
                      type="text"
                      name="shop"
                      value={shop}
                      onChange={setShop}
                      autoComplete="on"
                      helpText="e.g: my-store.myshopify.com"
                    />
                    <Button submit variant="primary">Log in</Button>
                  </BlockStack>
                </Form>
              </BlockStack>
            </Card>
          </Page>
        </AppProvider>
      </div>
    </div>
  );
}