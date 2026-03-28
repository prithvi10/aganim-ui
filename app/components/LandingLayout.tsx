import { Link } from "react-router";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

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

export const LandingHeader = () => (
  <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <Link to="/" className="flex items-center gap-3 text-sm font-semibold">
        <img
          src="/Icon-final.png"
          alt="Aganim AI"
          className="h-8 w-8"
        />
        Aganim AI
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
        <Link to="/features" className="transition hover:text-white">
          Features
        </Link>
        <a href="/#pricing" className="transition hover:text-white">
          Pricing
        </a>
      </nav>
      <Link
        to="/login"
        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/60"
      >
        Login
      </Link>
    </div>
  </header>
);

export const LandingFooter = () => (
  <footer className="border-t border-white/10 py-10">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
      <p>&copy; 2026 Aganim AI. All rights reserved.</p>
      <div className="flex flex-wrap gap-6">
        <Link to="/support" className="transition hover:text-white">
          Support
        </Link>
        <Link to="/privacy-policy" className="transition hover:text-white">
          Privacy Policy
        </Link>
        <Link to="/login" className="transition hover:text-white">
          Login
        </Link>
      </div>
    </div>
  </footer>
);
