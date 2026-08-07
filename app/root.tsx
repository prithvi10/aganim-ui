import { useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useLocation,
  type HeadersFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { isProfileSubdomainRequest } from "./utils/profileHost";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import "./tailwind.css";
import "./i18n";

export async function loader({ request }: LoaderFunctionArgs) {
  return {
    profileSubdomain: isProfileSubdomainRequest(request),
  };
}

if (typeof window !== "undefined" && window.ENV?.SENTRY_DSN) {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    environment: window.ENV.ENVIRONMENT || "development",
    tracesSampleRate: 0.1,
  });
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    const handler = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on("languageChanged", handler);
    return () => { i18n.off("languageChanged", handler); };
  }, [i18n]);

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Aganim AI",
              url: "https://aganim-ai.com",
              logo: "https://aganim-ai.com/Icon-final.png",
              description:
                "AI-powered cross-border e-commerce translation, localization, and growth engine for Shopify stores.",
              sameAs: [
                "https://apps.shopify.com/aganim",
              ],
            }),
          }}
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
