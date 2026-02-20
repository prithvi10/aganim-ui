import { useMemo, useRef, useEffect } from 'react';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  SkeletonBodyText,
  Text,
  Tooltip,
} from '@shopify/polaris';

export type RetailCalendarEntry = {
  name: string;
  date: string;
  days_until: number;
  retail_context: string;
  status: 'past' | 'active' | 'upcoming';
};

export type RetailCampaignCardProps = {
  calendar: RetailCalendarEntry[];
  nextHoliday: RetailCalendarEntry | null;
  campaignCode: string;
  seasonalCaption: string;
  seasonalCaptionLoading: boolean;
  onCopyCaption: () => void;
  onCopyCode: () => void;
  onRegenerate: () => void;
  shopCampaignsUrl: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PillItem({
  entry,
  isActive,
}: {
  entry: RetailCalendarEntry;
  isActive: boolean;
}) {
  const bg = entry.status === 'past'
    ? '#e4e5e7'
    : isActive
      ? '#e3f1df'
      : '#f6f6f7';
  const border = isActive ? '2px solid #108043' : '1px solid #d2d5d8';
  const color = entry.status === 'past' ? '#8c9196' : '#202223';

  return (
    <Tooltip content={entry.retail_context || entry.name}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 14px',
          borderRadius: '10px',
          border,
          background: bg,
          minWidth: '110px',
          flexShrink: 0,
          gap: '4px',
          opacity: entry.status === 'past' ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color, whiteSpace: 'nowrap' }}>
          {entry.name}
        </span>
        <span style={{ fontSize: '11px', color: '#6d7175', whiteSpace: 'nowrap' }}>
          {formatDate(entry.date)}
          {entry.days_until >= 0 && (
            <> &middot; {entry.days_until}d</>
          )}
        </span>
        {isActive && entry.retail_context && (
          <span style={{ fontSize: '10px', color: '#108043', textAlign: 'center', lineHeight: '1.2' }}>
            {entry.retail_context}
          </span>
        )}
      </div>
    </Tooltip>
  );
}

export function RetailCampaignCard({
  calendar,
  nextHoliday,
  campaignCode,
  seasonalCaption,
  seasonalCaptionLoading,
  onCopyCaption,
  onCopyCode,
  onRegenerate,
  shopCampaignsUrl,
}: RetailCampaignCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(() => {
    if (!nextHoliday) return -1;
    return calendar.findIndex(
      (e) => e.name === nextHoliday.name && e.date === nextHoliday.date
    );
  }, [calendar, nextHoliday]);

  useEffect(() => {
    if (scrollRef.current && activeIndex >= 0) {
      const container = scrollRef.current;
      const pills = container.children;
      if (pills[activeIndex]) {
        const pill = pills[activeIndex] as HTMLElement;
        const scrollLeft = pill.offsetLeft - container.offsetWidth / 2 + pill.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingLg">
              Retail Campaign
            </Text>
            {nextHoliday && (
              <Badge tone="attention">
                {nextHoliday.days_until} days to {nextHoliday.name}
              </Badge>
            )}
          </InlineStack>

          {/* Section 1: Horizontal Timeline */}
          {calendar.length > 0 && (
            <div
              ref={scrollRef}
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '6px',
                scrollbarWidth: 'thin',
              }}
            >
              {calendar.map((entry, i) => (
                <PillItem
                  key={`${entry.name}-${entry.date}`}
                  entry={entry}
                  isActive={i === activeIndex}
                />
              ))}
            </div>
          )}

          <Divider />

          {/* Section 3: Campaign Draft Preview */}
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Campaign Draft
            </Text>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Left: Code + Caption */}
              <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
                <BlockStack gap="300">
                  {/* Campaign Code */}
                  <Card>
                    <Box padding="300">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Suggested Code
                        </Text>
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p" variant="headingMd" fontWeight="bold">
                            {campaignCode || '—'}
                          </Text>
                          <Button
                            onClick={onCopyCode}
                            disabled={!campaignCode}
                            variant="plain"
                            size="slim"
                          >
                            Copy
                          </Button>
                        </InlineStack>
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* Seasonal Caption */}
                  <Card>
                    <Box padding="300">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Seasonal Caption
                        </Text>
                        {seasonalCaptionLoading ? (
                          <SkeletonBodyText lines={3} />
                        ) : seasonalCaption ? (
                          <Text as="p" variant="bodyMd">
                            {seasonalCaption}
                          </Text>
                        ) : (
                          <Text as="p" variant="bodySm" tone="subdued">
                            Generate social hooks to auto-create a seasonal caption.
                          </Text>
                        )}
                        {seasonalCaption && (
                          <InlineStack align="end">
                            <Button
                              onClick={onCopyCaption}
                              variant="plain"
                              size="slim"
                            >
                              Copy
                            </Button>
                          </InlineStack>
                        )}
                      </BlockStack>
                    </Box>
                  </Card>
                </BlockStack>
              </div>

              {/* Right: CTA Buttons */}
              <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                {shopCampaignsUrl && (
                  <Button url={shopCampaignsUrl} external variant="primary">
                    Open Campaigns
                  </Button>
                )}
                <Button onClick={onRegenerate} variant="secondary">
                  Re-generate
                </Button>
              </div>
            </div>
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}
