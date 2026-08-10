import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { languages, type Language } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className="glass inline-flex items-center gap-1 rounded-full p-1"
      role="group"
      aria-label={t("nav.language")}
    >
      <Globe className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      {(Object.keys(languages) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-300",
            lang === code
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
