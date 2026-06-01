import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import {
  Page,
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
  Select,
  Modal,
  Divider,
  Tabs,
  Checkbox,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl, safeFetchJson } from "../utils/portal-auth.server";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type EmailType =
  | "welcome"
  | "upgrade"
  | "credit_limit"
  | "enterprise"
  | "feedback"
  | "rating"
  | "custom";

type RecipientFilter = "all_active" | "pro_only" | "installed_14d_ago";

const EMAIL_TYPE_OPTIONS = [
  { label: "Welcome", value: "welcome" },
  { label: "Plan Upgrade", value: "upgrade" },
  { label: "Credit Limit Reached", value: "credit_limit" },
  { label: "Enterprise Invite", value: "enterprise" },
  { label: "Feedback Request", value: "feedback" },
  { label: "Rating Request", value: "rating" },
  { label: "Custom Announcement", value: "custom" },
];

const RECIPIENT_FILTER_OPTIONS = [
  { label: "All Active Merchants", value: "all_active" },
  { label: "Pro Plan Only", value: "pro_only" },
  { label: "Installed > 14 Days Ago", value: "installed_14d_ago" },
];

/* ------------------------------------------------------------------ */
/* Loader: fetch history + recipient counts                            */
/* ------------------------------------------------------------------ */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };

  const [histData, allCount, proCount, oldCount, agencySent] = await Promise.all([
    safeFetchJson(`${base}/api/superadmin/outreach/history?page_size=3`, { headers }),
    safeFetchJson<{ count?: number }>(`${base}/api/superadmin/outreach/recipients/count?recipient_filter=all_active`, { headers }).catch(() => null),
    safeFetchJson<{ count?: number }>(`${base}/api/superadmin/outreach/recipients/count?recipient_filter=pro_only`, { headers }).catch(() => null),
    safeFetchJson<{ count?: number }>(`${base}/api/superadmin/outreach/recipients/count?recipient_filter=installed_14d_ago`, { headers }).catch(() => null),
    safeFetchJson(`${base}/api/superadmin/outreach/agency/sent-recipients`, { headers }).catch(() => ({ recipients: [], total: 0 })),
  ]);

  const counts: Record<string, number> = {};
  if (allCount?.count != null) counts.all_active = allCount.count;
  if (proCount?.count != null) counts.pro_only = proCount.count;
  if (oldCount?.count != null) counts.installed_14d_ago = oldCount.count;

  return { ...histData, counts, agencySent };
};

/* ------------------------------------------------------------------ */
/* Action: handle all send operations                                  */
/* ------------------------------------------------------------------ */

