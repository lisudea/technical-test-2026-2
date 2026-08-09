import { describe, expect, it } from "vitest";

import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import italian from "./it.json";
import pt from "./pt.json";

function keys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? keys(child as object, path)
      : [path];
  });
}

const locales = { es, en, fr, pt, de, it: italian };
const sourceKeys = keys(es).sort();

describe("i18n keys", () => {
  for (const [code, locale] of Object.entries(locales)) {
    it(`keeps all source keys in ${code}`, () => {
      expect(keys(locale).sort()).toEqual(sourceKeys);
    });
  }

  it("keeps the critical user journeys translated in every locale", () => {
    const critical = [
      "auth.login",
      "auth.roleSelectionTitle",
      "dashboard.title",
      "navigation.equipment",
      "equipment.searchPlaceholder",
      "reservations.conflict",
      "profile.activeSessions",
      "admin.imageHint",
      "admin.users",
      "admin.roles",
      "admin.categories",
      "admin.locations",
      "admin.configuration",
      "admin.audit",
      "errors.unauthorized",
      "states.emptyText",
    ];

    for (const locale of Object.values(locales)) {
      const localeKeys = new Set(keys(locale));
      for (const key of critical) expect(localeKeys.has(key), `${key} is missing`).toBe(true);
    }
  });
});
