/**
 * Merchant-facing support/concern form.
 * Submits to POST /api/admin/submit-concern on the backend.
 */
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const backendUrl =
    process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";

  try {
    const resp = await fetch(`${backendUrl}/api/admin/submit-concern`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Shop-Domain": session.shop,
      },
      body: JSON.stringify({
        shop_domain: session.shop,
        email: String(form.get("email") || ""),
        subject: String(form.get("subject") || ""),
        message: String(form.get("message") || ""),
      }),
    });

    if (!resp.ok) {
      return { error: "Failed to submit. Please try again." };
    }

    return { success: true };
  } catch {
    return { error: "Unable to reach server. Please try again later." };
  }
};

export default function SupportPage() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <Page title="Support" subtitle="Have a concern or request? Let us know.">
      <Card>
        <BlockStack gap="400">
          {actionData?.success && (
            <Banner tone="success">
              Thank you! Your concern has been submitted. We'll get back to you soon.
            </Banner>
          )}
          {actionData?.error && (
            <Banner tone="critical">{actionData.error}</Banner>
          )}

          <Form method="post">
            <FormLayout>
              <TextField
                label="Your Email (optional)"
                name="email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                helpText="So we can reply to you directly"
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
                label="Message"
                name="message"
                value={message}
                onChange={setMessage}
                multiline={5}
                autoComplete="off"
                requiredIndicator
              />
              <Button variant="primary" submit loading={isSubmitting}>
                Submit Concern
              </Button>
            </FormLayout>
          </Form>
        </BlockStack>
      </Card>
    </Page>
  );
}
