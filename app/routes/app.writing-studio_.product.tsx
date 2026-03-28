import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useNavigate, useSearchParams, useFetcher, Form } from 'react-router';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Banner,
} from '@shopify/polaris';
import { useCallback, useState, useMemo } from 'react';
import { authenticate, getOfflineGraphqlClient } from '../shopify.server';
import type { Template } from '../components/TemplateGallery';

type LoaderData = {
  shop: string;
  backendApiUrl: string;
  template: Template | null;
  templateId: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';
  const templateId = url.searchParams.get('template') || 'product/collection';

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
    process.env.BACKEND_API_URL || 'https://aganim-api.onrender.com';

  // Fetch template details
  let template: Template | null = null;
  try {
    const templatesRes = await fetch(`${backendApiUrl}/api/templates?shop=${encodeURIComponent(shop)}`, {
      headers: {
        'X-Shopify-Shop-Domain': shop,
      },
    });
    if (templatesRes.ok) {
      const templatesData = await templatesRes.json();
      template = templatesData.templates.find((t: Template) => t.id === templateId) || null;
    }
  } catch (error) {
    console.error('Failed to fetch template:', error);
  }

  return {
    shop,
    backendApiUrl,
    template,
    templateId,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = formData.get('shop') as string;
  const templateId = formData.get('template_id') as string;
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://aganim-api.onrender.com';

  const body: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key !== 'shop' && key !== 'template_id' && key !== 'intent') {
      body[key] = value;
    }
  });

  try {
    const response = await fetch(
      `${backendApiUrl}/api/generate/${templateId}?shop=${encodeURIComponent(shop)}`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Shop-Domain': shop,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error: error.detail || 'Generation failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

export default function ProductContentEditor() {
  const { shop, backendApiUrl, template, templateId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<typeof action>();
  const [formData, setFormData] = useState<Record<string, string>>({});

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

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const formDataObj = new FormData(form);
      formDataObj.append('shop', shop);
      formDataObj.append('template_id', templateId || '');
      fetcher.submit(formDataObj, { method: 'POST' });
    },
    [shop, templateId, fetcher]
  );

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const result = fetcher.data;

  if (!template) {
    return (
      <Page title="Product Content Editor">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">Template not found</Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title={template.name}
      backAction={{
        content: 'Writing Studio',
        onAction: () => navigate(nav('/app/writing-studio')),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                {template.description}
              </Text>

              <Form onSubmit={handleSubmit}>
                <BlockStack gap="400">
                  {template.inputs.map((input) => (
                    <TextField
                      key={input.name}
                      label={input.label}
                      name={input.name}
                      value={formData[input.name] || ''}
                      onChange={(value) => handleFieldChange(input.name, value)}
                      required={input.required}
                      multiline={input.input_type === 'textarea'}
                      rows={input.input_type === 'textarea' ? 4 : 1}
                      helpText={input.description}
                      autoComplete="off"
                    />
                  ))}

                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      submit
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      Generate Content
                    </Button>
                    <Button onClick={() => navigate(nav('/app/writing-studio'))}>
                      Cancel
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>

              {result?.success && result.data && (
                <Banner tone="success">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Generated Content
                    </Text>
                    <Text as="p">{result.data.content || result.data.description || ''}</Text>
                    {result.data.title && (
                      <Text as="p" variant="headingSm">
                        Title: {result.data.title}
                      </Text>
                    )}
                  </BlockStack>
                </Banner>
              )}

              {result && !result.success && (
                <Banner tone="critical">
                  <Text as="p">Error: {result.error || 'Generation failed'}</Text>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
