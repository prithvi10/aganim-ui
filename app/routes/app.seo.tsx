import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
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
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useState, useCallback } from "react";

import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { MissionTimeline } from "../components/MissionTimeline";

type ProductListItem = { id: string; title: string };
type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
};

type LoaderData = {
  planName: "Free" | "Basic" | "Standard" | "Pro";
  shop: string;
  backendApiUrl: string;
  products: ProductListItem[];
  selectedProduct: SelectedProduct | null;
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
      ? `query { product(id: "${productGid}") { id title descriptionHtml productType } }`
      : `query getProduct($id: ID!) { product(id: $id) { id title descriptionHtml productType } }`;
    
    const productBody = await graphqlQuery(productQuery, { id: productGid }) as { data?: { product?: { id: string; title: string; descriptionHtml: string; productType: string } } };
    const p = productBody?.data?.product;
    if (p) {
      selectedProduct = {
        id: p.id,
        title: p.title,
        descriptionHtml: p.descriptionHtml || "",
        productType: p.productType || "",
      };
    }
  }

  const session = { shop: sessionShop };
  let planName: LoaderData["planName"] = "Free";
  const backendApiUrl = process.env.BACKEND_API_URL || "https://shopify-translator-api.onrender.com";

  try {
    const usageResp = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(session.shop)}`);
    if (usageResp.ok) {
      const data = await usageResp.json();
      const eff = String(data.effective_plan_name || data.plan_name || "").trim();
      if (eff === "Basic" || eff === "Standard" || eff === "Pro") planName = eff as LoaderData["planName"];
    }
  } catch { /* ignore */ }

  return { planName, shop: session.shop, backendApiUrl, products, selectedProduct };
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
          {title || "SEO title preview…"}
        </div>
        <div style={{ color: "#006621", fontSize: 13 }}>{url}</div>
        <div style={{ color: "#545454", fontSize: 14, lineHeight: "1.5" }}>
          {snippet || "Meta description preview…"}
        </div>
      </BlockStack>
    </Box>
  );
}

/**
 * CTR Score Display with traffic light indicators
 */
function CTRScoreDisplay({ ctrCheck }: { ctrCheck: SEOResult["ctr_check"] }) {
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
      <Row label="PST Check" active={ctrCheck.pain_present || false} hint={ctrCheck.pain_present ? "OK" : "Add problem/question"} />
      <Row label="Solution" active={ctrCheck.solution_present || false} hint={ctrCheck.solution_present ? "OK" : "Add benefit + spec"} />
      <Row label="Trust" active={ctrCheck.trust_present || false} hint={ctrCheck.trust_present ? "OK" : "Add trust cue"} />
      <Divider />
      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" variant="bodySm" fontWeight="semibold">CTR Score</Text>
        <Badge tone={ctrCheck.score && ctrCheck.score >= 0.7 ? "success" : ctrCheck.score && ctrCheck.score >= 0.4 ? "warning" : "critical"}>
          {Math.round((ctrCheck.score || 0) * 100)}%
        </Badge>
      </InlineStack>
    </BlockStack>
  );
}

export default function SEOPage() {
  const { shop, backendApiUrl, products, selectedProduct } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge() as unknown as Parameters<typeof getSessionToken>[0];

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [seoResult, setSeoResult] = useState<SEOResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProductChange = useCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("productId", productIdFromGid(value));
    setSearchParams(newParams);
    setSeoResult(null);
    setMissionId(null);
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
      const url = new URL(`${backendApiUrl}/api/missions`);
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
          product_id: productIdFromGid(selectedProduct.id),
          product_name: selectedProduct.title,
          japanese_description: selectedProduct.descriptionHtml,
          category: selectedProduct.productType || "General",
          target_locale: "en",
          requested_agents: ["SEOAgent"],
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setMissionId(data.mission_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start SEO optimization");
      setIsOptimizing(false);
    }
  }, [selectedProduct, backendApiUrl, app, shop]);

  const handleMissionComplete = useCallback((state: any) => {
    setIsOptimizing(false);
    setSeoResult({
      seo_title: state.seo_title,
      seo_description: state.seo_description,
      seo_alt_text: state.seo_alt_text,
      seo_insights: state.seo_insights,
      ctr_check: state.ctr_check,
      serp_insights: state.serp_insights,
    });
  }, []);

  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));
  const plainTextContent = selectedProduct ? stripHtml(selectedProduct.descriptionHtml) : "";

  return (
    <Page title="SEO Optimization" subtitle="Generate SEO metadata and analyze competitors">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Select Product</Text>
                <Select label="Product" labelHidden options={productOptions} value={selectedProduct?.id || ""} onChange={handleProductChange} />
                {selectedProduct && (
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text variant="headingSm" as="h3">{selectedProduct.title}</Text>
                      <Text variant="bodySm" tone="subdued">{selectedProduct.productType || "No category"}</Text>
                    </BlockStack>
                    <Button variant="primary" onClick={handleOptimize} loading={isOptimizing} disabled={!selectedProduct || isOptimizing}>
                      Optimize SEO
                    </Button>
                  </InlineStack>
                )}
              </BlockStack>
            </Card>

            {error && <Banner tone="critical" title="Error" onDismiss={() => setError(null)}><p>{error}</p></Banner>}

            {missionId && isOptimizing && (
              <MissionTimeline missionId={missionId} apiBaseUrl={backendApiUrl} shop={shop} initialAgents={["SEOAgent"]}
                onComplete={handleMissionComplete} onError={(err) => { setError(err); setIsOptimizing(false); }} showSummary={false} compact />
            )}

            {seoResult && (
              <BlockStack gap="400">
                {/* Competitor Ranks */}
                {seoResult.serp_insights && seoResult.serp_insights.length > 0 && (
                  <Card>
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Top 3 Ranks on Google Search</Text>
                      <BlockStack gap="200">
                        {seoResult.serp_insights.slice(0, 3).map((r, i) => (
                          <SearchEnginePreview
                            key={`comp-${i}`}
                            title={r.title || "—"}
                            url={r.link || "https://example.com"}
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
                      <Text variant="headingMd" as="h2">Your Product (SEO Preview)</Text>
                      <Badge tone="success">Optimized</Badge>
                    </InlineStack>
                    <SearchEnginePreview
                      title={seoResult.seo_title || "Your SEO Title"}
                      url={`https://${shop}/products/${productIdFromGid(selectedProduct?.id)}`}
                      snippet={seoResult.seo_description || "Your SEO description will appear here..."}
                      isYours
                    />
                    {seoResult.seo_alt_text && (
                      <Box paddingBlockStart="100">
                        <Text as="p" variant="bodySm" tone="subdued">
                          <strong>Alt Text:</strong> {seoResult.seo_alt_text}
                        </Text>
                      </Box>
                    )}
                  </BlockStack>
                </Card>

                {/* CTR Optimization Score */}
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">CTR Optimization Score</Text>
                    <CTRScoreDisplay ctrCheck={seoResult.ctr_check} />
                    {seoResult.ctr_check?.suggestions && seoResult.ctr_check.suggestions.length > 0 && (
                      <Box paddingBlockStart="200">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">Suggestions:</Text>
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
                      <Text variant="headingMd" as="h2">SEO Insights</Text>
                      {seoResult.seo_insights.lsi_keywords_used && seoResult.seo_insights.lsi_keywords_used.length > 0 && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">LSI Keywords Used:</Text>
                          <InlineStack gap="100" wrap>
                            {seoResult.seo_insights.lsi_keywords_used.map((kw, i) => (
                              <Badge key={i} tone="info">{kw}</Badge>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      )}
                      {seoResult.seo_insights.search_intent && (
                        <InlineStack gap="200">
                          <Text as="p" variant="bodySm" fontWeight="semibold">Search Intent:</Text>
                          <Badge>{seoResult.seo_insights.search_intent}</Badge>
                        </InlineStack>
                      )}
                      {seoResult.seo_insights.competitive_edge && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">Competitive Edge:</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{seoResult.seo_insights.competitive_edge}</Text>
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Card>
                )}
              </BlockStack>
            )}

            {!missionId && seoResult === null && !isOptimizing && (
              <Card>
                <Box padding="600">
                  <BlockStack gap="300" align="center">
                    <Text variant="headingMd" as="h3" alignment="center">Ready to Optimize</Text>
                    <Text variant="bodyMd" tone="subdued" alignment="center">
                      Select a product and click "Optimize SEO" to generate SEO metadata, analyze competitors, and check your CTR score.
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
