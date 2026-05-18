import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Badge,
  DescriptionList,
  Button,
  TextField,
  Select,
  Box,
  Banner,
} from "@shopify/polaris";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";
import { useState, useCallback } from "react";

const STATUS_TONES: Record<string, "success" | "warning" | "critical" | "info" | "attention"> = {
  invited: "info",
  accepted: "attention",
  active: "success",
  completed: "success",
  churned: "critical",
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };
  const domain = params.shopDomain!;

  const [detail, metrics] = await Promise.all([
    safeFetchJson(`${base}/api/superadmin/beta/merchants/${domain}`, { headers }),
    safeFetchJson(`${base}/api/superadmin/beta/metrics/${domain}`, { headers }),
  ]);

  return { detail, metrics, domain };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const domain = params.shopDomain!;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update") {
    const body: Record<string, any> = {};
    const status = formData.get("status") as string;
    const feedback_score = formData.get("feedback_score") as string;
    const willingness_to_pay = formData.get("willingness_to_pay") as string;
    const testimonial_text = formData.get("testimonial_text") as string;
    const notes = formData.get("notes") as string;

    if (status) body.status = status;
    if (feedback_score) body.feedback_score = parseFloat(feedback_score);
    if (willingness_to_pay) body.willingness_to_pay = willingness_to_pay;
    if (testimonial_text) body.testimonial_text = testimonial_text;
    if (notes) body.notes = notes;

    const resp = await fetch(`${base}/api/superadmin/beta/merchants/${domain}/update`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    return resp.json();
  }

  if (intent === "remove") {
    const resp = await fetch(`${base}/api/superadmin/beta/merchants/${domain}/remove`, {
      method: "POST",
      headers,
      body: "{}",
    });
    return resp.json();
  }

  if (intent === "send_email") {
    const template = formData.get("template") as string || "checkin";
    const resp = await fetch(`${base}/api/superadmin/beta/email/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ template, status_filter: null }),
    });
    return resp.json();
  }

  return null;
};

export default function PortalBetaMerchantDetail() {
  const { detail, metrics, domain } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const enrollment = detail?.enrollment;
  const shop = detail?.shop;

  const [notes, setNotes] = useState(enrollment?.notes || "");
  const [feedbackScore, setFeedbackScore] = useState(enrollment?.feedback_score?.toString() || "");
  const [wtp, setWtp] = useState(enrollment?.willingness_to_pay || "");
  const [testimonial, setTestimonial] = useState(enrollment?.testimonial_text || "");
  const [status, setStatus] = useState(enrollment?.status || "");

  const handleSave = useCallback(() => {
    fetcher.submit(
      {
        intent: "update",
        status,
        feedback_score: feedbackScore,
        willingness_to_pay: wtp,
        testimonial_text: testimonial,
        notes,
      },
      { method: "post" },
    );
  }, [fetcher, status, feedbackScore, wtp, testimonial, notes]);

  const handleRemove = useCallback(() => {
    if (confirm(`Remove ${domain} from beta? This will downgrade to Free plan.`)) {
      fetcher.submit({ intent: "remove" }, { method: "post" });
    }
  }, [fetcher, domain]);

  if (!enrollment) {
    return (
      <Page title="Beta Merchant" backAction={{ content: "Back", onAction: () => navigate("/portal/beta/merchants") }}>
        <Banner tone="critical">Merchant not found in beta program.</Banner>
      </Page>
    );
  }

  const lifecycleItems = [
    { term: "Status", description: <Badge tone={STATUS_TONES[enrollment.status]}>{enrollment.status}</Badge> },
    { term: "Invited", description: enrollment.invited_at?.slice(0, 10) || "—" },
    { term: "Accepted", description: enrollment.accepted_at?.slice(0, 10) || "—" },
    { term: "Activated", description: enrollment.activated_at?.slice(0, 10) || "—" },
    { term: "Completed", description: enrollment.completed_at?.slice(0, 10) || "—" },
    { term: "Source", description: enrollment.source || "—" },
    { term: "Target Market", description: enrollment.target_market || "—" },
    { term: "Signup URL", description: enrollment.signup_url ? (
      <code style={{ fontSize: 11, wordBreak: "break-all" }}>{enrollment.signup_url}</code>
    ) : "—" },
    { term: "Store Name", description: enrollment.store_name || "—" },
    { term: "Contact Email", description: enrollment.contact_email || "—" },
    { term: "Purpose", description: enrollment.purpose || "—" },
  ];

  const shopItems = shop
    ? [
        { term: "Domain", description: shop.domain },
        { term: "Plan", description: shop.plan || "Free" },
        { term: "Beta Expires", description: shop.access_expires_at?.slice(0, 10) || "—" },
        { term: "Active", description: shop.is_active ? "Yes" : "No" },
        { term: "Installed", description: shop.created_at?.slice(0, 10) || "—" },
        { term: "Monthly Rewrites", description: String(shop.monthly_rewrites_used) },
        { term: "Monthly Missions", description: String(shop.monthly_missions_used) },
        { term: "Monthly Images", description: String(shop.monthly_image_generations_used) },
      ]
    : [];

  const chartData = (metrics?.daily_usage || []).map((d: any) => ({
    day: d.day?.slice(5),
    count: d.count,
  }));

  return (
    <Page
      title={domain.replace(".myshopify.com", "")}
      subtitle="Beta merchant detail"
      backAction={{ content: "Back", onAction: () => navigate("/portal/beta/merchants") }}
    >
      <BlockStack gap="600">
        {/* Lifecycle & Shop Info */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Beta Lifecycle</Text>
                <DescriptionList items={lifecycleItems} />
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Shop Info</Text>
                {shop ? (
                  <DescriptionList items={shopItems} />
                ) : (
                  <Text as="p" tone="subdued">Shop not found in database</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Metrics */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">Total Events</Text>
              <Text as="p" variant="headingLg">{metrics?.total_events ?? 0}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">Rewrites</Text>
              <Text as="p" variant="headingLg">{metrics?.rewrites ?? 0}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">Missions</Text>
              <Text as="p" variant="headingLg">{metrics?.missions ?? 0}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">Images</Text>
              <Text as="p" variant="headingLg">{metrics?.images ?? 0}</Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Card>
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" tone="subdued">
              Features: {(metrics?.features_used || []).join(", ") || "None"}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Last Active: {metrics?.last_active?.slice(0, 10) || "Never"}
            </Text>
          </BlockStack>
        </Card>

        {/* Daily Usage Chart */}
        {chartData.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Daily Activity (30 days)</Text>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#5C6AC4" fill="#5C6AC4" fillOpacity={0.15} name="Events" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </BlockStack>
          </Card>
        )}

        {/* Feedback & Notes Form */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Feedback & Notes</Text>
            <Layout>
              <Layout.Section variant="oneHalf">
                <BlockStack gap="300">
                  <Select
                    label="Status"
                    options={[
                      { label: "Invited", value: "invited" },
                      { label: "Accepted", value: "accepted" },
                      { label: "Active", value: "active" },
                      { label: "Completed", value: "completed" },
                      { label: "Churned", value: "churned" },
                    ]}
                    value={status}
                    onChange={setStatus}
                  />
                  <TextField
                    label="Feedback Score (1-5)"
                    type="number"
                    value={feedbackScore}
                    onChange={setFeedbackScore}
                    min={1}
                    max={5}
                    autoComplete="off"
                  />
                  <Select
                    label="Willingness to Pay"
                    options={[
                      { label: "—", value: "" },
                      { label: "Yes", value: "yes" },
                      { label: "Maybe", value: "maybe" },
                      { label: "No", value: "no" },
                    ]}
                    value={wtp}
                    onChange={setWtp}
                  />
                </BlockStack>
              </Layout.Section>
              <Layout.Section variant="oneHalf">
                <BlockStack gap="300">
                  <TextField
                    label="Testimonial"
                    value={testimonial}
                    onChange={setTestimonial}
                    multiline={3}
                    autoComplete="off"
                  />
                  <TextField
                    label="Admin Notes"
                    value={notes}
                    onChange={setNotes}
                    multiline={3}
                    autoComplete="off"
                  />
                </BlockStack>
              </Layout.Section>
            </Layout>
            <InlineStack gap="300">
              <Button variant="primary" onClick={handleSave} loading={fetcher.state !== "idle"}>
                Save Changes
              </Button>
              <Button tone="critical" onClick={handleRemove}>
                Remove from Beta
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
