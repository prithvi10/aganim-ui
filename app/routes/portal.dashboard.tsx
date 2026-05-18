import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Button,
  Badge,
  InlineGrid,
} from "@shopify/polaris";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";

const COLORS = ["#5C6AC4", "#47C1BF", "#F49342", "#DE3618", "#9C6ADE", "#50B83C", "#EEC200", "#007ACE"];
const PLAN_COLORS: Record<string, string> = { Basic: "#5C6AC4", Standard: "#47C1BF", Pro: "#F49342" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };

  const [overview, timeseries, tokenUsage, imageCredits, planStats, featureUsage, revenue] =
    await Promise.all([
      safeFetchJson(`${base}/api/superadmin/dashboard/overview`, { headers }),
      safeFetchJson(`${base}/api/superadmin/dashboard/usage-timeseries?period=30d`, { headers }),
      safeFetchJson(`${base}/api/superadmin/dashboard/token-usage`, { headers }),
      safeFetchJson(`${base}/api/superadmin/dashboard/image-credits`, { headers }),
      safeFetchJson(`${base}/api/superadmin/dashboard/plan-stats`, { headers }),
      safeFetchJson(`${base}/api/superadmin/dashboard/feature-usage`, { headers }),
      safeFetchJson(`${base}/api/superadmin/dashboard/revenue`, { headers }),
    ]);

  return { overview, timeseries, tokenUsage, imageCredits, planStats, featureUsage, revenue };
};

function KpiCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">{title}</Text>
        <Text as="p" variant="headingLg">{String(value)}</Text>
        {subtitle && <Text as="p" variant="bodySm" tone="subdued">{subtitle}</Text>}
      </BlockStack>
    </Card>
  );
}

