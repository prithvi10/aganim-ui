import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useSearchParams, useNavigate } from 'react-router';
import {
  BlockStack,
  Button,
  Layout,
  Page,
  Toast,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import { RetailCampaignCard } from '../components/RetailCampaignCard';
import type { RetailCalendarEntry } from '../components/RetailCampaignCard';

type LoaderData = {
  shop: string;
  shopSlug: string;
  backendApiUrl: string;
  retailCalendar: RetailCalendarEntry[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';

  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  let sessionShop = '';

  if (offlineContext) {
    sessionShop = offlineContext.session.shop;
  } else {
    const { session } = await authenticate.admin(request);
    sessionShop = session.shop;
  }

  const shop = sessionShop;
  const shopSlug = shop.replace('.myshopify.com', '');
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://shopify-translator-api.onrender.com';

  let retailCalendar: RetailCalendarEntry[] = [];
  try {
    const calRes = await fetch(
      `${backendApiUrl}/api/retail-calendar?shop=${encodeURIComponent(sessionShop)}`,
      { headers: { 'X-Shopify-Shop-Domain': sessionShop } },
    );
    if (calRes.ok) {
      const calData = await calRes.json();
      retailCalendar = calData.calendar || [];
    }
  } catch {
    // best-effort
  }

  return { shop, shopSlug, backendApiUrl, retailCalendar } satisfies LoaderData;
};

function discountCodeName(holidayName: string, category: string, year: number) {
  const base = String(holidayName).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const cat = String(category || 'SALE').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const yy = String(year).slice(-2);
  return `${base}${yy}${cat.slice(0, 6)}`.slice(0, 20);
}

export default function CampaignsPage() {
  const { shop, shopSlug, backendApiUrl, retailCalendar } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const app = useAppBridge();

  const nav = (path: string) => {
    const params = new URLSearchParams(searchParams);
    if (shop) params.set('shop', shop);
    return params.toString() ? `${path}?${params.toString()}` : path;
  };

  const [toastContent, setToastContent] = useState<string | null>(null);

  const [seasonalCaptionLoading, setSeasonalCaptionLoading] = useState(false);
  const [seasonalCaption, setSeasonalCaption] = useState<string>('');

  const callAgent = useCallback(
    async (actionName: string, productData: Record<string, any>, context: Record<string, any>) => {
      let token: string | null = null;
      try {
        token = await getSessionToken(app as any);
      } catch {
        token = null;
      }

      const agentUrl = new URL(`${backendApiUrl}/api/agent`);
      if (!token && shop) {
        agentUrl.searchParams.set('shop', shop);
      }

      const resp = await fetch(agentUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: actionName,
          context,
          product_data: productData,
        }),
        credentials: 'include',
      });

      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.status !== 'success') {
        throw new Error(String(result?.detail || 'Agent request failed'));
      }
      return result;
    },
    [app, backendApiUrl, shop],
  );

  const generateSeasonalCaption = useCallback(async () => {
    setSeasonalCaptionLoading(true);
    try {
      const [campaignSettled, captionSettled] = await Promise.allSettled([
        callAgent('seasonal_campaign_agent', { category: 'General', productType: 'General' }, { current_date: new Date().toISOString() }),
        callAgent('seasonal_campaign_caption', { category: 'General', productType: 'General' }, { current_date: new Date().toISOString() }),
      ]);

      if (captionSettled.status === 'fulfilled') {
        const text = String(
          captionSettled.value?.data?.metadata?.copy_text ||
            captionSettled.value?.data?.metadata?.caption ||
            captionSettled.value?.data?.text ||
            '',
        );
        setSeasonalCaption(text);
      }

      setToastContent('Seasonal campaign data refreshed.');
    } catch {
      setToastContent('Failed to generate seasonal content.');
    } finally {
      setSeasonalCaptionLoading(false);
    }
  }, [callAgent]);

  useEffect(() => {
    generateSeasonalCaption();
  }, []);

  const nextHoliday = useMemo<RetailCalendarEntry | null>(() => {
    const active = retailCalendar.find((e) => e.status === 'active');
    if (active) return active;
    const upcoming = retailCalendar.find((e) => e.status === 'upcoming');
    return upcoming || null;
  }, [retailCalendar]);

  const campaignCode = useMemo(() => {
    if (!nextHoliday) return '';
    const year = Number(nextHoliday.date.slice(0, 4)) || new Date().getFullYear();
    return discountCodeName(nextHoliday.name, 'SALE', year);
  }, [nextHoliday]);

  const shopCampaignsUrl = useMemo(() => {
    if (!shopSlug) return '';
    return `https://admin.shopify.com/store/${shopSlug}/marketing/campaigns`;
  }, [shopSlug]);

  return (
    <Page
      title="Retail Campaigns"
      backAction={{
        content: 'Marketing',
        onAction: () => navigate(nav('/app/marketing')),
      }}
    >
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <RetailCampaignCard
              calendar={retailCalendar}
              nextHoliday={nextHoliday}
              campaignCode={campaignCode}
              seasonalCaption={seasonalCaption}
              seasonalCaptionLoading={seasonalCaptionLoading}
              onCopyCaption={async () => {
                try {
                  await navigator.clipboard.writeText(seasonalCaption || '');
                  setToastContent('Caption copied.');
                } catch {
                  setToastContent('Copy failed (clipboard not available).');
                }
              }}
              onCopyCode={async () => {
                try {
                  await navigator.clipboard.writeText(campaignCode || '');
                  setToastContent('Code copied.');
                } catch {
                  setToastContent('Copy failed (clipboard not available).');
                }
              }}
              onRegenerate={generateSeasonalCaption}
              shopCampaignsUrl={shopCampaignsUrl}
            />
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
