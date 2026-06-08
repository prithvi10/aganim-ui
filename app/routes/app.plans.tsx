import { useTranslation } from "react-i18next";
import { Layout, Page, Text, BlockStack, Button, InlineStack, Banner, Badge, Modal, RadioButton, Divider, Box } from "@shopify/polaris";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, useLoaderData, useLocation, useNavigation, redirect } from "react-router";
import {
  authenticate,
  MONTHLY_PLAN_BASIC,
  MONTHLY_PLAN_STANDARD,
  MONTHLY_PLAN_PRO,
  PROMO_PLAN_BASIC_MONTHLY,
  PROMO_PLAN_STANDARD_MONTHLY,
} from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PlanCard } from "../components/PlanCard";
import { buildPlanCatalog, PLAN_BASIC, PLAN_FREE, PLAN_PRO, PLAN_STANDARD, type PlanName } from "../utils/planCatalog";
import { useCallback, useMemo, useRef, useState } from "react";

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
        process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";
      const usageResp = await fetch(
        `${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(session.shop)}`,
        { headers: { "X-Token-Sync-Secret": process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET || "" } },
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
  // IMPORTANT: Only call authenticate.admin ONCE per request.
  // A second call performs another token exchange which can invalidate the
  // access token from the first call, causing billing.request() to 401.
  const { billing, session, admin } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const url = new URL(request.url);
  const returningPaid = url.searchParams.get("returning_paid") === "1";
  const embeddedParam = url.searchParams.get("embedded");
  const hostParam = url.searchParams.get("host");
  const hasAuthHeader = Boolean(request.headers.get("authorization"));
  // Build a return URL that works for both classic admin and new admin.shopify.com
  const shopSubdomain = shop.replace(".myshopify.com", "");
  const hostSuffix = hostParam ? `?host=${hostParam}` : "";
  const adminReturnUrl = `https://admin.shopify.com/store/${shopSubdomain}/apps/crossborderagent/app${hostSuffix}`;

  // FIX: Read the raw tier name from a dedicated hidden field instead of
  // relying only on the computed billing plan key ("plan").  A DOM / hydration
  // issue in some browsers was causing the wrong form's "plan" value to be
  // submitted (e.g. "Basic Promo Monthly" when clicking Pro's Upgrade button).
  // The "tier" field is always the canonical plan name (Free/Basic/Standard/Pro).
  const tierRaw = String(formData.get("tier") || "").trim();
  const planFieldRaw = String(formData.get("plan") || "").trim();
  const cycleRaw = String(formData.get("cycle") || "").trim();

  // Determine the canonical tier — prefer the explicit "tier" field.
  const requestedTier: PlanName = tierFromPlanName(tierRaw || planFieldRaw);

  // Compute the correct Shopify billing plan key server-side.
  // This ensures we always send the right plan to billing.request()
  // regardless of client-side rendering anomalies.
  let planKey: string;
  const isPromo = cycleRaw === "promo-monthly";
  if (requestedTier === PLAN_PRO) {
    planKey = MONTHLY_PLAN_PRO;
  } else if (requestedTier === PLAN_STANDARD) {
    if (cycleRaw === "promo-monthly") planKey = PROMO_PLAN_STANDARD_MONTHLY;
    else planKey = MONTHLY_PLAN_STANDARD;
  } else if (requestedTier === PLAN_BASIC) {
    if (cycleRaw === "promo-monthly") planKey = PROMO_PLAN_BASIC_MONTHLY;
    else planKey = MONTHLY_PLAN_BASIC;
  } else {
    planKey = planFieldRaw || tierRaw;  // fallback (Free or unknown)
  }
  console.log(`[Plans Action] tier="${tierRaw}" plan="${planFieldRaw}" cycle="${cycleRaw}" → requestedTier="${requestedTier}" planKey="${planKey}"`);

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

      // FIX: Only consider truly ACTIVE subscriptions for the upgrade guard.
      // PENDING subscriptions (from incomplete previous upgrade attempts where the
      // merchant closed the billing confirmation page) must NOT block retries.
      // The loader can still show PENDING as "active" for UI purposes.
      const activeOnlySubs = subs.filter(
        (s) => String(s?.status ?? "").toUpperCase() === "ACTIVE"
      );
      let activePlan = normalizeActivePlan(activeOnlySubs);

      // Grace override: if Shopify thinks "Free" but backend says last paid + grace active,
      // treat that as the effective current plan to prevent re-purchasing the same tier.
      try {
        const backendApiUrl =
          process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";
        const usageResp = await fetch(
          `${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(shop)}`,
          { headers: { "X-Token-Sync-Secret": process.env.TOKEN_SYNC_SECRET_UI || process.env.TOKEN_SYNC_SECRET || "" } },
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
        // The merchant already has this plan on Shopify.  Make sure the
        // backend DB is in sync (the subscription webhook may have failed).
        try {
          const backendApiUrl =
            process.env.BACKEND_API_URL || "https://aganim-api.onrender.com";
          await fetch(
            `${backendApiUrl}/api/admin/sync-plan`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shop,
                plan_name: requestedTier,           // e.g. "Pro"
                subscription_status: "ACTIVE",
              }),
            }
          ).catch(() => {});
          console.log(`[Plans Action] Shopify already has "${requestedTier}" ACTIVE — synced DB.`);
        } catch {
          // best-effort
        }
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
      // FIX: When upgrading from one paid plan to another, tell Shopify to
      // replace the existing subscription immediately (with proration).
      // Without this, the appSubscriptionCreate mutation may fail silently
      // when the merchant already has an active subscription.
      replacementBehavior: "APPLY_IMMEDIATELY",
    } as any);
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function PlansPage() {
  const { activePlan, returningPaid, graceActive, accessExpiresAt, promoEnabled } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const location = useLocation();

  const isUpgrading = navigation.state === "submitting";
  const planCatalog = useMemo(() => buildPlanCatalog(t), [t]);
  const visiblePlans = useMemo(() => planCatalog.filter((p) => p.name !== PLAN_FREE), [planCatalog]);

  const postAction = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    if (!sp.get("embedded")) sp.set("embedded", "1");
    return `${location.pathname}?${sp.toString()}`;
  }, [location.pathname, location.search]);

  const billingOptions = useMemo(() => ({
    [PLAN_BASIC]: { monthly: { price: "$20", key: "Basic Promo Monthly" }, original: null, savings: null },
    [PLAN_STANDARD]: { monthly: { price: "$33", key: "Standard Promo Monthly" }, original: null, savings: null },
    [PLAN_PRO]: { monthly: { price: "$65", key: "Pro" }, original: null, savings: null },
  } as const), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<PlanName | null>(null);
  const [modalCycle, setModalCycle] = useState<"monthly">("monthly");
  const formRef = useRef<HTMLFormElement>(null);

  const openBillingModal = useCallback((planName: PlanName) => {
    setModalPlan(planName);
    setModalCycle("monthly");
    setModalOpen(true);
  }, []);

  const closeBillingModal = useCallback(() => {
    setModalOpen(false);
    setModalPlan(null);
  }, []);

  const confirmBilling = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const modalBillingInfo: any = modalPlan ? (billingOptions as any)[modalPlan] : null;
  const modalPlanKey = modalBillingInfo
    ? modalBillingInfo.monthly.key
    : modalPlan || "";
  const modalCycleValue = modalPlan === PLAN_PRO ? "" : "promo-monthly";

  return (
    <Page title={t("plans.selectPlan")} fullWidth>
      <Layout>
        <Layout.Section>
          {returningPaid ? (
            <div style={{ marginBottom: 16 }}>
              <Banner tone="warning" title={t("plans.welcomeBackSelectPlan")} />
            </div>
          ) : null}
          {graceActive && accessExpiresAt ? (
            <div style={{ marginBottom: 16 }}>
              <Banner tone="info" title={t("plans.gracePeriodActive")}>
                <Text as="p" variant="bodyMd">
                  {t("plans.gracePeriodMessage")}{" "}
                  {new Date(accessExpiresAt).toLocaleDateString()}.
                </Text>
              </Banner>
            </div>
          ) : null}
          {promoEnabled ? (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--p-color-border-subdued)" }}>
              <InlineStack gap="300" blockAlign="start" wrap={false}>
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>&#9432;</span>
                <BlockStack gap="100">
                  <Text as="p" variant="headingSm">{t("plans.limitedTimeOffer")}</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {t("plans.earlyAdopterPricing")}
                  </Text>
                </BlockStack>
              </InlineStack>
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
              const hasBillingOptions =
                plan.name === PLAN_PRO || isPromoEligible;
              const info: any = (billingOptions as any)[plan.name];
              const accentMap: Record<string, string> = {
                [PLAN_BASIC]: "plan-card-accent--basic",
                [PLAN_STANDARD]: "plan-card-accent--standard",
                [PLAN_PRO]: "plan-card-accent--pro",
              };
              const btnGradientMap: Record<string, string> = {
                [PLAN_BASIC]: "plan-upgrade-btn plan-upgrade-btn--basic",
                [PLAN_STANDARD]: "plan-upgrade-btn plan-upgrade-btn--standard",
                [PLAN_PRO]: "plan-upgrade-btn plan-upgrade-btn--pro",
              };
              return (
                <div
                  key={plan.name}
                  style={{
                    minWidth: 320,
                    flex: "1 1 0px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <PlanCard
                    plan={plan}
                    isCurrent={isCurrent}
                    graceActive={Boolean(isCurrent && graceActive)}
                    extraBadges={null}
                    accentClass={accentMap[plan.name]}
                    priceNode={
                      info ? (
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="baseline">
                            <Text as="span" variant="heading2xl" fontWeight="bold">
                              {info.monthly.price}
                            </Text>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              {t("plans.perMonth")}
                            </Text>
                          </InlineStack>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {info.original ? (
                              <>
                                <span style={{ textDecoration: "line-through" }}>
                                  {info.original}{t("plans.perMonth")}
                                </span>
                              </>
                            ) : null}
                          </Text>
                        </BlockStack>
                      ) : undefined
                    }
                    cta={
                      hasBillingOptions && !isCurrent ? (
                        <div className={btnGradientMap[plan.name] || "plan-upgrade-btn"}>
                          <Button
                            variant="primary"
                            loading={isUpgrading && modalPlan === plan.name}
                            disabled={isCurrent}
                            onClick={() => openBillingModal(plan.name as PlanName)}
                          >
                            {t("plans.upgrade")}
                          </Button>
                        </div>
                      ) : (
                        <Form method="post" action={postAction}>
                          <input type="hidden" name="tier" value={plan.name} />
                          <input type="hidden" name="plan" value={plan.name} />
                          <input type="hidden" name="cycle" value="" />
                          <Button
                            variant={isCurrent ? "secondary" : "primary"}
                            fullWidth
                            submit
                            loading={isUpgrading}
                            disabled={isCurrent || plan.name === PLAN_FREE}
                          >
                            {isCurrent ? t("plans.currentPlan") : plan.name === PLAN_FREE ? t("plans.included") : t("plans.upgrade")}
                          </Button>
                        </Form>
                      )
                    }
                  />
                </div>
              );
            })}
            </div>
          </div>
        </Layout.Section>
      </Layout>

      {/* Billing cycle popup for promo-eligible plans */}
      <Modal
        open={modalOpen}
        onClose={closeBillingModal}
        title={`${t("plans.chooseBillingFor")} ${modalPlan || ""}`}
        primaryAction={{
          content: t("plans.continueToBilling"),
          onAction: confirmBilling,
          loading: isUpgrading,
        }}
        secondaryActions={[{ content: t("plans.cancel"), onAction: closeBillingModal }]}
      >
        <Modal.Section>
          {modalBillingInfo ? (
            <BlockStack gap="400">
              <div
                onClick={() => setModalCycle("monthly")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setModalCycle("monthly"); }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: modalCycle === "monthly"
                    ? "2px solid var(--p-color-border-interactive)"
                    : "2px solid var(--p-color-border-subdued)",
                  background: modalCycle === "monthly"
                    ? "var(--p-color-bg-surface-selected)"
                    : "var(--p-color-bg-surface)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <RadioButton
                  label=""
                  checked={modalCycle === "monthly"}
                  onChange={() => setModalCycle("monthly")}
                />
                <BlockStack gap="050">
                  <Text as="span" variant="headingSm">{t("plans.monthly")}</Text>
                  <Text as="span" variant="bodySm" tone="subdued">{t("plans.billedMonthly")}</Text>
                </BlockStack>
                <Text as="span" variant="headingMd" fontWeight="bold">
                  {modalBillingInfo.monthly.price}
                  <Text as="span" variant="bodySm" fontWeight="regular">{t("plans.perMo")}</Text>
                </Text>
              </div>

              {modalBillingInfo.original ? (
                <>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodySm" tone="subdued">{t("plans.regularPrice")}</Text>
                    <Text as="span" variant="bodySm" tone="subdued">
                      <span style={{ textDecoration: "line-through" }}>{modalBillingInfo.original}{t("plans.perMo")}</span>
                    </Text>
                  </InlineStack>
                </>
              ) : null}
            </BlockStack>
          ) : null}
        </Modal.Section>
      </Modal>

      {/* Hidden form for modal submission */}
      {modalPlan ? (
        <Form method="post" action={postAction} ref={formRef} style={{ display: "none" }}>
          <input type="hidden" name="tier" value={modalPlan} />
          <input type="hidden" name="plan" value={modalPlanKey} />
          <input type="hidden" name="cycle" value={modalCycleValue} />
        </Form>
      ) : null}
    </Page>
  );
}

