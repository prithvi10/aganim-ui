import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Badge,
  DataTable,
  Box,
  Divider,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl } from "../utils/portal-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();

  const resp = await fetch(`${base}/api/superadmin/outreach/history?page_size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await resp.json();
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const form = await request.formData();

  const toEmails = String(form.get("to_emails") || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const merchantDomains = String(form.get("merchant_domains") || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const subject = String(form.get("subject") || "");
  const body = String(form.get("body") || "");

  const resp = await fetch(`${base}/api/superadmin/outreach/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to_emails: toEmails,
      merchant_domains: merchantDomains,
      subject,
      body,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    return { error: err.detail || "Failed to send" };
  }

  return { success: true, ...(await resp.json()) };
};

export default function PortalOutreach() {
  const { history, total } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const [toEmails, setToEmails] = useState("");
  const [merchantDomains, setMerchantDomains] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const historyRows = (history || []).map((h: any) => [
    h.recipient_email,
    h.recipient_shop || "-",
    h.subject,
    h.body?.slice(0, 50) + (h.body?.length > 50 ? "..." : ""),
    h.status,
    h.sent_at?.slice(0, 16) || "-",
  ]);

  return (
    <Page
      title="Outreach"
      subtitle="Communicate with merchants"
      secondaryActions={[
        {
          content: "Refresh History",
          onAction: () => revalidator.revalidate(),
          loading: revalidator.state === "loading",
        },
      ]}
    >
      <BlockStack gap="600">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Compose Email</Text>

            {fetcher.data?.error && (
              <Banner tone="critical">{fetcher.data.error}</Banner>
            )}
            {fetcher.data?.success && (
              <Banner tone="success">{fetcher.data.message || "Email queued!"}</Banner>
            )}

            <fetcher.Form method="post">
              <FormLayout>
                <TextField
                  label="To Emails"
                  name="to_emails"
                  value={toEmails}
                  onChange={setToEmails}
                  autoComplete="off"
                  helpText="Comma-separated email addresses"
                  placeholder="merchant@example.com, another@example.com"
                />
                <TextField
                  label="Merchant Domains"
                  name="merchant_domains"
                  value={merchantDomains}
                  onChange={setMerchantDomains}
                  autoComplete="off"
                  helpText="Comma-separated shop domains (will use shop domain as email)"
                  placeholder="my-store.myshopify.com"
                />
                <TextField
                  label="Subject"
                  name="subject"
                  value={subject}
                  onChange={setSubject}
                  autoComplete="off"
                  requiredIndicator
                />
                <TextField
                  label="Body"
                  name="body"
                  value={body}
                  onChange={setBody}
                  multiline={6}
                  autoComplete="off"
                  requiredIndicator
                />
                <Button variant="primary" submit loading={fetcher.state === "submitting"}>
                  Send Email (Dummy)
                </Button>
              </FormLayout>
            </fetcher.Form>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Sent History ({total || 0})</Text>
            {historyRows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                headings={["Recipient", "Shop", "Subject", "Body", "Status", "Sent"]}
                rows={historyRows}
              />
            ) : (
              <Text as="p" tone="subdued">No outreach history yet</Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
