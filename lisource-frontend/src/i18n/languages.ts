export const supportedLanguages = [
  { code: "es", nativeName: "Español", locale: "es-CO" },
  { code: "en", nativeName: "English", locale: "en-US" },
  { code: "fr", nativeName: "Français", locale: "fr-FR" },
  { code: "pt", nativeName: "Português", locale: "pt-BR" },
  { code: "de", nativeName: "Deutsch", locale: "de-DE" },
  { code: "it", nativeName: "Italiano", locale: "it-IT" },
] as const;

export type AppLanguage = (typeof supportedLanguages)[number]["code"];

export const SUPPORTED_LANGUAGES = supportedLanguages.map(({ code }) => code) as AppLanguage[];

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

export function languageLocale(language: string): string {
  return supportedLanguages.find(({ code }) => code === language)?.locale ?? "es-CO";
}
