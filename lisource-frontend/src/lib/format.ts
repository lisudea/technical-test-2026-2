import { languageLocale } from "@/i18n/languages";

export function formatDate(value: string, language: string) {
  return new Date(value).toLocaleDateString(languageLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(value: string, language: string) {
  return new Date(value).toLocaleTimeString(languageLocale(language), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRange(start: string, end: string, language: string) {
  return `${formatTime(start, language)} — ${formatTime(end, language)}`;
}

/** yyyy-MM-dd in local time, for <input type="date"> defaults. */
export function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}
