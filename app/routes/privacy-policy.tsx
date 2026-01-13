import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | Cross-Border AI" },
    {
      name: "description",
      content:
        "Cross-Border AI privacy policy for Shopify merchants. Describes what data is accessed, processed, stored, and how deletion requests are handled.",
    },
  ];
};

export default function PrivacyPolicy() {
  return (
    <main
      style={{
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#111827",
        background: "#ffffff",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.2, margin: 0 }}>
            Cross-Border AI Privacy Policy
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#4b5563" }}>
            Effective Date: January 13, 2026
          </p>
        </header>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Introduction</h2>
          <p style={{ margin: 0, color: "#111827" }}>
            Cross-Border AI (“we”, “us”, “the App”) provides AI-driven product
            localization, rewriting, and marketing assistance for Shopify
            merchants. This Privacy Policy explains what data we access, what we
            store, how we use it, and how we delete it.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            2. Shopify permissions (API scopes)
          </h2>
          <p style={{ marginTop: 0 }}>
            When you install the App, we request the following Shopify API
            scopes:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <code>read_products</code>, <code>write_products</code>
            </li>
            <li>
              <code>read_locales</code>
            </li>
            <li>
              <code>read_translations</code>, <code>write_translations</code>
            </li>
            <li>
              <code>read_files</code>
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            We use these scopes to read product content and shop locales, generate
            localized copy, and write updates/translations back to your Shopify
            store at your request.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            3. Data we collect and store
          </h2>
          <p style={{ marginTop: 0 }}>
            We store only data needed to operate the App, authenticate requests,
            enforce usage limits, and support billing.
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Merchant / Shop data (stored)</strong>
              <ul>
                <li>Shop domain (e.g., your-store.myshopify.com)</li>
                <li>App plan information and usage counters (token usage)</li>
                <li>
                  Shopify Admin access token for your shop (used to write
                  translations/content back to Shopify)
                </li>
                <li>
                  Merchant email (optional, if provided during onboarding/billing)
                </li>
              </ul>
            </li>
            <li>
              <strong>App session data (stored)</strong>
              <ul>
                <li>
                  Shopify session records used to keep the embedded admin app
                  authenticated (access token, scopes, expiry)
                </li>
                <li>
                  Shopify may include optional user profile fields for merchant/staff
                  accounts (e.g., email, first/last name); if present, these may be
                  stored as part of session storage.
                </li>
              </ul>
            </li>
            <li>
              <strong>Logs (stored)</strong>
              <ul>
                <li>
                  Operational logs for troubleshooting and security auditing,
                  including GDPR webhook audit logs (topic, shop domain, webhook id).
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            4. Data we process but do not store in our database
          </h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Product data (processed)</strong>: product titles,
              descriptions, product type/category, tags, and localization settings
              are processed to generate rewritten/localized content. This content is
              typically fetched from Shopify, processed, and then written back into
              Shopify as product updates/translations.
            </li>
            <li>
              <strong>Marketing outputs (stored in Shopify, not our DB)</strong>:
              some generated marketing artifacts may be saved as Shopify metafields
              on your products to cache results and reduce repeated generation.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            5. Customer personal data
          </h2>
          <p style={{ marginTop: 0 }}>
            We do not build the App to store customer personal information (such
            as customer names, addresses, or payment details) in our databases.
          </p>
          <p style={{ marginBottom: 0 }}>
            Shopify may send customer-related information in mandatory compliance
            webhooks (see Section 7). We use these requests only to fulfill
            compliance obligations and do not persist customer personal data from
            those requests in our database.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            6. Use of AI / third-party processors
          </h2>
          <p style={{ marginTop: 0 }}>
            We use third-party AI services (for example, OpenAI) to generate
            localized product copy and marketing text.
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              Data sent to AI processors is used to generate outputs you request
              (e.g., rewrites, hooks).
            </li>
            <li>We do not use your store data to train our own models.</li>
            <li>
              Third-party AI providers process data under their own terms and
              policies.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            7. GDPR / Shopify mandatory privacy webhooks
          </h2>
          <p style={{ marginTop: 0 }}>
            We support Shopify’s mandatory data protection webhooks:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <code>customers/data_request</code>
            </li>
            <li>
              <code>customers/redact</code>
            </li>
            <li>
              <code>shop/redact</code>
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            We verify webhook authenticity using the{" "}
            <code>X-Shopify-Hmac-Sha256</code> header (HMAC SHA-256 computed over
            the raw request body) before processing. On <code>shop/redact</code>,
            we delete merchant-related records for the shop from our backend
            database (including authentication tokens and usage/billing linkage)
            upon receipt.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            8. Data retention and deletion
          </h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              Upon <code>shop/redact</code>, we delete merchant-related records for
              that shop from our backend systems after receiving the webhook (Shopify
              typically triggers this within 48 hours after uninstall).
            </li>
            <li>
              Security/audit logs may be retained for a limited period for App Store
              review and security auditing.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            9. Sharing and disclosures
          </h2>
          <p style={{ marginTop: 0 }}>
            We share data only with:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Shopify</strong> (authentication, billing, APIs for reading/writing
              product content and translations)
            </li>
            <li>
              <strong>AI providers</strong> (to generate content you request)
            </li>
            <li>
              <strong>Infrastructure providers</strong> (hosting/logging required to run
              the service)
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>We do not sell your data to third parties.</p>
        </section>

        <section style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>10. Contact</h2>
          <p style={{ margin: 0 }}>
            For privacy inquiries or deletion requests, contact:{" "}
            <strong>[Your Support Email Here]</strong>
          </p>
        </section>
      </div>
    </main>
  );
}

