import React, { createContext, useContext, useState, useCallback } from "react";
import { translations } from "./translations";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("lis_lang") || (navigator.language.startsWith("en") ? "en" : "es")
  );

  const changeLang = useCallback((next) => {
    setLang(next);
    localStorage.setItem("lis_lang", next);
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.es[key] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  return ctx;
}
