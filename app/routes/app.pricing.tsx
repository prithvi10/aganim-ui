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
  Spinner,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import { useState, useCallback, useEffect } from "react";

import { authenticate, getOfflineGraphqlClient } from "../shopify.server";
import { CompetitorMap, type Competitor } from "../components/CompetitorMap";
import "../styles/optimize-button.css";

type ProductListItem = { id: string; title: string };
type SelectedProduct = {
  id: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  variants: Array<{ price: string }>;
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
      ? `query { product(id: "${productGid}") { id title descriptionHtml productType variants(first: 1) { edges { node { price } } } } }`
      : `query getProduct($id: ID!) { product(id: $id) { id title descriptionHtml productType variants(first: 1) { edges { node { price } } } } }`;
    
    const productBody = await graphqlQuery(productQuery, { id: productGid }) as { data?: { product?: { id: string; title: string; descriptionHtml: string; productType: string; variants?: { edges?: Array<{ node: { price: string } }> } } } };
    const p = productBody?.data?.product;
    if (p) {
      selectedProduct = {
        id: p.id,
        title: p.title,
        descriptionHtml: p.descriptionHtml || "",
        productType: p.productType || "",
        variants: (p.variants?.edges || []).map((e) => ({ price: e.node.price })),
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

export default function PricingPage() {
  const { shop, backendApiUrl, products, selectedProduct } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge() as unknown as Parameters<typeof getSessionToken>[0];
  const navigate = useNavigate();
  
  const nav = (path: string) => {
    const params = new URLSearchParams(searchParams);
    if (shop) params.set("shop", shop);
    return params.toString() ? `${path}?${params.toString()}` : path;
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    yourPrice: number;
    competitors: Competitor[];
    recommendedPrice?: number;
    confidence?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = selectedProduct?.variants?.[0]?.price ? parseFloat(selectedProduct.variants[0].price) : 0;

  const handleProductChange = useCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("productId", productIdFromGid(value));
    setSearchParams(newParams);
    setAnalysisResult(null);
    setError(null);
  }, [searchParams, setSearchParams]);

  // Reset analysis result when product changes
  useEffect(() => {
    setAnalysisResult(null);
    setError(null);
  }, [selectedProduct?.id]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedProduct) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    // Calculate current price from the selected product
    const productPrice = selectedProduct?.variants?.[0]?.price ? parseFloat(selectedProduct.variants[0].price) : 0;

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
          action: "price_scout",
          product_data: {
            title: selectedProduct.title,
            description: selectedProduct.descriptionHtml,
            category: selectedProduct.productType || "General",
          },
          context: {},
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      const analysis = data?.data?.metadata?.pricing_analysis || {};
      
      // Use valid_competitors from Smart Price Discovery (Google Shopping)
      // Falls back to legacy competitors array if valid_competitors not present
      const competitorsData = analysis.valid_competitors || analysis.competitors || [];
      
      setAnalysisResult({
        yourPrice: productPrice,
        competitors: competitorsData.map((c: any) => ({
          // Use source (merchant name) or title for display name
          name: c.source || c.name || c.title || "Competitor",
          // Use extracted_price (numeric) for the bar chart, fall back to price if it's a number
          price: typeof c.extracted_price === 'number' ? c.extracted_price : 
                 typeof c.price === 'number' ? c.price : 
                 parseFloat(String(c.price || '0').replace(/[^0-9.]/g, '')) || undefined,
          link: c.link,
          // Include title for tooltip/display
          title: c.title,
        })),
        recommendedPrice: analysis.recommended_price,
        // Convert confidence from 0-1 to 0-100 if needed
        confidence: analysis.confidence != null 
          ? (analysis.confidence <= 1 ? Math.round(analysis.confidence * 100) : analysis.confidence)
          : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze prices");
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedProduct, backendApiUrl, app, shop]);

  const handleApplyPrice = useCallback(async (price: number) => {
    alert(`Price would be updated to $${price.toFixed(2)}`);
  }, []);

  const productOptions = products.map((p) => ({ label: p.title, value: p.id }));

  return (
    <Page 
      title="Pricing Intelligence" 
      subtitle="Analyze competitor prices and get AI-powered pricing recommendations"
      backAction={{
        content: "Back",
        onAction: () => navigate(nav("/app")),
      }}
    >
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
                      <Text variant="bodySm" tone="subdued">Current Price: ${currentPrice.toFixed(2)}</Text>
                    </BlockStack>
                    <div className="agent-btn-border-4">
                      <Button variant="primary" size="large" onClick={handleAnalyze} loading={isAnalyzing} disabled={!selectedProduct || isAnalyzing}>Scout Prices</Button>
                    </div>
                  </InlineStack>
                )}
              </BlockStack>
            </Card>

            {error && <Banner tone="critical" title="Analysis Error" onDismiss={() => setError(null)}><p>{error}</p></Banner>}

            {isAnalyzing && (
              <Card>
                <Box padding="600">
                  <BlockStack gap="400" align="center">
                    <Spinner size="large" />
                    <Text variant="headingSm" as="h3" alignment="center">Scouting Prices...</Text>
                    <Text variant="bodySm" tone="subdued" alignment="center">
                      Analyzing competitor pricing data
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {analysisResult && (
              <CompetitorMap yourPrice={analysisResult.yourPrice} competitors={analysisResult.competitors}
                recommendedPrice={analysisResult.recommendedPrice} confidence={analysisResult.confidence} onApplyPrice={handleApplyPrice} />
            )}

            {!analysisResult && !isAnalyzing && (
              <Card>
                <Box padding="600">
                  <BlockStack gap="300" align="center">
                    <Text variant="headingMd" as="h3" alignment="center">Ready to Scout Prices</Text>
                    <Text variant="bodyMd" tone="subdued" alignment="center">Select a product and click "Scout Prices" to analyze competitor pricing and get AI-powered recommendations.</Text>
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
