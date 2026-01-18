import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    // Shopify loads the app at the configured application_url (origin), so embedded loads land on `/`.
    // We run the reinstall "pathfinder" HERE (one-time entry), then send the merchant to:
    // - /app/dashboard (paid grace OR free with credits)
    // - /app/pricing?returning_paid=1 (expired paid)
    // - /app/pricing (free no credits)
    const backendApiUrl =
      process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
    try {
      const resp = await fetch(
        `${backendApiUrl}/api/admin/reinstall-path?shop=${encodeURIComponent(shop)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        const to = String(data?.redirect_to || "").trim() || "/app";
        const target = new URL(to, url.origin);
        for (const [k, v] of url.searchParams.entries()) {
          if (!target.searchParams.has(k)) target.searchParams.set(k, v);
        }
        throw redirect(`${target.pathname}${target.search}`);
      }
    } catch (e) {
      // ignore and fall back
    }

    url.pathname = "/app";
    throw redirect(`${url.pathname}${url.search}`);
  }

  return { showForm: true };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <img
          src="/Icon-final.png"
          alt="越境 AI / Cross-Border AI"
          style={{ width: 72, height: 72, marginBottom: 16 }}
        />
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
