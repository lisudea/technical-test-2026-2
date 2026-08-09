import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AppShell, PageHeader } from "@/components/layout/app-shell";
import {
  EquipmentFilters,
  emptyFilters,
  type EquipmentFilterValues,
} from "@/features/equipment/equipment-filters";
import { EquipmentList } from "@/features/equipment/equipment-list";
import { useCategories, useEquipmentList } from "@/features/equipment/use-equipment";

export const Route = createFileRoute("/equipos/")({
  head: () => ({
    meta: [
      { title: "Catálogo de equipos · LISource" },
      {
        name: "description",
        content:
          "Explora y filtra los equipos del Laboratorio Integrado de Sistemas por categoría, estado y palabra clave.",
      },
      { property: "og:title", content: "Catálogo de equipos · LISource" },
      {
        property: "og:description",
        content: "Consulta la disponibilidad de los recursos tecnológicos del LIS.",
      },
    ],
  }),
  component: EquipmentPage,
});

function EquipmentPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<EquipmentFilterValues>(emptyFilters);
  const [page, setPage] = useState(1);
  const categories = useCategories();
  const list = useEquipmentList({
    search: filters.search,
    categoryCode: filters.categoryCode,
    visualStatus: filters.visualStatus,
    page,
    pageSize: 8,
  });

  const applyFilters = (next: EquipmentFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <AppShell title={t("equipment.title")}>
      <PageHeader title={t("equipment.title")} subtitle={t("equipment.subtitle")} />

      <EquipmentFilters
        value={filters}
        onChange={applyFilters}
        categories={categories.data ?? []}
        resultCount={list.isLoading ? undefined : list.data?.totalItems}
      />

      <EquipmentList
        data={list.data}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
        onClearFilters={() => applyFilters(emptyFilters)}
        onPageChange={setPage}
      />
    </AppShell>
  );
}
