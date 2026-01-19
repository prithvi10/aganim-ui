import { Layout, Page, Text, BlockStack, Button, InlineStack, Banner, Badge, Select } from "@shopify/polaris";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, useLoaderData, useLocation, useNavigation, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PlanCard } from "../components/PlanCard";
import { PLAN_CATALOG, PLAN_BASIC, PLAN_FREE, PLAN_PRO, PLAN_STANDARD, type PlanName } from "../utils/planCatalog";
import { useMemo, useState } from "react";

type ActiveSub = { name?: string; status?: string; test?: boolean };

function tierFromPlanName(name: string): PlanName {
  const n = String(name ?? "").toLowerCase();
  // IMPORTANT: use word boundaries so "promo" does NOT match "pro"
  if (/\bbasic\b/.test(n)) return PLAN_BASIC;
  if (/\bstandard\b/.test(n)) return PLAN_STANDARD;
  if (/\bpro\b/.test(n)) return PLAN_PRO;
  return PLAN_FREE;
}

function normalizeActivePlan(subs: ActiveSub[] | null | undefined): PlanName {
  const activeNames = (subs ?? [])
    .filter((s) => {
      const st = String(s?.status ?? "").toUpperCase();
      // Shopify can return PENDING briefly right after upgrade; treat as active for UI + guards.
      return !st || st === "ACTIVE" || st === "PENDING";
    })
    .map((s) => String(s?.name ?? "").toLowerCase());

  const hasBasic = activeNames.some((n) => /\bbasic\b/.test(n));
  const hasStandard = activeNames.some((n) => /\bstandard\b/.test(n));
  const hasPro = activeNames.some((n) => /\bpro\b/.test(n));
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
    // Shopify billing is NOT the source of truth for plan display/gating.
    // Keep this only for diagnostics; the highlighted plan is backend effective_plan_name.
    const shopifyActivePlan = normalizeActivePlan(subs);
    let activePlan: PlanName = PLAN_FREE;

    // If grace is active, Shopify will often report no active subscription after uninstall.
    // Use backend usage (last_plan_name) as the effective plan for UI.
    let graceActive = false;
    let accessExpiresAt: string | null = null;
    let lastPlanName: PlanName | null = null;
    let promoEnabled = false;
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
        promoEnabled = Boolean(data.promo_pricing_enabled);
        const last = String(data.last_plan_name || "").trim();
        if (last === PLAN_BASIC || last === PLAN_STANDARD || last === PLAN_PRO) {
          lastPlanName = last as PlanName;
        }
        const eff = String(data.effective_plan_name || data.plan_name || "").trim();
        if (eff === PLAN_BASIC || eff === PLAN_STANDARD || eff === PLAN_PRO || eff === PLAN_FREE) {
          activePlan = eff as PlanName;
        } else if (graceActive && lastPlanName) {
          // Back-compat fallback (older backends)
          activePlan = lastPlanName;
        }
      }
    } catch {
      // ignore
    }

    return { currentPlans: subs, activePlan, returningPaid, graceActive, accessExpiresAt, lastPlanName, promoEnabled };
  } catch (e) {
    return { currentPlans: [], activePlan: PLAN_FREE, returningPaid, graceActive: false, accessExpiresAt: null, lastPlanName: null, promoEnabled: false };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const planKey = String(formData.get("plan") || "").trim();
  const url = new URL(request.url);
  const returningPaid = url.searchParams.get("returning_paid") === "1";
  const embeddedParam = url.searchParams.get("embedded");
  const hostParam = url.searchParams.get("host");
  const hasAuthHeader = Boolean(request.headers.get("authorization"));
  // Build a return URL that works for both classic admin and new admin.shopify.com
  const shopSubdomain = shop.replace(".myshopify.com", "");
  const hostSuffix = hostParam ? `?host=${hostParam}` : "";
  const adminReturnUrl = `https://admin.shopify.com/store/${shopSubdomain}/apps/crossborderagent/app${hostSuffix}`;

  const requestedTier: PlanName = tierFromPlanName(planKey);

  if (requestedTier === PLAN_FREE) {
    // Free is the default tier (no billing flow).
    // If this is a returning paid user, do not allow falling back to Free.
    if (returningPaid) {
      return null;
    }
    return null;
  }
  if (requestedTier === PLAN_BASIC || requestedTier === PLAN_STANDARD || requestedTier === PLAN_PRO) {
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

      if (activePlan === requestedTier) {
        return null;
      }
    } catch {
      // If billing.check fails, we still proceed (Shopify will handle idempotency / confirmation UI).
    }

    // NOTE: In shopify-app-react-router, billing.request throws a redirect Response (out-of-app)
    // and does not return normally.
    // IMPORTANT: return the Response from billing.request so React Router can redirect
    return await billing.request({
      // Shopify types can resolve plan to `never` depending on how billing is typed;
      // we only send known plan strings from our UI.
      plan: planKey as unknown as never,
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
  const { activePlan, returningPaid, graceActive, accessExpiresAt, promoEnabled } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const location = useLocation();

  const isUpgrading = navigation.state === "submitting";
  const visiblePlans = returningPaid ? PLAN_CATALOG.filter((p) => p.name !== PLAN_FREE) : PLAN_CATALOG;

  // IMPORTANT: Shopify billing "exit iframe" redirect requires embedded=1 on the request URL.
  // Some internal links preserve only host/shop; force embedded=1 for POSTs to /app/plans.
  const postAction = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    if (!sp.get("embedded")) sp.set("embedded", "1");
    return `${location.pathname}?${sp.toString()}`;
  }, [location.pathname, location.search]);

  const [billingCycle, setBillingCycle] = useState<Record<string, "monthly" | "annual">>({
    [PLAN_BASIC]: "monthly",
    [PLAN_STANDARD]: "monthly",
  });

  const promo = useMemo(() => {
    return {
      [PLAN_BASIC]: { monthly: { price: "$29", key: "Basic Promo Monthly" }, annual: { price: "$290", key: "Basic Promo Annual" }, original: "$49" },
      [PLAN_STANDARD]: { monthly: { price: "$79", key: "Standard Promo Monthly" }, annual: { price: "$790", key: "Standard Promo Annual" }, original: "$99" },
    } as const;
  }, []);

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
          {promoEnabled ? (
            <div style={{ marginBottom: 16 }}>
              <Banner tone="success" title="Limited time launch offer">
                <Text as="p" variant="bodyMd">
                  Early adopter pricing is available for a limited time. Choose monthly or annual billing on Basic/Standard.
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
              const isPromoEligible =
                promoEnabled && (plan.name === PLAN_BASIC || plan.name === PLAN_STANDARD);
              const cycle = billingCycle[plan.name] || "monthly";
              const promoInfo: any = (promo as any)[plan.name];
              const planKey =
                isPromoEligible && promoInfo
                  ? (cycle === "annual" ? promoInfo.annual.key : promoInfo.monthly.key)
                  : plan.name;
              const displayedPrice =
                isPromoEligible && promoInfo
                  ? (cycle === "annual" ? promoInfo.annual.price : promoInfo.monthly.price)
                  : plan.price;
              const displayedSuffix = isPromoEligible && cycle === "annual" ? "/year" : "/month";
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
                    extraBadges={
                      isPromoEligible && !isCurrent ? <Badge tone="success">Limited time</Badge> : null
                    }
                    priceNode={
                      isPromoEligible && promoInfo ? (
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="baseline">
                            <Text as="span" variant="heading2xl" fontWeight="bold">
                              {displayedPrice}
                            </Text>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              {displayedSuffix}
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="span" variant="bodySm" tone="subdued">
                              <span style={{ textDecoration: "line-through" }}>
                                {promoInfo.original}/month
                              </span>
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {plan.name === PLAN_BASIC ? "Monthly $29 or Annual $290" : "Monthly $79 or Annual $790"}
                            </Text>
                          </InlineStack>
                        </BlockStack>
                      ) : undefined
                    }
                    cta={
                      <BlockStack gap="200">
                        {isPromoEligible && !isCurrent ? (
                          <Select
                            label="Billing"
                            value={cycle}
                            options={[
                              { label: plan.name === PLAN_BASIC ? "Monthly — $29" : "Monthly — $79", value: "monthly" },
                              { label: plan.name === PLAN_BASIC ? "Annual — $290" : "Annual — $790", value: "annual" },
                            ]}
                            onChange={(v) =>
                              setBillingCycle((prev) => ({ ...prev, [plan.name]: v as any }))
                            }
                          />
                        ) : null}
                        <Form method="post" action={postAction}>
                          <input type="hidden" name="plan" value={planKey} />
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
                      </BlockStack>
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

