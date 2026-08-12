import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pp-theme";

/**
 * Inline script injected in <head> so the theme is applied before first paint
 * (prevents a dark→light flash). Reads saved choice, else system preference,
 * defaulting to dark to preserve the current look for people who haven't chosen.
 */
export const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem('${STORAGE_KEY}');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    var el = document.documentElement;
    el.classList.remove('light','dark');
    el.classList.add(theme);
    el.style.colorScheme = theme;
  } catch (e) {}
})();
`;

function getInitialTheme(): Theme {
  if (typeof document !== "undefined") {
    if (document.documentElement.classList.contains("light")) return "light";
    if (document.documentElement.classList.contains("dark")) return "dark";
  }
  return "dark";
}

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}>({ theme: "dark", toggleTheme: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((t: Theme) => {
    const el = document.documentElement;
    el.classList.remove("light", "dark");
    el.classList.add(t);
    el.style.colorScheme = t;
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  // sync state to whatever the no-flash script already set on mount
  useEffect(() => {
    setThemeState(getInitialTheme());
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      applyTheme(t);
    },
    [applyTheme],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Sun/moon toggle button used in the public headers. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-slate-300 transition hover:border-white/40 hover:text-white ${className}`}
    >
      {isLight ? (
        // moon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // sun
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
