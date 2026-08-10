import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Trophy } from "lucide-react";
import { CursorAura } from "@/components/lis/CursorAura";
import { Reveal } from "@/components/lis/Reveal";
import { Header, NavTabs } from "@/components/lis/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { fetchCancellationRate, fetchReservationsByCategory, fetchTopEquipment } from "@/lib/lis-api";

export const Route = createFileRoute("/estadisticas")({
  head: () => ({ meta: [{ title: "Estadísticas — Panel LIS" }] }),
  component: StatsPage,
});

function StatsPage() {
  const { t } = useI18n();
  const topQuery = useQuery({ queryKey: ["top-equipment"], queryFn: fetchTopEquipment });
  const categoryQuery = useQuery({
    queryKey: ["reservations-by-category"],
    queryFn: fetchReservationsByCategory,
  });
  const rateQuery = useQuery({ queryKey: ["cancellation-rate"], queryFn: fetchCancellationRate });

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CursorAura />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <Header />
        <NavTabs />

        <Reveal className="mt-8" delay={60}>
          <h2 className="text-xl font-bold">{t("stats.pageTitle")}</h2>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal delay={100}>
            <section className="glass rounded-3xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {t("stats.cancellationRate.title")}
              </h3>
              {rateQuery.isLoading ? (
                <Skeleton className="mt-4 h-24 rounded-2xl bg-card/60" />
              ) : rateQuery.data ? (
                <div className="mt-4 flex flex-wrap items-end gap-6">
                  <p className="text-4xl font-bold text-primary tabular-nums">
                    {rateQuery.data.percentage}%
                  </p>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>{t("stats.cancellationRate.total")}: {rateQuery.data.total}</span>
                    <span>{t("stats.cancellationRate.active")}: {rateQuery.data.active}</span>
                    <span>{t("stats.cancellationRate.cancelled")}: {rateQuery.data.cancelled}</span>
                  </div>
                </div>
              ) : null}
            </section>
          </Reveal>

          <Reveal delay={140}>
            <section className="glass rounded-3xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Trophy className="h-4 w-4 text-accent" />
                {t("top.title")}
              </h3>
              {topQuery.isLoading ? (
                <Skeleton className="mt-4 h-40 rounded-2xl bg-card/60" />
              ) : (
                <ol className="mt-4 space-y-3">
                  {topQuery.data?.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-3 text-sm">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-secondary/60 text-xs font-semibold text-accent">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{e.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.requests} {t("top.requests")}
                      </span>
                    </li>
                  ))}
                  {(topQuery.data?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">{t("stats.empty")}</p>
                  )}
                </ol>
              )}
            </section>
          </Reveal>

          <Reveal delay={180} className="lg:col-span-2">
            <section className="glass rounded-3xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {t("stats.byCategory.title")}
              </h3>
              {categoryQuery.isLoading ? (
                <Skeleton className="mt-4 h-64 rounded-2xl bg-card/60" />
              ) : (categoryQuery.data?.length ?? 0) === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("stats.empty")}</p>
              ) : (
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryQuery.data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="category" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}