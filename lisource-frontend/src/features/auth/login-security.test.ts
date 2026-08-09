import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import italian from "@/locales/it.json";
import pt from "@/locales/pt.json";

const routeSource = readFileSync(new URL("../../routes/ingreso.tsx", import.meta.url), "utf8");

describe("public login security", () => {
  it("keeps credential fields empty and preserves local and Google sign-in", () => {
    expect(routeSource.match(/useState\(""\)/g)).toHaveLength(2);
    expect(routeSource).toContain('type="email"');
    expect(routeSource).toContain('type={showPassword ? "text" : "password"}');
    expect(routeSource).toContain('t("auth.login")');
    expect(routeSource).toContain('t("auth.google")');
  });

  it("does not expose demo account controls or credentials", () => {
    expect(routeSource).not.toMatch(/demoAccounts|demoUser|demoAdmin|\.demo@/i);
    expect(routeSource).not.toMatch(/set(?:Email|Password)\(\s*["'][^"']+/i);
  });

  it("uses generic placeholders and no demo translation keys in every locale", () => {
    for (const locale of [es, en, fr, pt, de, italian]) {
      expect(locale.auth.emailPlaceholder).toBe("nombre@udea.edu.co");
      expect(locale.auth.passwordPlaceholder).toBe("••••••••");
      expect(locale.auth).not.toHaveProperty("demoAccounts");
      expect(locale.auth).not.toHaveProperty("demoUser");
      expect(locale.auth).not.toHaveProperty("demoAdmin");
    }
  });
});
