import { Search, SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EquipmentStatus } from "@/lib/lis-api";
import { cn } from "@/lib/utils";

type Props = {
  search: string;
  onSearch: (value: string) => void;
  categories: string[];
  category: string;
  onCategory: (value: string) => void;
  status: EquipmentStatus | "";
  onStatus: (value: EquipmentStatus | "") => void;
  onClear: () => void;
  resultCount: number;
};

const STATUSES: EquipmentStatus[] = ["available", "reserved", "maintenance", "decommissioned"];

export function FilterPanel({
  search,
  onSearch,
  categories,
  category,
  onCategory,
  status,
  onStatus,
  onClear,
  resultCount,
}: Props) {
  const { t } = useI18n();
  const hasFilters = Boolean(search || category || status);

  return (
    <section className="glass spotlight rounded-3xl p-5 transition-all duration-500 hover:shadow-[var(--shadow-glow)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="truncate text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {t("filters.title")}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("filters.results", { count: resultCount })}
        </span>
      </div>

      <div className="mt-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("filters.search")}
          aria-label={t("filters.search")}
          className="h-11 rounded-2xl border-border/70 bg-secondary/40 pl-9 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("filters.category")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip active={category === ""} onClick={() => onCategory("")}>
              {t("filters.all")}
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => onCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("filters.status")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip active={status === ""} onClick={() => onStatus("")}>
              {t("filters.allStatus")}
            </Chip>
            {STATUSES.map((s) => (
              <Chip key={s} active={status === s} onClick={() => onStatus(s)}>
                <span
                  className={cn(
                    "mr-2 inline-block h-2 w-2 rounded-full",
                    s === "available" && "bg-available",
                    s === "reserved" && "bg-reserved",
                    s === "maintenance" && "bg-maintenance",
                    s === "decommissioned" && "bg-destructive",
                  )}
                />
                {t(`status.${s}` as const)}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="mt-5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t("filters.clear")}
        </Button>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
        active
          ? "border-primary/60 bg-primary/15 text-primary shadow-[var(--shadow-glow)]"
          : "border-border/70 bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
