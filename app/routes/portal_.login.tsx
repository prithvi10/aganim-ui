import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, redirect, useNavigation } from "react-router";
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Box,
} from "@shopify/polaris";
import {
  getBackendBaseUrl,
  buildSetCookie,
  getTokenFromCookies,
} from "../utils/portal-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = getTokenFromCookies(request.headers.get("Cookie"));
  if (token) {
    return redirect("/portal/dashboard");
  }
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const username = String(form.get("username") || "");
  const password = String(form.get("password") || "");

  const backendUrl = getBackendBaseUrl();

  try {
    const resp = await fetch(`${backendUrl}/api/superadmin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: "Login failed" }));
      return { error: err.detail || "Invalid credentials" };
    }

    const data = await resp.json();

    return redirect("/portal/dashboard", {
      headers: {
        "Set-Cookie": buildSetCookie(data.access_token),
      },
    });
  } catch (e) {
    return { error: "Unable to reach server. Please try again." };
  }
};

export default function PortalLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1a3a6c 0%, #2d5aa0 25%, #4b6cb7 50%, #6a5acd 75%, #3b3f8f 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>
        <BlockStack gap="600">
          <Box paddingBlockEnd="200">
            <BlockStack gap="200" align="center">
              <p style={{ fontSize: 24, fontWeight: 700, textAlign: "center", margin: 0, color: "#ffffff" }}>
                Admin Portal
              </p>
              <p style={{ fontSize: 14, textAlign: "center", margin: 0, color: "rgba(255,255,255,0.7)" }}>
                CrossBorderAgent Internal Dashboard
              </p>
            </BlockStack>
          </Box>

          <Card>
            <BlockStack gap="400">
              {actionData?.error && (
                <Banner tone="critical">{actionData.error}</Banner>
              )}

              <Form method="post">
                <FormLayout>
                  <TextField
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={setUsername}
                    autoFocus
                  />
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                  />
                  <Button
                    variant="primary"
                    submit
                    loading={isSubmitting}
                    fullWidth
                    size="large"
                  >
                    Sign In
                  </Button>
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>
        </BlockStack>
      </div>
    </div>
  );
}
