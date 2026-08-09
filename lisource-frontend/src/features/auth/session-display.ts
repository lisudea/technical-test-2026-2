import type { SessionDto } from "@/types";

export function friendlyDeviceName(userAgent: string | null | undefined): string {
  const agent = userAgent?.trim() ?? "";
  if (!agent) return "Unknown device";

  if (/HeadlessChrome/i.test(agent)) return "Automated test · Headless Chrome";
  if (/WindowsPowerShell|PowerShell/i.test(agent)) return "PowerShell · Windows";
  if (/\bnode(?:\.js)?\b/i.test(agent)) return "Node.js · Automated client";

  const browser = /Edg(?:e|A|iOS)?\//i.test(agent)
    ? "Edge"
    : /OPR\//i.test(agent)
      ? "Opera"
      : /Firefox\//i.test(agent)
        ? "Firefox"
        : /Chrome|CriOS/i.test(agent)
          ? "Chrome"
          : /Safari\//i.test(agent)
            ? "Safari"
            : "Browser";

  const operatingSystem = /Windows NT 10\.0/i.test(agent)
    ? "Windows 10/11"
    : /Windows/i.test(agent)
      ? "Windows"
      : /Android/i.test(agent)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(agent)
          ? "iOS"
          : /Mac OS X|Macintosh/i.test(agent)
            ? "macOS"
            : /Linux/i.test(agent)
              ? "Linux"
              : "Unknown OS";

  return `${browser} · ${operatingSystem}`;
}

export function displayIp(ipAddress: string | null): string | null {
  if (!ipAddress) return null;
  return ["::1", "0:0:0:0:0:0:0:1", "127.0.0.1"].includes(ipAddress) ? "Localhost" : ipAddress;
}

export function sessionActivity(session: SessionDto): string {
  return session.lastUsedAt ?? session.createdAt;
}

export function relativeDate(value: string, locale: string, now = new Date()): string {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function absoluteDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
