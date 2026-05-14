import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  FormLayout,
  Select,
  TextField,
  Button,
  Banner,
  Badge,
  Box,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";
import { useState, useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };

  const [templates, history] = await Promise.all([
    safeFetchJson(`${base}/api/superadmin/beta/email/templates`, { headers }),
    safeFetchJson(`${base}/api/superadmin/outreach/history?page=1&page_size=15`, { headers }),
  ]);

  return { templates: templates?.templates || [], history: history?.history || [] };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "send_bulk") {
    const template = formData.get("template") as string;
    const status_filter = formData.get("status_filter") as string || null;
    const resp = await fetch(`${base}/api/superadmin/beta/email/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ template, status_filter: status_filter || null }),
    });
    return resp.json();
  }

  if (intent === "send_invite") {
    const domains = (formData.get("domains") as string || "")
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);
    const emails = (formData.get("emails") as string || "")
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);

    const resp = await fetch(`${base}/api/superadmin/beta/invite`, {
      method: "POST",
      headers,
      body: JSON.stringify({ shop_domains: domains, raw_emails: emails }),
    });
    return resp.json();
  }

  return null;
};

export default function PortalBetaOutreach() {
  const { templates, history } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [template, setTemplate] = useState("checkin");
  const [statusFilter, setStatusFilter] = useState("");
  const [inviteDomains, setInviteDomains] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");

  const handleSendBulk = useCallback(() => {
    fetcher.submit(
      { intent: "send_bulk", template, status_filter: statusFilter },
      { method: "post" },
    );
  }, [fetcher, template, statusFilter]);

  const handleSendInvite = useCallback(() => {
    fetcher.submit(
      { intent: "send_invite", domains: inviteDomains, emails: inviteEmails },
      { method: "post" },
    );
  }, [fetcher, inviteDomains, inviteEmails]);

  const result = fetcher.data as any;

  return (
    <Page title="Beta Outreach" subtitle="Send emails to beta merchants">
      <BlockStack gap="600">
        {result?.message && (
          <Banner tone="success" onDismiss={() => {}}>
            {result.message}
          </Banner>
        )}

        {result?.details && result.details.some((d: any) => d.signup_url) && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Generated Signup Links</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Share these links manually (e.g. via DM) if needed. Each link is unique per merchant.
              </Text>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Recipient</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Status</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Signup URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.details.filter((d: any) => d.signup_url).map((d: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f6f8" }}>
                        <td style={{ padding: "8px 12px" }}>{d.domain || d.email}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <Badge tone={d.status === "sent" ? "success" : "critical"}>{d.status}</Badge>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <code style={{ fontSize: 11, wordBreak: "break-all" }}>{d.signup_url}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BlockStack>
          </Card>
        )}

        {/* Invite New Merchants */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Invite New Merchants</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Send beta invite emails with a unique signup link. Use email addresses for merchants who haven't installed the app yet.
            </Text>

            {result?.details?.some((d: any) => d.reason === "no email") && (
              <Banner tone="warning">
                Some shop domains were skipped because no email is on file.
                Use the "Email addresses" field instead for merchants who haven't installed the app.
              </Banner>
            )}

            <FormLayout>
              <TextField
                label="Email addresses (one per line)"
                value={inviteEmails}
                onChange={setInviteEmails}
                multiline={4}
                placeholder={"merchant@example.com\nanother@store.jp"}
                autoComplete="off"
                helpText="Recommended: directly enter merchant email addresses to send invite emails"
              />
              <TextField
                label="Shop domains (one per line, only for merchants already in your DB)"
                value={inviteDomains}
                onChange={setInviteDomains}
                multiline={3}
                placeholder={"store-one.myshopify.com\nstore-two.myshopify.com"}
                autoComplete="off"
                helpText="Only works if the merchant already installed and has an email on file"
              />
              <Button
                variant="primary"
                onClick={handleSendInvite}
                loading={fetcher.state !== "idle"}
                disabled={!inviteDomains.trim() && !inviteEmails.trim()}
              >
                Send Invites
              </Button>
            </FormLayout>
          </BlockStack>
        </Card>

        {/* Bulk Send to Beta Cohort */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Send to Beta Cohort</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Send a template email to all beta merchants matching a filter.
            </Text>
            <FormLayout>
              <Select
                label="Email template"
                options={templates.map((t: any) => ({
                  label: `${t.name} — ${t.description}`,
                  value: t.id,
                }))}
                value={template}
                onChange={setTemplate}
              />
              <Select
                label="Filter by status"
                options={[
                  { label: "All enrolled", value: "" },
                  { label: "Active only", value: "active" },
                  { label: "Invited only", value: "invited" },
                  { label: "Accepted only", value: "accepted" },
                  { label: "Completed only", value: "completed" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <Button
                variant="primary"
                onClick={handleSendBulk}
                loading={fetcher.state !== "idle"}
              >
                Send to Cohort
              </Button>
            </FormLayout>
          </BlockStack>
        </Card>

        {/* Send History */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Recent Send History</Text>
              <Badge>{history.length} shown</Badge>
            </InlineStack>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Recipient</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Shop</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Subject</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.id} style={{ borderBottom: "1px solid #f4f6f8" }}>
                      <td style={{ padding: "8px 12px" }}>{h.recipient_email}</td>
                      <td style={{ padding: "8px 12px" }}>{h.recipient_shop || "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{h.subject?.slice(0, 50)}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge tone={h.status === "sent" ? "success" : "critical"}>
                          {h.status}
                        </Badge>
                      </td>
                      <td style={{ padding: "8px 12px" }}>{h.sent_at?.slice(0, 10) || "—"}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "16px 12px", textAlign: "center", color: "#6d7175" }}>
                        No emails sent yet
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
