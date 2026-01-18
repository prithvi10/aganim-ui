import { Layout, Page, Text, BlockStack, Button, InlineStack, Banner } from "@shopify/polaris";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, useLoaderData, useNavigation, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PlanCard } from "../components/PlanCard";
import { PLAN_CATALOG, PLAN_BASIC, PLAN_FREE, PLAN_PRO, PLAN_STANDARD, type PlanName } from "../utils/planCatalog";

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
  const fromDashboard = url.searchParams.get("from") === "dashboard";
  // /app/plans should not be discoverable via nav; allow only via Dashboard,
  // or when the app forces reactivation (returning_paid).
  if (!fromDashboard && !returningPaid) {
    const qs = url.searchParams.toString();
    throw redirect(qs ? `/app/dashboard?${qs}` : "/app/dashboard");
  }
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
  const visiblePlans = returningPaid ? PLAN_CATALOG.filter((p) => p.name !== PLAN_FREE) : PLAN_CATALOG;

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
                  <PlanCard
                    plan={plan}
                    isCurrent={isCurrent}
                    graceActive={Boolean(isCurrent && graceActive)}
                    cta={
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
                    }
                  />
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

