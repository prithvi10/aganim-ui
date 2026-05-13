import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  IndexTable,
  Badge,
  TextField,
  Select,
  Button,
  Modal,
  FormLayout,
  Box,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";
import { useState, useCallback } from "react";

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
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const page = url.searchParams.get("page") || "1";

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  qs.set("page", page);
  qs.set("page_size", "25");

  const data = await safeFetchJson(`${base}/api/superadmin/beta/merchants?${qs}`, { headers });
  return { ...data, currentStatus: status, currentPage: parseInt(page) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "enroll") {
    const domain = formData.get("domain") as string;
    const plan = formData.get("plan") as string || "Standard";
    const source = formData.get("source") as string || "";
    const resp = await fetch(`${base}/api/superadmin/beta/merchants/${domain}/enroll`, {
      method: "POST",
      headers,
      body: JSON.stringify({ upgrade_plan: plan, source }),
    });
    return resp.json();
  }

  return null;
};

export default function PortalBetaMerchants() {
  const { merchants, total, currentStatus, currentPage } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollDomain, setEnrollDomain] = useState("");
  const [enrollPlan, setEnrollPlan] = useState("Standard");
  const [enrollSource, setEnrollSource] = useState("");
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const handleFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    navigate(`/portal/beta/merchants?${params}`);
  }, [navigate]);

  const handleEnroll = useCallback(() => {
    fetcher.submit(
      { intent: "enroll", domain: enrollDomain, plan: enrollPlan, source: enrollSource },
      { method: "post" },
    );
    setEnrollModalOpen(false);
    setEnrollDomain("");
  }, [fetcher, enrollDomain, enrollPlan, enrollSource]);

  const resourceName = { singular: "merchant", plural: "merchants" };

  const rowMarkup = (merchants || []).map((m: any, index: number) => (
    <IndexTable.Row
      id={m.shop_domain}
      key={m.shop_domain}
      position={index}
      onClick={() => navigate(`/portal/beta/merchants/${m.shop_domain}`)}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {m.shop_domain?.replace(".myshopify.com", "")}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={STATUS_TONES[m.status] || "info"}>{m.status}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{m.plan || "—"}</IndexTable.Cell>
      <IndexTable.Cell>{m.enrolled_at?.slice(0, 10) || "—"}</IndexTable.Cell>
      <IndexTable.Cell>{m.last_active?.slice(0, 10) || "Never"}</IndexTable.Cell>
      <IndexTable.Cell>{m.rewrites}</IndexTable.Cell>
      <IndexTable.Cell>{m.features_used}</IndexTable.Cell>
      <IndexTable.Cell>{m.feedback_score ? `${m.feedback_score}/5` : "—"}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Beta Merchants"
      subtitle={`${total || 0} enrolled merchants`}
      primaryAction={
        <Button variant="primary" onClick={() => setEnrollModalOpen(true)}>
          Enroll Merchant
        </Button>
      }
    >
      <BlockStack gap="400">
        <Card>
          <InlineStack gap="400" align="start">
            <Select
              label="Filter by status"
              labelInline
              options={[
                { label: "All", value: "" },
                { label: "Invited", value: "invited" },
                { label: "Accepted", value: "accepted" },
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" },
                { label: "Churned", value: "churned" },
              ]}
              value={statusFilter}
              onChange={handleFilterChange}
            />
          </InlineStack>
        </Card>

        <Card padding="0">
          <IndexTable
            resourceName={resourceName}
            itemCount={merchants?.length || 0}
            headings={[
              { title: "Store" },
              { title: "Status" },
              { title: "Plan" },
              { title: "Enrolled" },
              { title: "Last Active" },
              { title: "Rewrites" },
              { title: "Features" },
              { title: "Feedback" },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>
        </Card>

        {total > 25 && (
          <InlineStack align="center" gap="400">
            <Button
              disabled={currentPage <= 1}
              onClick={() => navigate(`/portal/beta/merchants?page=${currentPage - 1}&status=${statusFilter}`)}
            >
              Previous
            </Button>
            <Text as="span" variant="bodySm">Page {currentPage} of {Math.ceil(total / 25)}</Text>
            <Button
              disabled={currentPage >= Math.ceil(total / 25)}
              onClick={() => navigate(`/portal/beta/merchants?page=${currentPage + 1}&status=${statusFilter}`)}
            >
              Next
            </Button>
          </InlineStack>
        )}
      </BlockStack>

      <Modal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Enroll Merchant in Beta"
        primaryAction={{ content: "Enroll", onAction: handleEnroll, disabled: !enrollDomain }}
        secondaryActions={[{ content: "Cancel", onAction: () => setEnrollModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Shop domain"
              value={enrollDomain}
              onChange={setEnrollDomain}
              placeholder="store-name.myshopify.com"
              autoComplete="off"
            />
            <Select
              label="Plan to grant"
              options={[
                { label: "Standard", value: "Standard" },
                { label: "Pro", value: "Pro" },
                { label: "Basic", value: "Basic" },
              ]}
              value={enrollPlan}
              onChange={setEnrollPlan}
            />
            <TextField
              label="Source"
              value={enrollSource}
              onChange={setEnrollSource}
              placeholder="How did you find them?"
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
