const LOCALES = { es: "es-CO", en: "en-US" };

export function formatDateTime(isoLike, lang) {
  if (!isoLike) return "";
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return isoLike;

  return new Intl.DateTimeFormat(LOCALES[lang] || "es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
