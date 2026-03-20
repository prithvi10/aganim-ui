import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Box,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Banner,
  Divider,
  Badge,
  Spinner,
} from "@shopify/polaris";

interface BulkStatusData {
  bulk_mission_id: string;
  status: string;
  mission_type: string;
  total: number;
  completed: number;
  failed: number;
  image_credits_used: number;
  estimated_remaining_minutes: number;
  shop_products_url?: string;
}

interface BulkMissionStatusProps {
  bulkMissionId: string;
  backendApiUrl: string;
  shop: string;
  onReset: () => void;
  getAuthToken: () => Promise<string | null>;
}

export function BulkMissionStatus({
  bulkMissionId,
  backendApiUrl,
  shop,
  onReset,
  getAuthToken,
}: BulkMissionStatusProps) {
  const { t } = useTranslation("missions");
  const [data, setData] = useState<BulkStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const url = new URL(
        `${backendApiUrl}/api/missions/bulk/${bulkMissionId}/status`,
      );
      if (!token && shop) {
        url.searchParams.set("shop", shop);
      }

      const resp = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const result: BulkStatusData = await resp.json();
      setData(result);

      if (result.status === "COMPLETED" || result.status === "ERROR") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch status",
      );
    }
  }, [bulkMissionId, backendApiUrl, shop, getAuthToken]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 15000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStatus]);

  const getPhase = (): {
    label: string;
    icon: string;
    isDone: boolean;
  } => {
    if (!data) return { label: t("bulkProcessing"), icon: "⏳", isDone: false };

    if (data.status === "COMPLETED") {
      return { label: t("bulkStatusDone"), icon: "✅", isDone: true };
    }
    if (data.status === "ERROR") {
      return { label: "Error", icon: "❌", isDone: true };
    }

    if (data.completed === 0) {
      return { label: t("bulkStatusStarted"), icon: "🚀", isDone: false };
    }
    if (data.completed < data.total * 0.6) {
      return { label: t("bulkStatusInProgress"), icon: "⚡", isDone: false };
    }
    return { label: t("bulkStatusFinishing"), icon: "🏁", isDone: false };
  };

  const phase = getPhase();

  // Summary view (when done)
  if (data && (data.status === "COMPLETED" || data.status === "ERROR")) {
    return (
      <Card>
        <Box padding="500">
          <BlockStack gap="500">
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="headingXl">
                {data.status === "COMPLETED" ? "✅" : "⚠️"}
              </Text>
              <Text as="h2" variant="headingLg">
                {t("bulkSummaryHeader", {
                  completed: data.completed,
                  total: data.total,
                })}
              </Text>
            </InlineStack>

            {data.failed > 0 && (
              <Banner tone="warning">
                <Text as="p" variant="bodySm">
                  {t("bulkSummaryFailed", { count: data.failed })}
                </Text>
              </Banner>
            )}

            {data.mission_type === "full_launch" &&
              data.image_credits_used > 0 && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {t("bulkCreditsUsed", {
                    count: data.image_credits_used,
                  })}
                </Text>
              )}

            <Divider />

            <BlockStack gap="200">
              {data.shop_products_url && (
                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  url={data.shop_products_url}
                  external
                >
                  {t("bulkViewInShopify")}
                </Button>
              )}
              <Button fullWidth onClick={onReset}>
                {t("bulkStartAnother")}
              </Button>
            </BlockStack>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  // In-progress view
  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="500">
          <InlineStack gap="300" blockAlign="center">
            <Text as="span" variant="headingXl">
              {phase.icon}
            </Text>
            <BlockStack gap="100">
              <Text as="h2" variant="headingLg">
                {phase.label}
              </Text>
              {data && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {data.completed + data.failed} / {data.total} products
                  processed
                </Text>
              )}
            </BlockStack>
            {!phase.isDone && <Spinner size="small" />}
          </InlineStack>

          {data && data.total > 0 && (
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--p-color-bg-surface-secondary)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((data.completed + data.failed) / data.total) * 100}%`,
                  background: "var(--p-color-bg-fill-brand)",
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          )}

          <BlockStack gap="100">
            {data && data.estimated_remaining_minutes > 0 && (
              <Text as="p" variant="bodySm" tone="subdued">
                {t("bulkEstimatedTime", {
                  minutes: data.estimated_remaining_minutes,
                })}
              </Text>
            )}
            <Text as="p" variant="bodySm" tone="subdued">
              {t("bulkCanLeave")}
            </Text>
          </BlockStack>

          {error && (
            <Banner tone="critical">
              <Text as="p" variant="bodySm">
                {error}
              </Text>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
