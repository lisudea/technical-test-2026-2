import { describe, expect, it } from "vitest";

import { displayIp, friendlyDeviceName, relativeDate, sessionActivity } from "./session-display";

describe("session display", () => {
  it("turns browser user agents into friendly device names", () => {
    expect(
      friendlyDeviceName(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
      ),
    ).toBe("Chrome · Windows 10/11");
    expect(friendlyDeviceName("Mozilla/5.0 HeadlessChrome/140.0")).toBe(
      "Automated test · Headless Chrome",
    );
    expect(friendlyDeviceName("WindowsPowerShell/7.5")).toBe("PowerShell · Windows");
  });

  it("uses creation as initial activity and normalizes loopback only for display", () => {
    expect(
      sessionActivity({
        id: 1,
        createdAt: "2026-08-08T12:00:00Z",
        expiresAt: "2026-08-15T12:00:00Z",
        lastUsedAt: null,
        ipAddress: "::1",
        userAgent: "test",
        current: true,
      }),
    ).toBe("2026-08-08T12:00:00Z");
    expect(displayIp("::1")).toBe("Localhost");
    expect(displayIp("192.0.2.1")).toBe("192.0.2.1");
    expect(relativeDate("2026-08-08T11:58:00Z", "en", new Date("2026-08-08T12:00:00Z"))).toBe(
      "2 minutes ago",
    );
  });
});
