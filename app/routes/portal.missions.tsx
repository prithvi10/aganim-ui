import { useState, useCallback } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useSearchParams, useRevalidator } from "react-router";
import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  Select,
  InlineStack,
  Box,
  Button,
  Banner,
  Pagination,
  BlockStack,
  Modal,
  TextField,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl } from "../utils/portal-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const shop = url.searchParams.get("shop") || "";
  const page = url.searchParams.get("page") || "1";

  const params = new URLSearchParams({ status, shop, page });

  const [missions, stuck] = await Promise.all([
    fetch(`${base}/api/superadmin/missions?${params}`, { headers }).then((r) => r.json()),
    fetch(`${base}/api/superadmin/missions/stuck`, { headers }).then((r) => r.json()),
  ]);

  return { ...missions, stuck, filters: { status, shop, page: Number(page) } };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const form = await request.formData();
  const missionId = form.get("mission_id");

  const resp = await fetch(`${base}/api/superadmin/missions/${missionId}/recover`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    return { error: err.detail || "Recovery failed" };
  }

  return await resp.json();
};

function statusTone(status: string): "success" | "critical" | "warning" | "info" | undefined {
  switch (status) {
    case "COMPLETED": return "success";
    case "ERROR": return "critical";
    case "IN_PROGRESS": return "warning";
    case "PENDING": return "info";
    default: return undefined;
  }
}

export default function PortalMissions() {
  const { missions, total, page, stuck, filters } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [shopFilter, setShopFilter] = useState(filters.shop);

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (statusFilter) p.set("status", statusFilter);
    if (shopFilter) p.set("shop", shopFilter);
    p.set("page", "1");
    setSearchParams(p);
  };

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "PENDING", value: "PENDING" },
    { label: "IN_PROGRESS", value: "IN_PROGRESS" },
    { label: "AWAITING_APPROVAL", value: "AWAITING_APPROVAL" },
    { label: "COMPLETED", value: "COMPLETED" },
    { label: "ERROR", value: "ERROR" },
  ];

  const recoverMission = (missionId: string) => {
    fetcher.submit({ mission_id: missionId }, { method: "post" });
  };

  return (
    <Page
      title="Missions"
      subtitle={`${total} total | ${stuck.count} stuck`}
      primaryAction={
        <Button onClick={() => revalidator.revalidate()} loading={revalidator.state === "loading"}>
          Refresh
        </Button>
      }
    >
      <BlockStack gap="400">
        {fetcher.data?.error && (
          <Banner tone="critical">{fetcher.data.error}</Banner>
        )}
        {fetcher.data?.message && (
          <Banner tone="success">{fetcher.data.message}</Banner>
        )}

        {stuck.count > 0 && (
          <Banner title={`${stuck.count} stuck mission(s)`} tone="warning">
            <BlockStack gap="200">
              {stuck.stuck_missions.map((m: any) => (
                <InlineStack key={m.id} gap="200" align="start" blockAlign="center">
                  <Text as="span" variant="bodySm">
                    {m.id.slice(0, 8)} — {m.shop_domain} — {m.status}
                  </Text>
                  <Button
                    size="micro"
                    onClick={() => recoverMission(m.id)}
                    loading={fetcher.state === "submitting"}
                  >
                    Recover
                  </Button>
                </InlineStack>
              ))}
            </BlockStack>
          </Banner>
        )}

        <Card>
          <InlineStack gap="300" align="start" blockAlign="end">
            <Box minWidth="150px">
              <Select
                label="Status"
                labelHidden
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </Box>
            <Box minWidth="200px">
              <TextField
                label="Shop"
                labelHidden
                placeholder="Filter by shop..."
                value={shopFilter}
                onChange={setShopFilter}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setShopFilter("")}
              />
            </Box>
            <Button onClick={applyFilters}>Filter</Button>
          </InlineStack>
        </Card>

        <Card padding="0">
          <IndexTable
            resourceName={{ singular: "mission", plural: "missions" }}
            itemCount={missions.length}
            headings={[
              { title: "ID" },
              { title: "Shop" },
              { title: "Resource" },
              { title: "Status" },
              { title: "Tier" },
              { title: "Error" },
              { title: "Created" },
              { title: "Actions" },
            ]}
            selectable={false}
          >
            {missions.map((m: any, i: number) => (
              <IndexTable.Row id={m.id} key={m.id} position={i}>
                <IndexTable.Cell>
                  <Text as="span" variant="bodySm">{m.id.slice(0, 8)}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" variant="bodySm">{m.shop_domain}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" variant="bodySm">{m.resource_id?.slice(0, 12) || "-"}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>{m.tier || "-"}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" variant="bodySm" tone="critical">
                    {m.error_message?.slice(0, 30) || "-"}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{m.created_at?.slice(0, 16) || "-"}</IndexTable.Cell>
                <IndexTable.Cell>
                  {(m.status === "IN_PROGRESS" || m.status === "ERROR") && (
                    <Button
                      size="micro"
                      onClick={() => recoverMission(m.id)}
                      loading={fetcher.state === "submitting"}
                    >
                      Recover
                    </Button>
                  )}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>

        {total > 25 && (
          <InlineStack align="center">
            <Pagination
              hasPrevious={page > 1}
              hasNext={missions.length === 25}
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
      </BlockStack>
    </Page>
  );
}
