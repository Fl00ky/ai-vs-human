"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type Lang,
  type TranslationTree,
  DEFAULT_LANG,
  LANG_COOKIE,
  LANG_LABELS,
  getTranslations,
} from "./translations";

// ─── Context ────────────────────────────────────────────────────────────────

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TranslationTree;
}

const LanguageContext = createContext<LangCtx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: getTranslations(DEFAULT_LANG),
});

// ─── Provider ───────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const stored =
      (document.cookie.match(/(?:^|;\s*)lang=([^;]*)/))?.[1] ||
      localStorage.getItem(LANG_COOKIE);
    if (stored === "en" || stored === "ru" || stored === "es") {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_COOKIE, l);
    document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=31536000`;
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: getTranslations(lang) }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLanguage() {
  return useContext(LanguageContext);
}

// ─── Switcher component ──────────────────────────────────────────────────────

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const langs = Object.entries(LANG_LABELS) as [Lang, string][];

  return (
    <div
      className={`flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-widest ${className}`}
    >
      {langs.map(([code, label], i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span className="text-fg/20 px-0.5">·</span>}
          <button
            type="button"
            onClick={() => setLang(code)}
            className={`px-1.5 py-0.5 transition-colors ${
              lang === code
                ? "text-matrix-green border border-matrix-green/50 bg-matrix-green/10"
                : "text-fg/40 hover:text-matrix-green border border-transparent"
            }`}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Floating overlay (non-authenticated pages) ──────────────────────────────

const AUTHED_PREFIXES = ["/dashboard", "/games", "/quests", "/achievements", "/leaderboard", "/profile"];

export function GlobalLanguageSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
    const onNav = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  if (!mounted) return null;
  if (AUTHED_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed top-3 right-4 z-[60]">
      <LanguageSwitcher />
    </div>
  );
}
