import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Box,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Collapsible,
  Spinner,
  Divider,
} from "@shopify/polaris";
import type { MissionState } from "./MissionTimeline";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MissionListItem {
  id: string;
  product_id: string;
  status: string;
  plan_tier: string;
  created_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  product_name: string | null;
}

interface MissionHistoryProps {
  apiBaseUrl: string;
  shop: string;
  /** Called when user clicks "Resume" on a paused mission */
  onResumeMission?: (missionId: string) => void;
  /** Called when user clicks "View Details" on a completed mission */
  onViewMission?: (missionId: string, state: MissionState) => void;
  /** Maximum number of missions to display */
  limit?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge tone="success">Completed</Badge>;
    case "ERROR":
      return <Badge tone="critical">Error</Badge>;
    case "IN_PROGRESS":
      return <Badge tone="info" progress="partiallyComplete">In Progress</Badge>;
    case "AWAITING_APPROVAL":
      return <Badge tone="warning">Awaiting Approval</Badge>;
    case "PENDING":
      return <Badge tone="attention">Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MissionHistory({
  apiBaseUrl,
  shop,
  onResumeMission,
  onViewMission,
  limit = 5,
}: MissionHistoryProps) {
  const [missions, setMissions] = useState<MissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [missionDetails, setMissionDetails] = useState<Record<string, Record<string, unknown>>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  // ── Fetch mission list ────────────────────────────────────────────────

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        const url = `${apiBaseUrl}/api/missions?shop=${encodeURIComponent(shop)}&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch missions");
        const data = await response.json();
        setMissions(data.missions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mission history");
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [apiBaseUrl, shop, limit]);

  // ── Fetch full mission details on expand ──────────────────────────────

  const toggleExpand = useCallback(async (missionId: string) => {
    if (expandedId === missionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(missionId);

    // If we already have details, don't re-fetch
    if (missionDetails[missionId]) return;

    setLoadingDetails(missionId);
    try {
      const url = `${apiBaseUrl}/api/missions/${missionId}?shop=${encodeURIComponent(shop)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setMissionDetails((prev) => ({
        ...prev,
        [missionId]: data.current_state || {},
      }));
    } catch {
      // Silently fail - user can retry
    } finally {
      setLoadingDetails(null);
    }
  }, [expandedId, apiBaseUrl, shop, missionDetails]);

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <Box padding="400">
          <InlineStack align="center" gap="200">
            <Spinner size="small" />
            <Text as="span" variant="bodySm" tone="subdued">Loading mission history...</Text>
          </InlineStack>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Box padding="400">
          <Text as="p" variant="bodySm" tone="critical">{error}</Text>
        </Box>
      </Card>
    );
  }

  if (missions.length === 0) {
    return (
      <Card>
        <Box padding="400">
          <BlockStack gap="200" inlineAlign="center">
            <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
              No missions yet. Start your first mission above!
            </Text>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Recent Missions
          </Text>

          <BlockStack gap="200">
            {missions.map((mission) => {
              const isExpanded = expandedId === mission.id;
              const details = missionDetails[mission.id];
              const isLoadingThis = loadingDetails === mission.id;

              return (
                <Box
                  key={mission.id}
                  padding="300"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    {/* Mission row */}
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        <div
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleExpand(mission.id)}
                        >
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {isExpanded ? "▼" : "▶"}{" "}
                            {mission.product_name || `Product ${mission.product_id}`}
                          </Text>
                        </div>
                        {getStatusBadge(mission.status)}
                      </InlineStack>

                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span" variant="bodySm" tone="subdued">
                          {relativeTime(mission.created_at)}
                        </Text>
                        {mission.status === "AWAITING_APPROVAL" && onResumeMission && (
                          <Button
                            size="slim"
                            variant="primary"
                            onClick={() => onResumeMission(mission.id)}
                          >
                            Resume
                          </Button>
                        )}
                      </InlineStack>
                    </InlineStack>

                    {/* Expanded details */}
                    <Collapsible
                      open={isExpanded}
                      id={`mission-details-${mission.id}`}
                      transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                    >
                      <Box paddingBlockStart="200">
                        <Divider />
                        <Box paddingBlockStart="200">
                          {isLoadingThis ? (
                            <InlineStack align="center" gap="200">
                              <Spinner size="small" />
                              <Text as="span" variant="bodySm" tone="subdued">Loading details...</Text>
                            </InlineStack>
                          ) : details ? (
                            <BlockStack gap="200">
                              {/* Workflow agents */}
                              {details.workflow_agents && Array.isArray(details.workflow_agents) && (
                                <InlineStack gap="100" wrap>
                                  <Text as="span" variant="bodySm" tone="subdued">Agents:</Text>
                                  {(details.workflow_agents as string[]).map((agent: string) => (
                                    <Badge key={agent} tone="info">{agent}</Badge>
                                  ))}
                                </InlineStack>
                              )}

                              {/* Key outputs */}
                              {details.draft_title && (
                                <Text as="p" variant="bodySm">
                                  <strong>Title:</strong> {String(details.draft_title)}
                                </Text>
                              )}

                              {details.pricing_analysis && typeof details.pricing_analysis === "object" && (
                                <Text as="p" variant="bodySm">
                                  <strong>Price:</strong>{" "}
                                  {(details.pricing_analysis as Record<string, unknown>).recommended_price
                                    ? `$${(details.pricing_analysis as Record<string, unknown>).recommended_price}`
                                    : "N/A"}{" "}
                                  ({String((details.pricing_analysis as Record<string, unknown>).price_position || "")})
                                </Text>
                              )}

                              {details.seo_title && (
                                <Text as="p" variant="bodySm">
                                  <strong>SEO Title:</strong> {String(details.seo_title)}
                                </Text>
                              )}

                              {/* Error message */}
                              {mission.error_message && (
                                <Text as="p" variant="bodySm" tone="critical">
                                  Error: {mission.error_message}
                                </Text>
                              )}

                              {/* View full details button for completed missions */}
                              {mission.status === "COMPLETED" && onViewMission && (
                                <Box paddingBlockStart="100">
                                  <Button
                                    size="slim"
                                    variant="plain"
                                    onClick={() => onViewMission(mission.id, details as unknown as MissionState)}
                                  >
                                    View Full Details
                                  </Button>
                                </Box>
                              )}
                            </BlockStack>
                          ) : (
                            <Text as="p" variant="bodySm" tone="subdued">
                              No details available.
                            </Text>
                          )}
                        </Box>
                      </Box>
                    </Collapsible>
                  </BlockStack>
                </Box>
              );
            })}
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}
