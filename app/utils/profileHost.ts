export const PROFILE_SUBDOMAIN_HOST =
  process.env.PROFILE_SUBDOMAIN_HOST || "prithvirajpawar.aganim-ai.com";

export const PROFILE_SUBDOMAIN_URL = `https://${PROFILE_SUBDOMAIN_HOST}`;
export const AGANIM_SITE_URL = "https://aganim-ai.com";

export function getRequestHost(request: Request): string {
  return new URL(request.url).hostname;
}

export function isProfileSubdomainHost(host: string): boolean {
  return (
    host === PROFILE_SUBDOMAIN_HOST ||
    host === "prithvirajpawar.localhost" ||
    host === "prithvirajpawar.local"
  );
}

export function isProfileSubdomainRequest(request: Request): boolean {
  return isProfileSubdomainHost(getRequestHost(request));
}

export function shouldRedirectProfileToSubdomain(request: Request): boolean {
  const host = getRequestHost(request);
  return host !== "localhost" && host !== "127.0.0.1" && !isProfileSubdomainHost(host);
}

export type ProfileSeoContext = {
  origin: string;
  isSubdomain: boolean;
};

export function getProfileSeoContext(request?: Request): ProfileSeoContext {
  const isSubdomain = request ? isProfileSubdomainRequest(request) : false;
  return {
    isSubdomain,
    origin: isSubdomain ? PROFILE_SUBDOMAIN_URL : AGANIM_SITE_URL,
  };
}

export function profileHomePath(isSubdomain: boolean): string {
  return isSubdomain ? "/" : "/profile";
}

export function profileSectionPath(isSubdomain: boolean, sectionId: string): string {
  return `${profileHomePath(isSubdomain)}#${sectionId}`;
}

export function profileProjectPath(isSubdomain: boolean, slug: string): string {
  return isSubdomain ? `/projects/${slug}` : `/profile/projects/${slug}`;
}

export function profileProjectsAnchor(isSubdomain: boolean): string {
  return profileSectionPath(isSubdomain, "blogs");
}

export function toSubdomainProfileUrl(pathname: string, search = "", hash = ""): string {
  const path = pathname.replace(/^\/profile(?=\/|$)/, "") || "/";
  return `${PROFILE_SUBDOMAIN_URL}${path}${search}${hash}`;
}
