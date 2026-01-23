import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {
  useFetcher,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  ButtonGroup,
  Divider,
  Box,
  Banner,
  Checkbox,
  Scrollable,
  Badge,
  Toast,
  Tabs,
  Spinner,
  SkeletonBodyText,
  Tooltip,
  Icon,
  Select,
  Modal,
} from '@shopify/polaris';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useAppBridge} from '@shopify/app-bridge-react';
import type {ClientApplication} from '@shopify/app-bridge/client';
import {getSessionToken} from '@shopify/app-bridge/utilities';
import {
  CheckIcon,
  LightbulbIcon,
  LockIcon,
  LinkIcon,
  ListBulletedIcon,
  ListNumberedIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from '@shopify/polaris-icons';

import {authenticate, getOfflineGraphqlClient} from '../shopify.server';
import {descriptionHash} from '../utils/descriptionHash.server';
import { DowngradeScheduledBanner } from '../components/DowngradeScheduledBanner';

type ShopLocale = {
  locale: string;
  name: string;
  published: boolean;
  primary: boolean;
};

type ProductListItem = {
  id: string;
  title: string;
};

type LoaderData = {
  shop: string;
  shopSlug: string;
  planName: 'Free' | 'Basic' | 'Standard' | 'Pro';
  maxLocales: number; // 1 = single-locale, -1 = unlimited
  billingCycleType?: 'lifetime' | 'recurring';
  rewriteLimit?: number | null;
  rewritesUsed?: number | null;
  lifetimeRewritesRemaining?: number | null;
  graceActive?: boolean;
  lastPlanName?: 'Free' | 'Basic' | 'Standard' | 'Pro' | null;
  accessExpiresAt?: string | null;
  pendingPlanName?: string | null;
  pendingPlanEffectiveAt?: string | null;
  primaryLocale: string;
  locales: ShopLocale[];
  products: ProductListItem[];
  selectedProduct: {
    id: string;
    title: string;
    descriptionHtml: string;
    productType: string;
    seo?: {title?: string | null; description?: string | null} | null;
    culturalContext?: {id?: string | null; value?: string | null} | null;
    descHashMeta?: {id?: string | null; value?: string | null} | null;
    appDescHashMeta?: {id?: string | null; value?: string | null} | null;
    _contentHash?: string;
  } | null;
  translationsByLocale: Record<
    string,
    {title?: string; descriptionHtml?: string; seoTitle?: string; seoDescription?: string}
  >;
  backendApiUrl: string;
  didSelfHeal?: boolean;
  contentHash: string | null;
  didResetMetaCache: boolean;
};

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}

function productIdFromGid(gid: string | null | undefined) {
  if (!gid) return '';
  return String(gid).split('/').pop() ?? '';
}

