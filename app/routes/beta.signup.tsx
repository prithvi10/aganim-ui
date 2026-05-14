import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
  Box,
} from "@shopify/polaris";
import { LandingHeader, LandingFooter } from "../components/LandingLayout";

const BACKEND_URL = process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { valid: false, error: "No invite token provided" };
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/beta/signup/${token}`);
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { valid: false, error: data.detail || "Invalid or expired invite link" };
    }
    const data = await resp.json();
    return { valid: true, token, ...data };
  } catch {
    return { valid: false, error: "Unable to validate invite. Please try again." };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const token = formData.get("token") as string;
  const body = {
    store_name: formData.get("store_name") as string,
    contact_email: formData.get("contact_email") as string,
    shop_domain: formData.get("shop_domain") as string,
    product_category: formData.get("product_category") as string,
    target_markets: formData.get("target_markets") as string,
    purpose: formData.get("purpose") as string,
  };

  try {
    const resp = await fetch(`${BACKEND_URL}/api/beta/signup/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: data.detail || "Signup failed" };
    }
    return { success: true, ...data };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
};

export default function BetaSignup() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [shopDomain, setShopDomain] = useState(loaderData?.shop_domain || "");
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState("");
  const [purpose, setPurpose] = useState("");

  const result = fetcher.data as any;
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (result?.success && result?.install_url) {
      const timer = setTimeout(() => {
        window.location.href = result.install_url;
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!loaderData?.valid) {
    return (
      <div>
        <LandingHeader />
        <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px" }}>
          <Card>
            <BlockStack gap="400">
              <Banner tone="critical">
                {loaderData?.error || "This invite link is invalid or has expired."}
              </Banner>
              <Text as="p" variant="bodyMd">
                If you believe this is an error, please contact us at support@aganim-ai.com.
              </Text>
            </BlockStack>
          </Card>
        </div>
        <LandingFooter />
      </div>
    );
  }

  if (result?.success) {
    return (
      <div>
        <LandingHeader />
        <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px" }}>
          <Card>
            <BlockStack gap="400">
              <Banner tone="success" title="Welcome to the Aganim Beta!">
                Your signup is complete. You'll be redirected to install the app in a few seconds.
              </Banner>
              <Text as="p" variant="bodyMd">
                After installing, you'll have full Pro access for 6 weeks — unlimited features, no charge.
              </Text>
              <Button variant="primary" url={result.install_url}>
                Install Aganim on Shopify
              </Button>
            </BlockStack>
          </Card>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div>
      <LandingHeader />
      <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 20px" }}>
        <BlockStack gap="600">
          <BlockStack gap="200">
            <Text as="h1" variant="headingXl">Join the Aganim AI Beta</Text>
            <Text as="p" variant="bodyLg" tone="subdued">
              Get full Pro access for 6 weeks — unlimited AI rewrites, SEO optimization,
              marketing copy, image generation, and more. Completely free.
            </Text>
          </BlockStack>

          {result?.error && (
            <Banner tone="critical">{result.error}</Banner>
          )}

          <Card>
            <fetcher.Form method="post">
              <input type="hidden" name="token" value={token} />
              <FormLayout>
                <TextField
                  label="Store name"
                  name="store_name"
                  value={storeName}
                  onChange={setStoreName}
                  placeholder="Your store or brand name"
                  autoComplete="organization"
                  requiredIndicator
                />
                <TextField
                  label="Email address"
                  name="contact_email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  requiredIndicator
                />
                <TextField
                  label="Shopify store domain"
                  name="shop_domain"
                  value={shopDomain}
                  onChange={setShopDomain}
                  placeholder="your-store.myshopify.com"
                  autoComplete="off"
                  helpText="Your .myshopify.com domain (e.g. my-store.myshopify.com)"
                />
                <Select
                  label="Product category"
                  name="product_category"
                  options={[
                    { label: "Select a category", value: "" },
                    { label: "Cosmetics & Beauty", value: "cosmetics" },
                    { label: "Crafts & Artisan", value: "crafts" },
                    { label: "Food & Beverage", value: "food" },
                    { label: "Fashion & Apparel", value: "fashion" },
                    { label: "Home & Living", value: "home" },
                    { label: "Electronics", value: "electronics" },
                    { label: "Other", value: "other" },
                  ]}
                  value={category}
                  onChange={setCategory}
                />
                <Select
                  label="Target markets"
                  name="target_markets"
                  options={[
                    { label: "Select target market", value: "" },
                    { label: "United States", value: "us" },
                    { label: "Europe", value: "eu" },
                    { label: "Southeast Asia", value: "sea" },
                    { label: "Korea", value: "kr" },
                    { label: "China / Taiwan", value: "cn" },
                    { label: "Global / Multiple", value: "global" },
                  ]}
                  value={markets}
                  onChange={setMarkets}
                />
                <TextField
                  label="What do you hope to achieve with Aganim?"
                  name="purpose"
                  value={purpose}
                  onChange={setPurpose}
                  multiline={3}
                  placeholder="e.g. Translate my product pages to English for US customers..."
                  autoComplete="off"
                />
                <Button
                  variant="primary"
                  submit
                  loading={isSubmitting}
                  disabled={!storeName || !email}
                  fullWidth
                >
                  Sign Up for Beta Access
                </Button>
              </FormLayout>
            </fetcher.Form>
          </Card>

          <Box padding="400">
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              By signing up you agree to our terms of service and privacy policy.
              Your Pro access lasts 6 weeks from installation.
            </Text>
          </Box>
        </BlockStack>
      </div>
      <LandingFooter />
    </div>
  );
}
