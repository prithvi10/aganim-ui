import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import {
  isProfileSubdomainRequest,
  shouldRedirectProfileToSubdomain,
  toSubdomainProfileUrl,
} from "../utils/profileHost";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (isProfileSubdomainRequest(request)) {
    if (url.pathname === "/profile" || url.pathname === "/profile/") {
      throw redirect(`/${url.hash}`, 301);
    }

    const projectMatch = url.pathname.match(/^\/profile\/projects\/([^/]+)\/?$/);
    if (projectMatch) {
      throw redirect(`/projects/${projectMatch[1]}${url.search}`, 301);
    }

    return null;
  }

  if (shouldRedirectProfileToSubdomain(request)) {
    throw redirect(
      toSubdomainProfileUrl(url.pathname, url.search, url.hash),
      301,
    );
  }

  return null;
}

export default function ProfileLayout() {
  return <Outlet />;
}
