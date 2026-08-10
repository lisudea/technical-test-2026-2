import { createContext, useCallback, useContext, useState } from "react";
import { translations } from "@/i18n";
import type { Locale, Translations } from "@/i18n";

const STORAGE_KEY = "lis_lang";

function getSavedLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "es";
}

interface LanguageContextValue {
  lang: Locale;
  t: Translations;
  setLang: (l: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>(getSavedLocale);

  const setLang = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used inside LanguageProvider");
  return ctx;
}
