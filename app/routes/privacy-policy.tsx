import type { MetaFunction } from "react-router";

const SITE_URL = "https://aganim-ui.onrender.com";
const OG_IMAGE = `${SITE_URL}/Icon-final.png`;

export const meta: MetaFunction = () => {
  const title = "Privacy Policy | Aganim AI";
  const description =
    "Aganim AI privacy policy for Shopify merchants. Describes what data is accessed, processed, stored, and how deletion requests are handled.";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${SITE_URL}/privacy-policy` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:site_name", content: "Aganim AI" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
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
            Aganim AI Privacy Policy
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#4b5563" }}>
            Effective Date: March 28, 2026
          </p>
        </header>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Introduction</h2>
          <p style={{ margin: 0, color: "#111827" }}>
            Aganim AI ("we", "us", "the App") provides AI-driven product
            localization, copywriting, SEO optimization, competitive pricing intelligence,
            marketing content generation, image refinement, and brand identity analysis for
            Shopify merchants expanding into global markets. This Privacy Policy explains
            what data we access, what we store, how we use it, and how we delete it.
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
              <code>read_products</code>, <code>write_products</code> &mdash;
              Read product content; write localized titles, descriptions, SEO fields, and media
            </li>
            <li>
              <code>read_locales</code> &mdash; Detect your store's published locales/markets
            </li>
            <li>
              <code>read_translations</code>, <code>write_translations</code> &mdash;
              Read and write per-locale translations for products
            </li>
            <li>
              <code>read_files</code> &mdash; Read media files (product images) for AI refinement
            </li>
            <li>
              <code>read_content</code>, <code>write_content</code> &mdash;
              Create blog articles, collections, and content pages on your behalf
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            We use these scopes to read product content and shop locales, generate
            localized copy, create marketing content (blogs, collections), upload refined
            product images, and write updates/translations back to your Shopify store at
            your request.
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
                <li>App plan information and usage counters (e.g., monthly rewrites, missions, image credits)</li>
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
              <strong>Brand Soul data (stored)</strong>
              <ul>
                <li>
                  Brand context text, pillars, and strategic intelligence (archetype, tone
                  guardrails, power words, value propositions) generated by AI from
                  merchant-provided URLs, text, or uploaded files
                </li>
                <li>
                  Brand logo URL (if uploaded by the merchant)
                </li>
                <li>
                  RAG (Retrieval-Augmented Generation) vector embeddings of brand context
                  chunks, stored in our database for context retrieval during content generation
                </li>
              </ul>
            </li>
            <li>
              <strong>Mission data (stored)</strong>
              <ul>
                <li>
                  Mission pipeline state, agent outputs, and product context for active
                  and recent AI missions (multi-agent workflows)
                </li>
                <li>
                  User corrections and feedback submitted during mission execution,
                  stored with embeddings for future content improvement
                </li>
              </ul>
            </li>
            <li>
              <strong>Meta integration credentials (stored, Pro plan)</strong>
              <ul>
                <li>
                  Meta (Facebook/Instagram) Page access token and Page ID, if provided
                  by the merchant for autonomous ad publishing
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
                  Logs never contain access tokens, API keys, or customer personal data.
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
              descriptions, product type/category, tags, images, and localization settings
              are processed to generate rewritten/localized content. This content is
              typically fetched from Shopify, processed, and then written back into
              Shopify as product updates/translations.
            </li>
            <li>
              <strong>Product images (processed)</strong>: product images may be
              downloaded temporarily for AI background removal and refinement. Refined
              images are uploaded to Cloudflare R2 (temporary storage) and then published
              to your Shopify media library. Original images are never deleted or replaced.
            </li>
            <li>
              <strong>Competitor data (processed)</strong>: for SEO optimization and
              price scouting features, we fetch publicly available Google Search results
              and Google Shopping listings. This data is used in-session to inform content
              generation and pricing recommendations and is not persisted in our database.
            </li>
            <li>
              <strong>Marketing outputs (stored in Shopify, not our DB)</strong>:
              some generated marketing artifacts (social hooks, campaign captions) may be saved
              as Shopify metafields on your products to cache results and reduce repeated generation.
            </li>
            <li>
              <strong>Blog articles and collections (created in Shopify)</strong>:
              content templates (blog posts, hero sections, FAQs, collection descriptions)
              are published directly to your Shopify store. We do not retain copies in our database.
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
            webhooks (see Section 8). We use these requests only to fulfill
            compliance obligations and do not persist customer personal data from
            those requests in our database.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            6. Use of AI and third-party processors
          </h2>
          <p style={{ marginTop: 0 }}>
            We use third-party services to power the App's AI features:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>OpenAI (GPT-4o, GPT-4o-mini)</strong>: product copy generation,
              SEO metadata, marketing content, brand intelligence extraction, pricing
              recommendations, and content templates.
            </li>
            <li>
              <strong>fal.ai (Flux models)</strong>: AI image generation for product
              refinement, marketing ad banners, and hero images.
            </li>
            <li>
              <strong>SerpAPI</strong>: Google Search and Google Shopping data retrieval
              for SEO competitor analysis and pricing intelligence.
            </li>
            <li>
              <strong>Cloudflare R2</strong>: temporary storage of generated images
              before they are published to your Shopify media library.
            </li>
            <li>
              <strong>Amazon SES</strong>: transactional emails (welcome, plan upgrades,
              support communications).
            </li>
            <li>
              <strong>Meta Graph API</strong> (Pro plan, optional): if you connect your
              Meta account, we use the Meta Graph API to publish ad content to your
              Facebook/Instagram page on your behalf.
            </li>
          </ul>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            Data sent to AI processors is used solely to generate outputs you request.
            We do not use your store data to train our own models. Third-party AI
            providers process data under their own terms and data processing agreements.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            7. Image data handling
          </h2>
          <p style={{ marginTop: 0 }}>
            When you use Image Refinement or Visual Marketing features:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              Your product image is downloaded from Shopify and processed through our
              background-removal pipeline (rembg, running on our servers).
            </li>
            <li>
              The isolated product image is sent to fal.ai for AI-powered background
              regeneration or ad banner generation.
            </li>
            <li>
              Generated images are temporarily stored on Cloudflare R2 and then uploaded
              to your Shopify product media library or Shopify Files.
            </li>
            <li>
              Your original product images are never modified or deleted.
            </li>
            <li>
              Image processing uses your plan's monthly image credits. No images are
              stored beyond what is published to your Shopify store.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            8. GDPR / Shopify mandatory privacy webhooks
          </h2>
          <p style={{ marginTop: 0 }}>
            We support Shopify's mandatory data protection webhooks:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <code>customers/data_request</code> &mdash; We acknowledge the request. We do not
              store customer personal data, so there is no customer data to export.
            </li>
            <li>
              <code>customers/redact</code> &mdash; We acknowledge the request. We do not store
              customer-linked records, so no deletion is necessary.
            </li>
            <li>
              <code>shop/redact</code> &mdash; We delete all merchant-related records for the
              shop from our backend database, including authentication tokens, usage records,
              brand context, mission data, and billing linkage.
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            We verify webhook authenticity using the{" "}
            <code>X-Shopify-Hmac-Sha256</code> header (HMAC SHA-256 computed over
            the raw request body) before processing. All compliance webhook events
            are logged to a dedicated security audit log.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            9. Data retention and deletion
          </h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              Upon <code>shop/redact</code>, we delete merchant-related records for
              that shop from our backend systems after receiving the webhook (Shopify
              typically triggers this within 48 hours after uninstall).
            </li>
            <li>
              Brand Soul data (brand context, strategic intelligence, RAG embeddings)
              is deleted as part of the shop/redact process.
            </li>
            <li>
              Mission history and agent correction data is deleted as part of the
              shop/redact process.
            </li>
            <li>
              Temporarily stored images on Cloudflare R2 are not linked to merchant
              identity and expire automatically.
            </li>
            <li>
              Security/audit logs may be retained for a limited period for App Store
              review and security auditing.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            10. Sharing and disclosures
          </h2>
          <p style={{ marginTop: 0 }}>
            We share data only with:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Shopify</strong> (authentication, billing, APIs for reading/writing
              product content, translations, media, blogs, and collections)
            </li>
            <li>
              <strong>OpenAI</strong> (AI text generation for rewrites, SEO, marketing, and
              brand analysis)
            </li>
            <li>
              <strong>fal.ai</strong> (AI image generation and refinement)
            </li>
            <li>
              <strong>SerpAPI</strong> (Google Search/Shopping data for SEO and pricing features)
            </li>
            <li>
              <strong>Cloudflare</strong> (R2 object storage for temporary image hosting)
            </li>
            <li>
              <strong>Amazon Web Services</strong> (SES for transactional email delivery)
            </li>
            <li>
              <strong>Meta Platforms</strong> (only if you connect your Meta account for
              autonomous ad publishing)
            </li>
            <li>
              <strong>Infrastructure providers</strong> (Render for hosting, PostgreSQL
              for database)
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>We do not sell your data to third parties.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            Fair Use Policy
          </h2>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>1. Purpose and Scope</h3>
          <p style={{ marginTop: 0 }}>
            To ensure consistent performance and priority access for all merchants,
            Aganim AI employs a Fair Use Policy. Each plan includes specific resource
            allocations. Features labelled "Unlimited" (such as product rewrites on
            Standard and Pro plans) are intended for the normal business operations of
            a single Shopify store.
          </p>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>2. Plan Limits</h3>
          <p style={{ marginTop: 0 }}>
            Resource allocations vary by plan. The following limits are enforced by
            the App and reset on a 30-day rolling billing cycle unless otherwise noted:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Free</strong>: 10 product rewrites (lifetime, non-renewing),
              3 missions (lifetime), 5 image credits (lifetime). Access expires after
              a 7-day trial window.
            </li>
            <li>
              <strong>Basic ($29/month)</strong>: 50 product rewrites per month,
              1 mission per month. No image generation or SEO features.
            </li>
            <li>
              <strong>Standard ($79/month)</strong>: Unlimited product rewrites,
              3 missions per month. Full SEO and pricing intelligence. No image generation.
            </li>
            <li>
              <strong>Pro ($199/month)</strong>: Unlimited product rewrites,
              unlimited missions, 150 image credits per month. Full feature access
              including autonomous publishing, bulk upload (up to 10 products per batch),
              multi-locale generation, and Meta integration.
            </li>
          </ul>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>3. What "Unlimited" Means</h3>
          <p style={{ marginTop: 0 }}>
            "Unlimited" product rewrites and missions (on applicable plans) are subject
            to the condition that your usage reflects normal merchant activity and does
            not significantly exceed the patterns of other merchants on the same tier.
            Prohibited usage includes:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Automated Scripting</strong>: Using third-party scripts, bots, browser
              automation, or API scrapers to trigger mass-generation beyond what a merchant
              would do manually in the normal course of managing their store.
            </li>
            <li>
              <strong>Excessive AI Cost</strong>: Generating content at a rate or volume
              that causes the AI processing cost for your store to significantly exceed
              the value of your monthly subscription.
            </li>
            <li>
              <strong>Multi-Store Abuse</strong>: Using a single subscription to serve
              multiple Shopify stores, or reselling generated content to third parties.
            </li>
          </ul>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>4. Monitoring and Intervention</h3>
          <p style={{ marginTop: 0 }}>
            We track monthly AI processing cost per store purely for cost-stability and
            system integrity. This data is never shared with merchants or third parties.
            If your store's usage is flagged as extraordinary, we may take one or more
            of the following actions:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Model Adjustment</strong>: Temporarily route your AI requests to a
              faster, cost-efficient model (e.g., GPT-4o-mini instead of GPT-4o) for the
              remainder of the billing cycle. Output quality remains high; response times
              may improve.
            </li>
            <li>
              <strong>Account Review</strong>: Contact you via email to discuss your usage
              and, if appropriate, offer a custom Enterprise tier tailored to your volume.
            </li>
            <li>
              <strong>Suspension</strong>: In cases of clear automated abuse, we reserve
              the right to suspend generation access immediately to protect platform
              stability for all merchants. Access to existing Shopify data is never affected.
            </li>
          </ul>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>5. Image Credit Policy</h3>
          <p style={{ marginTop: 0 }}>
            Image credits (used for product refinement, ad generation, and hero banners)
            are a metered resource:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li>Free plan: 5 lifetime credits (non-renewing).</li>
            <li>Pro plan: 150 credits per month, resetting on your billing date.</li>
            <li>Basic and Standard plans do not include image credits.</li>
            <li>Each image operation (refinement, ad, or hero) consumes 1 credit.</li>
            <li>Unused credits do not carry over to the next billing cycle.</li>
          </ul>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>6. Billing Cycle and Resets</h3>
          <p style={{ marginTop: 0 }}>
            Paid plans operate on a 30-day rolling billing cycle starting from your
            subscription date. Monthly product rewrites, mission credits, and image
            credits reset automatically at the start of each new cycle. If you upgrade
            mid-cycle, limits are reset immediately. If you downgrade, the change takes
            effect at the end of your current billing cycle (grace period).
          </p>

          <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>7. Our Commitment</h3>
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            We will never block a merchant for selling too much or growing too fast.
            If you are a high-volume merchant experiencing genuine growth, we will
            work with you to ensure your service remains uninterrupted. Our goal is
            to help you scale globally, not to penalize success.
          </p>
        </section>

        <section style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>11. Contact</h2>
          <p style={{ margin: 0 }}>
            For privacy inquiries or deletion requests, contact:{" "}
            <strong>support@aganim.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}