export const action = async ({ request }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const form = await request.formData();
  const intent = String(form.get("_intent") || "");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let endpoint: string;
  let payload: Record<string, unknown>;

  if (intent === "send-bulk-template") {
    endpoint = `${base}/api/superadmin/outreach/emails/send-template-bulk`;
    payload = {
      template: form.get("template"),
      recipient_filter: form.get("recipient_filter"),
      app_url: form.get("app_url") || "",
      plan_name: form.get("plan_name") || "",
      upgrade_url: form.get("upgrade_url") || "",
      feedback_link: form.get("feedback_link") || "",
      app_store_review_link: form.get("app_store_review_link") || "",
      subject: form.get("subject") || "",
      html_body: form.get("html_body") || "",
    };
  } else if (intent === "send-test") {
    endpoint = `${base}/api/superadmin/outreach/send-test-template`;
    payload = {
      template: form.get("email_type") || "custom",
      to_email: String(form.get("admin_email") || ""),
      merchant_name: "Test Store",
      app_url: String(form.get("app_url") || "https://app.aganim.com"),
      plan_name: String(form.get("plan_name") || "Pro"),
      upgrade_url: String(form.get("upgrade_url") || "https://app.aganim.com/pricing"),
      feedback_link: String(form.get("feedback_link") || ""),
      app_store_review_link: String(form.get("app_store_review_link") || ""),
      subject: String(form.get("subject") || ""),
      html_body: String(form.get("html_body") || ""),
    };
  } else if (intent === "agency-bulk-send") {
    const csv_data = String(form.get("csv_data") || "");
    const store_key = String(form.get("store_key") || "general");

    const lines = csv_data.trim().split("\n").filter(l => l.trim());
    const recipients = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      return {
        merchant_name: parts[0] || "",
        email: parts[1] || "",
        brand_name: parts[2] || "",
      };
    }).filter(r => r.merchant_name && r.email);

    if (recipients.length === 0) {
      return { error: "No valid recipients found. Format: Business Name (JP), email, Brand Name (optional)" };
    }

    endpoint = `${base}/api/superadmin/outreach/agency/bulk-send`;
    payload = { store_key, recipients };
  } else if (intent === "agency-follow-up") {
    const csv_data = String(form.get("csv_data") || "");
    const lines = csv_data.trim().split("\n").filter(l => l.trim());
    const recipients = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      return {
        merchant_name: parts[0] || "",
        email: parts[1] || "",
        brand_name: parts[2] || "",
      };
    }).filter(r => r.merchant_name && r.email);

    if (recipients.length === 0) {
      return { error: "No valid recipients found. Format: Business Name (JP), email, Brand Name (optional)" };
    }

    endpoint = `${base}/api/superadmin/outreach/agency/bulk-follow-up`;
    payload = { recipients };
  } else {
    return { error: "Unknown action" };
  }

  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    return { error: err.detail || `Failed (${resp.status})` };
  }

  return { success: true, ...(await resp.json()) };
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function PortalOutreach() {
  const { history, total, counts, agencySent } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const [selectedTab, setSelectedTab] = useState(0);

  // Merchant email state
  const [emailType, setEmailType] = useState<EmailType>("custom");
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all_active");

  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [appUrl, setAppUrl] = useState("https://app.aganim.com");
  const [planName, setPlanName] = useState("Pro");
  const [upgradeUrl, setUpgradeUrl] = useState("https://app.aganim.com/pricing");
  const [feedbackLink, setFeedbackLink] = useState("https://forms.gle/aganim-feedback");
  const [reviewLink, setReviewLink] = useState("https://apps.shopify.com/aganim#reviews");

  const [adminEmail, setAdminEmail] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Agency outreach state
  const [agencyCsv, setAgencyCsv] = useState("");
  const [agencyStoreKey, setAgencyStoreKey] = useState("general");
  const [agencyResult, setAgencyResult] = useState<any>(null);
  const [followUpCsv, setFollowUpCsv] = useState("");
  const [followUpResult, setFollowUpResult] = useState<any>(null);
  const [useAllSent, setUseAllSent] = useState(false);

  const isSubmitting = fetcher.state === "submitting";
  const recipientCount = counts?.[recipientFilter] ?? "?";

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as any;
      if (data?.results && !data?.error) {
        if (data._intent === "agency-bulk-send") {
          setAgencyResult(data);
        } else if (data._intent === "agency-follow-up") {
          setFollowUpResult(data);
        }
      }
    }
  }, [fetcher.data, fetcher.state]);

  const handleSendTest = useCallback(() => {
    if (!adminEmail.trim()) return;
    const formData = new FormData();
    formData.set("_intent", "send-test");
    formData.set("email_type", emailType);
    formData.set("admin_email", adminEmail);
    formData.set("subject", subject);
    formData.set("html_body", htmlBody);
    formData.set("app_url", appUrl);
    formData.set("plan_name", planName);
    formData.set("upgrade_url", upgradeUrl);
    formData.set("feedback_link", feedbackLink);
    formData.set("app_store_review_link", reviewLink);
    fetcher.submit(formData, { method: "post" });
  }, [adminEmail, emailType, subject, htmlBody, appUrl, planName, upgradeUrl, feedbackLink, reviewLink, fetcher]);

  const handleConfirmSend = useCallback(() => {
    const formData = new FormData();
    formData.set("_intent", "send-bulk-template");
    formData.set("template", emailType);
    formData.set("recipient_filter", recipientFilter);
    formData.set("app_url", appUrl);
    formData.set("plan_name", planName);
    formData.set("upgrade_url", upgradeUrl);
    formData.set("feedback_link", feedbackLink);
    formData.set("app_store_review_link", reviewLink);
    formData.set("subject", subject);
    formData.set("html_body", htmlBody);

    fetcher.submit(formData, { method: "post" });
    setConfirmModalOpen(false);
  }, [recipientFilter, emailType, appUrl, planName, upgradeUrl, feedbackLink, reviewLink, subject, htmlBody, fetcher]);

  const handleAgencyBulkSend = useCallback(() => {
    setAgencyResult(null);
    const formData = new FormData();
    formData.set("_intent", "agency-bulk-send");
    formData.set("csv_data", agencyCsv);
    formData.set("store_key", agencyStoreKey);
    fetcher.submit(formData, { method: "post" });
  }, [fetcher, agencyCsv, agencyStoreKey]);

  const handleFollowUp = useCallback(() => {
    setFollowUpResult(null);
    const csvToUse = useAllSent
      ? (agencySent?.recipients || []).map((r: any) => `${r.email.split("@")[0]},${r.email}`).join("\n")
      : followUpCsv;
    const formData = new FormData();
    formData.set("_intent", "agency-follow-up");
    formData.set("csv_data", csvToUse);
    fetcher.submit(formData, { method: "post" });
  }, [fetcher, followUpCsv, useAllSent, agencySent]);

  const historyRows = (history || []).map((h: any) => [
    h.recipient_email,
    h.recipient_shop || "-",
    h.subject,
    h.body?.slice(0, 60) + (h.body?.length > 60 ? "…" : ""),
    h.status === "sent"
      ? (<Badge tone="success">Sent</Badge>)
      : h.status === "failed"
        ? (<Badge tone="critical">Failed</Badge>)
        : (<Badge>{h.status}</Badge>),
    h.sent_at?.slice(0, 16) || "-",
  ]);

  const canSend =
    emailType === "custom" ? !!(subject.trim() && htmlBody.trim()) : true;

  const templateDescription: Record<EmailType, string> = {
    welcome: "Welcomes a new merchant and shows Free plan features with a Get Started CTA.",
    upgrade: "Confirms a plan upgrade and highlights newly unlocked features.",
    credit_limit: "Nudges merchants who hit their plan limits to upgrade.",
    enterprise: "High-touch invite for enterprise — reply-based, no button CTA.",
    feedback: "Asks merchants to share feedback via a form link.",
    rating: "Asks merchants to leave a review on the Shopify App Store.",
    custom: "Compose a free-form HTML email wrapped in the branded template.",
  };

  return (
    <Page
      title="Email Outreach"
      subtitle="Merchant emails & agency outreach"
      secondaryActions={[
        {
          content: "Refresh",
          onAction: () => revalidator.revalidate(),
          loading: revalidator.state === "loading",
        },
      ]}
    >
      <Tabs
        tabs={[
          { id: "merchants", content: "Merchant Emails" },
          { id: "agency", content: "Agency Outreach" },
        ]}
        selected={selectedTab}
        onSelect={setSelectedTab}
      >
        {selectedTab === 0 && (
      <BlockStack gap="600">
        <Box paddingBlockStart="400" />
        {fetcher.data?.error && (
          <Banner tone="critical" onDismiss={() => {}}>{fetcher.data.error}</Banner>
        )}
        {fetcher.data?.success && (
          <Banner tone="success" onDismiss={() => {}}>
            {fetcher.data.message || "Email sent successfully!"}
          </Banner>
        )}

        {/* ── Composer card ── */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Compose Email</Text>

            <FormLayout>
              <Select
                label="Email Type"
                options={EMAIL_TYPE_OPTIONS}
                value={emailType}
                onChange={(v) => setEmailType(v as EmailType)}
                helpText={templateDescription[emailType]}
              />

              <Select
                label="Recipients"
                options={RECIPIENT_FILTER_OPTIONS.map((o) => ({
                  ...o,
                  label: `${o.label} (${counts?.[o.value] ?? "…"})`,
                }))}
                value={recipientFilter}
                onChange={(v) => setRecipientFilter(v as RecipientFilter)}
                helpText={`${recipientCount} merchant(s) will receive this email. Sent with a 1 s delay between each.`}
              />

              {/* ── Template-specific fields ── */}

              {(emailType === "welcome" || emailType === "upgrade") && (
                <TextField
                  label="App URL"
                  value={appUrl}
                  onChange={setAppUrl}
                  autoComplete="off"
                  placeholder="https://app.aganim.com"
                  helpText="CTA button link in the email."
                />
              )}

              {(emailType === "upgrade" || emailType === "credit_limit") && (
                <TextField
                  label="Plan Name"
                  value={planName}
                  onChange={setPlanName}
                  autoComplete="off"
                  placeholder="Pro"
                  helpText={emailType === "upgrade" ? "The plan the merchant upgraded to." : "The plan whose limits were reached."}
                />
              )}

              {emailType === "credit_limit" && (
                <TextField
                  label="Upgrade URL"
                  value={upgradeUrl}
                  onChange={setUpgradeUrl}
                  autoComplete="off"
                  placeholder="https://app.aganim.com/pricing"
                  helpText="Link to the pricing/upgrade page."
                />
              )}

              {emailType === "feedback" && (
                <TextField
                  label="Feedback Form Link"
                  value={feedbackLink}
                  onChange={setFeedbackLink}
                  autoComplete="off"
                  placeholder="https://forms.gle/your-feedback-form"
                />
              )}

              {emailType === "rating" && (
                <TextField
                  label="App Store Review Link"
                  value={reviewLink}
                  onChange={setReviewLink}
                  autoComplete="off"
                  placeholder="https://apps.shopify.com/your-app#reviews"
                />
              )}

              {emailType === "custom" && (
                <>
                  <TextField
                    label="Subject"
                    value={subject}
                    onChange={setSubject}
                    autoComplete="off"
                    requiredIndicator
                    placeholder="Your email subject line"
                  />
                  <TextField
                    label="HTML Body"
                    value={htmlBody}
                    onChange={setHtmlBody}
                    multiline={10}
                    autoComplete="off"
                    requiredIndicator
                    helpText="Enter HTML content. It will be wrapped in the branded email template automatically."
                    placeholder="<h2>Hello!</h2><p>We have exciting news...</p>"
                  />
                </>
              )}
            </FormLayout>

            <Divider />

            {/* ── Test send ── */}
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Send Test Email</Text>
              <InlineStack gap="300" blockAlign="end">
                <Box minWidth="300px">
                  <TextField
                    label="Admin Email"
                    value={adminEmail}
                    onChange={setAdminEmail}
                    autoComplete="email"
                    placeholder="your-email@example.com"
                    labelHidden
                  />
                </Box>
                <Button
                  onClick={handleSendTest}
                  disabled={!adminEmail.trim() || isSubmitting}
                  loading={isSubmitting && fetcher.formData?.get("_intent") === "send-test"}
                >
                  Send Test
                </Button>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Sends the selected template to your email for preview.
              </Text>
            </BlockStack>

            <Divider />

            {/* ── Bulk send ── */}
            <InlineStack align="end">
              <Button
                variant="primary"
                disabled={!canSend || isSubmitting}
                onClick={() => setConfirmModalOpen(true)}
              >
                Send to {recipientCount} Merchant{recipientCount === 1 ? "" : "s"}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* ── History ── */}
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
        )}

        {selectedTab === 1 && (
      <BlockStack gap="600">
        <Box paddingBlockStart="400" />
        {agencyResult && !agencyResult.error && (
          <Banner tone="success" onDismiss={() => setAgencyResult(null)}>
            Batch complete: {agencyResult.sent} sent, {agencyResult.failed} failed out of {agencyResult.total} total.
          </Banner>
        )}
        {followUpResult && !followUpResult.error && (
          <Banner tone="success" onDismiss={() => setFollowUpResult(null)}>
            Follow-up complete: {followUpResult.sent} sent, {followUpResult.failed} failed out of {followUpResult.total} total.
          </Banner>
        )}
        {fetcher.data?.error && (
          <Banner tone="critical" onDismiss={() => {}}>{fetcher.data.error}</Banner>
        )}

        {/* ── Agency Bulk Send ── */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">Agency Promotion</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Send promotion emails to agencies/partners with image showcase from R2. No beta credits.
                </Text>
              </BlockStack>
              <Badge tone="attention">Promotion</Badge>
            </InlineStack>

            <Divider />

            <FormLayout>
              <TextField
                label="R2 Store Key"
                value={agencyStoreKey}
                onChange={setAgencyStoreKey}
                autoComplete="off"
                helpText={`Images loaded from: beta_outreach/${agencyStoreKey}/`}
              />
              <TextField
                label="Recipients (CSV)"
                value={agencyCsv}
                onChange={setAgencyCsv}
                multiline={10}
                autoComplete="off"
                placeholder={"株式会社飛躍, info@hiyaku-inc.com, Hiyaku\n株式会社GO RIDE, info@goride.co.jp, GO RIDE\n株式会社Tsun, hello@and-and.co, Tsun"}
                helpText="One per line: Business Name (JP), Email, Brand Name (optional). Lines without a valid email are skipped."
              />
            </FormLayout>

            {agencyCsv.trim() && (
              <Text as="p" variant="bodySm" tone="subdued">
                {agencyCsv.trim().split("\n").filter(l => l.includes(",") && l.trim()).length} recipient(s) detected
              </Text>
            )}

            <InlineStack gap="300" align="start">
              <Button
                variant="primary"
                onClick={handleAgencyBulkSend}
                loading={isSubmitting && (fetcher.formData?.get("_intent") === "agency-bulk-send")}
                disabled={!agencyCsv.trim() || !agencyStoreKey.trim()}
              >
                Send All Promotions
              </Button>
            </InlineStack>

            {agencyResult?.results && agencyResult.results.length > 0 && (
              <div style={{ overflowX: "auto", maxHeight: "200px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Business</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencyResult.results.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f1f1" }}>
                        <td style={{ padding: "6px 8px" }}>{r.merchant_name}</td>
                        <td style={{ padding: "6px 8px" }}>{r.email}</td>
                        <td style={{ padding: "6px 8px" }}>
                          <Badge tone={r.status === "sent" ? "success" : "critical"}>{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BlockStack>
        </Card>

        {/* ── Agency Follow-up ── */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">Follow-up</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Send a short reminder to previously contacted agencies. Threads with the original email — no images, just app link.
                </Text>
              </BlockStack>
              <Badge tone="info">Follow-up</Badge>
            </InlineStack>

            <Divider />

            {(agencySent?.recipients?.length ?? 0) > 0 && (
              <Checkbox
                label={`Send to all ${agencySent.recipients.length} previously contacted agencies`}
                checked={useAllSent}
                onChange={setUseAllSent}
                helpText="Uses the list of all agencies you've already emailed"
              />
            )}

            {!useAllSent && (
              <FormLayout>
                <TextField
                  label="Recipients (CSV)"
                  value={followUpCsv}
                  onChange={setFollowUpCsv}
                  multiline={8}
                  autoComplete="off"
                  placeholder={"株式会社飛躍, info@hiyaku-inc.com, Hiyaku\n株式会社GO RIDE, info@goride.co.jp, GO RIDE"}
                  helpText="One per line: Business Name (JP), Email, Brand Name (optional)."
                />
              </FormLayout>
            )}

            {useAllSent && agencySent?.recipients?.length > 0 && (
              <div style={{ overflowX: "auto", maxHeight: "150px", overflowY: "auto", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px" }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  {agencySent.recipients.map((r: any) => r.email).join(", ")}
                </Text>
              </div>
            )}

            <InlineStack gap="300" align="start">
              <Button
                variant="primary"
                onClick={handleFollowUp}
                loading={isSubmitting && (fetcher.formData?.get("_intent") === "agency-follow-up")}
                disabled={!useAllSent && !followUpCsv.trim()}
              >
                Send Follow-up
              </Button>
            </InlineStack>

            {followUpResult?.results && followUpResult.results.length > 0 && (
              <div style={{ overflowX: "auto", maxHeight: "200px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Business</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Status</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Threaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUpResult.results.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f1f1" }}>
                        <td style={{ padding: "6px 8px" }}>{r.merchant_name}</td>
                        <td style={{ padding: "6px 8px" }}>{r.email}</td>
                        <td style={{ padding: "6px 8px" }}>
                          <Badge tone={r.status === "sent" ? "success" : "critical"}>{r.status}</Badge>
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          {r.threaded ? <Badge tone="success">Yes</Badge> : <Badge>No</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BlockStack>
        </Card>

        {/* ── Previously Sent Agencies ── */}
        {(agencySent?.recipients?.length ?? 0) > 0 && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Previously Contacted ({agencySent.total})</Text>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Subject</th>
                      <th style={{ textAlign: "left", padding: "8px 12px" }}>Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencySent.recipients.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f1f1" }}>
                        <td style={{ padding: "8px 12px" }}>{r.email}</td>
                        <td style={{ padding: "8px 12px" }}>{r.subject}</td>
                        <td style={{ padding: "8px 12px" }}>{r.sent_at?.slice(0, 16) || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
        )}
      </Tabs>

      {/* ── Confirmation modal ── */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Bulk Email Send"
        primaryAction={{
          content: isSubmitting ? "Sending…" : `Send to ${recipientCount} Merchants`,
          onAction: handleConfirmSend,
          destructive: false,
          loading: isSubmitting,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setConfirmModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p">
              You are about to send a <Text as="span" fontWeight="bold">{EMAIL_TYPE_OPTIONS.find((o) => o.value === emailType)?.label}</Text> email
              to <Text as="span" fontWeight="bold">{recipientCount} merchant{recipientCount === 1 ? "" : "s"}</Text> matching
              the filter <Text as="span" fontWeight="bold">{RECIPIENT_FILTER_OPTIONS.find((o) => o.value === recipientFilter)?.label}</Text>.
            </Text>
            <Text as="p">
              Emails will be sent one at a time with a 1-second delay between each to avoid
              hitting SES rate limits. This operation cannot be undone.
            </Text>
            <Banner tone="warning">
              Please verify the email content and recipient filter before proceeding.
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