export default function PortalDashboard() {
  const { overview, timeseries, tokenUsage, imageCredits, planStats, featureUsage, revenue } =
    useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  const usageChartData = Object.entries(timeseries.series || {}).map(
    ([day, items]: [string, any]) => {
      const point: Record<string, any> = { day: day.slice(5) };
      let totalCost = 0;
      for (const item of items) {
        totalCost += item.cost;
      }
      point.cost = Number(totalCost.toFixed(4));
      return point;
    },
  );

  const planPieData = Object.entries(planStats.enrollment || {}).map(
    ([name, count]: [string, any]) => ({
      name,
      value: count,
    }),
  );

  const featureBarData = (featureUsage || []).slice(0, 10).map((f: any) => ({
    name: f.feature?.length > 15 ? f.feature.slice(0, 15) + "..." : f.feature,
    usage: f.total_usage,
    shops: f.unique_shops,
  }));

  const tokenBarData = (tokenUsage || []).slice(0, 10).map((t: any) => ({
    name: t.shop_domain?.replace(".myshopify.com", "") || "unknown",
    tokens: t.total_tokens,
    cost: t.estimated_cost_usd,
  }));

  const revenueBarData = Object.entries(revenue?.by_plan || {}).map(
    ([plan, info]: [string, any]) => ({
      plan,
      revenue: info.revenue,
      merchants: info.count,
    }),
  );

  const paidPlanBreakdown = Object.entries(overview.plan_breakdown || {})
    .filter(([name]) => name !== "No Active Plan" && name !== "Free" && name !== null)
    .slice(0, 2);

  return (
    <Page
      title="Dashboard"
      subtitle="Admin overview of CrossBorderAgent"
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
            title="Total Merchants"
            value={overview.total_merchants}
          />
          <KpiCard
            title="Active (30d)"
            value={overview.active_merchants_30d}
          />
          <KpiCard
            title="Total Agentic Missions"
            value={overview.total_missions}
          />
          <KpiCard
            title="Monthly Revenue"
            value={`$${Number(revenue?.total_mrr || 0).toFixed(2)}`}
          />
        </InlineGrid>

        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <KpiCard
            title="Total Rewrites"
            value={overview.total_rewrites}
          />
          <KpiCard
            title="Image Generations"
            value={overview.total_image_generations}
          />
          <KpiCard
            title="OpenAI Cost (Total)"
            value={`$${Number(overview.total_estimated_cost_usd || 0).toFixed(2)}`}
          />
          {paidPlanBreakdown.length > 0 ? (
            paidPlanBreakdown.map(([plan, count]: [string, any]) => (
              <KpiCard key={plan} title={`Plan: ${plan}`} value={count} />
            ))
          ) : (
            <KpiCard title="Churned" value={planStats?.churned_count || 0} />
          )}
        </InlineGrid>

        {/* Revenue by Plan */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Revenue by Plan (MRR)</Text>
              <Badge tone="success">${Number(revenue?.total_mrr || 0).toFixed(2)}/mo</Badge>
            </InlineStack>
            {revenueBarData.length > 0 ? (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} />
                    <Tooltip formatter={(value: any, name: string) => name === "revenue" ? `$${value}` : value} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" radius={[4, 4, 0, 0]}>
                      {revenueBarData.map((entry, i) => (
                        <Cell key={i} fill={PLAN_COLORS[entry.plan] || COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar yAxisId="right" dataKey="merchants" fill={COLORS[5]} name="Merchants" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Box padding="400">
                <Text as="p" tone="subdued" alignment="center">No paid plan subscriptions</Text>
              </Box>
            )}
          </BlockStack>
        </Card>

        {/* OpenAI Usage Costs Over Time */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">OpenAI Usage Costs (30 days)</Text>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(4)}`} />
                  <Legend />
                  <Area type="monotone" dataKey="cost" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.15} name="Cost ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BlockStack>
        </Card>

        <Layout>
          {/* Plan Distribution */}
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Plan Distribution</Text>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {planPieData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Feature Usage */}
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Feature Usage</Text>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis dataKey="name" type="category" width={110} fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="usage" fill={COLORS[0]} name="Total Usage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* OpenAI Token Usage per Merchant */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">OpenAI Token Usage (Top Merchants)</Text>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} angle={-25} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tokens" fill={COLORS[4]} name="Total Tokens" />
                  <Bar yAxisId="right" dataKey="cost" fill={COLORS[2]} name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BlockStack>
        </Card>

        {/* Image Credits */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Image Credit Usage</Text>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Shop</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Plan</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>Monthly Used</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>Lifetime Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {(imageCredits || []).map((ic: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f4f6f8" }}>
                      <td style={{ padding: "8px 12px" }}>{ic.shop_domain}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge>{ic.plan || "No Active Plan"}</Badge>
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>{ic.monthly_used}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px" }}>{ic.lifetime_remaining}</td>
                    </tr>
                  ))}
                  {(!imageCredits || imageCredits.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ padding: "16px 12px", textAlign: "center", color: "#6d7175" }}>
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </BlockStack>
        </Card>

        {/* Recent Plan Changes */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Recent Plan Changes</Text>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Shop</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>From</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>To</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(planStats.recent_changes || []).slice(0, 15).map((ch: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f4f6f8" }}>
                      <td style={{ padding: "8px 12px" }}>{ch.shop_domain}</td>
                      <td style={{ padding: "8px 12px" }}>{ch.from_plan || "-"}</td>
                      <td style={{ padding: "8px 12px" }}>{ch.to_plan || "-"}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge tone={ch.change_type === "upgrade" ? "success" : "warning"}>
                          {ch.change_type || "change"}
                        </Badge>
                      </td>
                      <td style={{ padding: "8px 12px" }}>{ch.changed_at?.slice(0, 10) || "-"}</td>
                    </tr>
                  ))}
                  {(!planStats.recent_changes || planStats.recent_changes.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ padding: "16px 12px", textAlign: "center", color: "#6d7175" }}>
                        No recent changes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
