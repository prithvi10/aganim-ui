import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  TextField,
  Select,
  InlineStack,
  Box,
  Pagination,
  BlockStack,
  Button,
  Tabs,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const plan = url.searchParams.get("plan") || "";
  const page = url.searchParams.get("page") || "1";
  const headers = { Authorization: `Bearer ${token}` };

  const params = new URLSearchParams({ search, plan, page });

  const [merchantsResp, limitsResp] = await Promise.all([
    safeFetchJson(`${base}/api/superadmin/merchants?${params}`, { headers }),
    safeFetchJson(`${base}/api/superadmin/dashboard/approaching-limits?threshold=80`, { headers }),
  ]);

  return { ...merchantsResp, approachingLimits: limitsResp, filters: { search, plan, page: Number(page) } };
};

export default function PortalMerchants() {
  const { merchants, total, page, total_pages, filters, approachingLimits } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState(filters.search);
  const [planFilter, setPlanFilter] = useState(filters.plan);
  const [selectedTab, setSelectedTab] = useState(0);

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (searchVal) p.set("search", searchVal);
    if (planFilter) p.set("plan", planFilter);
    p.set("page", "1");
    setSearchParams(p);
  };

  const planOptions = [
    { label: "All Plans", value: "" },
    { label: "Free", value: "Free" },
    { label: "Basic", value: "Basic" },
    { label: "Standard", value: "Standard" },
    { label: "Pro", value: "Pro" },
  ];

  const resourceName = { singular: "merchant", plural: "merchants" };
  const limitsCount = approachingLimits?.merchants?.length || 0;

  const tabs = [
    { id: "all", content: "All Merchants" },
    { id: "limits", content: `Approaching Limits (${limitsCount})` },
  ];

  const rowMarkup = merchants.map((m: any, index: number) => (
    <IndexTable.Row
      id={String(m.id)}
      key={m.id}
      position={index}
      onClick={() => navigate(`/portal/merchants/${encodeURIComponent(m.domain)}`)}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">{m.domain}</Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={m.is_active ? "success" : "critical"}>
          {m.is_active ? "Active" : "Inactive"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={
          m.subscription_status === "CANCELLED" ? "warning" :
          m.current_plan_name ? "info" : undefined
        }>{m.plan_display || "-"}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{m.monthly_rewrites_used}</IndexTable.Cell>
      <IndexTable.Cell>{m.monthly_missions_used}</IndexTable.Cell>
      <IndexTable.Cell>{m.monthly_image_generations_used}</IndexTable.Cell>
      <IndexTable.Cell>${Number(m.monthly_cost_accumulated || 0).toFixed(2)}</IndexTable.Cell>
      <IndexTable.Cell>{m.created_at?.slice(0, 10) || "-"}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Merchants" subtitle={`${total} total merchants`}>
      <BlockStack gap="400">
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />

        {selectedTab === 0 && (
          <>
            <Card>
              <InlineStack gap="300" align="start" blockAlign="end">
                <Box minWidth="240px">
                  <TextField
                    label="Search"
                    labelHidden
                    placeholder="Search by domain..."
                    value={searchVal}
                    onChange={setSearchVal}
                    autoComplete="off"
                    onClearButtonClick={() => setSearchVal("")}
                    clearButton
                  />
                </Box>
                <Box minWidth="150px">
                  <Select
                    label="Plan"
                    labelHidden
                    options={planOptions}
                    value={planFilter}
                    onChange={setPlanFilter}
                  />
                </Box>
                <Button onClick={applyFilters}>Filter</Button>
              </InlineStack>
            </Card>

            <Card padding="0">
              <IndexTable
                resourceName={resourceName}
                itemCount={merchants.length}
                headings={[
                  { title: "Domain" },
                  { title: "Status" },
                  { title: "Plan" },
                  { title: "Rewrites" },
                  { title: "Missions" },
                  { title: "Image Gens" },
                  { title: "Cost" },
                  { title: "Joined" },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            </Card>

            {total_pages > 1 && (
              <InlineStack align="center">
                <Pagination
                  hasPrevious={page > 1}
                  hasNext={page < total_pages}
                  onPrevious={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set("page", String(page - 1));
                    setSearchParams(p);
                  }}
                  onNext={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set("page", String(page + 1));
                    setSearchParams(p);
                  }}
                />
              </InlineStack>
            )}
          </>
        )}

        {selectedTab === 1 && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Merchants at ≥ 80% of Plan Limits
                </Text>
                <Badge tone="warning">{limitsCount} merchant{limitsCount !== 1 ? "s" : ""}</Badge>
              </InlineStack>
              {limitsCount > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e1e3e5" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Merchant</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Plan</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Resource</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", minWidth: 180 }}>Usage</th>
                        <th style={{ textAlign: "right", padding: "8px 12px" }}>Remaining</th>
                        <th style={{ textAlign: "left", padding: "8px 12px" }}>Resets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(approachingLimits?.merchants || []).map((m: any) =>
                        m.breaches.map((b: any, bi: number) => (
                          <tr
                            key={`${m.domain}-${b.resource}`}
                            style={{
                              borderBottom: "1px solid #f4f6f8",
                              backgroundColor: b.pct >= 100 ? "rgba(222,54,24,0.06)" : b.pct >= 90 ? "rgba(244,147,66,0.06)" : undefined,
                            }}
                          >
                            {bi === 0 ? (
                              <>
                                <td style={{ padding: "8px 12px", fontWeight: 600 }} rowSpan={m.breaches.length}>
                                  {m.domain?.replace(".myshopify.com", "")}
                                </td>
                                <td style={{ padding: "8px 12px" }} rowSpan={m.breaches.length}>
                                  <Badge>{m.plan}</Badge>
                                </td>
                              </>
                            ) : null}
                            <td style={{ padding: "8px 12px" }}>
                              <InlineStack gap="200" blockAlign="center">
                                <span>{b.resource}</span>
                                {b.pct >= 100 && <Badge tone="critical">Exhausted</Badge>}
                                {b.pct >= 90 && b.pct < 100 && <Badge tone="warning">Critical</Badge>}
                              </InlineStack>
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 4,
                                  background: "#e4e5e7",
                                  overflow: "hidden",
                                }}>
                                  <div style={{
                                    width: `${Math.min(b.pct, 100)}%`,
                                    height: "100%",
                                    borderRadius: 4,
                                    background: b.pct >= 100 ? "#DE3618" : b.pct >= 90 ? "#F49342" : "#EEC200",
                                    transition: "width 0.3s ease",
                                  }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36, textAlign: "right" }}>
                                  {b.pct}%
                                </span>
                              </div>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {b.used} / {b.limit} ({b.limit_type})
                              </Text>
                            </td>
                            <td style={{ textAlign: "right", padding: "8px 12px", fontWeight: b.remaining === 0 ? 700 : 400, color: b.remaining === 0 ? "#DE3618" : undefined }}>
                              {b.remaining}
                            </td>
                            {bi === 0 ? (
                              <td style={{ padding: "8px 12px" }} rowSpan={m.breaches.length}>
                                {b.limit_type === "lifetime" ? "Never" : m.next_reset?.slice(0, 10) || "-"}
                              </td>
                            ) : null}
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Box padding="400">
                  <Text as="p" tone="subdued" alignment="center">
                    No merchants are currently at or above 80% of their plan limits.
                  </Text>
                </Box>
              )}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
