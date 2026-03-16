import { useState, useCallback } from "react";
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

  const [histData, allCount, proCount, oldCount] = await Promise.all([
    safeFetchJson(`${base}/api/superadmin/outreach/history?page_size=3`, { headers }),
    safeFetchJson<{ count?: number }>(`${base}/api/superadmin/outreach/recipients/count?recipient_filter=all_active`, { headers }).catch(() => null),
    safeFetchJson<{ count?: number }>(`${base}/api/superadmin/outreach/recipients/count?recipient_filter=pro_only`, { headers }).catch(() => null),
    safeFetchJson<{ count?: number }>(`${base}/api/superadmin/outreach/recipients/count?recipient_filter=installed_14d_ago`, { headers }).catch(() => null),
  ]);

  const counts: Record<string, number> = {};
  if (allCount?.count != null) counts.all_active = allCount.count;
  if (proCount?.count != null) counts.pro_only = proCount.count;
  if (oldCount?.count != null) counts.installed_14d_ago = oldCount.count;

  return { ...histData, counts };
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
      app_url: String(form.get("app_url") || "https://app.crossborderagent.com"),
      plan_name: String(form.get("plan_name") || "Pro"),
      upgrade_url: String(form.get("upgrade_url") || "https://app.crossborderagent.com/pricing"),
      feedback_link: String(form.get("feedback_link") || ""),
      app_store_review_link: String(form.get("app_store_review_link") || ""),
      subject: String(form.get("subject") || ""),
      html_body: String(form.get("html_body") || ""),
    };
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
  const { history, total, counts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const [emailType, setEmailType] = useState<EmailType>("custom");
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all_active");

  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [appUrl, setAppUrl] = useState("https://app.crossborderagent.com");
  const [planName, setPlanName] = useState("Pro");
  const [upgradeUrl, setUpgradeUrl] = useState("https://app.crossborderagent.com/pricing");
  const [feedbackLink, setFeedbackLink] = useState("https://forms.gle/crossborderagent-feedback");
  const [reviewLink, setReviewLink] = useState("https://apps.shopify.com/crossborderagent#reviews");

  const [adminEmail, setAdminEmail] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const isSubmitting = fetcher.state === "submitting";
  const recipientCount = counts?.[recipientFilter] ?? "?";

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
      subtitle="Compose and send emails to merchants"
      secondaryActions={[
        {
          content: "Refresh",
          onAction: () => revalidator.revalidate(),
          loading: revalidator.state === "loading",
        },
      ]}
    >
      <BlockStack gap="600">
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
                  placeholder="https://app.crossborderagent.com"
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
                  placeholder="https://app.crossborderagent.com/pricing"
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
