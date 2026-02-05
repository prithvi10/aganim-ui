import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, useNavigate } from "react-router";
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
  Badge,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useState, useCallback } from "react";

import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { MissionTimeline, type MissionState } from "../components/MissionTimeline";

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

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return "";
  return String(gid).split("/").pop() ?? "";
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
  // Handle both numeric ID and full GID formats
  let productGid = "";
  if (selectedProductIdParam) {
    productGid = selectedProductIdParam.startsWith("gid://") 
      ? selectedProductIdParam 
      : `gid://shopify/Product/${selectedProductIdParam}`;
  } else if (products[0]?.id) {
    productGid = products[0].id;
  }

  if (productGid) {
    // For offline client, inline the ID since it doesn't support variables
    const productQuery = offlineContext
      ? `query { product(id: "${productGid}") { id title descriptionHtml productType } }`
      : `query getProduct($id: ID!) { product(id: $id) { id title descriptionHtml productType } }`;
    
    const productBody = await graphqlQuery(productQuery, { id: productGid }) as { data?: { product?: { id: string; title: string; descriptionHtml: string; productType: string } } };
    const p = productBody?.data?.product;
    if (p) {
      selectedProduct = { id: p.id, title: p.title, descriptionHtml: p.descriptionHtml || "", productType: p.productType || "" };
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

export default function OptimizePage() {
  const { planName, shop, backendApiUrl, products, selectedProduct } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const app = useAppBridge() as unknown as Parameters<typeof getSessionToken>[0];

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalState, setFinalState] = useState<MissionState | null>(null);

  const handleProductChange = useCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("productId", productIdFromGid(value));
    setSearchParams(newParams);
    setMissionId(null);
    setFinalState(null);
  }, [searchParams, setSearchParams]);

  const handleOptimize = useCallback(async () => {
    if (!selectedProduct) return;
    setIsOptimizing(true);
    setError(null);
    setFinalState(null);

    let token: string | null = null;
    try {
      token = await getSessionToken(app);
    } catch {
      token = null;
    }

    try {
      // Include shop param as fallback authentication when token isn't available
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
          // No requested_agents = full workflow based on plan tier
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setMissionId(data.mission_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start optimization");
      setIsOptimizing(false);
    }
  }, [selectedProduct, backendApiUrl, app, shop]);

  const handleMissionComplete = useCallback((state: MissionState) => {
    setIsOptimizing(false);
    setFinalState(state);
  }, []);

  const handlePublish = useCallback(async (state: MissionState) => {
    // TODO: Implement publishing logic via Shopify API
    console.log("Publishing state:", state);
    alert("Changes would be published to Shopify!");
  }, []);

  const handleDiscard = useCallback(() => {
    setMissionId(null);
    setFinalState(null);
  }, []);

  const handleEdit = useCallback((state: MissionState) => {
    // Navigate to rewriter with the draft content
    const params = new URLSearchParams(searchParams);
    params.set("productId", productIdFromGid(selectedProduct?.id));
    navigate(`/app/rewriter?${params.toString()}`);
  }, [navigate, searchParams, selectedProduct]);

  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));

  // Get workflow description based on plan
  const getWorkflowDescription = () => {
    return "Rewriter → SEO → Marketing → Pricing";
  };

  return (
    <Page
      title="Optimize using AI"
      subtitle="Run the full AI optimization workflow on your product"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Product Selection Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h2">Select Product to Optimize</Text>
                  <Badge tone="info">{planName} Plan</Badge>
                </InlineStack>

                <Select label="Product" labelHidden options={productOptions} value={selectedProduct?.id || ""} onChange={handleProductChange} />

                {selectedProduct && !missionId && (
                  <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="300">
                      <Text variant="headingSm" as="h3">{selectedProduct.title}</Text>
                      <Text variant="bodySm" tone="subdued">Category: {selectedProduct.productType || "General"}</Text>

                      <InlineStack gap="200" align="start">
                        <Text variant="bodySm" fontWeight="semibold">Workflow:</Text>
                        <Text variant="bodySm" tone="subdued">{getWorkflowDescription()}</Text>
                      </InlineStack>

                      <Button variant="primary" onClick={handleOptimize} loading={isOptimizing} disabled={!selectedProduct || isOptimizing} fullWidth>
                        Start AI Optimization
                      </Button>
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            </Card>

            {/* Error Banner */}
            {error && <Banner tone="critical" title="Optimization Error" onDismiss={() => setError(null)}><p>{error}</p></Banner>}

            {/* Mission Timeline - Step-by-step mode for merchant control */}
            {missionId && (
              <MissionTimeline
                missionId={missionId}
                apiBaseUrl={backendApiUrl}
                shop={shop}
                onComplete={handleMissionComplete}
                onError={(err) => { setError(err); setIsOptimizing(false); }}
                onPublish={handlePublish}
                onDiscard={handleDiscard}
                onEdit={handleEdit}
                showSummary={true}
                stepMode={true}
                onStepApprove={() => console.log("[Optimize] Step approved")}
                onStepRegenerate={(feedback) => console.log("[Optimize] Step regenerated with feedback:", feedback)}
                onStepSkip={() => console.log("[Optimize] Step skipped")}
              />
            )}

            {/* Empty State */}
            {!missionId && !isOptimizing && (
              <Card>
                <Box padding="600">
                  <BlockStack gap="400" align="center">
                    <Text variant="headingLg" as="h2" alignment="center">AI-Powered Product Optimization</Text>
                    <Text variant="bodyMd" tone="subdued" alignment="center">
                      Our AI agents will work together to optimize your product listing.
                      You control the journey - approve, regenerate, or skip each step.
                    </Text>

                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">1</Badge>
                        <Text variant="bodyMd"><strong>Rewriter</strong> - Rewrites your description with brand voice</Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">2</Badge>
                        <Text variant="bodyMd"><strong>SEO</strong> - Optimizes title, description, and analyzes CTR</Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">3</Badge>
                        <Text variant="bodyMd"><strong>Marketing</strong> - Creates social media hooks and captions</Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">4</Badge>
                        <Text variant="bodyMd"><strong>Pricing</strong> - Analyzes competitors and suggests pricing</Text>
                      </InlineStack>
                    </BlockStack>

                    <Box paddingBlockStart="200">
                      <Banner tone="info">
                        <Text variant="bodySm">
                          After each agent completes, you can:
                          <strong> Approve</strong> to continue,
                          <strong> Regenerate</strong> with feedback, or
                          <strong> Skip</strong> the step entirely.
                        </Text>
                      </Banner>
                    </Box>

                    <Text variant="bodySm" tone="subdued" alignment="center">
                      Select a product above to begin the optimization journey.
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
