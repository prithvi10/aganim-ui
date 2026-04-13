import { Link } from "react-router";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

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

export const LandingHeader = () => {
  const { t } = useTranslation();

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
    </div>
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
      </div>
    </div>
  </footer>
  );
};
