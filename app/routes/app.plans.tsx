import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Button,
  InlineStack,
  ExceptionList,
  Badge,
  Banner,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Hardcoded Plan Constants for Client-Side Use
// We duplicate these here to avoid importing server-side code (shopify.server.ts) into the client bundle
const PLAN_BASIC = 'Basic' as const;
const PLAN_STANDARD = 'Standard' as const;
const PLAN_PRO = 'Pro' as const;
const PLAN_FREE = 'Free' as const;
type PlanName = typeof PLAN_FREE | typeof PLAN_BASIC | typeof PLAN_STANDARD | typeof PLAN_PRO;

type ActiveSub = { name?: string; status?: string; test?: boolean };

function normalizeActivePlan(subs: ActiveSub[] | null | undefined): PlanName {
  const activeNames = (subs ?? [])
    .filter((s) => {
      const st = String(s?.status ?? "").toUpperCase();
      // Shopify can return PENDING briefly right after upgrade; treat as active for UI + guards.
      return !st || st === "ACTIVE" || st === "PENDING";
    })
    .map((s) => String(s?.name ?? "").toLowerCase());

  const hasPro = activeNames.some((n) => n.includes("pro"));
  const hasStandard = activeNames.some((n) => n.includes("standard"));
  const hasBasic = activeNames.some((n) => n.includes("basic"));
  // If no subscription is active, treat as Free tier by default.
  return hasPro ? PLAN_PRO : hasStandard ? PLAN_STANDARD : hasBasic ? PLAN_BASIC : PLAN_FREE;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const returningPaid = url.searchParams.get("returning_paid") === "1";
  try {
    const { admin, session } = await authenticate.admin(request);
    const resp = await admin.graphql(`
      query {
        currentAppInstallation {
          activeSubscriptions {
            name
            status
            test
          }
        }
      }
    `);
    const body = await resp.json();
    const subs: ActiveSub[] =
      body?.data?.currentAppInstallation?.activeSubscriptions ?? [];
    const shopifyActivePlan = normalizeActivePlan(subs);
    let activePlan = shopifyActivePlan;

    // If grace is active, Shopify will often report no active subscription after uninstall.
    // Use backend usage (last_plan_name) as the effective plan for UI.
    let graceActive = false;
    let accessExpiresAt: string | null = null;
    let lastPlanName: PlanName | null = null;
    try {
      const backendApiUrl =
        process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
      const usageResp = await fetch(
        `${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(session.shop)}`
      );
      if (usageResp.ok) {
        const data = await usageResp.json();
        // "Grace" is a reinstall-only UI state (backend grace_mode implies an uninstall happened).
        graceActive = Boolean(data.grace_mode) && shopifyActivePlan === PLAN_FREE;
        accessExpiresAt = data.access_expires_at ?? null;
        const last = String(data.last_plan_name || "").trim();
        if (last === PLAN_BASIC || last === PLAN_STANDARD || last === PLAN_PRO) {
          lastPlanName = last as PlanName;
        }
        if (graceActive && lastPlanName) {
          activePlan = lastPlanName;
        }
      }
    } catch {
      // ignore
    }

    return { currentPlans: subs, activePlan, returningPaid, graceActive, accessExpiresAt, lastPlanName };
  } catch (e) {
    return { currentPlans: [], activePlan: PLAN_FREE, returningPaid, graceActive: false, accessExpiresAt: null, lastPlanName: null };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const plan = formData.get("plan") as PlanName | null;
  const url = new URL(request.url);
  const returningPaid = url.searchParams.get("returning_paid") === "1";
  // Build a return URL that works for both classic admin and new admin.shopify.com
  const shopSubdomain = shop.replace(".myshopify.com", "");
  const hostParam = new URL(request.url).searchParams.get("host");
  const hostSuffix = hostParam ? `?host=${hostParam}` : "";
  const adminReturnUrl = `https://admin.shopify.com/store/${shopSubdomain}/apps/crossborderagent/app${hostSuffix}`;

  if (plan === PLAN_FREE) {
    // Free is the default tier (no billing flow).
    // If this is a returning paid user, do not allow falling back to Free.
    if (returningPaid) {
      return null;
    }
    return null;
  }
  if (plan === PLAN_BASIC || plan === PLAN_STANDARD || plan === PLAN_PRO) {
    // Server-side guard: do not allow "upgrading" to the already-active plan.
    try {
      const { admin } = await authenticate.admin(request);
      const resp = await admin.graphql(`
        query {
          currentAppInstallation {
            activeSubscriptions {
              name
              status
            }
          }
        }
      `);
      const body = await resp.json();
      const subs: ActiveSub[] =
        body?.data?.currentAppInstallation?.activeSubscriptions ?? [];
      let activePlan = normalizeActivePlan(subs);

      // Grace override: if Shopify thinks "Free" but backend says last paid + grace active,
      // treat that as the effective current plan to prevent re-purchasing the same tier.
      try {
        const backendApiUrl =
          process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";
        const usageResp = await fetch(
          `${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shop)}`
        );
        if (usageResp.ok) {
          const data = await usageResp.json();
          const last = String(data.last_plan_name || "").trim();
          const grace = Boolean(data.grace_mode);
          if (activePlan === PLAN_FREE && grace && (last === PLAN_BASIC || last === PLAN_STANDARD || last === PLAN_PRO)) {
            activePlan = last as PlanName;
          }
        }
      } catch {
        // ignore
      }

      if (activePlan === plan) {
        return null;
      }
    } catch {
      // If billing.check fails, we still proceed (Shopify will handle idempotency / confirmation UI).
    }

    await billing.request({
      // Shopify types can resolve plan to `never` depending on how billing is typed;
      // we only send known plan strings from our UI.
      plan: plan as unknown as never,
      isTest: process.env.NODE_ENV !== "production",
      // Redirect back to the embedded app root; prefer new admin URL
      returnUrl: adminReturnUrl,
    });
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function PlansPage() {
  const { activePlan, returningPaid, graceActive, accessExpiresAt } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const isUpgrading = navigation.state === "submitting";

  const plans = [
    {
      name: PLAN_FREE,
      price: "$0",
      rewrites: "10 lifetime credits",
      rewriterFeatures: [
        "AI product rewrite (title + description)",
        "SEO details (title + meta description)",
        "SEO editor + preview",
        "1 market at a time (1 locale)",
      ],
      marketingFeatures: [
        "Instagram captions + hashtags",
        "Seasonal campaign ideas + caption",
      ],
      otherFeatures: [] as string[],
    },
    {
      name: PLAN_BASIC,
      price: "$49",
      rewrites: "50 rewrites / month",
      rewriterFeatures: [
        "AI product rewrite (title + description)",
        "SEO details (title + meta description)",
        "SEO editor + preview",
        "Key Details (Nuance) auto-detected",
        "EN unit conversion (metric + US)",
        "1 market at a time (1 locale)",
      ],
      marketingFeatures: [
        "Instagram captions + hashtags",
        "Seasonal campaign ideas + caption",
      ],
      otherFeatures: [] as string[],
    },
    {
      name: PLAN_STANDARD,
      price: "$99",
      rewrites: "100 rewrites / month",
      rewriterFeatures: [
        "Everything in Basic (Rewriter)",
        "Multi-market (multiple locales per run)",
        "Brand tones: Luxury / Minimalist / Playful",
        "Bulk market optimization",
      ],
      marketingFeatures: [
        "Everything in Basic (Marketing)",
      ],
      otherFeatures: [] as string[],
    },
    {
      name: PLAN_PRO,
      price: "$199",
      rewrites: "Unlimited rewrites",
      rewriterFeatures: [
        "Everything in Standard (Rewriter)",
        "Unlimited bulk multi-market",
      ],
      marketingFeatures: [
        "Everything in Standard (Marketing)",
      ],
      otherFeatures: [
        "Priority AI (GPT‑5)",
      ],
    },
  ];

  const visiblePlans = returningPaid ? plans.filter((p) => p.name !== PLAN_FREE) : plans;

  return (
    <Page title="Select a Plan" fullWidth>
      <Layout>
        <Layout.Section>
          {returningPaid ? (
            <div style={{ marginBottom: 16 }}>
              <Banner tone="warning" title="Welcome back! Please select a plan to reactivate your account." />
            </div>
          ) : null}
          {graceActive && accessExpiresAt ? (
            <div style={{ marginBottom: 16 }}>
              <Banner tone="info" title="Grace Period Active">
                <Text as="p" variant="bodyMd">
                  Your previous plan stays active until{" "}
                  {new Date(accessExpiresAt).toLocaleDateString()}.
                </Text>
              </Banner>
            </div>
          ) : null}
          <div style={{overflowX: "auto"}}>
            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "nowrap",
                alignItems: "stretch",
                width: "100%",
                minWidth: 0,
                paddingBottom: 4,
              }}
            >
            {visiblePlans.map((plan) => {
              const isCurrent = plan.name === activePlan;
              return (
                <div
                  key={plan.name}
                  style={{
                    minWidth: 320,
                    flex: "1 1 0px",
                  }}
                >
                  <Card>
                    <div style={{ height: 432 }}>
                      <Box padding="400">
                        <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                        {/* Header (fixed) */}
                        <div>
                          <BlockStack gap="200">
                            <Text as="h2" variant="headingLg">
                              <InlineStack gap="200" align="space-between">
                                <span>{plan.name}</span>
                                {isCurrent ? (
                                  <InlineStack gap="200" blockAlign="center">
                                    <Badge tone="success">Active</Badge>
                                    {graceActive ? <Badge tone="info">Grace</Badge> : null}
                                  </InlineStack>
                                ) : null}
                              </InlineStack>
                            </Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {plan.price}
                              <Text as="span" variant="bodyMd" fontWeight="regular">
                                /month
                              </Text>
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {plan.rewrites}
                            </Text>
                          </BlockStack>
                        </div>

                        {/* Features (scrollable) */}
                        <div style={{flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2}}>
                          <BlockStack gap="200">
                            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                              <BlockStack gap="200">
                                <Text as="h3" variant="headingSm">
                                  Rewriter
                                </Text>
                                <BlockStack gap="100">
                                  {plan.rewriterFeatures.map((feature) => (
                                    <ExceptionList
                                      key={`rewriter-${plan.name}-${feature}`}
                                      items={[
                                        {
                                          icon: CheckIcon,
                                          description: feature,
                                        },
                                      ]}
                                    />
                                  ))}
                                </BlockStack>
                              </BlockStack>
                            </Box>

                            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                              <BlockStack gap="200">
                                <Text as="h3" variant="headingSm">
                                  Marketing
                                </Text>
                                <BlockStack gap="100">
                                  {plan.marketingFeatures.map((feature) => (
                                    <ExceptionList
                                      key={`marketing-${plan.name}-${feature}`}
                                      items={[
                                        {
                                          icon: CheckIcon,
                                          description: feature,
                                        },
                                      ]}
                                    />
                                  ))}
                                </BlockStack>
                              </BlockStack>
                            </Box>

                            {plan.otherFeatures.length ? (
                              <BlockStack gap="100">
                                <Text as="h3" variant="headingSm">
                                  Other
                                </Text>
                                {plan.otherFeatures.map((feature) => (
                                  <ExceptionList
                                    key={`other-${plan.name}-${feature}`}
                                    items={[
                                      {
                                        icon: CheckIcon,
                                        description: feature,
                                      },
                                    ]}
                                  />
                                ))}
                              </BlockStack>
                            ) : null}
                          </BlockStack>
                        </div>

                        {/* CTA (fixed to bottom) */}
                        <div style={{paddingTop: 16}}>
                          <Form method="post">
                            <input type="hidden" name="plan" value={plan.name} />
                            <Button
                              variant={isCurrent ? "secondary" : "primary"}
                              fullWidth
                              submit
                              loading={isUpgrading}
                              disabled={isCurrent || plan.name === PLAN_FREE}
                            >
                              {isCurrent ? "Current Plan" : plan.name === PLAN_FREE ? "Included" : "Upgrade"}
                            </Button>
                          </Form>
                        </div>
                        </div>
                      </Box>
                    </div>
                  </Card>
                </div>
              );
            })}
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

