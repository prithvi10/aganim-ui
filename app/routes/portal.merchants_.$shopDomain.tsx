import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  DescriptionList,
  DataTable,
  Box,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const shopDomain = params.shopDomain!;

  const data = await safeFetchJson(
    `${base}/api/superadmin/merchants/${encodeURIComponent(shopDomain)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (data?._error) {
    throw new Response("Merchant not found", { status: data._status ?? 404 });
  }

  return data;
};

export default function MerchantDetail() {
  const { shop, user, feature_usage, recent_events, missions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const shopItems = [
    { term: "Domain", description: shop.domain },
    { term: "Current Plan", description: shop.current_plan_name || "None (no active plan)" },
    { term: "Plan Status", description: shop.plan_display || "-" },
    { term: "Previous Plan", description: shop.last_plan_name || "-" },
    { term: "Pending Plan", description: shop.pending_plan_name || "-" },
    { term: "Last Change", description: shop.last_plan_change_type || "-" },
    { term: "Subscription Status", description: shop.last_shopify_subscription_status || "-" },
    { term: "Active", description: shop.is_active ? "Yes" : "No" },
    { term: "Onboarding", description: shop.is_onboarding_finished ? "Finished" : `Step ${shop.onboarding_step}` },
    { term: "Monthly Rewrites", description: String(shop.monthly_rewrites_used) },
    { term: "Lifetime Rewrites Left", description: String(shop.lifetime_rewrites_remaining) },
    { term: "Monthly Missions", description: String(shop.monthly_missions_used) },
    { term: "Lifetime Missions Left", description: String(shop.lifetime_missions_remaining) },
    { term: "Monthly Image Gens", description: String(shop.monthly_image_generations_used) },
    { term: "Lifetime Image Credits Left", description: String(shop.lifetime_image_credits_remaining) },
    { term: "Monthly Cost", description: `$${Number(shop.monthly_cost_accumulated || 0).toFixed(2)}` },
    { term: "Brand Context", description: shop.brand_context_status || "-" },
    { term: "UI Language", description: shop.ui_language },
    { term: "Target Locale", description: shop.default_target_locale },
    { term: "Created", description: shop.created_at?.slice(0, 19) || "-" },
    { term: "Updated", description: shop.updated_at?.slice(0, 19) || "-" },
    { term: "Reset Date", description: shop.next_reset_date?.slice(0, 10) || "-" },
  ];

  const featureRows = (feature_usage || []).map((f: any) => [
    f.feature,
    f.billing_cycle_start,
    f.usage_count,
  ]);

  const eventRows = (recent_events || []).slice(0, 20).map((e: any) => [
    e.event_type,
    e.feature,
    e.total_tokens,
    `$${Number(e.estimated_cost_usd || 0).toFixed(4)}`,
    e.model_used || "-",
    e.created_at?.slice(0, 16) || "-",
  ]);

  const missionRows = (missions || []).map((m: any) => [
    m.id?.slice(0, 8) || "-",
    m.resource_id || "-",
    m.status,
    m.tier || "-",
    m.error_message?.slice(0, 40) || "-",
    m.created_at?.slice(0, 16) || "-",
  ]);

  return (
    <Page
      title={shop.domain}
      backAction={{ content: "Merchants", onAction: () => navigate("/portal/merchants") }}
      titleMetadata={
        <InlineStack gap="200">
          <Badge tone={shop.is_active ? "success" : "critical"}>
            {shop.is_active ? "Active" : "Inactive"}
          </Badge>
          <Badge tone={
            shop.last_shopify_subscription_status === "CANCELLED" ? "warning" :
            shop.current_plan_name ? "info" : undefined
          }>{shop.plan_display || "-"}</Badge>
        </InlineStack>
      }
    >
      <BlockStack gap="600">
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Shop Details</Text>
                <DescriptionList items={shopItems} />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">User</Text>
                {user ? (
                  <DescriptionList
                    items={[
                      { term: "Username", description: user.username },
                      { term: "Email", description: user.email || "-" },
                      { term: "Created", description: user.created_at?.slice(0, 19) || "-" },
                    ]}
                  />
                ) : (
                  <Text as="p" tone="subdued">No linked user record</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Feature Usage</Text>
            {featureRows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "numeric"]}
                headings={["Feature", "Billing Cycle", "Count"]}
                rows={featureRows}
              />
            ) : (
              <Text as="p" tone="subdued">No feature usage data</Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Recent Events</Text>
            {eventRows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text", "text", "text"]}
                headings={["Type", "Feature", "Tokens", "Cost", "Model", "Date"]}
                rows={eventRows}
              />
            ) : (
              <Text as="p" tone="subdued">No recent events</Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Missions</Text>
            {missionRows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                headings={["ID", "Resource", "Status", "Tier", "Error", "Created"]}
                rows={missionRows}
              />
            ) : (
              <Text as="p" tone="subdued">No missions</Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
