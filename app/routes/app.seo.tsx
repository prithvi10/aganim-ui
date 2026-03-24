import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, useNavigate, useFetcher } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
  Box,
  Select,
  Scrollable,
  Badge,
  Divider,
  Spinner,
  TextField,
  Toast,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "@shopify/polaris-icons";

import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { PlanGateBadge } from "../components/PlanGateBadge";
import { LockedFeatureNotice } from "../components/LockedFeatureNotice";
import { canAccess, formatUsage, type Entitlements, type FeatureUsageMap } from "../utils/entitlements";
import "../styles/optimize-button.css";

type ProductListItem = { id: string; title: string };
type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  seo?: { title?: string | null; description?: string | null } | null;
  seoDataMeta?: { id?: string | null; value?: string | null } | null;
};

type LoaderData = {
  planName: "Free" | "Basic" | "Standard" | "Pro";
  shop: string;
  backendApiUrl: string;
  products: ProductListItem[];
  selectedProduct: SelectedProduct | null;
  entitlements: Entitlements;
  feature_usage: FeatureUsageMap;
  defaultTargetLocale?: string;
};

type SEOResult = {
  seo_title?: string;
  seo_description?: string;
  seo_alt_text?: string;
  seo_insights?: {
    lsi_keywords_used?: string[];
    search_intent?: string;
    competitive_edge?: string;
  };
  ctr_check?: {
    pain_present?: boolean;
    solution_present?: boolean;
    trust_present?: boolean;
    score?: number;
    suggestions?: string[];
  };
  serp_insights?: Array<{
    title?: string;
    snippet?: string;
    link?: string;
    position?: number;
  }>;
};

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return "";
  return String(gid).split("/").pop() ?? "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") || "";
  const selectedProductIdParam = url.searchParams.get("productId") || "";

  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  let sessionShop = "";
  let graphqlQuery: (query: string, variables?: Record<string, unknown>) => Promise<unknown>;

  if (offlineContext) {
    sessionShop = offlineContext.session.shop;
    graphqlQuery = async (query) => {
      const resp = await offlineContext.client.query({ data: query });
      return resp?.body;
    };
  } else {
    const { admin, session } = await authenticate.admin(request);
    sessionShop = session.shop;
    graphqlQuery = async (query, variables) => {
      const resp = await admin.graphql(query, { variables });
      return await resp.json();
    };
  }

  const productsBody = await graphqlQuery(`
    query { products(first: 50, sortKey: UPDATED_AT, reverse: true) { edges { node { id title } } } }
  `) as { data?: { products?: { edges?: Array<{ node: { id: string; title: string } }> } } };
  const products: ProductListItem[] = (productsBody?.data?.products?.edges || [])
    .map((e) => ({ id: e.node.id, title: e.node.title }));

  let selectedProduct: SelectedProduct | null = null;
  let productGid = "";
  if (selectedProductIdParam) {
    productGid = selectedProductIdParam.startsWith("gid://") 
      ? selectedProductIdParam 
      : `gid://shopify/Product/${selectedProductIdParam}`;
  } else if (products[0]?.id) {
    productGid = products[0].id;
  }

  if (productGid) {
    const productQuery = offlineContext
      ? `query { product(id: "${productGid}") { id title descriptionHtml productType seo { title description } seoDataMeta: metafield(namespace: "crossborderagent", key: "seo_data") { id value } } }`
      : `query getProduct($id: ID!) { product(id: $id) { id title descriptionHtml productType seo { title description } seoDataMeta: metafield(namespace: "crossborderagent", key: "seo_data") { id value } } }`;
    
    const productBody = await graphqlQuery(productQuery, { id: productGid }) as { data?: { product?: { id: string; title: string; descriptionHtml: string; productType: string; seo?: { title?: string | null; description?: string | null } | null; seoDataMeta?: { id?: string | null; value?: string | null } | null } } };
    const p = productBody?.data?.product;
    if (p) {
      selectedProduct = {
        id: p.id,
        title: p.title,
        descriptionHtml: p.descriptionHtml || "",
        productType: p.productType || "",
        seo: p.seo || null,
        seoDataMeta: p.seoDataMeta || null,
      };
    }
  }

  const session = { shop: sessionShop };
  let planName: LoaderData["planName"] = "Free";
  const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";

  let entitlements: Entitlements = {};
  let feature_usage: FeatureUsageMap = {};
  let defaultTargetLocale: string | undefined = undefined;
  try {
    const usageResp = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(session.shop)}`);
    if (usageResp.ok) {
      const data = await usageResp.json();
      const eff = String(data.effective_plan_name || data.plan_name || "").trim();
      if (eff === "Basic" || eff === "Standard" || eff === "Pro") planName = eff as LoaderData["planName"];
      entitlements = data.entitlements || {};
      feature_usage = data.feature_usage || {};
      defaultTargetLocale = data.default_target_locale ?? undefined;
    }
  } catch { /* ignore */ }

  return {
    planName,
    shop: session.shop,
    backendApiUrl,
    products,
    selectedProduct,
    entitlements,
    feature_usage,
    defaultTargetLocale,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  const { admin } = await authenticate.admin(request);

  if (intent === "save_seo") {
    const productId = String(formData.get("productId") || "");
    const seoTitle = String(formData.get("seoTitle") || "");
    const seoDescription = String(formData.get("seoDescription") || "");

    if (!productId) return { ok: false, error: "Missing productId" };

    // Update product SEO fields
    const resp = await admin.graphql(
      `mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id }
          userErrors { message }
        }
      }`,
      {
        variables: {
          input: {
            id: productId,
            ...((seoTitle || seoDescription)
              ? { seo: { title: seoTitle || null, description: seoDescription || null } }
              : {}),
          },
        },
      },
    );
    const body = await resp.json();
    const errors = body?.data?.productUpdate?.userErrors ?? [];
    if (errors.length > 0) {
      return { ok: false, error: errors[0]?.message ?? "Unknown error" };
    }

    // Also save to metafield for consistency
    try {
      const seoData = {
        seo_title: seoTitle,
        seo_description: seoDescription,
      };
      await admin.graphql(
        `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id }
            userErrors { field message }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                ownerId: productId,
                namespace: "crossborderagent",
                key: "seo_data",
                type: "json",
                value: JSON.stringify(seoData),
              },
            ],
          },
        },
      );
    } catch {
      // best-effort
    }

    return { ok: true };
  }

  return { ok: false, error: "Unknown intent" };
};

