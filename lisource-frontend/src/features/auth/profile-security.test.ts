import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const profileRoute = readFileSync(new URL("../../routes/perfil.tsx", import.meta.url), "utf8");
const authService = readFileSync(
  new URL("../../services/auth.service.ts", import.meta.url),
  "utf8",
);
const authContext = readFileSync(new URL("./auth-context.tsx", import.meta.url), "utf8");

describe("profile and session security UI", () => {
  it("edits names while rendering institutional identity fields read-only", () => {
    expect(profileRoute).toContain('id="profile-first-name"');
    expect(profileRoute).toContain('id="profile-last-name"');
    expect(profileRoute).toMatch(/id="profile-email"[\s\S]*?readOnly/);
    expect(profileRoute).toMatch(/id="profile-role"[\s\S]*?readOnly/);
    expect(profileRoute).toContain('t("profile.saveChanges")');
    expect(profileRoute).not.toContain("window.location.reload");
  });

  it("updates only the authenticated profile contract and applies the returned user immediately", () => {
    expect(authService).toContain('apiRequest<UserDto>("/profile"');
    expect(authService).toContain("body: JSON.stringify(input)");
    expect(authService).not.toMatch(/updateProfile[\s\S]{0,100}userId/);
    expect(authContext).toContain("const updated = await authService.updateProfile(input)");
    expect(authContext).toContain("applyUser(updated)");
  });

  it("provides current, individual, other-session and all-session actions", () => {
    expect(profileRoute).toContain("session.current");
    expect(profileRoute).toContain("revokeSessionOrLogout");
    expect(profileRoute).toContain("authService.logoutOthers()");
    expect(profileRoute).toContain("logoutAll()");
  });
});
