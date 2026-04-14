import type { MetaFunction } from "react-router";

const SITE_URL = "https://aganim-ai.com";
const OG_IMAGE = `${SITE_URL}/og-banner.png`;

export const meta: MetaFunction = () => {
  const title = "Terms of Service | Aganim AI";
  const description =
    "Aganim AI terms of service for Shopify merchants. Covers acceptable use, billing, data handling, and liability.";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${SITE_URL}/terms-of-service` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:site_name", content: "Aganim AI" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
  ];
};

export default function TermsOfService() {
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
            Aganim AI Terms of Service
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#4b5563" }}>
            Effective Date: April 14, 2026
          </p>
        </header>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Acceptance of Terms</h2>
          <p style={{ margin: 0 }}>
            By installing, accessing, or using the Aganim AI application ("the App")
            through the Shopify App Store, you ("Merchant", "you") agree to be bound by
            these Terms of Service ("Terms"). If you do not agree, you must uninstall the
            App immediately.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Description of Service</h2>
          <p style={{ margin: 0 }}>
            Aganim AI provides AI-powered product localization, copywriting, SEO
            optimization, competitive pricing intelligence, marketing content generation,
            image refinement, and brand identity analysis for Shopify merchants expanding
            into global markets. The App reads your product data and store locales, generates
            localized content using AI models, and writes translations and content back to
            your Shopify store at your direction.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>3. Account and Access</h2>
          <p style={{ margin: 0 }}>
            Access to the App requires a valid Shopify store and an active Shopify account.
            You are responsible for maintaining the security of your Shopify account
            credentials. You agree not to share your account or allow unauthorized third
            parties to access the App through your store.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            4. Plans, Billing, and Payments
          </h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              The App offers a free tier with limited usage and paid subscription plans
              (Basic, Standard, Pro) with varying feature access and usage limits.
            </li>
            <li>
              Paid subscriptions are billed through the Shopify Billing API. By subscribing
              to a paid plan, you authorize Shopify to charge the applicable fees to your
              Shopify account.
            </li>
            <li>
              Plan pricing, features, and limits are displayed on the pricing page within the
              App and may change with reasonable notice.
            </li>
            <li>
              You may upgrade, downgrade, or cancel your subscription at any time. Downgrades
              take effect at the end of the current billing cycle.
            </li>
            <li>
              Refunds are handled in accordance with Shopify&apos;s billing policies.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>5. Acceptable Use</h2>
          <p style={{ marginTop: 0 }}>You agree not to:</p>
          <ul style={{ marginTop: 0 }}>
            <li>
              Use the App to generate or distribute content that is illegal, harmful,
              defamatory, or infringes on third-party rights
            </li>
            <li>
              Attempt to reverse-engineer, decompile, or extract the AI models, prompts, or
              proprietary algorithms used by the App
            </li>
            <li>
              Circumvent usage limits, rate limits, or plan restrictions through automated
              scripts or other means
            </li>
            <li>
              Use the App in any way that could damage, disable, or impair the service or
              interfere with other merchants&apos; use
            </li>
            <li>
              Resell, sublicense, or redistribute the App or its output as a standalone
              service
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            6. AI-Generated Content
          </h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              Content generated by the App (translations, product descriptions, marketing
              copy, SEO recommendations, pricing insights, images) is produced by AI and is
              provided as a suggestion. You are responsible for reviewing and approving all
              generated content before it is published to your store.
            </li>
            <li>
              We do not guarantee the accuracy, completeness, cultural appropriateness, or
              legal compliance of AI-generated content. You should verify translations and
              claims for your target markets.
            </li>
            <li>
              You retain ownership of your original product data. AI-generated content
              created for your store is yours to use.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>7. Data Handling</h2>
          <p style={{ margin: 0 }}>
            Our collection, use, and handling of your data is governed by our{" "}
            <a href="/privacy-policy" style={{ color: "#2563eb" }}>
              Privacy Policy
            </a>
            . By using the App, you also agree to the terms of the Privacy Policy. We do
            not sell merchant data or end-customer data to third parties.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            8. Service Availability and Modifications
          </h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              We strive to maintain high availability but do not guarantee uninterrupted
              access. The App may be temporarily unavailable due to maintenance, updates, or
              circumstances beyond our control.
            </li>
            <li>
              We reserve the right to modify, update, or discontinue features of the App
              with reasonable notice. Material changes to paid plan features will be
              communicated before they take effect.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            9. Limitation of Liability
          </h2>
          <p style={{ margin: 0 }}>
            To the maximum extent permitted by applicable law, Aganim AI and its operators
            shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of the App, including but not limited to
            loss of revenue, lost profits, loss of data, or business interruption. Our total
            aggregate liability for any claim related to the App shall not exceed the fees
            you paid for the App in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            10. Disclaimer of Warranties
          </h2>
          <p style={{ margin: 0 }}>
            The App is provided on an "as is" and "as available" basis without warranties of
            any kind, either express or implied, including but not limited to implied
            warranties of merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the App will meet your specific
            requirements or that AI-generated content will be error-free.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>11. Termination</h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              You may terminate your use of the App at any time by uninstalling it from your
              Shopify store.
            </li>
            <li>
              We may suspend or terminate your access to the App if you violate these Terms
              or engage in activities that harm the service or other users.
            </li>
            <li>
              Upon uninstallation, we retain minimal merchant data as described in our
              Privacy Policy. Full data deletion occurs when Shopify sends the mandatory
              shop/redact webhook.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            12. Changes to These Terms
          </h2>
          <p style={{ margin: 0 }}>
            We may update these Terms from time to time. Material changes will be
            communicated through the App or via email. Continued use of the App after changes
            take effect constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>13. Governing Law</h2>
          <p style={{ margin: 0 }}>
            These Terms are governed by and construed in accordance with applicable law. Any
            disputes arising from these Terms or your use of the App shall be resolved
            through good-faith negotiation before pursuing formal legal remedies.
          </p>
        </section>

        <section style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>14. Contact</h2>
          <p style={{ margin: 0 }}>
            For questions about these Terms, contact:{" "}
            <strong>support@aganim.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
