import { describe, expect, it, vi } from "vitest";

import type { SessionDto } from "@/types";

import { revokeSessionOrLogout } from "./session-actions";

const session = (current: boolean): SessionDto => ({
  id: current ? 10 : 11,
  createdAt: "2026-08-08T12:00:00Z",
  expiresAt: "2026-08-15T12:00:00Z",
  lastUsedAt: null,
  ipAddress: null,
  userAgent: "Test browser",
  current,
});

describe("revokeSessionOrLogout", () => {
  it("performs complete logout when the current profile session is closed", async () => {
    const logout = vi.fn(async () => undefined);
    const revokeSession = vi.fn(async () => undefined);

    await expect(revokeSessionOrLogout(session(true), { logout, revokeSession })).resolves.toBe(
      "logged-out",
    );
    expect(logout).toHaveBeenCalledOnce();
    expect(revokeSession).not.toHaveBeenCalled();
  });

  it("revokes another session without closing the current login", async () => {
    const logout = vi.fn(async () => undefined);
    const revokeSession = vi.fn(async () => undefined);

    await expect(revokeSessionOrLogout(session(false), { logout, revokeSession })).resolves.toBe(
      "revoked",
    );
    expect(revokeSession).toHaveBeenCalledWith(11);
    expect(logout).not.toHaveBeenCalled();
  });
});
