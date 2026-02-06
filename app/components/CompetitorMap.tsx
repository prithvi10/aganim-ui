import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Box,
  Divider,
  Button,
  Tooltip,
  Link,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";

interface Competitor {
  /** Competitor name or source */
  name: string;
  /** Competitor's price (optional - may not be available) */
  price?: number;
  /** Source URL (optional) */
  link?: string;
  /** Price position category */
  position?: "premium" | "mid" | "budget";
  /** Snippet from search results */
  snippet?: string;
  /** Title from search results */
  title?: string;
}

interface CompetitorMapProps {
  /** Your product's current price */
  yourPrice: number;
  /** List of competitors with their prices */
  competitors: Competitor[];
  /** Recommended price from the agent */
  recommendedPrice?: number;
  /** Confidence score for the recommendation (0-100) */
  confidence?: number;
  /** Currency symbol */
  currency?: string;
  /** Callback when "Apply Price" is clicked */
  onApplyPrice?: (price: number) => void;
  /** Whether apply action is loading */
  isApplying?: boolean;
}

/**
 * Get the maximum price for scaling the bars
 */
function getMaxPrice(yourPrice: number, competitors: Competitor[], recommendedPrice?: number): number {
  const competitorPrices = competitors.map(c => c.price).filter((p): p is number => p != null && !isNaN(p));
  const allPrices = [yourPrice, ...competitorPrices].filter(p => p != null && !isNaN(p));
  if (recommendedPrice != null && !isNaN(recommendedPrice)) allPrices.push(recommendedPrice);
  if (allPrices.length === 0) return 100; // Fallback
  return Math.max(...allPrices) * 1.1; // Add 10% padding
}

/**
 * Determine price position relative to competitors
 */
function getPricePosition(yourPrice: number, competitors: Competitor[]): {
  position: string;
  percentile: number;
  tone: "success" | "attention" | "critical";
} {
  const validCompetitors = competitors.filter(c => c.price != null && !isNaN(c.price));
  if (validCompetitors.length === 0 || yourPrice == null || isNaN(yourPrice)) {
    return { position: "Unknown", percentile: 50, tone: "attention" };
  }
  
  const allPrices = validCompetitors.map(c => c.price!).sort((a, b) => a - b);
  const below = allPrices.filter(p => p < yourPrice).length;
  const percentile = Math.round((below / allPrices.length) * 100);
  
  if (percentile >= 70) {
    return { position: "Premium", percentile, tone: "success" };
  } else if (percentile >= 30) {
    return { position: "Mid-Market", percentile, tone: "attention" };
  } else {
    return { position: "Budget", percentile, tone: "critical" };
  }
}

/**
 * Format price with currency
 */
