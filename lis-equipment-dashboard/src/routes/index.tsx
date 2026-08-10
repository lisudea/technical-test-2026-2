import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Plus, Trophy } from "lucide-react";
import { CursorAura } from "@/components/lis/CursorAura";
import { Reveal } from "@/components/lis/Reveal";
import { Header, NavTabs } from "@/components/lis/Header";
import { FilterPanel } from "@/components/lis/FilterPanel";
import { EquipmentCard } from "@/components/lis/EquipmentCard";
import { ReserveDialog } from "@/components/lis/ReserveDialog";
import { EquipmentFormDialog } from "@/components/lis/EquipmentFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  fetchAllEquipment,
  fetchActiveReservations,
  fetchTopEquipment,
  type Equipment,
  type EquipmentStatus,
} from "@/lib/lis-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel LIS — Monitoreo de recursos del laboratorio" },
      {
        name: "description",
        content:
          "Dashboard reactivo para monitorear el estado de los equipos del laboratorio LIS, filtrar por categoría y crear reservas.",
      },
      { property: "og:title", content: "Panel LIS — Monitoreo de recursos del laboratorio" },
      {
        property: "og:description",
        content:
          "Estado en tiempo real, filtros dinámicos y reservas de equipos del laboratorio LIS.",
      },
    ],
  }),
  component: Dashboard,
});

const PAGE_SIZE = 9;

function isCurrentlyActive(startAt: string, endAt: string): boolean {
  const now = Date.now();
  return new Date(startAt).getTime() <= now && new Date(endAt).getTime() > now;
}

function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const backendOrigin = import.meta.env["VITE_BACKEND_ORIGIN"] as string | undefined;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<EquipmentStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const equipmentQuery = useQuery({ queryKey: ["equipment-all"], queryFn: fetchAllEquipment });
  const reservationsQuery = useQuery({
    queryKey: ["reservations-active"],
    queryFn: fetchActiveReservations,
  });
  const topQuery = useQuery({ queryKey: ["top-equipment"], queryFn: fetchTopEquipment });

  const isError = equipmentQuery.isError || reservationsQuery.isError;
  const isLoading = equipmentQuery.isLoading || reservationsQuery.isLoading;

  const derivedEquipment = useMemo(() => {
    const equipment = equipmentQuery.data ?? [];
    const reservations = reservationsQuery.data ?? [];
    const reservedIds = new Set(
      reservations.filter((r) => isCurrentlyActive(r.startAt, r.endAt)).map((r) => r.equipmentId),
    );
    return equipment.map((e) =>
      e.status === "available" && reservedIds.has(e.id) ? { ...e, status: "reserved" as const } : e,
    );
  }, [equipmentQuery.data, reservationsQuery.data]);

  const categories = useMemo(
    () => Array.from(new Set(derivedEquipment.map((e) => e.category))).sort(),
    [derivedEquipment],
  );

  const stats = useMemo(
    () => ({
      total: derivedEquipment.length,
      available: derivedEquipment.filter((e) => e.status === "available").length,
      reserved: derivedEquipment.filter((e) => e.status === "reserved").length,
      maintenance: derivedEquipment.filter((e) => e.status === "maintenance").length,
      decommissioned: derivedEquipment.filter((e) => e.status === "decommissioned").length,
    }),
    [derivedEquipment],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return derivedEquipment.filter((e) => {
      const matchCategory = !category || e.category === category;
      const matchStatus = !status || e.status === status;
      const matchSearch =
        !term ||
        e.name.toLowerCase().includes(term) ||
        e.serial.toLowerCase().includes(term) ||
        e.id.toLowerCase().includes(term);
      return matchCategory && matchStatus && matchSearch;
    });
  }, [derivedEquipment, category, status, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const applyFilter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["equipment-all"] });
    void queryClient.invalidateQueries({ queryKey: ["reservations-active"] });
    void queryClient.invalidateQueries({ queryKey: ["top-equipment"] });
  };

  function handleReserveClick(equipment: Equipment) {
    if (!user) {
      window.location.href = backendOrigin ?? "/";
      return;
    }
    setSelected(equipment);
  }

  function handleCreateClick() {
    setEditingEquipment(null);
    setEquipmentDialogOpen(true);
  }

  function handleEditClick(equipment: Equipment) {
    setEditingEquipment(equipment);
    setEquipmentDialogOpen(true);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CursorAura />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <Header />
        <NavTabs />

        {isAdmin && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreateClick} size="sm" className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("equipmentForm.addButton")}
            </Button>
          </div>
        )}

        <Reveal className="mt-8" delay={60}>
          <div className="focus-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label={t("stats.total")} value={stats.total} tone="text-primary" />
            <StatCard label={t("stats.available")} value={stats.available} tone="text-available" />
            <StatCard label={t("stats.reserved")} value={stats.reserved} tone="text-reserved" />
            <StatCard label={t("stats.maintenance")} value={stats.maintenance} tone="text-maintenance" />
            <StatCard label={t("stats.decommissioned")} value={stats.decommissioned} tone="text-destructive" />
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <Reveal delay={100}>
              <FilterPanel
                search={search}
                onSearch={applyFilter(setSearch)}
                categories={categories}
                category={category}
                onCategory={applyFilter(setCategory)}
                status={status}
                onStatus={applyFilter(setStatus)}
                onClear={() => {
                  setSearch("");
                  setCategory("");
                  setStatus("");
                  setPage(1);
                }}
                resultCount={filtered.length}
              />
            </Reveal>

            {(topQuery.data?.length ?? 0) > 0 && (
              <Reveal delay={160}>
                <section className="glass rounded-3xl p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    <Trophy className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">{t("top.title")}</span>
                  </h2>
                  <ol className="mt-4 space-y-3">
                    {topQuery.data?.map((e, i) => (
                      <li key={e.id} className="flex min-w-0 items-center gap-3 text-sm">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-secondary/60 text-xs font-semibold text-accent">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{e.name}</span>
                        {e.requests ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {e.requests} {t("top.requests")}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              </Reveal>
            )}
          </div>

          <section>
            {isError ? (
              <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <h2 className="mt-4 text-lg font-semibold">{t("error.loadTitle")}</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {equipmentQuery.error instanceof ApiError
                    ? (equipmentQuery.error.detail ?? t(equipmentQuery.error.messageKey))
                    : t("error.network")}
                </p>
                <Button
                  className="mt-6 rounded-full"
                  onClick={() => {
                    void equipmentQuery.refetch();
                    void reservationsQuery.refetch();
                  }}
                >
                  {t("error.retry")}
                </Button>
              </div>
            ) : isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-3xl bg-card/60" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="glass flex flex-col items-center rounded-3xl px-6 py-16 text-center">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">{t("equipment.empty")}</p>
              </div>
            ) : (
              <div className="focus-grid grid gap-4 transition-opacity duration-300 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((equipment, i) => (
                  <Reveal key={equipment.id} delay={i * 50}>
                    <EquipmentCard
                      equipment={equipment}
                      onReserve={handleReserveClick}
                      isAdmin={isAdmin}
                      onEdit={handleEditClick}
                    />
                  </Reveal>
                ))}
              </div>
            )}

            {totalPages > 1 && !isError && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("pagination.prev")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("pagination.page", { page, total: totalPages })}
                </span>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      <ReserveDialog
        equipment={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSuccess={refreshAll}
      />

      <EquipmentFormDialog
        equipment={editingEquipment}
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
        onSuccess={refreshAll}
      />
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="glass spotlight rounded-3xl p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", tone)}>{value}</p>
    </div>
  );
}