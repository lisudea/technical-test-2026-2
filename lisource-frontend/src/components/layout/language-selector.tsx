import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Languages } from "lucide-react";
import { toast } from "sonner";

import { isAppLanguage, supportedLanguages, type AppLanguage } from "@/i18n";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api-error";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSelector({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const { updateLanguage } = useAuth();
  const current = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : "es";
  const selected = supportedLanguages.find(({ code }) => code === current) ?? supportedLanguages[0];

  const change = (language: AppLanguage) => {
    if (language === current) return;
    void updateLanguage(language).catch((error: unknown) => {
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown"));
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("common.language")}: ${selected.nativeName}`}
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none sm:min-w-32",
            className,
          )}
        >
          <Languages className="h-4 w-4 shrink-0 text-brand-dark" aria-hidden="true" />
          <span className="hidden truncate sm:inline">{selected.nativeName}</span>
          <ChevronDown
            className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => change(language.code)}
            aria-current={current === language.code ? "true" : undefined}
            className="min-h-10 cursor-pointer"
          >
            <span className="flex h-4 w-4 items-center justify-center" aria-hidden="true">
              {current === language.code ? <Check className="h-4 w-4 text-brand-dark" /> : null}
            </span>
            <span lang={language.code}>{language.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
