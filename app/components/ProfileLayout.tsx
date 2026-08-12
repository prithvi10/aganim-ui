import { Link } from "react-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "./LandingLayout";
import { AGANIM_SITE_URL } from "../utils/profileHost";
import { useProfilePaths } from "../utils/useProfilePaths";
import { ThemeToggle } from "../utils/theme";

const MobileMenuIcon = ({ open }: { open: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-slate-200"
  >
    {open ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ) : (
      <>
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </>
    )}
  </svg>
);

export function ProfileHeader() {
  const paths = useProfilePaths();
  const navItems = useMemo(
    () => [
      { label: "Home", href: paths.section("about") },
      { label: "Experience", href: paths.section("experience") },
      { label: "Blogs", href: paths.section("projects") },
      { label: "Contact", href: paths.section("contact") },
    ],
    [paths],
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to={paths.home} className="flex items-center gap-3 text-xl font-bold">
          <img src="/profile/avatar.jpg" alt="Prithviraj Pawar" className="h-8 w-8 rounded-full object-cover" />
          Prithviraj Pawar
        </Link>

        <nav
          aria-label="Profile navigation"
          className="hidden items-center gap-6 text-sm text-slate-300 md:flex"
        >
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
          {paths.isSubdomain ? (
            <a
              href={AGANIM_SITE_URL}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/40 hover:text-white"
            >
              Aganim AI
            </a>
          ) : (
            <Link
              to="/"
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/40 hover:text-white"
            >
              Aganim AI
            </Link>
          )}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
          className="flex items-center justify-center"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <MobileMenuIcon open={mobileOpen} />
        </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur md:hidden"
            aria-label="Mobile profile navigation"
          >
            <div className="flex flex-col gap-4 px-6 py-5">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-200 transition hover:text-white"
                  onClick={closeMobile}
                >
                  {item.label}
                </a>
              ))}
              {paths.isSubdomain ? (
                <a
                  href={AGANIM_SITE_URL}
                  className="text-sm text-slate-200 transition hover:text-white"
                  onClick={closeMobile}
                >
                  Aganim AI
                </a>
              ) : (
                <Link
                  to="/"
                  className="text-sm text-slate-200 transition hover:text-white"
                  onClick={closeMobile}
                >
                  Aganim AI
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function ProfileFooter() {
  const paths = useProfilePaths();

  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Prithviraj Pawar. This work is licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
            className="transition hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-NC-ND 4.0
          </a>
        </p>
        <div className="flex flex-wrap gap-6">
          {paths.isSubdomain ? (
            <a href={AGANIM_SITE_URL} className="transition hover:text-white">
              Aganim AI
            </a>
          ) : (
            <Link to="/" className="transition hover:text-white">
              Aganim AI
            </Link>
          )}
          <Link to="/privacy-policy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="transition hover:text-white">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function ProfileSection({
  id,
  title,
  children,
  className = "",
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 py-16 ${className}`}>
      <Reveal>
        <h2 className="mb-10 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}

export function ProfilePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="theme-scope min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
      </div>
      <ProfileHeader />
      <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-28">{children}</main>
      <ProfileFooter />
    </div>
  );
}
