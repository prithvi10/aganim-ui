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
  Divider,
  Checkbox,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";
import { useState, useCallback, useRef, useEffect } from "react";

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

  if (intent === "showcase_preview") {
    const merchant_name = formData.get("merchant_name") as string;
    const store_key = formData.get("store_key") as string;
    const brand_name = formData.get("brand_name") as string || "";
    const email = formData.get("email") as string || "";
    const is_promotion = formData.get("is_promotion") === "true";

    const resp = await fetch(`${base}/api/superadmin/beta/showcase/preview`, {
      method: "POST",
      headers,
      body: JSON.stringify({ merchant_name, store_key, brand_name, email, is_promotion }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { intent: "showcase_preview", error: true, message: `Preview failed (${resp.status}): ${text.slice(0, 200)}` };
    }
    const data = await resp.json();
    return { intent: "showcase_preview", ...data };
  }

  if (intent === "showcase_send") {
    const merchant_name = formData.get("merchant_name") as string;
    const store_key = formData.get("store_key") as string;
    const brand_name = formData.get("brand_name") as string || "";
    const email = formData.get("email") as string;
    const is_promotion = formData.get("is_promotion") === "true";

    const resp = await fetch(`${base}/api/superadmin/beta/showcase/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ merchant_name, store_key, brand_name, email, is_promotion }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { intent: "showcase_send", error: true, message: `Send failed (${resp.status}): ${text.slice(0, 200)}` };
    }
    const data = await resp.json();
    return { intent: "showcase_send", ...data };
  }

  if (intent === "send_bulk") {
    const template = formData.get("template") as string;
    const status_filter = formData.get("status_filter") as string || null;
    const resp = await fetch(`${base}/api/superadmin/beta/email/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ template, status_filter: status_filter || null }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { intent: "send_bulk", error: true, message: `Failed (${resp.status}): ${text.slice(0, 200)}` };
    }
    return { intent: "send_bulk", ...(await resp.json()) };
  }

  return null;
};

