import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/ActionExtension.tsx' {
  const shopify: import('@shopify/ui-extensions/admin').ApiForRenderExtension<'admin.product-details.action.render'>;
  const globalThis: { shopify: typeof shopify };
}
