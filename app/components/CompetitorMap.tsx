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
} from "@shopify/polaris";
import { ExternalIcon, CheckIcon } from "@shopify/polaris-icons";

interface Competitor {
  /** Competitor name or source */
  name: string;
  /** Competitor's price */
  price: number;
  /** Source URL (optional) */
  link?: string;
  /** Price position category */
  position?: "premium" | "mid" | "budget";
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
  const allPrices = [yourPrice, ...competitors.map(c => c.price)];
  if (recommendedPrice) allPrices.push(recommendedPrice);
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
  if (competitors.length === 0) {
    return { position: "Unknown", percentile: 50, tone: "attention" };
  }
  
  const allPrices = competitors.map(c => c.price).sort((a, b) => a - b);
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
function formatPrice(price: number, currency: string): string {
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
  price: number;
  maxPrice: number;
  currency: string;
  type: "you" | "competitor" | "recommended";
  link?: string;
  isDashed?: boolean;
}

function PriceBar({ label, price, maxPrice, currency, type, link, isDashed }: PriceBarProps) {
  const percentage = Math.round((price / maxPrice) * 100);
  const barColor = getBarColor(type);
  
  return (
    <Box paddingBlockEnd="200">
      <InlineStack align="space-between" blockAlign="center">
        <Box minWidth="120px">
          <InlineStack gap="100" blockAlign="center">
            <Text variant="bodySm" fontWeight={type === "you" ? "bold" : "regular"}>
              {label}
            </Text>
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalIcon />
              </a>
            )}
          </InlineStack>
        </Box>
        
        <Box minWidth="200px" maxWidth="300px">
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
                backgroundColor: barColor,
                borderRadius: "4px",
                borderStyle: isDashed ? "dashed" : "solid",
                borderWidth: isDashed ? "2px" : "0",
                borderColor: barColor,
                backgroundColor: isDashed ? "transparent" : barColor,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </Box>
        
        <Box minWidth="80px">
          <Text variant="bodySm" fontWeight={type === "you" ? "bold" : "regular"} alignment="end">
            {formatPrice(price, currency)}
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
  
  // Sort competitors by price
  const sortedCompetitors = [...competitors].sort((a, b) => a.price - b.price);
  
  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">Competitor Price Analysis</Text>
          <Badge tone={pricePosition.tone}>
            {pricePosition.position} ({pricePosition.percentile}th percentile)
          </Badge>
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
              label={competitor.name}
              price={competitor.price}
              maxPrice={maxPrice}
              currency={currency}
              type="competitor"
              link={competitor.link}
            />
          ))}
          
          {/* Recommended Price (if different from your price) */}
          {recommendedPrice && Math.abs(recommendedPrice - yourPrice) > 0.01 && (
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
            {recommendedPrice && (
              <InlineStack gap="100" blockAlign="center">
                <div style={{ width: 12, height: 12, border: `2px dashed ${getBarColor("recommended")}`, borderRadius: 2 }} />
                <Text variant="bodySm" tone="subdued">Recommended</Text>
              </InlineStack>
            )}
          </InlineStack>
        </Box>
        
        {/* Recommendation Card */}
        {recommendedPrice && (
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
                {yourPrice !== recommendedPrice && (
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
        
        {/* Competitor Details Table */}
        {competitors.length > 0 && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Text variant="headingSm" as="h4">Competitor Details</Text>
              <Box
                padding="200"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #E1E3E5" }}>
                        <Text variant="bodySm" fontWeight="semibold">Source</Text>
                      </th>
                      <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #E1E3E5" }}>
                        <Text variant="bodySm" fontWeight="semibold">Price</Text>
                      </th>
                      <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #E1E3E5" }}>
                        <Text variant="bodySm" fontWeight="semibold">Position</Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCompetitors.map((competitor, index) => (
                      <tr key={index}>
                        <td style={{ padding: "8px" }}>
                          <InlineStack gap="100" blockAlign="center">
                            <Text variant="bodySm">{competitor.name}</Text>
                            {competitor.link && (
                              <a href={competitor.link} target="_blank" rel="noopener noreferrer">
                                <ExternalIcon />
                              </a>
                            )}
                          </InlineStack>
                        </td>
                        <td style={{ padding: "8px", textAlign: "right" }}>
                          <Text variant="bodySm">{formatPrice(competitor.price, currency)}</Text>
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <Badge
                            tone={
                              competitor.position === "premium" ? "success" :
                              competitor.position === "mid" ? "attention" : "info"
                            }
                          >
                            {competitor.position || "—"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </BlockStack>
          </>
        )}
      </BlockStack>
    </Card>
  );
}

export type { Competitor };