export default function PortalBetaOutreach() {
  const { templates, history } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  // Showcase Invite state
  const [merchantName, setMerchantName] = useState("");
  const [storeKey, setStoreKey] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [isPromotion, setIsPromotion] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [sent, setSent] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bulk send state
  const [template, setTemplate] = useState("checkin");
  const [statusFilter, setStatusFilter] = useState("");

  const result = fetcher.data as any;

  useEffect(() => {
    if (result?.intent === "showcase_preview" && !result.error && result.html) {
      setPreviewHtml(result.html);
      setPreviewSubject(result.subject || "");
      setImageCount(result.image_count || 0);
      setHasPreviewed(true);
      setSent(false);
    }
    if (result?.intent === "showcase_send" && !result.error) {
      setSent(true);
    }
  }, [result]);

  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  const handlePreview = useCallback(() => {
    setPreviewHtml(null);
    setHasPreviewed(false);
    setSent(false);
    fetcher.submit(
      { intent: "showcase_preview", merchant_name: merchantName, store_key: storeKey, brand_name: brandName, email, is_promotion: String(isPromotion) },
      { method: "post" },
    );
  }, [fetcher, merchantName, storeKey, brandName, email, isPromotion]);

  const handleSend = useCallback(() => {
    fetcher.submit(
      { intent: "showcase_send", merchant_name: merchantName, store_key: storeKey, brand_name: brandName, email, is_promotion: String(isPromotion) },
      { method: "post" },
    );
  }, [fetcher, merchantName, storeKey, brandName, email, isPromotion]);

  const handleSendBulk = useCallback(() => {
    fetcher.submit(
      { intent: "send_bulk", template, status_filter: statusFilter },
      { method: "post" },
    );
  }, [fetcher, template, statusFilter]);

  const canPreview = merchantName.trim() && storeKey.trim();
  const canSend = hasPreviewed && email.trim() && !sent;

  return (
    <Page title="Beta Outreach" subtitle="Showcase invites & cohort emails">
      <BlockStack gap="600">
        {/* Global error banner */}
        {result?.error && (
          <Banner tone="critical" onDismiss={() => {}}>
            {result.message}
          </Banner>
        )}
        {result?.intent === "showcase_send" && !result?.error && (
          <Banner tone="success" onDismiss={() => {}}>
            {result.message || "Email sent successfully"}
          </Banner>
        )}
        {result?.intent === "send_bulk" && !result?.error && (
          <Banner tone="success" onDismiss={() => {}}>
            {result.message}
          </Banner>
        )}

        {/* Showcase Invite - Primary Card */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">{isPromotion ? "Agency Promotion" : "Showcase Invite"}</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {isPromotion
                    ? "Send a promotion email to agencies/partners — promotes app download without beta credits."
                    : "Send a personalized beta invite with before/after transformation screenshots from R2."
                  }
                </Text>
              </BlockStack>
              <Badge tone={isPromotion ? "attention" : "info"}>{isPromotion ? "Promotion" : "Beta Invite"}</Badge>
            </InlineStack>

            <Divider />

            <Checkbox
              label="Promotion mode (no beta credits — promote app download instead)"
              checked={isPromotion}
              onChange={(val) => { setIsPromotion(val); setHasPreviewed(false); setSent(false); }}
            />

            <FormLayout>
              <FormLayout.Group>
                <TextField
                  label="Business Name (JP)"
                  value={merchantName}
                  onChange={setMerchantName}
                  placeholder="むす美（山田繊維株式会社）"
                  autoComplete="off"
                  helpText="Formal Japanese business name shown in the email greeting"
                />
                <TextField
                  label="Brand Name (display)"
                  value={brandName}
                  onChange={setBrandName}
                  placeholder="MUSUBI Furoshiki"
                  autoComplete="off"
                  helpText="Optional — brand name used in the email body. Defaults to Business Name if empty."
                />
              </FormLayout.Group>
              <FormLayout.Group>
                <TextField
                  label="R2 Store Key"
                  value={storeKey}
                  onChange={(val) => { setStoreKey(val); setHasPreviewed(false); setSent(false); }}
                  placeholder="musubi"
                  autoComplete="off"
                  helpText={`Images loaded from: beta_outreach/${storeKey || "<store_key>"}/`}
                />
                <TextField
                  label="Target Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="merchant@example.com"
                  autoComplete="email"
                  type="email"
                  helpText="Recipient email address"
                />
              </FormLayout.Group>
            </FormLayout>

            <InlineStack gap="300" align="start">
              <Button
                variant="secondary"
                onClick={handlePreview}
                loading={fetcher.state !== "idle" && !hasPreviewed}
                disabled={!canPreview}
              >
                Preview Email
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                loading={fetcher.state !== "idle" && hasPreviewed && !sent}
                disabled={!canSend}
              >
                {isPromotion ? "Send Promotion" : "Send Invite"}
              </Button>
            </InlineStack>

            {/* Preview Panel */}
            {previewHtml && (
              <BlockStack gap="300">
                <Divider />
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">Email Preview</Text>
                  <InlineStack gap="200">
                    <Badge>{`${imageCount} image${imageCount !== 1 ? "s" : ""}`}</Badge>
                    {sent && <Badge tone="success">Sent</Badge>}
                  </InlineStack>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Subject: {previewSubject}
                </Text>
                <div style={{
                  border: "1px solid #e1e3e5",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#ffffff",
                }}>
                  <iframe
                    ref={iframeRef}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                    style={{
                      width: "100%",
                      height: "700px",
                      border: "none",
                      display: "block",
                    }}
                  />
                </div>
              </BlockStack>
            )}
          </BlockStack>
        </Card>

        {/* Bulk Send to Beta Cohort - Secondary */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Send to Beta Cohort</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Send a template email to all beta merchants matching a status filter.
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
              <Badge>{`${history.length} shown`}</Badge>
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
