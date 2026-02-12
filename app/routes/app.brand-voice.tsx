import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useNavigate, useSearchParams } from 'react-router';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  Spinner,
} from '@shopify/polaris';
import { useCallback, useState, useMemo } from 'react';
import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import { IntelligenceDashboard, type StrategicIntelligence } from '../components/IntelligenceDashboard';

type LoaderData = {
  shop: string;
  backendApiUrl: string;
  intelligence: StrategicIntelligence | null;
  intelligenceUpdatedAt: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';

  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  let session;

  if (offlineContext) {
    session = offlineContext.session;
  } else {
    const authResult = await authenticate.admin(request);
    session = authResult.session;
  }

  const shop = session.shop;
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://shopify-translator-api.onrender.com';

  // Fetch strategic intelligence
  let intelligence: StrategicIntelligence | null = null;
  let intelligenceUpdatedAt: string | null = null;
  try {
    const intelRes = await fetch(
      `${backendApiUrl}/api/admin/brand-intelligence?shop=${encodeURIComponent(shop)}`,
      {
        headers: {
          'X-Shopify-Shop-Domain': shop,
        },
      }
    );
    if (intelRes.ok) {
      const intelData = await intelRes.json();
      intelligence = intelData.intelligence || null;
      intelligenceUpdatedAt = intelData.updated_at || null;
    }
  } catch (error) {
    console.error('Failed to fetch intelligence:', error);
  }

  return {
    shop,
    backendApiUrl,
    intelligence,
    intelligenceUpdatedAt,
  };
};

export default function BrandVoice() {
  const { shop, backendApiUrl, intelligence, intelligenceUpdatedAt } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isExtracting, setIsExtracting] = useState(false);

  const navQs = useMemo(() => {
    const p = new URLSearchParams();
    if (searchParams.get('host')) p.set('host', searchParams.get('host')!);
    if (shop) p.set('shop', shop);
    return p.toString();
  }, [searchParams, shop]);

  const nav = useCallback(
    (path: string) => {
      return navQs ? `${path}?${navQs}` : path;
    },
    [navQs]
  );

  const handleExtractIntelligence = useCallback(async () => {
    setIsExtracting(true);
    try {
      const response = await fetch(
        `${backendApiUrl}/api/admin/brand-intelligence/extract?shop=${encodeURIComponent(shop)}`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Shop-Domain': shop,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Reload the page to show updated intelligence
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Failed to extract intelligence:', errorData);
      }
    } catch (error) {
      console.error('Error extracting intelligence:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [backendApiUrl, shop]);

  return (
    <Page
      title="Brand Voice & Intelligence"
      backAction={{
        content: 'Writing Studio',
        onAction: () => navigate(nav('/app/writing-studio')),
      }}
    >
      <Layout>
        <Layout.Section>
          <IntelligenceDashboard
            intelligence={intelligence}
            updatedAt={intelligenceUpdatedAt}
            onExtract={handleExtractIntelligence}
            isLoading={isExtracting}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
