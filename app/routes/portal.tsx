/**
 * Portal layout — wraps all /portal/* child routes with sidebar navigation.
 * Runs outside the Shopify embedded context.
 */
import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  Frame,
  Navigation,
  TopBar,
  Text,
} from "@shopify/polaris";
import {
  HomeIcon,
  PersonIcon,
  FlagIcon,
  ChatIcon,
  SendIcon,
  ExitIcon,
  ArrowDownIcon,
  TargetIcon,
} from "@shopify/polaris-icons";
import { requirePortalAuth, buildClearCookie } from "../utils/portal-auth.server";
import { useState, useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  requirePortalAuth(request);
  return null;
};

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavActive, setMobileNavActive] = useState(false);

  const toggleMobileNav = useCallback(
    () => setMobileNavActive((v) => !v),
    [],
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNav}
      secondaryMenu={
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 16 }}>
          <Text as="span" variant="bodySm" tone="subdued">
            Admin
          </Text>
          <form method="post" action="/portal/logout">
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--p-color-text-secondary)",
                fontSize: 13,
                textDecoration: "underline",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      }
    />
  );

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        title="Admin Portal"
        items={[
          {
            label: "Dashboard",
            icon: HomeIcon,
            url: "/portal/dashboard",
            selected: location.pathname === "/portal/dashboard",
            onClick: () => navigate("/portal/dashboard"),
          },
          {
            label: "Merchants",
            icon: PersonIcon,
            url: "/portal/merchants",
            selected: location.pathname.startsWith("/portal/merchants"),
            onClick: () => navigate("/portal/merchants"),
          },
          {
            label: "Attrition",
            icon: ArrowDownIcon,
            url: "/portal/attrition",
            selected: location.pathname === "/portal/attrition",
            onClick: () => navigate("/portal/attrition"),
          },
          {
            label: "Agentic Missions",
            icon: FlagIcon,
            url: "/portal/missions",
            selected: location.pathname === "/portal/missions",
            onClick: () => navigate("/portal/missions"),
          },
          {
            label: "Concerns",
            icon: ChatIcon,
            url: "/portal/concerns",
            selected: location.pathname === "/portal/concerns",
            onClick: () => navigate("/portal/concerns"),
          },
          {
            label: "Outreach",
            icon: SendIcon,
            url: "/portal/outreach",
            selected: location.pathname === "/portal/outreach",
            onClick: () => navigate("/portal/outreach"),
          },
          {
            label: "Beta Test",
            icon: TargetIcon,
            url: "/portal/beta",
            selected: location.pathname.startsWith("/portal/beta"),
            onClick: () => navigate("/portal/beta"),
            subNavigationItems: [
              {
                label: "Dashboard",
                url: "/portal/beta",
                selected: location.pathname === "/portal/beta",
                onClick: () => navigate("/portal/beta"),
              },
              {
                label: "Merchants",
                url: "/portal/beta/merchants",
                selected: location.pathname.startsWith("/portal/beta/merchants"),
                onClick: () => navigate("/portal/beta/merchants"),
              },
              {
                label: "Invites",
                url: "/portal/beta/outreach",
                selected: location.pathname === "/portal/beta/outreach",
                onClick: () => navigate("/portal/beta/outreach"),
              },
            ],
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavActive}
      onNavigationDismiss={toggleMobileNav}
    >
      <Outlet />
    </Frame>
  );
}
