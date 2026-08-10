import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { translations, getNested } from "./translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "lis-lang";

function detectInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "es" || saved === "en") return saved;
  return "es";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectInitialLanguage);

  const changeLanguage = useCallback((next) => {
    setLang(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (path, fallback) => {
      const value = getNested(translations[lang], path);
      return value !== undefined ? value : fallback ?? path;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang: changeLanguage, t }),
    [lang, changeLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