export const loader = async ({request}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get('shop') || '';
  const selectedProductIdParam = url.searchParams.get('productId') || '';

  // Prefer offline context to avoid redirect loops; fall back to standard auth.
  const offlineContext = shopParam ? await getOfflineGraphqlClient(shopParam) : null;
  const usingOfflineClient = Boolean(offlineContext);
  let sessionShop = '';
  let graphqlQuery: (query: string, variables?: Record<string, any>) => Promise<any>;

  if (offlineContext) {
    sessionShop = offlineContext.session.shop;
    graphqlQuery = async (query) => {
      const resp = await offlineContext.client.query({data: query});
      return resp?.body;
    };
  } else {
    const {admin, session} = await authenticate.admin(request);
    sessionShop = session.shop;
    graphqlQuery = async (query, variables) => {
      const resp = await admin.graphql(query, {variables});
      return await resp.json();
    };
  }

  const shopSlug = sessionShop.replace('.myshopify.com', '');
  const backendApiUrl =
    process.env.BACKEND_API_URL || 'https://shopify-translator-api.onrender.com';

  const planQuery = `query AppPlan {
    appInstallation {
      activeSubscriptions {
        name
        status
      }
    }
  }`;

  const localesQuery = `query ShopLocales {
    shopLocales {
      locale
      name
      published
      primary
    }
  }`;

  // NOTE: the offline GraphQL wrapper (`getOfflineGraphqlClient`) does not accept variables.
  // For offline mode, inline the arguments instead of using `$first`.
  const productsQuery = usingOfflineClient
    ? `query Products {
        products(first: 50, sortKey: TITLE) {
          edges {
            node { id title }
          }
        }
      }`
    : `query Products($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges {
            node { id title }
          }
        }
      }`;

  let [planRes, localesRes, productsRes] = await Promise.all([
    graphqlQuery(planQuery),
    graphqlQuery(localesQuery),
    graphqlQuery(productsQuery, usingOfflineClient ? undefined : {first: 50}),
  ]);

  // SELF-HEALING: if offline token is expired, the offline wrapper returns null bodies.
  // In that case, force standard auth to mint a fresh session and retry with an online client.
  const missingData =
    !planRes?.data ||
    !localesRes?.data ||
    !productsRes?.data;

  let didSelfHeal = false;
  if (missingData && usingOfflineClient) {
    didSelfHeal = true;
    const {admin, session} = await authenticate.admin(request);
    sessionShop = session.shop;
    graphqlQuery = async (query, variables) => {
      const resp = await admin.graphql(query, {variables});
      return await resp.json();
    };

    [planRes, localesRes, productsRes] = await Promise.all([
      graphqlQuery(planQuery),
      graphqlQuery(localesQuery),
      graphqlQuery(
        `query Products($first: Int!) {
          products(first: $first, sortKey: TITLE) {
            edges { node { id title } }
          }
        }`,
        {first: 50},
      ),
    ]);
  }

  // Shopify billing is NOT the source of truth for plan display/gating.
  // Keep this GraphQL fetch for products/locales; plan gating comes from backend usage below.
  let planName: LoaderData['planName'] = 'Free';

  // Pull plan limits from backend DB so gating matches seeded limits.
  let maxLocales: number = 1;
  let billingCycleType: LoaderData['billingCycleType'] = 'lifetime';
  let rewriteLimit: number | null = null;
  let rewritesUsed: number | null = null;
  let lifetimeRewritesRemaining: number | null = null;
  let graceActive = false;
  let lastPlanName: LoaderData['planName'] | null = null;
  let accessExpiresAt: string | null = null;
  let pendingPlanName: string | null = null;
  let pendingPlanEffectiveAt: string | null = null;
  try {
    const u = await fetch(`${backendApiUrl}/api/admin/usage?shop=${encodeURIComponent(sessionShop)}`);
    if (u.ok) {
      const data: any = await u.json().catch(() => ({}));
      // Backend is the source-of-truth for grace period plan display after reinstall
      // (Shopify activeSubscriptions may be empty after uninstall).
      const ml = Number(data?.max_locales);
      if (Number.isFinite(ml)) {
        maxLocales = ml;
      }
      const bt = String(data?.billing_cycle_type || '').trim().toLowerCase();
      billingCycleType = bt === 'lifetime' ? 'lifetime' : 'recurring';
      const rl = Number(data?.rewrite_limit);
      rewriteLimit = Number.isFinite(rl) ? rl : null;
      const used = Number(data?.monthly_rewrites_used ?? data?.current_usage);
      rewritesUsed = Number.isFinite(used) ? used : null;
      const lr = Number(data?.lifetime_rewrites_remaining);
      lifetimeRewritesRemaining = Number.isFinite(lr) ? lr : null;

      // Reinstall-only UI: backend grace_mode is true only when the shop actually uninstalled.
      graceActive = Boolean(data?.grace_mode) && planName === 'Free';
      accessExpiresAt = data?.access_expires_at ?? null;
      pendingPlanName = data?.pending_plan_name ?? null;
      pendingPlanEffectiveAt = data?.pending_plan_effective_at ?? null;
      const last = String(data?.last_plan_name || '').trim();
      if (last === 'Free' || last === 'Basic' || last === 'Standard' || last === 'Pro') {
        lastPlanName = last as LoaderData['planName'];
      }
      const eff = String(data?.effective_plan_name || data?.plan_name || '').trim();
      if (eff === 'Free' || eff === 'Basic' || eff === 'Standard' || eff === 'Pro') {
        planName = eff as LoaderData['planName'];
      } else if (graceActive && lastPlanName && lastPlanName !== 'Free') {
        // Back-compat fallback (older backends)
        planName = lastPlanName;
      }
    }
  } catch {
    // Best-effort: keep fallback gating.
  }

  const locales: ShopLocale[] = localesRes?.data?.shopLocales ?? [];
  const primaryLocale = locales.find((l) => l.primary)?.locale || 'en';
  const products: ProductListItem[] =
    productsRes?.data?.products?.edges?.map((e: any) => e.node) ?? [];

  const fallbackSelected = firstOrNull(products)?.id ?? '';
  const selectedProductId = selectedProductIdParam || fallbackSelected;

  const selectedProductRes = selectedProductId
    ? usingOfflineClient
      ? await graphqlQuery(
          `query Product {
            product(id: "${String(selectedProductId).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}") {
              id
              title
              descriptionHtml
              productType
              seo { title description }
              culturalContext: metafield(namespace: "crossborderagent", key: "cultural_context") { id value }
              descHashMeta: metafield(namespace: "crossborderagent", key: "desc_hash") { id value }
              appDescHashMeta: metafield(namespace: "crossborderagent", key: "app_desc_hash") { id value }
            }
          }`,
        )
      : await graphqlQuery(
          `query Product($id: ID!) {
            product(id: $id) {
              id
              title
              descriptionHtml
              productType
              seo { title description }
              culturalContext: metafield(namespace: "crossborderagent", key: "cultural_context") { id value }
              descHashMeta: metafield(namespace: "crossborderagent", key: "desc_hash") { id value }
              appDescHashMeta: metafield(namespace: "crossborderagent", key: "app_desc_hash") { id value }
            }
          }`,
          {id: selectedProductId},
        )
    : null;

  let selectedProduct = selectedProductRes?.data?.product ?? null;

  const currentContentHash = selectedProduct?.descriptionHtml
    ? descriptionHash(String(selectedProduct.descriptionHtml ?? ''))
    : descriptionHash('');
  let didResetMetaCache = false;

  // If description changed manually in Shopify (not via our app), clear cached context metafields.
  if (selectedProduct?.id) {
    const prevDescHash = String(selectedProduct?.descHashMeta?.value ?? '');
    const appDescHash = String(selectedProduct?.appDescHashMeta?.value ?? '');
    // If we don't have a baseline yet, just set it—don't treat it as a manual change.
    if (prevDescHash && prevDescHash !== currentContentHash) {
      const isManualChange = appDescHash !== currentContentHash;
      if (isManualChange) {
        const ctxId = selectedProduct?.culturalContext?.id;
        if (ctxId) {
          try {
            await graphqlQuery(
              `mutation DeleteMetafield($input: MetafieldDeleteInput!) {
                metafieldDelete(input: $input) {
                  deletedId
                  userErrors { field message }
                }
              }`,
              {input: {id: ctxId}},
            );
          } catch {
            // best-effort
          }
        }
        // Ensure UI doesn't keep showing stale "saved" status for cultural context.
        selectedProduct = {
          ...selectedProduct,
          culturalContext: {id: null, value: null},
        };
        didResetMetaCache = true;
      }

      // Record latest seen hash so we don't reset repeatedly.
      try {
        await graphqlQuery(
          `mutation SetHash($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id }
              userErrors { field message }
            }
          }`,
          {
            metafields: [
              {
                ownerId: selectedProduct.id,
                namespace: "crossborderagent",
                key: "desc_hash",
                type: "single_line_text_field",
                value: currentContentHash,
              },
            ],
          },
        );
      } catch {
        // best-effort
      }
    }

    // Ensure we always have a baseline hash recorded for future comparisons.
    if (!prevDescHash) {
      try {
        await graphqlQuery(
          `mutation SetHash($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id }
              userErrors { field message }
            }
          }`,
          {
            metafields: [
              {
                ownerId: selectedProduct.id,
                namespace: "crossborderagent",
                key: "desc_hash",
                type: "single_line_text_field",
                value: currentContentHash,
              },
            ],
          },
        );
      } catch {
        // best-effort
      }
    }
  }

  if (selectedProduct) {
    selectedProduct = {...selectedProduct, _contentHash: currentContentHash};
  }

  // Existing translations for this product (used for locale switching in the workspace).
  // NOTE: Shopify requires a `locale` argument for `translations(...)`, so we query per locale.
  const translationsByLocale: LoaderData['translationsByLocale'] = {};
  if (selectedProductId) {
    const safeId = String(selectedProductId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const localeList = locales.filter((l) => l.published).map((l) => l.locale);

    for (const loc of localeList) {
      const safeLocale = String(loc).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const tr = await graphqlQuery(
        `query TranslationsForLocale {
          translatableResource(resourceId: "${safeId}") {
            translations(locale: "${safeLocale}") {
              key
              value
            }
          }
        }`,
      );

      const items: Array<{key: string; value: string}> =
        tr?.data?.translatableResource?.translations ?? [];

      const bucket = (translationsByLocale[loc] ||= {});
      for (const item of items) {
        if (item?.key === 'title') bucket.title = item.value;
        if (item?.key === 'body_html') bucket.descriptionHtml = item.value;
        if (item?.key === 'title_tag') bucket.seoTitle = item.value;
        if (item?.key === 'description_tag') bucket.seoDescription = item.value;
      }
    }
  }

  return {
    shop: sessionShop,
    shopSlug,
    planName,
    maxLocales,
    billingCycleType,
    rewriteLimit,
    rewritesUsed,
    lifetimeRewritesRemaining,
    graceActive,
    lastPlanName,
    accessExpiresAt,
    pendingPlanName,
    pendingPlanEffectiveAt,
    primaryLocale,
    locales,
    products,
    selectedProduct,
    translationsByLocale,
    backendApiUrl,
    didSelfHeal,
    contentHash: selectedProduct?._contentHash ?? null,
    didResetMetaCache,
  } satisfies LoaderData;
};

// Avoid revalidating the loader for non-destructive fetcher actions like saving cultural context.
// Revalidation can reseed drafts and appear as a "reset" while the merchant is editing.
export const shouldRevalidate = (args: {
  formData?: FormData | null;
  defaultShouldRevalidate: boolean;
}) => {
  const intent = String(args.formData?.get('intent') ?? '');
  if (intent === 'set_cultural_context') return false;
  return args.defaultShouldRevalidate;
};

export const action = async ({request}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  // Ensure the request is an authenticated embedded-app request.
  const {admin} = await authenticate.admin(request);

  if (intent === 'set_cultural_context') {
    const productId = String(formData.get('productId') || '');
    const value = String(formData.get('value') || '');
    if (!productId) return {ok: false, error: 'Missing productId'};
    if (!value.trim()) return {ok: false, error: 'Missing value'};

    const resp = await admin.graphql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key namespace value }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: productId,
              namespace: 'crossborderagent',
              key: 'cultural_context',
              type: 'multi_line_text_field',
              value,
            },
          ],
        },
      },
    );
    const body = await resp.json();
    const errs = body?.data?.metafieldsSet?.userErrors ?? [];
    if (errs.length > 0) {
      return {ok: false, error: errs[0]?.message ?? 'Failed to set metafield'};
    }

    // Treat this as an app-driven change for our hash tracking. Some Shopify operations can re-normalize HTML,
    // so we stamp hashes based on Shopify's canonical saved description to avoid false "manual edit" detection.
    try {
      const p = await admin.graphql(
        `query ProductDesc($id: ID!) { product(id: $id) { descriptionHtml } }`,
        {variables: {id: productId}},
      );
      const pj = await p.json();
      const canonical = String(pj?.data?.product?.descriptionHtml ?? '');
      const h = descriptionHash(canonical);
      await admin.graphql(
        `mutation SetHashes($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id }
            userErrors { field message }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                ownerId: productId,
                namespace: 'crossborderagent',
                key: 'app_desc_hash',
                type: 'single_line_text_field',
                value: h,
              },
              {
                ownerId: productId,
                namespace: 'crossborderagent',
                key: 'desc_hash',
                type: 'single_line_text_field',
                value: h,
              },
            ],
          },
        },
      );
    } catch {
      // best-effort
    }
    return {ok: true};
  }

  if (intent === 'save') {
    const productId = String(formData.get('productId') || '');
    const targetLocale = String(formData.get('targetLocale') || '');
    const title = String(formData.get('draftTitle') || '');
    const descriptionHtml = String(formData.get('draftDescription') || '');
    const seoTitle = String(formData.get('draftSeoTitle') || '');
    const seoDescription = String(formData.get('draftSeoDescription') || '');

    // Determine shop primary locale
    const localesResp = await admin.graphql(`query ShopLocales { shopLocales { locale primary } }`);
    const localesJson = await localesResp.json();
    const shopLocales: Array<{locale: string; primary: boolean}> =
      localesJson?.data?.shopLocales ?? [];
    const primaryLocale = shopLocales.find((l) => l.primary)?.locale || 'en';

    // If saving to primary locale, update product directly
    if (!targetLocale || targetLocale === primaryLocale) {
    const resp = await admin.graphql(
      `mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id }
          userErrors { message }
        }
      }`,
      {
        variables: {
          input: {
            id: productId,
            ...(title ? {title} : {}),
            ...(descriptionHtml ? {descriptionHtml} : {}),
            ...((seoTitle || seoDescription)
              ? {seo: {title: seoTitle || null, description: seoDescription || null}}
              : {}),
          },
        },
      },
    );
    const body = await resp.json();
    const errors = body?.data?.productUpdate?.userErrors ?? [];
    if (errors.length > 0) {
      return {ok: false, error: errors[0]?.message ?? 'Unknown error'};
    }

    // Stamp hashes using Shopify's canonical saved HTML (Shopify may normalize/sanitize the HTML we submit).
    if (descriptionHtml) {
      try {
        const p = await admin.graphql(
          `query ProductDesc($id: ID!) { product(id: $id) { descriptionHtml } }`,
          {variables: {id: productId}},
        );
        const pj = await p.json();
        const canonical = String(pj?.data?.product?.descriptionHtml ?? descriptionHtml);
        const h = descriptionHash(canonical);
        await admin.graphql(
          `mutation SetHashes($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id }
              userErrors { field message }
            }
          }`,
          {
            variables: {
              metafields: [
                {
                  ownerId: productId,
                  namespace: 'crossborderagent',
                  key: 'app_desc_hash',
                  type: 'single_line_text_field',
                  value: h,
                },
                {
                  ownerId: productId,
                  namespace: 'crossborderagent',
                  key: 'desc_hash',
                  type: 'single_line_text_field',
                  value: h,
                },
              ],
            },
          },
        );
      } catch {
        // best-effort
      }
    }
    return {ok: true};
    }

    // Otherwise, register translation for the target locale (prevents overwriting the primary language)
    const digestResp = await admin.graphql(
      `query Digests($id: ID!) {
        translatableResource(resourceId: $id) {
          translatableContent {
            key
            digest
          }
        }
      }`,
      {variables: {id: productId}},
    );
    const digestJson = await digestResp.json();
    const contents: Array<{key: string; digest: string}> =
      digestJson?.data?.translatableResource?.translatableContent ?? [];
    const titleDigest = contents.find((c) => c.key === 'title')?.digest || '';
    const bodyDigest = contents.find((c) => c.key === 'body_html')?.digest || '';
    const titleTagDigest = contents.find((c) => c.key === 'title_tag')?.digest || '';
    const descTagDigest = contents.find((c) => c.key === 'description_tag')?.digest || '';
    if (!titleDigest || !bodyDigest) {
      return {ok: false, error: 'Missing translation digests for title/body_html.'};
    }
    if ((seoTitle && !titleTagDigest) || (seoDescription && !descTagDigest)) {
      return {ok: false, error: 'Missing translation digests for SEO (title_tag/description_tag).'};
    }

    const registerResp = await admin.graphql(
      `mutation Register($id: ID!, $translations: [TranslationInput!]!) {
        translationsRegister(resourceId: $id, translations: $translations) {
          userErrors { message }
        }
      }`,
      {
        variables: {
          id: productId,
          translations: [
            {
              locale: targetLocale,
              key: 'title',
              value: title,
              translatableContentDigest: titleDigest,
            },
            {
              locale: targetLocale,
              key: 'body_html',
              value: descriptionHtml,
              translatableContentDigest: bodyDigest,
            },
            ...(seoTitle
              ? [
                  {
                    locale: targetLocale,
                    key: 'title_tag',
                    value: seoTitle,
                    translatableContentDigest: titleTagDigest,
                  },
                ]
              : []),
            ...(seoDescription
              ? [
                  {
                    locale: targetLocale,
                    key: 'description_tag',
                    value: seoDescription,
                    translatableContentDigest: descTagDigest,
                  },
                ]
              : []),
          ],
        },
      },
    );
    const registerJson = await registerResp.json();
    const userErrors = registerJson?.data?.translationsRegister?.userErrors ?? [];
    if (userErrors.length > 0) {
      return {ok: false, error: userErrors[0]?.message ?? 'Translation save failed'};
    }
    return {ok: true};
  }

  return {ok: false, error: 'Unknown intent'};
};

function RichTextEditor({
  label,
  value,
  onChange,
  height = 320,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [blockType, setBlockType] = useState<'p' | 'h2' | 'h3'>('p');

  // Keep the editor showing rendered HTML without forcing cursor jumps while typing.
  useEffect(() => {
    if (!ref.current) return;
    if (isFocused) return;
    if (ref.current.innerHTML === value) return;
    ref.current.innerHTML = value || '';
  }, [value, isFocused]);

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      try {
        document.execCommand(command, false, commandValue);
        if (ref.current) onChange(ref.current.innerHTML);
      } catch {
        // no-op
      }
    },
    [onChange],
  );

  const applyBlockType = useCallback(
    (next: 'p' | 'h2' | 'h3') => {
      setBlockType(next);
      // Make Enter create <p> blocks (closer to Shopify’s editor behavior).
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch {
        // no-op
      }
      // Apply format block to current selection.
      const tag = next === 'p' ? 'p' : next;
      exec('formatBlock', tag);
    },
    [exec],
  );

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    exec('createLink', url);
  }, [exec]);

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm" tone="subdued">
        {label}
      </Text>

      {/* Shopify-like typography for headings/lists inside the editor surface */}
      <style>
        {`
          .shopifyRte h2 { font-size: 28px; line-height: 34px; font-weight: 700; margin: 0 0 14px; }
          .shopifyRte h3 { font-size: 22px; line-height: 28px; font-weight: 700; margin: 18px 0 10px; }
          .shopifyRte h4 { font-size: 18px; line-height: 24px; font-weight: 650; margin: 14px 0 8px; }
          .shopifyRte p  { margin: 0 0 12px; }
          .shopifyRte ul, .shopifyRte ol { margin: 0 0 12px 20px; padding: 0; }
          .shopifyRte li { margin: 4px 0; }
          .shopifyRte hr { margin: 16px 0; }
          .shopifyRte table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .shopifyRte th, .shopifyRte td { border: 1px solid #d0d0d0; padding: 10px 12px; vertical-align: top; }
          .shopifyRte th { background: #f6f6f7; font-weight: 650; text-align: left; width: 36%; }
        `}
      </style>

      <Box
        borderColor="border"
        borderWidth="025"
        borderRadius="200"
        background="bg-surface"
      >
        {/* Toolbar (Shopify-like) */}
        <Box padding="200" background="bg-surface">
          <div style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto'}}>
            <div style={{minWidth: 128, maxWidth: 170, flex: '0 0 auto'}}>
              <Select
                label=""
                labelHidden
                options={[
                  {label: 'Paragraph', value: 'p'},
                  {label: 'Heading', value: 'h2'},
                  {label: 'Subheading', value: 'h3'},
                ]}
                value={blockType}
                onChange={(v) => applyBlockType(v as 'p' | 'h2' | 'h3')}
              />
            </div>

            <ButtonGroup>
              <Button size="micro" accessibilityLabel="Bold" icon={TextBoldIcon} onClick={() => exec('bold')} />
              <Button size="micro" accessibilityLabel="Italic" icon={TextItalicIcon} onClick={() => exec('italic')} />
              <Button size="micro" accessibilityLabel="Underline" icon={TextUnderlineIcon} onClick={() => exec('underline')} />
            </ButtonGroup>

            <ButtonGroup>
              <Button
                size="micro"
                accessibilityLabel="Bulleted list"
                icon={ListBulletedIcon}
                onClick={() => exec('insertUnorderedList')}
              />
              <Button
                size="micro"
                accessibilityLabel="Numbered list"
                icon={ListNumberedIcon}
                onClick={() => exec('insertOrderedList')}
              />
            </ButtonGroup>

            <Button size="micro" accessibilityLabel="Insert link" icon={LinkIcon} onClick={insertLink} />
          </div>
        </Box>
        <Divider />

        {/* Editor surface */}
        <div
          ref={ref}
          className="shopifyRte"
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            setIsFocused(true);
            try {
              document.execCommand('defaultParagraphSeparator', false, 'p');
            } catch {
              // no-op
            }
          }}
          onBlur={() => setIsFocused(false)}
          onInput={() => {
            if (ref.current) onChange(ref.current.innerHTML);
          }}
          style={{
            padding: 16,
            minHeight: height,
            maxHeight: height,
            overflowY: 'auto',
            // Match Shopify Admin editor feel (typography + spacing)
            fontSize: 16,
            lineHeight: '24px',
            fontFamily: 'var(--p-font-family-sans)',
          }}
        />
      </Box>
    </BlockStack>
  );
}

function RewriterWorkspaceInner({
  planName,
  maxLocales,
  billingCycleType,
  rewriteLimit,
  rewritesUsed,
  lifetimeRewritesRemaining,
  graceActive,
  lastPlanName,
  accessExpiresAt,
  pendingPlanName,
  pendingPlanEffectiveAt,
  primaryLocale,
  locales,
  products,
  selectedProduct,
  translationsByLocale,
  didSelfHeal,
  contentHash,
  didResetMetaCache,
  shop,
  backendApiUrl,
  shopSlug,
}: LoaderData) {
  const [searchParams, setSearchParams] = useSearchParams();
  const app = useAppBridge() as unknown as ClientApplication<any>;

  const [search, setSearch] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<string>('');
  const [overLimit, setOverLimit] = useState(false);
  const [autoConvertUnits, setAutoConvertUnits] = useState(true);
  const [toneProfile, setToneProfile] = useState<'professional' | 'luxury' | 'minimalist' | 'playful'>('professional');

  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceDescription, setReferenceDescription] = useState('');

  const [draftByLocale, setDraftByLocale] = useState<
    Record<
      string,
      {title: string; description: string; seoTitle: string; seoDescription: string; seoAltText: string}
    >
  >({});
  const [isSwitchingLocale, setIsSwitchingLocale] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [discoveredValues, setDiscoveredValues] = useState<
    Array<{
      category: string;
      evidence: string;
      explanation: string;
      suggested_footer: string;
      insight_headline?: string;
      strategic_value?: string;
    }>
  >([]);
  const [addedValueKeys, setAddedValueKeys] = useState<Record<string, boolean>>({});
  const [culturalContextSaved, setCulturalContextSaved] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('⏳ Analyzing materials and craftsmanship...');
  const loadingTimerRef = useRef<number | null>(null);

  const saveFetcher = useFetcher<typeof action>();
  const culturalFetcher = useFetcher<typeof action>();

  const [toastContent, setToastContent] = useState<string | null>(null);
  const [showSelfHealBanner, setShowSelfHealBanner] = useState(Boolean(didSelfHeal));
  const [showDowngradeBanner, setShowDowngradeBanner] = useState(true);
  const [seoIntelOpen, setSeoIntelOpen] = useState(false);
  const [jvOpen, setJvOpen] = useState(false);
  const [removeIrrelevantContent, setRemoveIrrelevantContent] = useState(true);
  const [miscInfoByLocale, setMiscInfoByLocale] = useState<Record<string, string>>({});
  const [seoIntelByLocale, setSeoIntelByLocale] = useState<
    Record<
      string,
      {
        competitor_titles?: string[];
        competitor_results?: {title?: string | null; snippet?: string | null; link?: string | null}[];
        lsi_keywords_used?: string[];
        search_intent?: string;
        competitive_edge?: string;
      }
    >
  >({});

  const allowsMultiLocale = maxLocales !== 1;
  // IMPORTANT: determine Free by billingCycleType (source-of-truth from backend usage),
  // not by Shopify billing planName (which may show "Free" after uninstall).
  const isFreePlan =
    billingCycleType === 'lifetime' || (!billingCycleType && planName === 'Free');
  const isBasicPlan = planName === 'Basic' || isFreePlan;
  const effectiveTone: 'professional' | 'luxury' | 'minimalist' | 'playful' = isBasicPlan
    ? 'professional'
    : toneProfile;
  const isOutOfFreeCredits =
    isFreePlan && Number(lifetimeRewritesRemaining ?? 0) <= 0;

  const localeLimitMsg = isFreePlan
    ? 'Free plan allows selecting 1 locale. Upgrade to Standard to select multiple.'
    : 'Basic plan allows selecting 1 locale. Upgrade to Standard to select multiple.';

  const isExpiredPaid = useMemo(() => {
    // If last plan is paid and access_expires_at has passed, the merchant must upgrade.
    const last = String(lastPlanName || '').trim();
    const expiresAt = String(accessExpiresAt || '').trim();
    if (!last || last === 'Free') return false;
    if (!expiresAt) return false;
    const dt = new Date(expiresAt);
    if (Number.isNaN(dt.getTime())) return false;
    return Date.now() > dt.getTime();
  }, [lastPlanName, accessExpiresAt]);

  const publishedLocales = useMemo(
    () => locales.filter((l) => l.published),
    [locales],
  );

  // Default selected locale: primary
  useEffect(() => {
    if (selectedLocales.length > 0) return;
    const primary = publishedLocales.find((l) => l.primary)?.locale || primaryLocale;
    if (primary) setSelectedLocales([primary]);
  }, [publishedLocales, selectedLocales.length]);

  // Keep active locale in sync (tabs control the visible draft)
  useEffect(() => {
    const published = publishedLocales.map((l) => l.locale);
    if (activeLocale && published.includes(activeLocale)) return;
    const next =
      publishedLocales.find((l) => l.primary)?.locale ||
      primaryLocale ||
      published[0] ||
      '';
    setActiveLocale(next);
  }, [activeLocale, primaryLocale, publishedLocales]);

  // When product changes, reset reference + draft to current product
  useEffect(() => {
    setOptimizeError(null);
    setReferenceTitle(selectedProduct?.title ?? '');
    setReferenceDescription(selectedProduct?.descriptionHtml ?? '');
    setDiscoveredValues([]);
    setAddedValueKeys({});
    setCulturalContextSaved(didResetMetaCache ? false : Boolean(selectedProduct?.culturalContext?.value));

    const baseTitle = selectedProduct?.title ?? '';
    const baseDesc = selectedProduct?.descriptionHtml ?? '';
    const baseSeoTitle = String(selectedProduct?.seo?.title ?? '').trim();
    const baseSeoDesc = String(selectedProduct?.seo?.description ?? '').trim();

    // Seed draft map from existing Shopify translations, falling back to primary content.
    const seeded: Record<
      string,
      {title: string; description: string; seoTitle: string; seoDescription: string; seoAltText: string}
    > = {};
    for (const loc of publishedLocales.map((l) => l.locale)) {
      const t = translationsByLocale?.[loc];
      const isPrimary = loc === primaryLocale;
      seeded[loc] = {
        // For primary locale, always reflect the live product values (prevents stale SEO after manual edits).
        title: isPrimary ? baseTitle : t?.title ?? baseTitle,
        description: isPrimary ? baseDesc : t?.descriptionHtml ?? baseDesc,
        seoTitle: isPrimary ? baseSeoTitle : t?.seoTitle ?? '',
        seoDescription: isPrimary ? baseSeoDesc : t?.seoDescription ?? '',
        seoAltText: '',
      };
    }
    setDraftByLocale(seeded);

    // Ensure activeLocale stays valid for the new product
    const initLocale =
      activeLocale ||
      publishedLocales.find((l) => l.primary)?.locale ||
      primaryLocale ||
      publishedLocales[0]?.locale ||
      '';
    if (initLocale) setActiveLocale(initLocale);
    if (didResetMetaCache) {
      setToastContent('Product description changed in Shopify. Context & drafts were reset.');
    }
  }, [selectedProduct?.id, contentHash]);

  // Reflect metafield save immediately in UI.
  useEffect(() => {
    if ((culturalFetcher.data as any)?.ok) {
      setCulturalContextSaved(true);
    }
  }, [culturalFetcher.data]);

  // NOTE: Value discovery now comes from the main generation response (LLM JSON),
  // so we intentionally do not run a separate discovery call on selection.

  // Success toast after Save
  useEffect(() => {
    if ((saveFetcher.data as any)?.ok) {
      setToastContent('Product saved, please refresh to check!');
    }
  }, [saveFetcher.data]);

  // Show a small spinner while switching locales (prevents perceived flicker)
  useEffect(() => {
    if (!activeLocale) return;
    const hasDraft = Boolean(draftByLocale[activeLocale]);
    // if we don't have draft data yet, keep spinner on until it arrives
    setIsSwitchingLocale(!hasDraft);
  }, [activeLocale, draftByLocale]);

  const currentDraft = useMemo(() => {
    const baseTitle = selectedProduct?.title ?? '';
    const baseDesc = selectedProduct?.descriptionHtml ?? '';
    const fromMap = activeLocale ? draftByLocale[activeLocale] : undefined;
    if (fromMap) return fromMap;
    const fromTranslations = activeLocale ? translationsByLocale?.[activeLocale] : undefined;
    return {
      title: fromTranslations?.title ?? baseTitle,
      description: fromTranslations?.descriptionHtml ?? baseDesc,
      seoTitle: fromTranslations?.seoTitle ?? '',
      seoDescription: fromTranslations?.seoDescription ?? '',
      seoAltText: '',
    };
  }, [activeLocale, draftByLocale, selectedProduct?.descriptionHtml, selectedProduct?.title, translationsByLocale]);

  const seoPlaceholders = useMemo(() => {
    const pTitle = String(selectedProduct?.seo?.title ?? '').trim();
    const pDesc = String(selectedProduct?.seo?.description ?? '').trim();
    return {
      title: pTitle,
      description: pDesc,
    };
  }, [selectedProduct?.seo?.description, selectedProduct?.seo?.title]);

  function SearchEnginePreview({
    title,
    url,
    snippet,
  }: {
    title: string;
    url: string;
    snippet: string;
  }) {
    return (
      <div
        style={{
          border: '1px solid var(--p-color-border-secondary)',
          borderRadius: 8,
          padding: 12,
          background: 'var(--p-color-bg-surface)',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <div
            style={{
              color: '#1a0dab',
              fontSize: 18,
              lineHeight: '22px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={title}
          >
            {title || 'SEO title preview…'}
          </div>
          <div style={{color: '#006621', fontSize: 14, lineHeight: '18px'}}>
            {url}
          </div>
          <div style={{color: '#4b5563', fontSize: 14, lineHeight: '18px'}}>
            {snippet || 'Meta description preview…'}
          </div>
        </div>
      </div>
    );
  }

  const valueKey = useCallback(
    (v: {category: string; evidence: string}) => `${v.category}::${v.evidence}`,
    [],
  );

  const uniqueValues = useMemo(() => {
    // Deduplicate by (category,evidence) so the same insight doesn't render multiple times.
    const seen = new Set<string>();
    const out: typeof discoveredValues = [];
    for (const v of discoveredValues) {
      const k = valueKey(v);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(v);
    }
    return out;
  }, [discoveredValues, valueKey]);

  const handleAdd = useCallback(
    (v: {category: string; evidence: string; suggested_footer: string}) => {
      const key = valueKey(v);
      if (addedValueKeys[key] || culturalContextSaved) return;

      const footerText = String(v.suggested_footer || '').trim();
      if (!footerText) return;

      const escapeHtml = (s: string) =>
        s
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');

      // Suggested heading to make the appended footer feel intentional + premium in the description.
      const heading = 'Key Details (Nuance)';
      const snippet =
        `\n\n<hr />\n` +
        `<div class="ai-value-footer">\n` +
        `<h3>${heading}</h3>\n` +
        `<p>${escapeHtml(footerText)}</p>\n` +
        `</div>\n`;

      const base = String(currentDraft.description || '');
      const nextDesc = base ? `${base}${snippet}` : snippet.trim();

      setDraftByLocale((prev) => ({
        ...prev,
        [activeLocale]: {
          title: currentDraft.title,
          description: nextDesc,
          seoTitle: currentDraft.seoTitle,
          seoDescription: currentDraft.seoDescription,
          seoAltText: currentDraft.seoAltText,
        },
      }));

      setAddedValueKeys((prev) => ({...prev, [key]: true}));

      // Persist to Shopify as a product metafield (theme/SEO usage).
      if (selectedProduct?.id) {
        const metaValue = `${heading}\n\n${footerText}`;
        const fd = new FormData();
        fd.set('intent', 'set_cultural_context');
        fd.set('productId', selectedProduct.id);
        fd.set('value', metaValue);
        culturalFetcher.submit(fd, {method: 'post'});
      }
    },
    [
      activeLocale,
      addedValueKeys,
      culturalContextSaved,
      culturalFetcher,
      currentDraft.description,
      currentDraft.title,
      selectedProduct?.id,
      setDraftByLocale,
      valueKey,
    ],
  );

  const startLoading = useCallback(() => {
    const msgs = [
      '⏳ Analyzing materials and craftsmanship...',
      '⏳ Applying global marketing psychology...',
      '⏳ Building your brand story...',
    ];
    let i = 0;
    setLoadingMessage(msgs[0]);
    if (loadingTimerRef.current) window.clearInterval(loadingTimerRef.current);
    loadingTimerRef.current = window.setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMessage(msgs[i]);
    }, 2000);
  }, []);

  const stopLoading = useCallback(() => {
    if (loadingTimerRef.current) window.clearInterval(loadingTimerRef.current);
    loadingTimerRef.current = null;
  }, []);

  const extractGenerated = (
    result: any,
    locale: string,
  ): {
    title?: string;
    description?: string;
    seo_title?: string;
    seo_description?: string;
    seo_alt_text?: string;
    seo_insights?: {
      lsi_keywords_used?: string[];
      search_intent?: string;
      competitive_edge?: string;
    };
    misc_information?: string;
    competitor_titles?: string[];
    competitor_results?: {title?: string | null; snippet?: string | null; link?: string | null}[];
  } | null => {
    if (result?.data) return result.data;
    const results = result?.results;
    if (results && typeof results === 'object') {
      if (locale && results[locale]) return results[locale];
      const first = Object.keys(results)[0];
      if (first) return results[first];
    }
    return null;
  };

  const handleOptimize = useCallback(async () => {
    if (isOutOfFreeCredits) {
      setToastContent("You've used your 10 free lifetime credits. Upgrade to Basic for 50 rewrites every month!");
      return;
    }
    setOptimizeError(null);
    setOverLimit(false);
    setDiscoveredValues([]);
    setAddedValueKeys({});

    if (!selectedProduct?.id) {
      setOptimizeError('No product selected.');
      return;
    }
    if (!activeLocale) {
      setOptimizeError('Please select a market.');
      return;
    }

    setIsOptimizing(true);
    startLoading();

    try {
      let token: string | null = null;
      try {
        token = await getSessionToken(app);
      } catch {
        token = null;
      }

      const payload = {
        japanese_description: referenceDescription ?? '',
        product_name: referenceTitle ?? '',
        category: selectedProduct?.productType ?? '',
        product_id: productIdFromGid(selectedProduct?.id),
        // Pro users can generate for multiple locales at once; we still preview the activeLocale in the Draft pane.
        target_locales: selectedLocales.length > 0 ? selectedLocales : [activeLocale],
        auto_convert_units: Boolean(autoConvertUnits),
        tone_profile: effectiveTone,
        remove_irrelevant_content: Boolean(removeIrrelevantContent),
      };

      // Call through same-origin proxy to avoid CORS; forward the session token to backend.
      const resp = await fetch('/api/proxy/generate-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result?.status !== 'success') {
        const msg = result?.detail || 'Generation failed';
        setOptimizeError(String(msg));
        return;
      }
      if (Array.isArray(result?.discovered_values)) {
        // Preferred contract: discovered_values from backend.
        const vals = result.discovered_values
          .map((v: any) => ({
            category: String(v?.category ?? '').trim(),
            evidence: String(v?.evidence ?? '').trim(),
            explanation: String(v?.explanation ?? '').trim(),
            suggested_footer: String(v?.suggested_footer ?? '').trim(),
            insight_headline: String(v?.insight_headline ?? '').trim() || undefined,
            strategic_value: String(v?.strategic_value ?? '').trim() || undefined,
          }))
          .filter((v: any) => v.category && v.evidence && v.suggested_footer);
        setDiscoveredValues(vals);
      } else if (Array.isArray(result?.discoveries)) {
        // Back-compat: map legacy discoveries to discoveredValues.
        const vals = result.discoveries
          .map((d: any) => ({
            category: String(d?.category ?? '').trim(),
            evidence: String(d?.evidence_text ?? '').trim(),
            explanation: '',
            suggested_footer: String(d?.suggested_content ?? '').trim(),
            insight_headline: String(d?.title ?? '').trim() || undefined,
            strategic_value: '',
          }))
          .filter((v: any) => v.category && v.evidence && v.suggested_footer);
        setDiscoveredValues(vals);
      }

      const data = extractGenerated(result, activeLocale);
      if (!data) {
        setOptimizeError('Generation succeeded but no content was returned.');
        return;
      }
      if (data?.seo_insights || data?.competitor_titles || data?.competitor_results) {
        setSeoIntelByLocale((prev) => ({
          ...prev,
          [activeLocale]: {
            competitor_titles: Array.isArray(data?.competitor_titles)
              ? data?.competitor_titles
              : prev[activeLocale]?.competitor_titles,
            competitor_results: Array.isArray(data?.competitor_results)
              ? data?.competitor_results
              : prev[activeLocale]?.competitor_results,
            lsi_keywords_used: Array.isArray(data?.seo_insights?.lsi_keywords_used)
              ? data?.seo_insights?.lsi_keywords_used
              : prev[activeLocale]?.lsi_keywords_used,
            search_intent:
              typeof data?.seo_insights?.search_intent === 'string'
                ? data?.seo_insights?.search_intent
                : prev[activeLocale]?.search_intent,
            competitive_edge:
              typeof data?.seo_insights?.competitive_edge === 'string'
                ? data?.seo_insights?.competitive_edge
                : prev[activeLocale]?.competitive_edge,
          },
        }));
      }
      if (typeof data?.misc_information === 'string') {
        setMiscInfoByLocale((prev) => ({
          ...prev,
          [activeLocale]: (data.misc_information || '').trim(),
        }));
      }

      // Update the currently-visible locale draft (active tab)
      setDraftByLocale((prev) => ({
        ...prev,
        [activeLocale]: {
          title: typeof data.title === 'string' && data.title ? data.title : prev[activeLocale]?.title ?? '',
          description:
            typeof data.description === 'string' && data.description
              ? data.description
              : prev[activeLocale]?.description ?? '',
          seoTitle:
            typeof data.seo_title === 'string' && data.seo_title
              ? data.seo_title
              : prev[activeLocale]?.seoTitle ?? '',
          seoDescription:
            typeof data.seo_description === 'string' && data.seo_description
              ? data.seo_description
              : prev[activeLocale]?.seoDescription ?? '',
          seoAltText:
            typeof data.seo_alt_text === 'string' && data.seo_alt_text
              ? data.seo_alt_text
              : prev[activeLocale]?.seoAltText ?? '',
        },
      }));

      // If multi-locale, store drafts for all returned locales so switching works.
      if (result?.results && typeof result.results === 'object') {
        setDraftByLocale((prev) => {
          const next = {...prev};
          for (const [loc, payload] of Object.entries(result.results)) {
            const p: any = payload;
            next[loc] = {
              title: String(p?.title ?? next[loc]?.title ?? ''),
              description: String(p?.description ?? next[loc]?.description ?? ''),
              seoTitle: String(p?.seo_title ?? next[loc]?.seoTitle ?? ''),
              seoDescription: String(p?.seo_description ?? next[loc]?.seoDescription ?? ''),
              seoAltText: String(p?.seo_alt_text ?? next[loc]?.seoAltText ?? ''),
            };
          }
          return next;
        });
      }

      const processed = Array.isArray(result?.processed) ? result.processed : [];
      setToastContent(
        processed.length > 1
          ? `Product Description updated! (${processed.join(', ')})`
          : 'Product Description updated!',
      );
    } catch (e: any) {
      setOptimizeError(e?.message ? `Network Error: ${e.message}` : 'Network Error');
    } finally {
      stopLoading();
      setIsOptimizing(false);
    }
  }, [
    activeLocale,
    app,
    referenceDescription,
    referenceTitle,
    selectedLocales,
    selectedProduct?.id,
    selectedProduct?.productType,
    startLoading,
    stopLoading,
    isOutOfFreeCredits,
  ]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, search]);

  const plansUrl = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/app/plans?from=dashboard&${qs}` : "/app/plans?from=dashboard";
  }, [searchParams]);

  const seoStatus = useMemo(() => {
    const titleLen = (currentDraft.seoTitle || '').length;
    const descLen = (currentDraft.seoDescription || '').length;
    const titleOk = titleLen >= 50 && titleLen <= 70;
    const descOk = descLen > 0 && descLen <= 160;

    // Reuse CTR lights logic to keep badge honest
    const desc = String(currentDraft.seoDescription || "");
    const descLower = desc.toLowerCase();
    const problemWords = [
      "tired",
      "struggling",
      "problem",
      "frustrated",
      "looking for",
      "need a",
      "wish",
    ];
    const hasProblemSignal =
      desc.includes("?") ||
      problemWords.some((w) => descLower.includes(w));
    const hasBrandTrust =
      /japan/i.test(desc) ||
      /handcrafted/i.test(desc) ||
      /free shipping/i.test(desc);

    const pstTone: "green" | "yellow" | "red" = hasProblemSignal
      ? "green"
      : /shop now|discover|order|buy/i.test(desc)
        ? "yellow"
        : "red";
    const trustTone: "green" | "yellow" | "red" = hasBrandTrust
      ? "green"
      : /authentic|artisan|premium/i.test(desc)
        ? "yellow"
        : "red";
    const lenTone: "green" | "yellow" | "red" =
      titleLen > 50 && titleLen < 70
        ? "green"
        : titleLen >= 45 && titleLen <= 75
          ? "yellow"
          : "red";

    const allGreen = pstTone === "green" && trustTone === "green" && lenTone === "green";

    return {
      label: allGreen && titleOk && descOk ? 'Optimized' : 'Needs work',
      tone: allGreen && titleOk && descOk ? 'success' : 'warning' as 'success' | 'warning',
    };
  }, [currentDraft.seoDescription, currentDraft.seoTitle]);

  const jvStatus = useMemo(() => {
    const hasValues = uniqueValues.length > 0;
    return {
      label: hasValues ? 'Optimized' : 'Needs work',
      tone: hasValues ? 'success' : 'warning' as 'success' | 'warning',
    };
  }, [uniqueValues.length]);

  const selectedProductId = searchParams.get('productId') || (products[0]?.id ?? '');

  const toggleLocale = (locale: string, nextChecked: boolean) => {
    setOverLimit(false);
    setSelectedLocales((prev) => {
      const next = nextChecked ? Array.from(new Set([...prev, locale])) : prev.filter((l) => l !== locale);
      if (!allowsMultiLocale && next.length > 1) {
        setOverLimit(true);
        setToastContent(localeLimitMsg);
        return prev;
      }
      return next;
    });
  };

  const draftTabs = useMemo(() => {
    // Show all published locales as tabs (EN, FR, KO, zh-TW, etc.)
    return publishedLocales.map((l) => {
      const short = String(l.locale).split('-')[0]?.toUpperCase() || String(l.locale).toUpperCase();
      return {
        id: l.locale,
        content: short,
        accessibilityLabel: l.name,
      };
    });
  }, [publishedLocales]);

  const selectedTabIndex = useMemo(() => {
    const idx = draftTabs.findIndex((t) => t.id === activeLocale);
    return idx >= 0 ? idx : 0;
  }, [activeLocale, draftTabs]);

  return (
    <Page title="Rewriter" titleHidden fullWidth>
      <Box padding="400">
        <InlineStack gap="300" blockAlign="center">
          <img
            src="/Icon-final.png"
            alt="Cross-Border AI"
            style={{width: 24, height: 24}}
          />
          <Text as="h1" variant="headingLg">
            Rewriter
          </Text>
        </InlineStack>
      </Box>
      <style>
        {`
          @keyframes aiRainbowShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .aiOptimizeWrap {
            position: relative;
            display: inline-flex;
            border-radius: 14px;
            padding: 3px;
          }

          /* Animated gradient border (video-style) */
          .aiOptimizeWrap::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 14px;
            background: linear-gradient(
              90deg,
              #ff2bd6,
              #ff7a00,
              #ffe600,
              #2ee59d,
              #34a7ff,
              #7c3aed,
              #ff2bd6
            );
            background-size: 400% 400%;
            animation: aiRainbowShift 2.8s ease-in-out infinite;
            filter: saturate(1.25);
            opacity: 0.95;
          }

          /* Glow */
          .aiOptimizeWrap::after {
            content: "";
            position: absolute;
            inset: -6px;
            border-radius: 18px;
            background: inherit;
            background: linear-gradient(
              90deg,
              #ff2bd6,
              #ff7a00,
              #ffe600,
              #2ee59d,
              #34a7ff,
              #7c3aed,
              #ff2bd6
            );
            background-size: 400% 400%;
            animation: aiRainbowShift 2.8s ease-in-out infinite;
            filter: blur(10px) saturate(1.1);
            opacity: 0.35;
            pointer-events: none;
          }

          .aiOptimizeInner {
            position: relative;
            z-index: 1;
            display: inline-flex;
            border-radius: 12px;
            background: var(--p-color-bg-surface);
            padding: 1px; /* keeps the border visible even with large button radius */
          }

          .aiOptimizeWrap--disabled::before {
            animation: none;
            opacity: 0.25;
            filter: grayscale(0.7);
          }
          .aiOptimizeWrap--disabled::after {
            animation: none;
            opacity: 0.15;
            filter: blur(14px) grayscale(0.7);
          }

          @media (prefers-reduced-motion: reduce) {
            .aiOptimizeWrap::before { animation: none; }
            .aiOptimizeWrap::after { animation: none; }
          }

          .aiActions {
            position: relative;
            width: fit-content;
            padding-bottom: 30px; /* reserve space for loader without shifting buttons */
          }

          .aiActionsLoader {
            position: absolute;
            right: 0;
            top: 100%;
            margin-top: 6px;
            max-width: 520px;
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .aiLoaderText {
            font-size: 16px;
            line-height: 22px;
            font-weight: 600;
          }
        `}
      </style>
      {toastContent ? (
        <Toast content={toastContent} onDismiss={() => setToastContent(null)} />
      ) : null}
      {showSelfHealBanner ? (
        <Box paddingInline="400" paddingBlockEnd="400">
          <Banner
            tone="info"
            onDismiss={() => setShowSelfHealBanner(false)}
            title="Reconnected to Shopify—retrying…"
          >
            <p>
              We refreshed your Shopify session because the previous one was expired. If
              something looks missing, wait a second and refresh this page.
            </p>
          </Banner>
        </Box>
      ) : null}
      <InlineStack gap="400" align="start" wrap={false}>
        <div style={{width: 320, flex: '0 0 320px'}}>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Products
                  </Text>
                  <Badge tone={planName === 'Basic' ? 'warning' : 'success'}>{planName}</Badge>
                </InlineStack>

                {showDowngradeBanner && String(pendingPlanName || '').trim() && String(pendingPlanEffectiveAt || '').trim() ? (
                  <DowngradeScheduledBanner
                    currentPlanName={String(planName)}
                    pendingPlanName={String(pendingPlanName)}
                    pendingPlanEffectiveAt={String(pendingPlanEffectiveAt)}
                    dismissible
                    onDismiss={() => setShowDowngradeBanner(false)}
                  />
                ) : null}

                <TextField
                  label="Search"
                  labelHidden
                  value={search}
                  onChange={setSearch}
                  placeholder="Search products…"
                  autoComplete="off"
                />

                <Divider />

                <Box>
                  <Scrollable style={{height: 720}}>
                    <BlockStack gap="100">
                      {filteredProducts.map((p) => {
                        const isSelected = p.id === selectedProductId;
                        const title = p.title.length > 44 ? `${p.title.slice(0, 44)}…` : p.title;
                        return (
                          <Box
                            key={p.id}
                            padding="200"
                            background={isSelected ? 'bg-surface-secondary' : undefined}
                            borderRadius="200"
                          >
                            <Tooltip content={p.title}>
                              <Button
                                variant="plain"
                                fullWidth
                                textAlign="left"
                                onClick={() => {
                                  const next = new URLSearchParams(searchParams);
                                  next.set('productId', p.id);
                                  setSearchParams(next);
                                }}
                              >
                                {title}
                              </Button>
                            </Tooltip>
                          </Box>
                        );
                      })}
                    </BlockStack>
                  </Scrollable>
                </Box>
              </BlockStack>
            </Box>
          </Card>
        </div>

        <div style={{flex: 1, minWidth: 0}}>
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">
                      Workspace
                    </Text>
                    <Text as="p" variant="headingMd" tone="subdued">
                      Generate draft product description, SEO details, refine it, then save to Shopify.
                    </Text>
                  </BlockStack>
                </InlineStack>

                {!selectedProduct ? (
                  <Banner tone="warning">No product selected.</Banner>
                ) : null}

                {optimizeError ? <Banner tone="critical">{optimizeError}</Banner> : null}

                <Divider />

                <InlineStack gap="500" blockAlign="start" wrap={false}>
                  <Box width="50%">
                    <Card>
                      <Box padding="400">
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Reference
                          </Text>
                          {/* Spacer to align with the Draft locale tabs row */}
                          <div style={{height: 44}} aria-hidden="true" />
                          <TextField label="Title" value={referenceTitle} onChange={setReferenceTitle} autoComplete="off" />
                          <RichTextEditor
                            label="Description"
                            value={referenceDescription}
                            onChange={setReferenceDescription}
                            height={420}
                          />
                        </BlockStack>
                      </Box>
                    </Card>
                  </Box>

                  <Box width="50%">
                    <Card>
                      <Box padding="400">
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Draft
                          </Text>
                          <Tabs
                            tabs={draftTabs}
                            selected={selectedTabIndex}
                            onSelect={(index) => {
                              const id = draftTabs[index]?.id;
                              if (id) {
                                setIsSwitchingLocale(true);
                                setActiveLocale(id);
                              }
                            }}
                          />
                          {isSwitchingLocale ? (
                            <InlineStack gap="200" blockAlign="center">
                              <Spinner accessibilityLabel="Loading locale" size="small" />
                              <Text as="span" variant="bodySm" tone="subdued">
                                Loading…
                              </Text>
                            </InlineStack>
                          ) : null}
                          <TextField
                            label="Title"
                            value={currentDraft.title}
                            onChange={(v) =>
                              setDraftByLocale((prev) => ({
                                ...prev,
                                [activeLocale]: {
                                  title: v,
                                  description: currentDraft.description,
                                  seoTitle: currentDraft.seoTitle,
                                  seoDescription: currentDraft.seoDescription,
                                  seoAltText: currentDraft.seoAltText,
                                },
                              }))
                            }
                            autoComplete="off"
                          />
                          <RichTextEditor
                            label="Description"
                            value={currentDraft.description}
                            onChange={(v) =>
                              setDraftByLocale((prev) => ({
                                ...prev,
                                [activeLocale]: {
                                  title: currentDraft.title,
                                  description: v,
                                  seoTitle: currentDraft.seoTitle,
                                  seoDescription: currentDraft.seoDescription,
                                  seoAltText: currentDraft.seoAltText,
                                },
                              }))
                            }
                            height={420}
                          />
                        </BlockStack>
                      </Box>
                    </Card>
                  </Box>
                </InlineStack>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Optimization preferences
                  </Text>

                  <InlineStack align="space-between" blockAlign="start" wrap={false} gap="300">
                    <div style={{flex: "1 1 auto"}}>
                      <BlockStack gap="200">
                      <Box>
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p" variant="bodyMd" tone="subdued">
                            Market Persona / Brand Tone
                          </Text>
                          {isBasicPlan ? <Icon source={LockIcon} tone="magic" /> : null}
                        </InlineStack>
                        <div style={{maxWidth: 420}}>
                          <Select
                            label=""
                            labelHidden
                            disabled={isBasicPlan}
                            options={[
                              {label: 'Professional (Standard English)', value: 'professional'},
                              {label: 'Luxury (Sophisticated & Heritage)', value: 'luxury'},
                              {label: 'Minimalist (Clean & Direct)', value: 'minimalist'},
                              {label: 'Playful (Friendly & Social)', value: 'playful'},
                            ]}
                            value={effectiveTone}
                            onChange={(v) => setToneProfile(v as any)}
                          />
                        </div>
                        {isBasicPlan ? (
                          <Box paddingBlockStart="200">
                            <Banner tone="info">
                              <InlineStack gap="200" blockAlign="center">
                                <Icon source={LockIcon} tone="magic" />
                                <Text as="p">
                                  <strong>Standard Plan Feature:</strong> Unlock Luxury and Minimalist tones to match your
                                  brand&apos;s voice.
                                </Text>
                              </InlineStack>
                            </Banner>
                          </Box>
                        ) : null}
                      </Box>

                      <Box paddingBlockStart="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p" variant="bodyMd" tone="subdued">
                            Rewrite markets
                          </Text>
                        </InlineStack>
                        {overLimit ? (
                          <Box paddingBlockStart="200">
                            <Banner tone="warning">
                              {localeLimitMsg}
                            </Banner>
                          </Box>
                        ) : null}
                        <Box paddingBlockStart="200">
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                            {publishedLocales.map((loc) => {
                              const short =
                                String(loc.locale).split('-')[0]?.toUpperCase() ||
                                String(loc.locale).toUpperCase();
                              return (
                                <Checkbox
                                  key={loc.locale}
                                  label={short}
                                  checked={selectedLocales.includes(loc.locale)}
                                  onChange={(v) => toggleLocale(loc.locale, v)}
                                />
                              );
                            })}
                          </div>
                        </Box>
                      </Box>

                      <Box paddingBlockStart="200">
                        <Checkbox
                          label="✨ Auto-convert units to US Standard"
                          checked={autoConvertUnits}
                          onChange={setAutoConvertUnits}
                        />
                        <Text as="p" variant="bodySm" tone="subdued">
                          Keeps metric specs (cm, g, kg, ml, L) and appends US equivalents in parentheses for English
                          output.
                        </Text>
                      </Box>

                      <Box paddingBlockStart="200">
                        <Checkbox
                          label="Remove irrelvant content"
                          checked={removeIrrelevantContent}
                          onChange={setRemoveIrrelevantContent}
                          helpText="Remove any not product related information from the product description."
                        />
                      </Box>
                      </BlockStack>
                    </div>

                    <div className="aiActions" style={{paddingTop: '32px', flex: '0 0 auto'}}>
                      <InlineStack align="end" gap="300" blockAlign="center">
                        {isExpiredPaid ? (
                          <Button size="large" variant="primary" url="/app/dashboard">
                            Go to Dashboard
                          </Button>
                        ) : isOutOfFreeCredits ? (
                          <Button size="large" variant="primary" url="/app/dashboard">
                            Go to Dashboard
                          </Button>
                        ) : (
                          <div
                            className={`aiOptimizeWrap${
                              !selectedProduct ||
                              selectedLocales.length === 0 ||
                              isOptimizing ||
                              saveFetcher.state !== 'idle'
                                ? ' aiOptimizeWrap--disabled'
                                : ''
                            }`}
                          >
                            <div className="aiOptimizeInner">
                              <Button
                                size="large"
                                onClick={handleOptimize}
                                disabled={
                                  !selectedProduct ||
                                  selectedLocales.length === 0 ||
                                  isOptimizing ||
                                  saveFetcher.state !== 'idle'
                                }
                              >
                                Optimize for Global
                              </Button>
                            </div>
                          </div>
                        )}
                      </InlineStack>

                      <div className="aiActionsLoader" aria-live="polite">
                        {isOptimizing ? (
                          <Text as="p" tone="subdued">
                            <span className="aiLoaderText">{loadingMessage}</span>
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  </InlineStack>
                </BlockStack>

              {miscInfoByLocale[activeLocale]?.trim() ? (
                <Box paddingBlockStart="200">
                  <Banner tone="warning" title="Miscellaneous information (Recommended to be removed)">
                    <Text as="p">{miscInfoByLocale[activeLocale]}</Text>
                  </Banner>
                </Box>
              ) : null}

                <Card>
                  <Box padding="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">
                          SEO strategy crafted by AI
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Preview of your SEO readiness. Open to review details.
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={seoStatus.tone === 'success' ? 'success' : 'warning'}>
                          {seoStatus.label}
                        </Badge>
                        <Button onClick={() => setSeoIntelOpen(true)} variant="primary">
                          View Details
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </Box>
                </Card>

                {miscInfoByLocale[activeLocale]?.trim() ? (
                  <Box paddingBlockStart="200">
                    <Banner tone="warning" title="Miscellaneous information (Recommended to be removed)">
                      <Text as="p">{miscInfoByLocale[activeLocale]}</Text>
                    </Banner>
                  </Box>
                ) : null}

                <Modal
                  open={seoIntelOpen}
                  onClose={() => setSeoIntelOpen(false)}
                  title="SEO Strategy & Competitor Intelligence"
                  size="large"
                >
                  <Modal.Section>
                    <BlockStack gap="300">
                      <div style={{ display: "flex", gap: 24, alignItems: "stretch", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 360px", minWidth: 320 }}>
                          <Card>
                            <Box padding="300">
                              <BlockStack gap="200">
                                <Text as="h4" variant="headingSm">
                                  Top 3 Ranks on Google Search
                                </Text>
                                {isBasicPlan ? (
                                  <BlockStack gap="200">
                                    <Text as="p" tone="subdued">
                                      Locked. Upgrade to Standard to see live competitor analysis.
                                    </Text>
                                    <Button url={plansUrl} variant="primary">
                                      Upgrade to Standard
                                    </Button>
                                  </BlockStack>
                                ) : isOptimizing ? (
                                  <BlockStack gap="200">
                                    <Text as="p" tone="subdued">
                                      Analyzing live US Google results...
                                    </Text>
                                    <SkeletonBodyText lines={3} />
                                  </BlockStack>
                                ) : (
                                  <BlockStack gap="200">
                                    {(() => {
                                      const entries =
                (seoIntelByLocale[activeLocale]?.competitor_results &&
                  seoIntelByLocale[activeLocale]?.competitor_results?.length
                  ? seoIntelByLocale[activeLocale]?.competitor_results
                  : seoIntelByLocale[activeLocale]?.competitor_titles?.map((t) => ({
                      title: t,
                      snippet: undefined,
                      link: undefined,
                    })) || []) || [];
                                      return entries.length ? (
                                        entries.map((r, i) => (
                                          <SearchEnginePreview
                                            key={`comp-${i}`}
                                            title={r?.title || '—'}
                                            url={r?.link || 'https://example.com'}
                                            snippet={r?.snippet || '—'}
                                          />
                                        ))
                                      ) : (
                                        <Text as="p" tone="subdued">
                                          Currently unavailable.
                                        </Text>
                                      );
                                    })()}
                                  </BlockStack>
                                )}
                              </BlockStack>
                            </Box>
                          </Card>
                        </div>

                        <div style={{ flex: "1 1 480px", minWidth: 320 }}>
                          <Card>
                            <Box padding="300">
                              <BlockStack gap="300">
                                <InlineStack align="space-between" blockAlign="center">
                                  <Text as="h4" variant="headingSm">
                                    Our SEO Strategy
                                  </Text>
                                  <InlineStack gap="300" blockAlign="center">
                                    <Text
                                      as="span"
                                      variant="bodySm"
                                      tone={(currentDraft.seoTitle || '').length > 70 ? 'critical' : 'subdued'}
                                    >
                                      Title {(currentDraft.seoTitle || '').length}/70
                                    </Text>
                                    <Text
                                      as="span"
                                      variant="bodySm"
                                      tone={(currentDraft.seoDescription || '').length > 160 ? 'critical' : 'subdued'}
                                    >
                                      Description {(currentDraft.seoDescription || '').length}/160
                                    </Text>
                                  </InlineStack>
                                </InlineStack>

                                <BlockStack gap="300">
                                  <TextField
                                    label="SEO Title"
                                    value={currentDraft.seoTitle}
                                    placeholder={currentDraft.seoTitle ? '' : seoPlaceholders.title || 'Shop the authentic…'}
                                    multiline={2}
                                    onChange={(v) =>
                                      setDraftByLocale((prev) => ({
                                        ...prev,
                                        [activeLocale]: {
                                          title: currentDraft.title,
                                          description: currentDraft.description,
                                          seoTitle: v,
                                          seoDescription: currentDraft.seoDescription,
                                          seoAltText: currentDraft.seoAltText,
                                        },
                                      }))
                                    }
                                    autoComplete="off"
                                  />

                                  <TextField
                                    label="Meta Description"
                                    multiline={3}
                                    value={currentDraft.seoDescription}
                                    placeholder={
                                      currentDraft.seoDescription
                                        ? ''
                                        : seoPlaceholders.description || 'Discover authentic craftsmanship…'
                                    }
                                    onChange={(v) =>
                                      setDraftByLocale((prev) => ({
                                        ...prev,
                                        [activeLocale]: {
                                          title: currentDraft.title,
                                          description: currentDraft.description,
                                          seoTitle: currentDraft.seoTitle,
                                          seoDescription: v,
                                          seoAltText: currentDraft.seoAltText,
                                        },
                                      }))
                                    }
                                    autoComplete="off"
                                  />

                                  <TextField
                                    label="SEO Alt Text (Main image)"
                                    value={currentDraft.seoAltText}
                                    placeholder="Black leather wallet - slim design"
                                    onChange={(v) =>
                                      setDraftByLocale((prev) => ({
                                        ...prev,
                                        [activeLocale]: {
                                          title: currentDraft.title,
                                          description: currentDraft.description,
                                          seoTitle: currentDraft.seoTitle,
                                          seoDescription: currentDraft.seoDescription,
                                          seoAltText: v,
                                        },
                                      }))
                                    }
                                    autoComplete="off"
                                  />

                                  {isBasicPlan ? (
                                    <Box
                                      padding="300"
                                      background="bg-surface-secondary"
                                      borderRadius="200"
                                    >
                                      <InlineStack align="space-between" blockAlign="center">
                                        <Text as="p" variant="bodyMd" tone="subdued">
                                          CTR Optimization Score is available on Standard & Pro.
                                        </Text>
                                        <Button url={plansUrl} variant="primary">
                                          Upgrade
                                        </Button>
                                      </InlineStack>
                                    </Box>
                                  ) : (
                                    <Box
                                      padding="300"
                                      background="bg-surface-secondary"
                                      borderRadius="200"
                                    >
                                      <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="center">
                                          <Text as="h4" variant="headingSm">
                                            CTR Optimization Score
                                          </Text>
                                          <Text as="span" variant="bodySm" tone="subdued">
                                            <span
                                              style={{
                                                display: "inline-block",
                                                padding: "2px 8px",
                                                borderRadius: 999,
                                                background: "var(--p-color-bg-surface-brand)",
                                                color: "var(--p-color-text-on-color)",
                                                fontSize: 12,
                                              }}
                                            >
                                              Optimized for US Search Patterns
                                            </span>
                                          </Text>
                                        </InlineStack>

                                        {(() => {
                                          const titleLen = (currentDraft.seoTitle || "").length;
                                          const desc = String(currentDraft.seoDescription || "");
                                          const descLower = desc.toLowerCase();
                                          const problemWords = [
                                            "tired",
                                            "struggling",
                                            "problem",
                                            "frustrated",
                                            "looking for",
                                            "need a",
                                            "wish",
                                          ];
                                          const hasProblemSignal =
                                            desc.includes("?") ||
                                            problemWords.some((w) => descLower.includes(w));
                                          const hasBrandTrust =
                                            /japan/i.test(desc) ||
                                            /handcrafted/i.test(desc) ||
                                            /free shipping/i.test(desc);

                                          const pstTone: "green" | "yellow" | "red" = hasProblemSignal
                                            ? "green"
                                            : /shop now|discover|order|buy/i.test(desc)
                                              ? "yellow"
                                              : "red";
                                          const trustTone: "green" | "yellow" | "red" = hasBrandTrust
                                            ? "green"
                                            : /authentic|artisan|premium/i.test(desc)
                                              ? "yellow"
                                              : "red";
                                          const lenTone: "green" | "yellow" | "red" =
                                            titleLen > 50 && titleLen < 70
                                              ? "green"
                                              : titleLen >= 45 && titleLen <= 75
                                                ? "yellow"
                                                : "red";

                                          const colorFor = (t: "green" | "yellow" | "red") =>
                                            t === "green"
                                              ? "var(--p-color-bg-fill-success)"
                                              : t === "yellow"
                                                ? "var(--p-color-bg-fill-warning)"
                                                : "var(--p-color-bg-fill-critical)";

                                          const Light = ({ tone }: { tone: "green" | "yellow" | "red" }) => (
                                            <span
                                              style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 999,
                                                display: "inline-block",
                                                background: colorFor(tone),
                                                boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.6) inset",
                                              }}
                                            />
                                          );

                                          const Row = ({
                                            label,
                                            tone,
                                            hint,
                                          }: {
                                            label: string;
                                            tone: "green" | "yellow" | "red";
                                            hint: string;
                                          }) => (
                                            <InlineStack align="space-between" blockAlign="center">
                                              <InlineStack gap="200" blockAlign="center">
                                                <Light tone={tone} />
                                                <Text as="span" variant="bodySm">
                                                  {label}
                                                </Text>
                                              </InlineStack>
                                              <Text as="span" variant="bodySm" tone="subdued">
                                                {hint}
                                              </Text>
                                            </InlineStack>
                                          );

                                          return (
                                            <BlockStack gap="200">
                                              <Row
                                                label="PST Check"
                                                tone={pstTone}
                                                hint={hasProblemSignal ? "OK" : "Add a problem/question"}
                                              />
                                              <Row
                                                label="Brand Trust"
                                                tone={trustTone}
                                                hint={hasBrandTrust ? "OK" : 'Add “Japan”, “Handcrafted” or “Free Shipping”'}
                                              />
                                              <Row
                                                label="Length Check"
                                                tone={lenTone}
                                                hint={`${titleLen}/70`}
                                              />
                                            </BlockStack>
                                          );
                                        })()}
                                      </BlockStack>
                                    </Box>
                                  )}

                                  <BlockStack gap="100">
                                    <Text as="h4" variant="headingSm">
                                      Strategy Insight
                                    </Text>
                                    <InlineStack gap="200" wrap>
                                      {(seoIntelByLocale[activeLocale]?.lsi_keywords_used || []).length ? (
                                        seoIntelByLocale[activeLocale]?.lsi_keywords_used?.map((k, i) => (
                                          <Badge key={`lsi-${i}`}>{k}</Badge>
                                        ))
                                      ) : (
                                        <Text as="p" tone="subdued">
                                          No LSI keywords found.
                                        </Text>
                                      )}
                                    </InlineStack>
                                  </BlockStack>

                                  <BlockStack gap="100">
                                    <Text as="h4" variant="headingSm">
                                      Competitive Edge
                                    </Text>
                                    <Text as="p">
                                      {seoIntelByLocale[activeLocale]?.competitive_edge ||
                                        "Emphasized 'Arita-yaki' origin to differentiate from generic ceramic rivals."}
                                    </Text>
                                  </BlockStack>

                                  <BlockStack gap="100">
                                    <Text as="h4" variant="headingSm">
                                      Search Intent
                                    </Text>
                                    {seoIntelByLocale[activeLocale]?.search_intent ? (
                                      <Text as="p">
                                        {String(seoIntelByLocale[activeLocale]?.search_intent).toLowerCase() ===
                                        'transactional'
                                          ? '🟢 Perfect Match: High-purchase intent detected and applied.'
                                          : `🟡 Partial Match: ${seoIntelByLocale[activeLocale]?.search_intent} intent detected and applied.`}
                                      </Text>
                                    ) : (
                                      <Text as="p" tone="subdued">
                                        No intent detected.
                                      </Text>
                                    )}
                                  </BlockStack>
                                </BlockStack>
                              </BlockStack>
                            </Box>
                          </Card>
                        </div>
                      </div>
                    </BlockStack>
                  </Modal.Section>
                </Modal>

                {(saveFetcher.data as any)?.error ? (
                  <Banner tone="critical">{(saveFetcher.data as any).error}</Banner>
                ) : null}

                <Card>
                  <Box padding="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">
                          Japanese Value Proposition
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Highlight cultural nuance and proof, then add to your description.
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={jvStatus.tone === 'success' ? 'success' : 'warning'}>
                          {jvStatus.label}
                        </Badge>
                        <Button onClick={() => setJvOpen(true)} variant="primary">
                          View Details
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </Box>
                </Card>

                <Modal
                  open={jvOpen}
                  onClose={() => setJvOpen(false)}
                  title="Japanese Value Proposition"
                  size="large"
                >
                  <Modal.Section>
                    {uniqueValues.length === 0 ? (
                      <BlockStack gap="300">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          No Japanese value insights detected yet. Run Optimize to surface cultural nuances, then add them to your copy.
                        </Text>
                      </BlockStack>
                    ) : (
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          ✨ Verified Japanese Value Detected
                        </Text>

                        <BlockStack gap="200">
                          {uniqueValues.map((v) => {
                            const key = valueKey(v);
                            const existingMetafield = String(selectedProduct?.culturalContext?.value || '').trim();
                            const addedThisSession = Boolean(addedValueKeys[key]);
                            const alreadySaved = culturalContextSaved && Boolean(existingMetafield);
                            const isDisabled = addedThisSession || culturalContextSaved;
                            const headline =
                              String(v.insight_headline || '').trim() ||
                              `${v.category} Insight`;
                            const strategy =
                              String(v.strategic_value || '').trim() ||
                              String(v.explanation || '').trim();
                            const evidence = String(v.evidence || '').trim();
                            const evidenceShort =
                              evidence.length > 140 ? `${evidence.slice(0, 140)}…` : evidence;

                            return (
                              <BlockStack key={key} gap="200">
                                {/* 1) Value detected card */}
                                <Card>
                                  <Box padding="300">
                                    <BlockStack gap="200">
                                      <InlineStack gap="200" blockAlign="center">
                                        <Badge tone="magic">{v.category}</Badge>
                                        <Text as="h4" variant="headingSm">
                                          {headline}
                                        </Text>
                                      </InlineStack>

                                      <Box
                                        padding="200"
                                        background="bg-surface-secondary"
                                        borderRadius="200"
                                      >
                                        <Text as="p">
                                          🔍 Found in your notes: “{evidenceShort}”
                                        </Text>
                                      </Box>

                                      {strategy ? (
                                        <div style={{display: 'flex', gap: 8, alignItems: 'flex-start'}}>
                                          <div style={{flex: '0 0 auto', marginTop: 2}}>
                                            <Icon source={LightbulbIcon} tone="magic" />
                                          </div>
                                          <div style={{flex: '1 1 auto'}}>
                                            <Text as="p">{strategy}</Text>
                                          </div>
                                        </div>
                                      ) : null}
                                    </BlockStack>
                                  </Box>
                                </Card>

                                {/* 2) Footer suggestion + CTA card */}
                                <Card>
                                  <Box padding="300">
                                    <BlockStack gap="200">
                                      <Text as="p" tone="subdued">
                                        {culturalContextSaved ? (
                                          <strong>Key details (nuance) are already saved in product metafields.</strong>
                                        ) : (
                                          <strong>
                                            AI suggestion: Add following "footer" in your product description to increase value
                                          </strong>
                                        )}
                                      </Text>

                                      <Box
                                        padding="200"
                                        borderColor="border"
                                        borderWidth="025"
                                        borderRadius="200"
                                      >
                                        <Text as="p">
                                          {culturalContextSaved && existingMetafield
                                            ? existingMetafield
                                            : v.suggested_footer}
                                        </Text>
                                      </Box>

                                      <InlineStack align="end">
                                        <Tooltip content="This adds key details & nuance based on your product details.">
                                          <Button
                                            variant="primary"
                                            icon={isDisabled ? CheckIcon : undefined}
                                            disabled={isDisabled}
                                            onClick={() => handleAdd(v)}
                                          >
                                            {alreadySaved
                                              ? 'Already added'
                                              : addedThisSession
                                                ? 'Added'
                                                : 'Add to Description'}
                                          </Button>
                                        </Tooltip>
                                      </InlineStack>
                                    </BlockStack>
                                  </Box>
                                </Card>
                              </BlockStack>
                            );
                          })}
                        </BlockStack>
                      </BlockStack>
                    )}
                  </Modal.Section>
                </Modal>

                <Box paddingBlockStart="400">
                  <saveFetcher.Form method="post">
                    <input type="hidden" name="intent" value="save" />
                    <input type="hidden" name="productId" value={selectedProduct?.id ?? ''} />
                    <input type="hidden" name="targetLocale" value={activeLocale || primaryLocale} />
                    <input type="hidden" name="draftTitle" value={currentDraft.title} />
                    <input type="hidden" name="draftDescription" value={currentDraft.description} />
                    <input type="hidden" name="draftSeoTitle" value={currentDraft.seoTitle} />
                    <input type="hidden" name="draftSeoDescription" value={currentDraft.seoDescription} />
                    <Button
                      size="large"
                      variant="primary"
                      fullWidth
                      submit
                      disabled={
                        !selectedProduct ||
                        saveFetcher.state !== 'idle' ||
                        isOptimizing
                      }
                    >
                      Save
                    </Button>
                  </saveFetcher.Form>
                </Box>
              </BlockStack>
            </Box>
          </Card>
        </div>
      </InlineStack>
    </Page>
  );
}

export default function RewriterWorkspace() {
  const data = useLoaderData<typeof loader>() as LoaderData;
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // IMPORTANT: Render a static, non-Polaris placeholder on the server and before hydration.
  // Polaris components can render responsively based on `window.matchMedia`, which differs on SSR vs client.
  if (!hasMounted) {
    return (
      <div suppressHydrationWarning style={{padding: 16}}>
        <div
          style={{
            border: '1px solid var(--p-color-border-secondary)',
            borderRadius: 12,
            padding: 14,
            background: 'var(--p-color-bg-surface)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: 'var(--p-color-bg-fill-brand)',
            }}
          />
          <span style={{color: 'var(--p-color-text-subdued)', fontSize: 14}}>
            Loading Rewriter…
          </span>
        </div>
      </div>
    );
  }

  return <RewriterWorkspaceInner {...data} />;
}