/**
 * Google Search Engine Preview Card
 */
function SearchEnginePreview({
  title,
  url,
  snippet,
  rank,
  isYours,
}: {
  title: string;
  url: string;
  snippet: string;
  rank?: number;
  isYours?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Box
      padding="300"
      background={isYours ? "bg-surface" : "bg-surface-secondary"}
      borderRadius="200"
      borderColor={isYours ? "border-success" : undefined}
      borderWidth={isYours ? "025" : undefined}
    >
      <BlockStack gap="100">
        {rank !== undefined && (
          <Text as="span" variant="bodySm" tone="subdued">#{rank}</Text>
        )}
        <div style={{ color: "#1a0dab", fontSize: 18, fontWeight: 400, lineHeight: "1.3" }}>
          {title || t("seo.seoTitlePreview")}
        </div>
        <div style={{ color: "#006621", fontSize: 13 }}>{url}</div>
        <div style={{ color: "#545454", fontSize: 14, lineHeight: "1.5" }}>
          {snippet || t("seo.metaDescriptionPreview")}
        </div>
      </BlockStack>
    </Box>
  );
}

/**
 * CTR Score Display with traffic light indicators
 */
function CTRScoreDisplay({ ctrCheck }: { ctrCheck: SEOResult["ctr_check"] }) {
  const { t } = useTranslation();
  if (!ctrCheck) return null;

  const Light = ({ active, color }: { active: boolean; color: string }) => (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        display: "inline-block",
        background: active ? color : "#ddd",
        boxShadow: active ? `0 0 0 2px ${color}40` : undefined,
      }}
    />
  );

  const Row = ({ label, active, hint }: { label: string; active: boolean; hint: string }) => (
    <InlineStack align="space-between" blockAlign="center">
      <InlineStack gap="200" blockAlign="center">
        <Light active={active} color={active ? "var(--p-color-bg-fill-success)" : "var(--p-color-bg-fill-critical)"} />
        <Text as="span" variant="bodySm">{label}</Text>
      </InlineStack>
      <Text as="span" variant="bodySm" tone="subdued">{hint}</Text>
    </InlineStack>
  );

  return (
    <BlockStack gap="200">
      <Row label={t("seo.pstCheck")} active={ctrCheck.pain_present || false} hint={ctrCheck.pain_present ? t("seo.ok") : t("seo.addProblemQuestion")} />
      <Row label={t("seo.solution")} active={ctrCheck.solution_present || false} hint={ctrCheck.solution_present ? t("seo.ok") : t("seo.addBenefitSpec")} />
      <Row label={t("seo.trust")} active={ctrCheck.trust_present || false} hint={ctrCheck.trust_present ? t("seo.ok") : t("seo.addTrustCue")} />
      <Divider />
      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" variant="bodySm" fontWeight="semibold">{t("seo.ctrScore")}</Text>
        <Badge tone={ctrCheck.score && ctrCheck.score >= 0.7 ? "success" : ctrCheck.score && ctrCheck.score >= 0.4 ? "warning" : "critical"}>
          {Math.round((ctrCheck.score || 0) * 100)}%
        </Badge>
      </InlineStack>
    </BlockStack>
  );
}

