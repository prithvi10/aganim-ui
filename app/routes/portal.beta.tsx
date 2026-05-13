import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Badge,
  Box,
  Button,
} from "@shopify/polaris";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";

const COLORS = ["#5C6AC4", "#47C1BF", "#F49342", "#DE3618", "#9C6ADE", "#50B83C"];
const STATUS_TONES: Record<string, "success" | "warning" | "critical" | "info" | "attention"> = {
  invited: "info",
  accepted: "attention",
  active: "success",
  completed: "success",
  churned: "critical",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };

  const [dashboard, funnel, feedback] = await Promise.all([
    safeFetchJson(`${base}/api/superadmin/beta/dashboard`, { headers }),
    safeFetchJson(`${base}/api/superadmin/beta/funnel`, { headers }),
    safeFetchJson(`${base}/api/superadmin/beta/feedback`, { headers }),
  ]);

  return { dashboard, funnel, feedback };
};

function KpiCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">{title}</Text>
        <Text as="p" variant="headingLg">{String(value ?? "—")}</Text>
        {subtitle && <Text as="p" variant="bodySm" tone="subdued">{subtitle}</Text>}
      </BlockStack>
    </Card>
  );
}

export default function PortalBetaDashboard() {
  const { dashboard, funnel, feedback } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  const funnelData = Object.entries(funnel?.funnel || {}).map(
    ([status, count]: [string, any]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count || 0,
    }),
  );

  const wtpData = Object.entries(feedback?.willingness_to_pay || {}).map(
    ([answer, count]: [string, any]) => ({
      answer: answer.charAt(0).toUpperCase() + answer.slice(1),
      count,
    }),
  );

  return (
    <Page
      title="Beta Test"
      subtitle="Manage your closed beta program"
      primaryAction={
        <Button
          onClick={() => revalidator.revalidate()}
          loading={revalidator.state === "loading"}
        >
          Refresh
        </Button>
      }
    >
      <BlockStack gap="600">
        {/* KPI Cards */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <KpiCard
            title="Total Enrolled"
            value={dashboard?.total_enrolled ?? 0}
          />
          <KpiCard
            title="Active"
            value={dashboard?.active ?? 0}
          />
          <KpiCard
            title="Avg Feedback Score"
            value={dashboard?.avg_feedback_score ? dashboard.avg_feedback_score.toFixed(1) + "/5" : "—"}
          />
          <KpiCard
            title="Willingness to Pay"
            value={dashboard?.willingness_to_pay_pct ? dashboard.willingness_to_pay_pct + "%" : "—"}
          />
        </InlineGrid>

        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          <KpiCard title="Completed" value={dashboard?.completed ?? 0} />
          <KpiCard title="Churned" value={dashboard?.churned ?? 0} />
          <KpiCard
            title="Churn Rate"
            value={dashboard?.churn_rate_pct ? dashboard.churn_rate_pct + "%" : "0%"}
          />
        </InlineGrid>

        {/* Funnel Chart */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Beta Funnel</Text>
            {funnelData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" fontSize={12} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Merchants" radius={[4, 4, 0, 0]}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Box padding="400">
                <Text as="p" tone="subdued" alignment="center">No beta enrollments yet</Text>
              </Box>
            )}
          </BlockStack>
        </Card>

        <Layout>
          {/* Willingness to Pay */}
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Willingness to Pay</Text>
                {wtpData.length > 0 ? (
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <BarChart data={wtpData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="answer" fontSize={12} />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Responses" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Box padding="400">
                    <Text as="p" tone="subdued" alignment="center">No feedback data yet</Text>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Testimonials */}
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">Testimonials</Text>
                  <Badge tone="success">{feedback?.testimonials?.length || 0} collected</Badge>
                </InlineStack>
                {feedback?.testimonials?.length > 0 ? (
                  <BlockStack gap="300">
                    {feedback.testimonials.slice(0, 5).map((t: any, i: number) => (
                      <Box key={i} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">{t.shop_domain}</Text>
                          <Text as="p" variant="bodyMd">"{t.text}"</Text>
                        </BlockStack>
                      </Box>
                    ))}
                  </BlockStack>
                ) : (
                  <Box padding="400">
                    <Text as="p" tone="subdued" alignment="center">No testimonials yet</Text>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Feedback Score */}
        {feedback?.avg_score && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Feedback Summary</Text>
              <InlineGrid columns={3} gap="400">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Average Score</Text>
                  <Text as="p" variant="headingMd">{feedback.avg_score}/5</Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Responses</Text>
                  <Text as="p" variant="headingMd">{feedback.total_responses}</Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Score 4-5 (Happy)</Text>
                  <Text as="p" variant="headingMd">{feedback.score_distribution?.["4-5"] || 0}</Text>
                </BlockStack>
              </InlineGrid>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
