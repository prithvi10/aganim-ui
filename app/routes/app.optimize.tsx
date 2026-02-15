import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, useNavigate } from "react-router";
import {
  Page,
  Layout,
  BlockStack,
  Text,
  Banner,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useState, useCallback } from "react";

import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { MissionTimeline, type MissionState } from "../components/MissionTimeline";
import { MissionSummary } from "../components/MissionSummary";
import { MissionHistory } from "../components/MissionHistory";
import {
  MissionArchitect,
  type WorkflowStep,
  type MissionExtraContext,
} from "../components/MissionArchitect";
import "../styles/optimize-button.css";

type ProductListItem = { id: string; title: string };

// Saved mission data from Shopify metafields (crossborder_agent namespace)
type SavedMissionData = {
  social_hooks?: Array<{
    type?: string;
    caption?: string;
    hashtags?: string[];
    overlay?: string;
    copy_text?: string;
  }>;
  pricing_analysis?: {
    recommended_price?: number;
    price_position?: string;
    confidence?: number;
    reasoning?: string;
  };
  seo_data?: {
    seo_title?: string;
    seo_description?: string;
    seo_alt_text?: string;
  };
};

type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  savedMissionData: SavedMissionData | null;
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
      ? `query { product(id: "${productGid}") { id title descriptionHtml productType metafields(first: 10, namespace: "crossborder_agent") { edges { node { key value } } } } }`
      : `query getProduct($id: ID!) { product(id: $id) { id title descriptionHtml productType metafields(first: 10, namespace: "crossborder_agent") { edges { node { key value } } } } }`;
    
    type ProductQueryResult = {
      data?: {
        product?: {
          id: string;
          title: string;
          descriptionHtml: string;
          productType: string;
          metafields?: {
            edges?: Array<{ node: { key: string; value: string } }>;
          };
        };
      };
    };
    
    const productBody = await graphqlQuery(productQuery, { id: productGid }) as ProductQueryResult;
    const p = productBody?.data?.product;
    if (p) {
      const metafields = p.metafields?.edges || [];
      const savedMissionData: SavedMissionData = {};
      
      for (const edge of metafields) {
        const { key, value } = edge.node;
        try {
          if (key === "social_hooks") {
            savedMissionData.social_hooks = JSON.parse(value);
          } else if (key === "pricing_analysis") {
            savedMissionData.pricing_analysis = JSON.parse(value);
          } else if (key === "seo_data") {
            savedMissionData.seo_data = JSON.parse(value);
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
      
      const hasSavedData = Object.keys(savedMissionData).length > 0;
      
      selectedProduct = {
        id: p.id,
        title: p.title,
        descriptionHtml: p.descriptionHtml || "",
        productType: p.productType || "",
        savedMissionData: hasSavedData ? savedMissionData : null,
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

export default function OptimizePage() {
  const { planName, shop, backendApiUrl, products, selectedProduct } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const app = useAppBridge() as unknown as Parameters<typeof getSessionToken>[0];

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalState, setFinalState] = useState<MissionState | null>(null);
  const [toastContent, setToastContent] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState(true);
  const [viewingSavedMission, setViewingSavedMission] = useState(false);

  // ── Product selection (syncs to URL) ────────────────────────────────────

  const handleProductChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("productId", productIdFromGid(value));
      setSearchParams(newParams);
      setMissionId(null);
      setFinalState(null);
    },
    [searchParams, setSearchParams],
  );

  // ── Start Mission (called from MissionArchitect wizard) ─────────────────

  const handleOptimize = useCallback(
    async (pipeline: WorkflowStep[], extraContext?: MissionExtraContext) => {
      if (!selectedProduct || pipeline.length === 0) return;
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
            workflow_config: pipeline,
            // Extra wizard context (blog topic, collection info, etc.)
            ...(extraContext ? { extra_context: extraContext } : {}),
          }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        setMissionId(data.mission_id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start optimization",
        );
        setIsOptimizing(false);
      }
    },
    [selectedProduct, backendApiUrl, app, shop],
  );

  // ── Mission callbacks ──────────────────────────────────────────────────

  const handleMissionComplete = useCallback((state: MissionState) => {
    setIsOptimizing(false);
    setFinalState(state);
    if (state.status === "COMPLETED") {
      setToastSuccess(true);
      setToastContent("Mission complete! Your product has been updated in Shopify.");
    } else if (state.status === "ERROR") {
      setToastSuccess(false);
      setToastContent("Mission failed. Please try again.");
    }
  }, []);

  const handlePublish = useCallback(async (state: MissionState) => {
    console.log("Publishing state:", state);
    alert("Changes would be published to Shopify!");
  }, []);

  const handleDiscard = useCallback(() => {
    setMissionId(null);
    setFinalState(null);
    setIsOptimizing(false);
  }, []);

  const handleEdit = useCallback(
    (state: MissionState) => {
      const params = new URLSearchParams(searchParams);
      params.set("productId", productIdFromGid(selectedProduct?.id));
      navigate(`/app/rewriter?${params.toString()}`);
    },
    [navigate, searchParams, selectedProduct],
  );

  // Build a MissionState from saved metafield data
  const buildSavedMissionState = useCallback((): MissionState | null => {
    if (!selectedProduct?.savedMissionData) return null;
    const saved = selectedProduct.savedMissionData;
    return {
      mission_id: "saved",
      status: "COMPLETED",
      product_name: selectedProduct.title,
      agents_completed: [],
      current_agent: null,
      rewritten_description: null,
      seo_title: saved.seo_data?.seo_title || null,
      seo_description: saved.seo_data?.seo_description || null,
      seo_alt_text: saved.seo_data?.seo_alt_text || null,
      social_hooks: saved.social_hooks || null,
      pricing_analysis: saved.pricing_analysis
        ? {
            recommended_price: saved.pricing_analysis.recommended_price || 0,
            price_position: saved.pricing_analysis.price_position || "",
            confidence: saved.pricing_analysis.confidence || 0,
            reasoning: saved.pricing_analysis.reasoning || "",
          }
        : null,
    };
  }, [selectedProduct]);

  // ── Resume a paused mission from history ────────────────────────────────

  const handleResumeMission = useCallback((resumeId: string) => {
    setMissionId(resumeId);
    setFinalState(null);
    setIsOptimizing(true);
    setError(null);
  }, []);

  // ── Viewing saved mission ───────────────────────────────────────────────

  if (viewingSavedMission && selectedProduct?.savedMissionData) {
    const savedState = buildSavedMissionState();
    if (savedState) {
      return (
        <Frame>
          <Page
            backAction={{
              content: "Back",
              onAction: () => setViewingSavedMission(false),
            }}
          >
            <Layout>
              <Layout.Section>
                <MissionSummary
                  state={savedState}
                  onPublish={() => {
                    setToastSuccess(true);
                    setToastContent("This data is already saved in Shopify.");
                    setViewingSavedMission(false);
                  }}
                  onDiscard={() => setViewingSavedMission(false)}
                  onEdit={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set(
                      "productId",
                      productIdFromGid(selectedProduct?.id),
                    );
                    navigate(`/app/rewriter?${params.toString()}`);
                  }}
                />
              </Layout.Section>
            </Layout>
          </Page>
          {toastContent && (
            <Toast
              content={toastContent}
              onDismiss={() => setToastContent(null)}
              duration={5000}
              {...(!toastSuccess ? { error: true } : {})}
            />
          )}
        </Frame>
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Main render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <Frame>
      <Page
        title="AI-Powered Product Optimization"
        backAction={{ content: "Home", onAction: () => navigate("/app") }}
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {/* ── Mission Architect Wizard ─────────────────────────────── */}
              {!missionId && (
                <MissionArchitect
                  products={products}
                  selectedProductId={selectedProduct?.id || ""}
                  onProductChange={handleProductChange}
                  onStartMission={handleOptimize}
                  isRunning={isOptimizing}
                  planTier={planName}
                />
              )}

              {/* Error Banner */}
              {error && (
                <Banner
                  tone="critical"
                  title="Optimization Error"
                  onDismiss={() => setError(null)}
                >
                  <p>{error}</p>
                </Banner>
              )}

              {/* Mission Timeline — step-by-step mode */}
              {missionId && (
                <MissionTimeline
                  missionId={missionId}
                  apiBaseUrl={backendApiUrl}
                  shop={shop}
                  onComplete={handleMissionComplete}
                  onError={(err) => {
                    setError(err);
                    setIsOptimizing(false);
                  }}
                  onPublish={handlePublish}
                  onDiscard={handleDiscard}
                  onEdit={handleEdit}
                  showSummary={true}
                  stepMode={true}
                  onStepApprove={() =>
                    console.log("[Optimize] Step approved")
                  }
                  onStepRegenerate={(feedback) =>
                    console.log(
                      "[Optimize] Step regenerated with feedback:",
                      feedback,
                    )
                  }
                  onStepSkip={() => console.log("[Optimize] Step skipped")}
                />
              )}

              {/* Mission History */}
              {!missionId && (
                <MissionHistory
                  apiBaseUrl={backendApiUrl}
                  shop={shop}
                  onResumeMission={handleResumeMission}
                  limit={5}
                />
              )}
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>

      {/* Success/Error Toast */}
      {toastContent && (
        <Toast
          content={toastContent}
          onDismiss={() => setToastContent(null)}
          duration={5000}
          {...(!toastSuccess ? { error: true } : {})}
        />
      )}
    </Frame>
  );
}
