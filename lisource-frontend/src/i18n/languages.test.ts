// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import i18n, { languageLocale, readStoredLanguage, persistLanguage, supportedLanguages } from ".";

describe("supported languages", () => {
  beforeEach(() => window.localStorage.clear());

  it("exposes the six configured languages in their native names", () => {
    expect(supportedLanguages.map(({ code, nativeName }) => ({ code, nativeName }))).toEqual([
      { code: "es", nativeName: "Español" },
      { code: "en", nativeName: "English" },
      { code: "fr", nativeName: "Français" },
      { code: "pt", nativeName: "Português" },
      { code: "de", nativeName: "Deutsch" },
      { code: "it", nativeName: "Italiano" },
    ]);
  });

  it("persists a valid preference and ignores unsupported stored values", () => {
    persistLanguage("fr");
    expect(readStoredLanguage()).toBe("fr");

    window.localStorage.setItem("lisource.language", "xx");
    expect(readStoredLanguage()).toBeNull();
  });

  it("maps date formatting locales and falls back to Spanish", () => {
    expect(languageLocale("de")).toBe("de-DE");
    expect(languageLocale("unsupported")).toBe("es-CO");
  });

  it("keeps the document language synchronized with i18next", async () => {
    await i18n.changeLanguage("it");
    expect(document.documentElement.lang).toBe("it");
  });
});
