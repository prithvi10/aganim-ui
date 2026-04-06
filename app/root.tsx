import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useLocation,
  type HeadersFunction,
} from "react-router";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { boundary } from "@shopify/shopify-app-react-router/server";
import "./tailwind.css";
import "./i18n";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" type="image/png" href="/Icon-final.png" />
        <link rel="apple-touch-icon" href="/Icon-final.png" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <PolarisAppProvider i18n={enTranslations}>
        <Outlet />
        </PolarisAppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function PortalErrorFallback({ error }: { error: unknown }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" type="image/png" href="/Icon-final.png" />
      </head>
      <body style={{ fontFamily: "Inter, sans-serif", padding: 40 }}>
        <h1>Something went wrong</h1>
        <p>{error instanceof Error ? error.message : "Unexpected error"}</p>
        <a href="/portal/login">Back to login</a>
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  // On the client, check window.location
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/portal")) {
    return <PortalErrorFallback error={error} />;
  }

  // On the server, try useLocation (may throw in some error states)
  try {
    const location = useLocation();
    if (location.pathname.startsWith("/portal")) {
      return <PortalErrorFallback error={error} />;
    }
  } catch {
    // useLocation can fail in certain error states — if the error itself
    // was a Response redirect (e.g. from boundary.error), check the error
    if (error instanceof Response && [302, 301, 307, 308].includes(error.status)) {
      const loc = error.headers?.get("Location") || "";
      if (loc.includes("/auth/login") || loc.includes("/auth?")) {
        return <PortalErrorFallback error={new Error("Shopify auth is not available for this page.")} />;
      }
    }
  }

  return boundary.error(error);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
