import { Link } from "react-router";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: "easeOut" as const },
  viewport: { once: true, amount: 0.3 as const },
};

export const Reveal = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div {...fadeUp} className={className}>
    {children}
  </motion.div>
);

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("landing-lang");
    if (saved && (saved === "en" || saved === "ja")) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "ja" ? "en" : "ja";
    i18n.changeLanguage(newLang);
    localStorage.setItem("landing-lang", newLang);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/40 hover:text-white"
      aria-label="Toggle language"
    >
      <span className={i18n.language === "en" ? "text-white" : "text-slate-500"}>EN</span>
      <span className="text-slate-500">/</span>
      <span className={i18n.language === "ja" ? "text-white" : "text-slate-500"}>日本語</span>
    </button>
  );
};

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

export const LandingHeader = () => {
  const { t } = useTranslation();
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
      <Link to="/" className="flex items-center gap-3 text-xl font-bold">
        <img
          src="/Icon-final.png"
          alt="Aganim AI"
          className="h-8 w-8"
        />
        Aganim AI
      </Link>

      {/* Desktop nav */}
      <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
        <Link to="/features" className="transition hover:text-white">
          {t("landing.nav.features")}
        </Link>
        <a href="/#pricing" className="transition hover:text-white">
          {t("landing.nav.pricing")}
        </a>
        <Link to="/support" className="transition hover:text-white">
          {t("landing.nav.support")}
        </Link>
        <LanguageToggle />
      </nav>

      {/* Mobile hamburger button */}
      <button
        className="flex items-center justify-center md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        <MobileMenuIcon open={mobileOpen} />
      </button>
    </div>

    {/* Mobile drawer */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-4 px-6 py-5">
            <Link to="/features" className="text-sm text-slate-200 transition hover:text-white" onClick={closeMobile}>
              {t("landing.nav.features")}
            </Link>
            <a href="/#pricing" className="text-sm text-slate-200 transition hover:text-white" onClick={closeMobile}>
              {t("landing.nav.pricing")}
            </a>
            <Link to="/support" className="text-sm text-slate-200 transition hover:text-white" onClick={closeMobile}>
              {t("landing.nav.support")}
            </Link>
            <div className="pt-2">
              <LanguageToggle />
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  </header>
  );
};

export const LandingFooter = () => {
  const { t } = useTranslation();

  return (
  <footer className="border-t border-white/10 py-10">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
      <p>&copy; {new Date().getFullYear()} {t("landing.footer.copyright")}</p>
      <div className="flex flex-wrap gap-6">
        <Link to="/support" className="transition hover:text-white">
          {t("landing.footer.support")}
        </Link>
        <Link to="/privacy-policy" className="transition hover:text-white">
          {t("landing.footer.privacyPolicy")}
        </Link>
        <Link to="/terms-of-service" className="transition hover:text-white">
          {t("landing.footer.termsOfService", "Terms of Service")}
        </Link>
      </div>
    </div>
  </footer>
  );
};