function formatPrice(price: number | undefined | null, currency: string): string {
  if (price == null || isNaN(price)) return `${currency}—`;
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Get bar color based on entity type
 */
function getBarColor(type: "you" | "competitor" | "recommended"): string {
  switch (type) {
    case "you":
      return "#2C6ECB"; // Primary blue
    case "competitor":
      return "#8C9196"; // Neutral gray
    case "recommended":
      return "#008060"; // Success green
  }
}

interface PriceBarProps {
  label: string;
  price?: number;
  maxPrice: number;
  currency: string;
  type: "you" | "competitor" | "recommended";
  link?: string;
  isDashed?: boolean;
}

function PriceBar({ label, price, maxPrice, currency, type, link, isDashed }: PriceBarProps) {
  const hasPrice = price != null && !isNaN(price);
  const safePrice = price ?? 0;
  const safeMaxPrice = maxPrice || 100;
  const percentage = hasPrice ? Math.round((safePrice / safeMaxPrice) * 100) : 0;
  const barColor = getBarColor(type);
  
  return (
    <Box paddingBlockEnd="200">
      <InlineStack align="space-between" blockAlign="center">
        <Box minWidth="180px">
          <InlineStack gap="100" blockAlign="center">
            {link ? (
              <Link url={link} target="_blank" removeUnderline>
                <Text variant="bodySm" fontWeight={type === "you" ? "bold" : "regular"}>
                  {label}
                </Text>
              </Link>
            ) : (
              <Text variant="bodySm" fontWeight={type === "you" ? "bold" : "regular"}>
                {label}
              </Text>
            )}
          </InlineStack>
        </Box>
        
        <Box minWidth="200px" maxWidth="300px">
          {hasPrice ? (
            <div
              style={{
                width: "100%",
                height: "24px",
                backgroundColor: "#F1F1F1",
                borderRadius: "4px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: "100%",
                  borderRadius: "4px",
                  borderStyle: isDashed ? "dashed" : "solid",
                  borderWidth: isDashed ? "2px" : "0",
                  borderColor: barColor,
                  backgroundColor: isDashed ? "transparent" : barColor,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          ) : (
            <Text variant="bodySm" tone="subdued">Check link for price →</Text>
          )}
        </Box>
        
        <Box minWidth="80px">
          <Text variant="bodySm" fontWeight={type === "you" ? "bold" : "regular"} alignment="end">
            {hasPrice ? formatPrice(price, currency) : "—"}
          </Text>
        </Box>
      </InlineStack>
    </Box>
  );
}

export function CompetitorMap({
  yourPrice,
  competitors,
  recommendedPrice,
  confidence,
  currency = "$",
  onApplyPrice,
  isApplying = false,
}: CompetitorMapProps) {
  const maxPrice = getMaxPrice(yourPrice, competitors, recommendedPrice);
  const pricePosition = getPricePosition(yourPrice, competitors);
  
  // Check if any competitor has actual price data
  const hasAnyPrices = competitors.some(c => c.price != null && !isNaN(c.price));
  
  // Sort competitors: those with prices first, then by price
  const sortedCompetitors = [...competitors].sort((a, b) => {
    if (a.price != null && b.price == null) return -1;
    if (a.price == null && b.price != null) return 1;
    if (a.price != null && b.price != null) return a.price - b.price;
    return 0;
  });
  
  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">Competitor Price Analysis</Text>
          {hasAnyPrices && (
            <Badge tone={pricePosition.tone}>
              {pricePosition.position} ({pricePosition.percentile}th percentile)
            </Badge>
          )}
        </InlineStack>
        
        <Divider />
        
        {/* Price Bars */}
        <BlockStack gap="100">
          {/* Your Price */}
          <PriceBar
            label="Your Price"
            price={yourPrice}
            maxPrice={maxPrice}
            currency={currency}
            type="you"
          />
          
          {/* Competitor Prices */}
          {sortedCompetitors.map((competitor, index) => (
            <PriceBar
              key={index}
              label={competitor.name || competitor.title || `Competitor ${index + 1}`}
              price={competitor.price}
              maxPrice={maxPrice}
              currency={currency}
              type="competitor"
              link={competitor.link}
            />
          ))}
          
          {/* Recommended Price (if different from your price) */}
          {recommendedPrice != null && !isNaN(recommendedPrice) && Math.abs(recommendedPrice - yourPrice) > 0.01 && (
            <PriceBar
              label="Recommended"
              price={recommendedPrice}
              maxPrice={maxPrice}
              currency={currency}
              type="recommended"
              isDashed
            />
          )}
        </BlockStack>
        
        {/* Legend */}
        <Box paddingBlockStart="200">
          <InlineStack gap="400">
            <InlineStack gap="100" blockAlign="center">
              <div style={{ width: 12, height: 12, backgroundColor: getBarColor("you"), borderRadius: 2 }} />
              <Text variant="bodySm" tone="subdued">Your Price</Text>
            </InlineStack>
            <InlineStack gap="100" blockAlign="center">
              <div style={{ width: 12, height: 12, backgroundColor: getBarColor("competitor"), borderRadius: 2 }} />
              <Text variant="bodySm" tone="subdued">Competitors</Text>
            </InlineStack>
            {recommendedPrice != null && (
              <InlineStack gap="100" blockAlign="center">
                <div style={{ width: 12, height: 12, border: `2px dashed ${getBarColor("recommended")}`, borderRadius: 2 }} />
                <Text variant="bodySm" tone="subdued">Recommended</Text>
              </InlineStack>
            )}
          </InlineStack>
        </Box>
        
        {/* Info banner when no prices available */}
        {!hasAnyPrices && competitors.length > 0 && (
          <>
            <Divider />
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <Text variant="bodySm" tone="subdued">
                💡 Price data not available from search results. Click on competitor links above to check their current prices manually.
              </Text>
            </Box>
          </>
        )}
        
        {/* Recommendation Card */}
        {recommendedPrice != null && !isNaN(recommendedPrice) && (
          <>
            <Divider />
            <Box
              padding="400"
              borderRadius="200"
              background="bg-surface-success-subdued"
            >
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingSm" as="h4">
                      Recommended Price
                    </Text>
                    <Text variant="headingLg" as="p">
                      {formatPrice(recommendedPrice, currency)}
                    </Text>
                  </BlockStack>
                  
                  {confidence !== undefined && (
                    <Tooltip content={`Based on analysis of ${competitors.length} competitors`}>
                      <Badge tone={confidence >= 70 ? "success" : confidence >= 40 ? "attention" : "info"}>
                        {confidence}% confidence
                      </Badge>
                    </Tooltip>
                  )}
                </InlineStack>
                
                {/* Price Change Indicator */}
                {yourPrice != null && !isNaN(yourPrice) && yourPrice !== recommendedPrice && (
                  <Text variant="bodySm" tone="subdued">
                    {recommendedPrice > yourPrice
                      ? `Increase by ${formatPrice(recommendedPrice - yourPrice, currency)} (+${Math.round(((recommendedPrice - yourPrice) / yourPrice) * 100)}%)`
                      : `Decrease by ${formatPrice(yourPrice - recommendedPrice, currency)} (-${Math.round(((yourPrice - recommendedPrice) / yourPrice) * 100)}%)`}
                  </Text>
                )}
                
                {onApplyPrice && (
                  <Button
                    variant="primary"
                    onClick={() => onApplyPrice(recommendedPrice)}
                    loading={isApplying}
                    icon={CheckIcon}
                  >
                    Apply Recommended Price
                  </Button>
                )}
              </BlockStack>
            </Box>
          </>
        )}
      </BlockStack>
    </Card>
  );
}

export type { Competitor };
