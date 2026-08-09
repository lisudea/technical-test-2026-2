import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import pt from "@/locales/pt.json";
import de from "@/locales/de.json";
import it from "@/locales/it.json";

export {
  SUPPORTED_LANGUAGES,
  isAppLanguage,
  languageLocale,
  supportedLanguages,
  type AppLanguage,
} from "./languages";
import { isAppLanguage, type AppLanguage } from "./languages";

const STORAGE_KEY = "lisource.language";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      pt: { translation: pt },
      de: { translation: de },
      it: { translation: it },
    },
    lng: "es",
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

function syncDocumentLanguage(language: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = isAppLanguage(language) ? language : "es";
}

i18n.off("languageChanged", syncDocumentLanguage);
i18n.on("languageChanged", syncDocumentLanguage);

/** Reads the persisted preference. Later this will come from tbl_usuario.id_idioma. */
export function readStoredLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return isAppLanguage(value) ? value : null;
}

export function persistLanguage(language: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}

export default i18n;