export default function SEOPage() {
  const { t } = useTranslation();
  const { shop, backendApiUrl, products, selectedProduct, entitlements, feature_usage, defaultTargetLocale } = useLoaderData<typeof loader>();
  const seoLocked = !canAccess(entitlements, "seo");
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge() as unknown as Parameters<typeof getSessionToken>[0];
  const navigate = useNavigate();
  const saveFetcher = useFetcher<typeof action>();
  
  const nav = (path: string) => {
    const [basePath, existingQs] = path.split('?');
    const params = new URLSearchParams(existingQs || '');
    const sp = new URLSearchParams(searchParams);
    sp.forEach((v, k) => { if (!params.has(k)) params.set(k, v); });
    if (shop) params.set("shop", shop);
    return params.toString() ? `${basePath}?${params.toString()}` : basePath;
  };

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [seoResult, setSeoResult] = useState<SEOResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingSeo, setIsEditingSeo] = useState(false);
  const [editedSeoTitle, setEditedSeoTitle] = useState("");
  const [editedSeoDescription, setEditedSeoDescription] = useState("");
  const [toastContent, setToastContent] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleProductChange = useCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("productId", productIdFromGid(value));
    setSearchParams(newParams);
    setSeoResult(null);
  }, [searchParams, setSearchParams]);

  const handleOptimize = useCallback(async () => {
    if (!selectedProduct) return;
    setIsOptimizing(true);
    setError(null);
    setSeoResult(null);

    let token: string | null = null;
    try {
      token = await getSessionToken(app);
    } catch {
      token = null;
    }

    try {
      // Use synchronous /api/agent endpoint - no DB storage
      const url = new URL(`${backendApiUrl}/api/agent`);
      if (!token && shop) {
        url.searchParams.set("shop", shop);
      }
      
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "seo_optimize",
          product_data: {
            title: selectedProduct.title,
            description: selectedProduct.descriptionHtml,
            category: selectedProduct.productType || "General",
          },
          context: {
            target_locale: defaultTargetLocale || "en",
          },
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      const metadata = data?.data?.metadata || {};
      
      const newSeoResult = {
        seo_title: metadata.seo_title,
        seo_description: metadata.seo_description,
        seo_alt_text: metadata.seo_alt_text,
        seo_insights: metadata.seo_insights,
        ctr_check: metadata.ctr_check,
        serp_insights: metadata.serp_insights,
      };
      setSeoResult(newSeoResult);
      setEditedSeoTitle(metadata.seo_title || "");
      setEditedSeoDescription(metadata.seo_description || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize SEO");
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedProduct, backendApiUrl, app, shop]);

  // Load cached SEO data when product changes
  useEffect(() => {
    if (!selectedProduct?.id) {
      setSeoResult(null);
      setEditedSeoTitle("");
      setEditedSeoDescription("");
      return;
    }

    // Try to load from metafield first
    let cachedSeo: SEOResult | null = null;
    if (selectedProduct.seoDataMeta?.value) {
      try {
        const parsed = JSON.parse(selectedProduct.seoDataMeta.value);
        if (parsed.seo_title || parsed.seo_description) {
          cachedSeo = {
            seo_title: parsed.seo_title || selectedProduct.seo?.title || undefined,
            seo_description: parsed.seo_description || selectedProduct.seo?.description || undefined,
            seo_alt_text: parsed.seo_alt_text || undefined,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Fallback to product SEO fields if metafield not available
    if (!cachedSeo && (selectedProduct.seo?.title || selectedProduct.seo?.description)) {
      cachedSeo = {
        seo_title: selectedProduct.seo.title || undefined,
        seo_description: selectedProduct.seo.description || undefined,
      };
    }

    if (cachedSeo) {
      setSeoResult(cachedSeo);
      setEditedSeoTitle(cachedSeo.seo_title || "");
      setEditedSeoDescription(cachedSeo.seo_description || "");
    } else {
      setSeoResult(null);
      setEditedSeoTitle("");
      setEditedSeoDescription("");
    }
  }, [selectedProduct?.id, selectedProduct?.seoDataMeta?.value, selectedProduct?.seo]);

  // Sync edited values when seoResult changes (from new generation)
  useEffect(() => {
    if (seoResult?.seo_title) setEditedSeoTitle(seoResult.seo_title);
    if (seoResult?.seo_description) setEditedSeoDescription(seoResult.seo_description);
  }, [seoResult?.seo_title, seoResult?.seo_description]);

  // Handle save response
  useEffect(() => {
    if (saveFetcher.data) {
      if (saveFetcher.data.ok) {
        setToastContent(t("seo.seoMetadataSaved"));
        setIsSaved(true);
      } else {
        setError(saveFetcher.data.error || "Failed to save SEO metadata");
        setIsSaved(false);
      }
    }
  }, [saveFetcher.data]);

  // Reset saved state when SEO result changes or product changes
  useEffect(() => {
    setIsSaved(false);
  }, [seoResult, selectedProduct?.id]);

  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));
  const plainTextContent = selectedProduct ? stripHtml(selectedProduct.descriptionHtml) : "";

  return (
    <Page 
      title={t("seo.seoOptimization")}
      subtitle={t("seo.seoSubtitle")}
      titleMetadata={seoLocked ? <PlanGateBadge tierName="Standard" /> : undefined}
      backAction={{
        content: t("seo.home"),
        onAction: () => navigate(nav("/app")),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {seoLocked ? (
              <LockedFeatureNotice
                title={t("seo.standardPlanFeature")}
                description={t("seo.seoRequiresStandard")}
                ctaLabel={t("seo.upgrade")}
                ctaUrl={nav("/app/plans?from=dashboard")}
              />
            ) : (
              <>
            {formatUsage(feature_usage.seo) && (
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  {t("seo.seoUsage")} {formatUsage(feature_usage.seo)}
                </Text>
              </InlineStack>
            )}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">{t("seo.selectProduct")}</Text>
                <Select label={t("seo.product")} labelHidden options={productOptions} value={selectedProduct?.id || ""} onChange={handleProductChange} />
                {selectedProduct && (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="agent-btn-border-6">
                      <Button variant="primary" size="large" onClick={handleOptimize} loading={isOptimizing} disabled={!selectedProduct || isOptimizing}>
                        {t("seo.optimizeSeo")}
                      </Button>
                    </div>
                  </div>
                )}
              </BlockStack>
            </Card>

            {error && <Banner tone="critical" title={t("seo.error")} onDismiss={() => setError(null)}><p>{error}</p></Banner>}

            {isOptimizing && (
              <Card>
                <Box padding="600">
                  <BlockStack gap="400" align="center">
                    <Spinner size="large" />
                    <Text variant="headingSm" as="h3" alignment="center">{t("seo.optimizingSeo")}</Text>
                    <Text variant="bodySm" tone="subdued" alignment="center">
                      {t("seo.analyzingCompetitors")}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {seoResult && (
              <BlockStack gap="400">
                {/* Competitor Ranks */}
                {seoResult.serp_insights && seoResult.serp_insights.length > 0 && (
                  <Card>
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">{t("seo.top3Ranks")}</Text>
                      <BlockStack gap="200">
                        {seoResult.serp_insights.slice(0, 3).map((r, i) => (
                          <SearchEnginePreview
                            key={`comp-${i}`}
                            title={r.title || "—"}
                            url={r.link || ""}
                            snippet={r.snippet || "—"}
                            rank={r.position}
                          />
                        ))}
                      </BlockStack>
                    </BlockStack>
                  </Card>
                )}

                {/* Your Product SEO Preview */}
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h2">{t("seo.yourProductSeoPreview")}</Text>
                      <InlineStack gap="200">
                        <Badge tone="success">{t("seo.optimized")}</Badge>
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditingSeo(!isEditingSeo)}
                        >
                          {isEditingSeo ? t("seo.doneEditing") : t("seo.editSeo")}
                        </Button>
                      </InlineStack>
                    </InlineStack>

                    {/* Editable SEO Fields */}
                    {isEditingSeo && (
                      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="400">
                          <TextField
                            label={t("seo.seoTitle")}
                            value={editedSeoTitle}
                            onChange={setEditedSeoTitle}
                            autoComplete="off"
                            helpText={`${editedSeoTitle.length}/60 ${t("seo.charactersRecommended")}`}
                            maxLength={70}
                          />
                          <TextField
                            label={t("seo.seoDescription")}
                            value={editedSeoDescription}
                            onChange={setEditedSeoDescription}
                            autoComplete="off"
                            multiline={3}
                            helpText={`${editedSeoDescription.length}/160 ${t("seo.charactersRecommended")}`}
                            maxLength={200}
                          />
                        </BlockStack>
                      </Box>
                    )}

                    <SearchEnginePreview
                      title={isEditingSeo ? editedSeoTitle : (seoResult.seo_title || t("seo.yourSeoTitle"))}
                      url={`https://${shop}/products/${productIdFromGid(selectedProduct?.id)}`}
                      snippet={isEditingSeo ? editedSeoDescription : (seoResult.seo_description || t("seo.yourSeoDescription"))}
                      isYours
                    />
                    {seoResult.seo_alt_text && (
                      <Box paddingBlockStart="100">
                        <Text as="p" variant="bodySm" tone="subdued">
                          <strong>{t("seo.altText")}</strong> {seoResult.seo_alt_text}
                        </Text>
                      </Box>
                    )}
                  </BlockStack>
                </Card>

                {/* CTR Optimization Score */}
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">{t("seo.ctrOptimizationScore")}</Text>
                    <CTRScoreDisplay ctrCheck={seoResult.ctr_check} />
                    {seoResult.ctr_check?.suggestions && seoResult.ctr_check.suggestions.length > 0 && (
                      <Box paddingBlockStart="200">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">{t("seo.suggestions")}</Text>
                          {seoResult.ctr_check.suggestions.map((s, i) => (
                            <Text key={i} as="p" variant="bodySm" tone="subdued">• {s}</Text>
                          ))}
                        </BlockStack>
                      </Box>
                    )}
                  </BlockStack>
                </Card>

                {/* SEO Insights */}
                {seoResult.seo_insights && (
                  <Card>
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">{t("seo.seoInsights")}</Text>
                      {seoResult.seo_insights.lsi_keywords_used && seoResult.seo_insights.lsi_keywords_used.length > 0 && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">{t("seo.lsiKeywordsUsed")}</Text>
                          <InlineStack gap="100" wrap>
                            {seoResult.seo_insights.lsi_keywords_used.map((kw, i) => (
                              <Badge key={i} tone="info">{kw}</Badge>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      )}
                      {seoResult.seo_insights.search_intent && (
                        <InlineStack gap="200">
                          <Text as="p" variant="bodySm" fontWeight="semibold">{t("seo.searchIntent")}</Text>
                          <Badge>{seoResult.seo_insights.search_intent}</Badge>
                        </InlineStack>
                      )}
                      {seoResult.seo_insights.competitive_edge && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">{t("seo.competitiveEdge")}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{seoResult.seo_insights.competitive_edge}</Text>
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Card>
                )}
              </BlockStack>
            )}

            {seoResult === null && !isOptimizing && (
              <Card>
                <Box padding="600">
                  <BlockStack gap="300" align="center">
                    <Text variant="headingMd" as="h3" alignment="center">{t("seo.readyToOptimize")}</Text>
                    <Text variant="bodyMd" tone="subdued" alignment="center">
                      {t("seo.readyToOptimizeDesc")}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {/* Save Button */}
            {seoResult && selectedProduct && (
              <Card>
                <Box padding="400">
                  <saveFetcher.Form method="post">
                    <input type="hidden" name="intent" value="save_seo" />
                    <input type="hidden" name="productId" value={selectedProduct.id} />
                    <input type="hidden" name="seoTitle" value={editedSeoTitle} />
                    <input type="hidden" name="seoDescription" value={editedSeoDescription} />
                    <Button
                      size="large"
                      variant={isSaved ? "secondary" : "primary"}
                      fullWidth
                      submit
                      disabled={
                        !selectedProduct ||
                        saveFetcher.state !== "idle" ||
                        isOptimizing ||
                        isSaved
                      }
                      icon={isSaved ? CheckIcon : undefined}
                      tone={isSaved ? "success" : undefined}
                    >
                      {isSaved ? t("seo.saved") : t("seo.save")}
                    </Button>
                  </saveFetcher.Form>
                </Box>
              </Card>
            )}
              </>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}
    </Page>
  );
}
