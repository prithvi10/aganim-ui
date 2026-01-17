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
type PlanName = typeof PLAN_BASIC | typeof PLAN_STANDARD | typeof PLAN_PRO;

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
  return hasPro ? PLAN_PRO : hasStandard ? PLAN_STANDARD : hasBasic ? PLAN_BASIC : PLAN_BASIC;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
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
    const activePlan = normalizeActivePlan(subs);
    return { currentPlans: subs, activePlan };
  } catch (e) {
    return { currentPlans: [], activePlan: PLAN_BASIC };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const plan = formData.get("plan") as PlanName | null;
  // Build a return URL that works for both classic admin and new admin.shopify.com
  const shopSubdomain = shop.replace(".myshopify.com", "");
  const hostParam = new URL(request.url).searchParams.get("host");
  const hostSuffix = hostParam ? `?host=${hostParam}` : "";
  const adminReturnUrl = `https://admin.shopify.com/store/${shopSubdomain}/apps/crossborderagent/app${hostSuffix}`;

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
      const activePlan = normalizeActivePlan(subs);
      if (activePlan === plan) {
        return null;
      }
    } catch {
      // If billing.check fails, we still proceed (Shopify will handle idempotency / confirmation UI).
    }

    await billing.request({
      plan,
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
  const { activePlan } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const isUpgrading = navigation.state === "submitting";

  const plans = [
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

  return (
    <Page title="Select a Plan" fullWidth>
      <Layout>
        <Layout.Section>
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
            {plans.map((plan) => {
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
                    <Box padding="400" style={{height: 432}}>
                      <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                        {/* Header (fixed) */}
                        <div>
                          <BlockStack gap="200">
                            <Text as="h2" variant="headingLg">
                              <InlineStack gap="200" align="space-between">
                                <span>{plan.name}</span>
                                {isCurrent ? <Badge tone="success">Active</Badge> : null}
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
                              disabled={isCurrent}
                            >
                              {isCurrent ? "Current Plan" : "Upgrade"}
                            </Button>
                          </Form>
                        </div>
                      </div>
                    </Box>
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

