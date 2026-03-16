import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import {
  Page,
  Card,
  Text,
  Badge,
  InlineStack,
  Box,
  BlockStack,
  Button,
  Select,
  InlineGrid,
} from "@shopify/polaris";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";

const COLORS = ["#5C6AC4", "#47C1BF", "#F49342", "#DE3618", "#9C6ADE", "#50B83C"];
const PLAN_COLORS: Record<string, string> = { Free: "#9C6ADE", Basic: "#5C6AC4", Standard: "#47C1BF", Pro: "#F49342" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const url = new URL(request.url);
  const days = url.searchParams.get("days") || "30";
  const headers = { Authorization: `Bearer ${token}` };

  const data = await safeFetchJson(
    `${base}/api/superadmin/dashboard/attrition?days=${days}`,
    { headers },
  );

  return { ...data, selectedDays: days };
};

function KpiCard({ title, value, tone }: { title: string; value: string | number; tone?: "critical" | "warning" | "subdued" }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">{title}</Text>
        <Text as="p" variant="headingLg" tone={tone}>{String(value)}</Text>
      </BlockStack>
    </Card>
  );
}

export default function PortalAttrition() {
  const { total_churned, total_lost_revenue, by_plan, merchants, period_days, selectedDays } =
    useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [days, setDays] = useState(selectedDays);

  const planBarData = Object.entries(by_plan || {}).map(([plan, info]: [string, any]) => ({
    plan,
    count: info.count,
    revenue: info.revenue,
  }));

  const typeCounts = (merchants || []).reduce(
    (acc: Record<string, number>, m: any) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typePieData = Object.entries(typeCounts).map(([type, count]) => ({
    name: type === "uninstalled" ? "Uninstalled" : "Cancelled Plan",
    value: count,
  }));

  const periodOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
    { label: "Last 180 days", value: "180" },
    { label: "Last 365 days", value: "365" },
  ];

  const handlePeriodChange = (val: string) => {
    setDays(val);
    const params = new URLSearchParams({ days: val });
    window.location.href = `/portal/attrition?${params}`;
  };

  return (
    <Page
      title="Attrition Analysis"
      subtitle={`Merchants who left in the last ${period_days} days`}
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
        <Card>
          <InlineStack gap="300" align="start" blockAlign="end">
            <Box minWidth="200px">
              <Select
                label="Period"
                labelHidden
                options={periodOptions}
                value={days}
                onChange={handlePeriodChange}
              />
            </Box>
          </InlineStack>
        </Card>

        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <KpiCard title="Merchants Lost" value={total_churned} tone="critical" />
          <KpiCard
            title="Revenue Lost (MRR)"
            value={`$${Number(total_lost_revenue || 0).toFixed(2)}`}
            tone="critical"
          />
          <KpiCard title="Uninstalled" value={typeCounts["uninstalled"] || 0} tone="warning" />
          <KpiCard title="Cancelled Plan" value={typeCounts["cancelled"] || 0} tone="warning" />
        </InlineGrid>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            {/* Churn by Plan */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Lost Revenue by Plan</Text>
                {planBarData.length > 0 ? (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={planBarData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="plan" fontSize={12} />
                        <YAxis yAxisId="left" fontSize={11} tickFormatter={(v) => `$${v}`} />
                        <YAxis yAxisId="right" orientation="right" fontSize={11} />
                        <Tooltip formatter={(value: any, name: string) => name === "revenue" ? `$${value}` : value} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Lost Revenue ($)" radius={[4, 4, 0, 0]}>
                          {planBarData.map((entry, i) => (
                            <Cell key={i} fill={PLAN_COLORS[entry.plan] || COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                        <Bar yAxisId="right" dataKey="count" fill={COLORS[3]} name="Merchants" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Box padding="400">
                    <Text as="p" tone="subdued" alignment="center">No churn data</Text>
                  </Box>
                )}
              </BlockStack>
            </Card>

            {/* Churn Type Breakdown */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Churn Type</Text>
                {typePieData.length > 0 ? (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={typePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {typePieData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? COLORS[3] : COLORS[2]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Box padding="400">
                    <Text as="p" tone="subdued" alignment="center">No churn data</Text>
                  </Box>
                )}
              </BlockStack>
            </Card>
        </InlineGrid>

        {/* Detailed Merchant List */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Churned Merchants</Text>
            {(merchants || []).length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e1e3e5" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Merchant</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Type</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Last Plan</th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>Lost Revenue</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(merchants || []).map((m: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f6f8" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                          {m.domain?.replace(".myshopify.com", "")}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <Badge tone={m.type === "uninstalled" ? "critical" : "warning"}>
                            {m.type === "uninstalled" ? "Uninstalled" : "Cancelled"}
                          </Badge>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <Badge>{m.last_plan}</Badge>
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: m.lost_revenue > 0 ? 600 : 400, color: m.lost_revenue > 0 ? "#DE3618" : undefined }}>
                          ${Number(m.lost_revenue || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "8px 12px" }}>{m.date || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Box padding="400">
                <Text as="p" tone="subdued" alignment="center">
                  No merchants have churned in the selected period.
                </Text>
              </Box>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
