import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryDto, VisualStatus } from "@/types";

export interface EquipmentFilterValues {
  search: string;
  categoryCode: string;
  visualStatus: VisualStatus | "ALL";
}

export const emptyFilters: EquipmentFilterValues = {
  search: "",
  categoryCode: "ALL",
  visualStatus: "ALL",
};

const statuses: Array<{ value: VisualStatus; labelKey: string }> = [
  { value: "AVAILABLE", labelKey: "equipment.available" },
  { value: "RESERVED", labelKey: "equipment.reserved" },
  { value: "MAINTENANCE", labelKey: "equipment.maintenance" },
  { value: "OUT_OF_SERVICE", labelKey: "equipment.outOfService" },
  { value: "RETIRED", labelKey: "equipment.retired" },
];

export function EquipmentFilters({
  value,
  onChange,
  categories,
  resultCount,
}: {
  value: EquipmentFilterValues;
  onChange: (next: EquipmentFilterValues) => void;
  categories: CategoryDto[];
  resultCount: number | undefined;
}) {
  const { t } = useTranslation();
  const dirty = value.search !== "" || value.categoryCode !== "ALL" || value.visualStatus !== "ALL";

  return (
    <section
      aria-label={t("equipment.filters")}
      className="surface-card mb-4 flex flex-col gap-4 p-4 sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label htmlFor="equipment-search">{t("common.search")}</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="equipment-search"
              value={value.search}
              onChange={(event) => onChange({ ...value, search: event.target.value })}
              placeholder={t("equipment.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipment-category">{t("equipment.category")}</Label>
          <Select
            value={value.categoryCode}
            onValueChange={(next) => onChange({ ...value, categoryCode: next })}
          >
            <SelectTrigger id="equipment-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("equipment.allCategories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.code} value={category.code}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipment-status">{t("equipment.status")}</Label>
          <Select
            value={value.visualStatus}
            onValueChange={(next) =>
              onChange({ ...value, visualStatus: next as VisualStatus | "ALL" })
            }
          >
            <SelectTrigger id="equipment-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("equipment.allStatuses")}</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {t(status.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resultCount === undefined
            ? t("common.loading")
            : t("common.results", { count: resultCount })}
        </p>
        {dirty ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)}>
            <X className="h-4 w-4" aria-hidden="true" />
            {t("common.clear")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
