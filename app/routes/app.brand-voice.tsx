import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Box,
  Divider,
  DropZone,
  InlineStack,
  Text,
  TextField,
  Button,
  Banner,
  Spinner,
  Toast,
} from '@shopify/polaris';
import { useCallback, useEffect, useState, useMemo } from 'react';
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

function LogoUploadCard({ shop, backendApiUrl }: { shop: string; backendApiUrl: string }) {
  const { t } = useTranslation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoInput, setLogoInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `${backendApiUrl}/api/shop/logo?shop=${encodeURIComponent(shop)}`,
          { headers: { 'X-Shopify-Shop-Domain': shop } },
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data.logo_url) setLogoUrl(data.logo_url);
        }
      } catch {
        // ignore fetch errors on load
      }
    })();
  }, [shop, backendApiUrl]);

  const handleUploadFromUrl = useCallback(async () => {
    const url = logoInput.trim();
    if (!url) return;
    setUploading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${backendApiUrl}/api/shop/logo?shop=${encodeURIComponent(shop)}`,
        {
          method: 'POST',
          headers: { 'X-Shopify-Shop-Domain': shop, 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_url: url }),
        },
      );
      const data = await resp.json();
      if (resp.ok && data.logo_url) {
        setLogoUrl(data.logo_url);
        setLogoInput('');
        setToast(t('brandVoice.logoUploadedSuccess'));
      } else {
        setError(data.detail || 'Upload failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setUploading(false);
    }
  }, [logoInput, shop, backendApiUrl]);

  const handleFileDrop = useCallback(async (_: File[], acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResp = await fetch(
        `${backendApiUrl}/api/upload-product-image?shop=${encodeURIComponent(shop)}`,
        { method: 'POST', headers: { 'X-Shopify-Shop-Domain': shop }, body: formData },
      );
      if (!uploadResp.ok) throw new Error('File upload failed');
      const uploadData = await uploadResp.json();
      const tempUrl = uploadData.url;

      const resp = await fetch(
        `${backendApiUrl}/api/shop/logo?shop=${encodeURIComponent(shop)}`,
        {
          method: 'POST',
          headers: { 'X-Shopify-Shop-Domain': shop, 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_url: tempUrl }),
        },
      );
      const data = await resp.json();
      if (resp.ok && data.logo_url) {
        setLogoUrl(data.logo_url);
        setToast(t('brandVoice.logoUploadedSuccess'));
      } else {
        setError(data.detail || 'Upload failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setUploading(false);
    }
  }, [shop, backendApiUrl]);

  return (
    <>
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">{t('brandVoice.brandLogo')}</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {t('brandVoice.brandLogoDesc')}
              </Text>
            </BlockStack>
            <Divider />

            {logoUrl && (
              <InlineStack align="center">
                <div style={{ width: 120, height: 120, borderRadius: 10, overflow: 'hidden', border: '1px solid #e1e3e5', background: '#fafafa' }}>
                  <img src={logoUrl} alt="Shop logo" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
              </InlineStack>
            )}

            <TextField
              label={t('brandVoice.logoUrl')}
              value={logoInput}
              onChange={setLogoInput}
              placeholder="https://example.com/logo.png"
              autoComplete="off"
              connectedRight={
                <Button onClick={handleUploadFromUrl} loading={uploading} disabled={!logoInput.trim() || uploading}>
                  {t('brandVoice.upload')}
                </Button>
              }
            />

            <DropZone accept="image/*" type="image" onDrop={handleFileDrop} disabled={uploading} allowMultiple={false} variableHeight>
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <BlockStack gap="100" inlineAlign="center">
                  <Text as="p" variant="bodySm">{t('brandVoice.orDropToUpload')}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">{t('brandVoice.pngJpgWebp')}</Text>
                </BlockStack>
              </div>
            </DropZone>

            {error && <Banner tone="critical">{error}</Banner>}
          </BlockStack>
        </Box>
      </Card>
      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

export default function BrandVoice() {
  const { t } = useTranslation();
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
      title={t('brandVoice.brandVoiceIntelligence')}
      backAction={{
        content: t('brandVoice.writingStudio'),
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
        <Layout.Section>
          <LogoUploadCard shop={shop} backendApiUrl={backendApiUrl} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
