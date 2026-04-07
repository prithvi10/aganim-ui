import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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

const LOCALE_CURRENCY: Record<string, string> = {
  ja: "¥", ko: "₩", "zh-TW": "NT$", "zh-CN": "¥", th: "฿", pt: "R$",
};

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
  mission_title: string | null;
  is_bulk_parent?: boolean;
}

interface MissionHistoryProps {
  apiBaseUrl: string;
  shop: string;
  /** Called when user clicks "Resume" on a paused mission */
  onResumeMission?: (missionId: string) => void;
  /** Called when user clicks "View Details" on a completed mission */
  onViewMission?: (missionId: string, state: MissionState) => void;
  /** Called when user clicks a bulk parent mission to view its status */
  onBulkMissionClick?: (bulkMissionId: string) => void;
  /** Maximum number of missions to display */
  limit?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MissionHistory({
  apiBaseUrl,
  shop,
  onResumeMission,
  onViewMission,
  onBulkMissionClick,
  limit = 5,
}: MissionHistoryProps) {
  const { t } = useTranslation("missions");
  const [missions, setMissions] = useState<MissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [missionDetails, setMissionDetails] = useState<Record<string, Record<string, unknown>>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState(false);

  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return <Badge tone="success">{t("completed")}</Badge>;
      case "ERROR":
        return <Badge tone="critical">{t("errorStatus")}</Badge>;
      case "IN_PROGRESS":
        return <Badge tone="info" progress="partiallyComplete">{t("inProgress")}</Badge>;
      case "AWAITING_APPROVAL":
        return <Badge tone="warning">{t("awaitingApproval")}</Badge>;
      case "PENDING":
        return <Badge tone="attention">{t("pending")}</Badge>;
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

    if (diffSecs < 60) return t("justNow");
    if (diffMins < 60) return t("minsAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo", { count: diffDays });
    return date.toLocaleDateString();
  }

  // ── Fetch mission list ────────────────────────────────────────────────

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        const url = `${apiBaseUrl}/api/missions?shop=${encodeURIComponent(shop)}&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(t("failedToFetchMissions"));
        const data = await response.json();
        setMissions(data.missions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToLoadHistory"));
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [apiBaseUrl, shop, limit, t]);

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
      if (!response.ok) throw new Error(t("failedToFetchDetails"));
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
  }, [expandedId, apiBaseUrl, shop, missionDetails, t]);

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <Box padding="400">
          <InlineStack align="center" gap="200">
            <Spinner size="small" />
            <Text as="span" variant="bodySm" tone="subdued">{t("loadingHistory")}</Text>
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
              {t("noMissionsYet")}
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
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSectionOpen((o) => !o)}
            onKeyDown={(e) => e.key === "Enter" && setSectionOpen((o) => !o)}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd">
                {sectionOpen ? "▼" : "▶"} {t("recentMissions")}
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {missions.length} {missions.length === 1 ? "mission" : "missions"}
              </Text>
            </InlineStack>
          </div>

          <Collapsible
            open={sectionOpen}
            id="recent-missions-section"
            transition={{ duration: "250ms", timingFunction: "ease-in-out" }}
          >
          <BlockStack gap="200">
            {missions.map((mission) => {
              const isBulk = mission.is_bulk_parent;
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
                          onClick={() => {
                            if (isBulk && onBulkMissionClick) {
                              onBulkMissionClick(mission.id);
                            } else {
                              toggleExpand(mission.id);
                            }
                          }}
                        >
                          <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {!isBulk && (isExpanded ? "▼" : "▶")}{" "}
                              {mission.mission_title || mission.product_name || t("productFallback", { id: mission.product_id })}
                            </Text>
                            {mission.mission_title && mission.product_name && !isBulk && (
                              <Text as="span" variant="bodySm" tone="subdued">
                                {mission.product_name}
                              </Text>
                            )}
                          </BlockStack>
                        </div>
                        {getStatusBadge(mission.status)}
                        {isBulk && <Badge tone="info">{t("bulkBadge")}</Badge>}
                      </InlineStack>

                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span" variant="bodySm" tone="subdued">
                          {relativeTime(mission.created_at)}
                        </Text>
                        {isBulk && onBulkMissionClick && (
                          <Button
                            size="slim"
                            onClick={() => onBulkMissionClick(mission.id)}
                          >
                            {t("viewStatus")}
                          </Button>
                        )}
                        {!isBulk && mission.status === "AWAITING_APPROVAL" && onResumeMission && (
                          <Button
                            size="slim"
                            variant="primary"
                            onClick={() => onResumeMission(mission.id)}
                          >
                            {t("resume")}
                          </Button>
                        )}
                      </InlineStack>
                    </InlineStack>

                    {/* Expanded details (not for bulk parents) */}
                    {!isBulk && <Collapsible
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
                              <Text as="span" variant="bodySm" tone="subdued">{t("loadingDetails")}</Text>
                            </InlineStack>
                          ) : details ? (
                            <BlockStack gap="200">
                              {/* Workflow agents */}
                              {details.workflow_agents && Array.isArray(details.workflow_agents) && (
                                <InlineStack gap="100" wrap>
                                  <Text as="span" variant="bodySm" tone="subdued">{t("agents")}</Text>
                                  {(details.workflow_agents as string[]).map((agent: string) => (
                                    <Badge key={agent} tone="info">{agent}</Badge>
                                  ))}
                                </InlineStack>
                              )}

                              {/* Key outputs */}
                              {details.draft_title && (
                                <Text as="p" variant="bodySm">
                                  <strong>{t("titleLabel")}</strong> {String(details.draft_title)}
                                </Text>
                              )}

                              {details.pricing_analysis && typeof details.pricing_analysis === "object" && (
                                <Text as="p" variant="bodySm">
                                  <strong>{t("priceLabel")}</strong>{" "}
                                  {(details.pricing_analysis as Record<string, unknown>).recommended_price
                                    ? `${(details.pricing_analysis as Record<string, unknown>).currency || LOCALE_CURRENCY[String(details.target_locale || "")] || "$"}${(details.pricing_analysis as Record<string, unknown>).recommended_price}`
                                    : t("na")}{" "}
                                  ({String((details.pricing_analysis as Record<string, unknown>).price_position || "")})
                                </Text>
                              )}

                              {details.seo_title && (
                                <Text as="p" variant="bodySm">
                                  <strong>{t("seoTitleLabel")}</strong> {String(details.seo_title)}
                                </Text>
                              )}

                              {/* Error message */}
                              {mission.error_message && (
                                <Text as="p" variant="bodySm" tone="critical">
                                  {t("errorPrefix")} {mission.error_message}
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
                                    {t("viewFullDetails")}
                                  </Button>
                                </Box>
                              )}
                            </BlockStack>
                          ) : (
                            <Text as="p" variant="bodySm" tone="subdued">
                              {t("noDetailsAvailable")}
                            </Text>
                          )}
                        </Box>
                      </Box>
                    </Collapsible>}
                  </BlockStack>
                </Box>
              );
            })}
          </BlockStack>
          </Collapsible>
        </BlockStack>
      </Box>
    </Card>
  );
}
