import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import {
  Page,
  Card,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Banner,
  Box,
  Divider,
} from "@shopify/polaris";
import { requirePortalAuth, getBackendBaseUrl } from "../utils/portal-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();

  const resp = await fetch(`${base}/api/superadmin/concerns`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await resp.json();
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const token = requirePortalAuth(request);
  const base = getBackendBaseUrl();
  const form = await request.formData();
  const concernId = form.get("concern_id");
  const reply = form.get("reply");

  const resp = await fetch(`${base}/api/superadmin/concerns/${concernId}/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reply }),
  });

  if (!resp.ok) {
    return { error: "Failed to submit reply" };
  }

  return { success: true };
};

function ConcernCard({ concern }: { concern: any }) {
  const fetcher = useFetcher();
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200">
            <Text as="span" variant="headingSm">{concern.subject}</Text>
            <Badge tone={concern.status === "open" ? "attention" : "success"}>
              {concern.status}
            </Badge>
          </InlineStack>
          <Text as="span" variant="bodySm" tone="subdued">
            {concern.created_at?.slice(0, 16) || "-"}
          </Text>
        </InlineStack>

        <InlineStack gap="200">
          <Text as="span" variant="bodySm" tone="subdued">
            From: {concern.shop_domain}
          </Text>
          {concern.email && (
            <Text as="span" variant="bodySm" tone="subdued">
              ({concern.email})
            </Text>
          )}
        </InlineStack>

        <Box padding="300" background="bg-surface-secondary" borderRadius="200">
          <Text as="p" variant="bodyMd">{concern.message}</Text>
        </Box>

        {concern.admin_reply && (
          <>
            <Divider />
            <Box padding="300" background="bg-surface-success" borderRadius="200">
              <BlockStack gap="100">
                <Text as="span" variant="bodySm" fontWeight="semibold">Your Reply:</Text>
                <Text as="p" variant="bodyMd">{concern.admin_reply}</Text>
              </BlockStack>
            </Box>
          </>
        )}

        {!concern.admin_reply && (
          <>
            {showReply ? (
              <fetcher.Form method="post">
                <input type="hidden" name="concern_id" value={concern.id} />
                <BlockStack gap="200">
                  <TextField
                    label="Reply"
                    labelHidden
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={setReplyText}
                    multiline={3}
                    name="reply"
                    autoComplete="off"
                  />
                  <InlineStack gap="200">
                    <Button submit variant="primary" loading={fetcher.state === "submitting"}>
                      Send Reply
                    </Button>
                    <Button onClick={() => setShowReply(false)}>Cancel</Button>
                  </InlineStack>
                </BlockStack>
              </fetcher.Form>
            ) : (
              <Button onClick={() => setShowReply(true)} size="slim">
                Reply
              </Button>
            )}
          </>
        )}
      </BlockStack>
    </Card>
  );
}

export default function PortalConcerns() {
  const { concerns, source } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  return (
    <Page
      title="Concerns & Enquiries"
      subtitle={`${concerns?.length || 0} concern(s) — Source: ${source}`}
      primaryAction={
        <Button
          onClick={() => revalidator.revalidate()}
          loading={revalidator.state === "loading"}
        >
          Refresh
        </Button>
      }
    >
      <BlockStack gap="400">
        {(!concerns || concerns.length === 0) && (
          <Card>
            <Text as="p" tone="subdued" alignment="center">
              No concerns yet. Merchants can submit concerns from the Support page in the app.
            </Text>
          </Card>
        )}

        {(concerns || []).map((c: any) => (
          <ConcernCard key={c.id} concern={c} />
        ))}
      </BlockStack>
    </Page>
  );
}
