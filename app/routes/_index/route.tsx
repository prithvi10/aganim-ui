import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import shopify, { login, getOfflineGraphqlClient } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    try {
      const offlineContext = await getOfflineGraphqlClient(shop);
      if (offlineContext?.client) {
        // Warm the offline client with locales + billing to mirror dashboard behavior
        await offlineContext.client.query({
          data: `
            query {
              shopLocales {
                locale
                name
                primary
                published
              }
            }
          `,
        });

        const billingApi = (shopify as any)?.billing;
        if (billingApi?.check) {
          await billingApi.check({ session: offlineContext.session });
        }
      } else {
        return { needsReauth: true };
      }
    } catch (err) {
      console.error("Landing loader offline admin prefetch failed", err);
      return { needsReauth: true };
    }

    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>A short heading about [your app]</h1>
        <p className={styles.text}>
          A tagline about [your app] that describes your value proposition.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
        </ul>
      </div>
    </div>
  );
}
