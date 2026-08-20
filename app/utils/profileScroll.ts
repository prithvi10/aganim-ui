export function scrollToProfileSection(sectionId: string, homePath: string) {
  const el = document.getElementById(sectionId);
  if (!el) return false;

  el.scrollIntoView({ block: "start", behavior: "smooth" });
  window.history.replaceState(null, "", `${homePath}#${sectionId}`);
  return true;
}

export function handleProfileSectionNavClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  homePath: string,
) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return;

  const sectionId = href.slice(hashIndex + 1);
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const normalizedHome = homePath.replace(/\/$/, "") || "/";

  if (pathname === normalizedHome) {
    event.preventDefault();
    scrollToProfileSection(sectionId, homePath);
  }
}

export function scrollToProfileSectionFromHash(homePath: string) {
  const sectionId = window.location.hash.slice(1);
  if (!sectionId) return;

  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const normalizedHome = homePath.replace(/\/$/, "") || "/";
  if (pathname !== normalizedHome) return;

  window.requestAnimationFrame(() => {
    scrollToProfileSection(sectionId, homePath);
  });
}
