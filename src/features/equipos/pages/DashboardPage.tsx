import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';
import { useEquipos } from '@/features/equipos/hooks/useEquipos';
import { useCategorias } from '@/features/categorias/hooks/useCategorias';
import { FilterBar } from '@/features/equipos/components/FilterBar';
import { EquipoCard } from '@/features/equipos/components/EquipoCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';

const PAGE_SIZE = 9;
const DEBOUNCE_MS = 250;

function SkeletonCard() {
  return (
    <div className="card-base flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-3 w-2/3" />
      <div className="skeleton h-3 w-1/2" />
      <div className="mt-2 flex gap-2">
        <div className="skeleton h-9 flex-1" />
        <div className="skeleton h-9 w-20" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawNombre = searchParams.get('q') ?? '';
  const estado = searchParams.get('estado') ?? '';
  const categoria = searchParams.get('categoria') ?? '';
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0);

  // Debounce the text search so typing doesn't thrash the API.
  const [nombreInput, setNombreInput] = useState(rawNombre);
  const [debouncedNombre, setDebouncedNombre] = useState(rawNombre);

  useEffect(() => {
    setNombreInput(rawNombre);
  }, [rawNombre]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedNombre(nombreInput), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [nombreInput]);

  const categoriasQuery = useCategorias();
  const categorias = categoriasQuery.data ?? [];

  const filters = useMemo(
    () => ({
      nombre: debouncedNombre || undefined,
      estado: estado || undefined,
      categoria: categoria || undefined,
      page,
      size: PAGE_SIZE,
    }),
    [debouncedNombre, estado, categoria, page]
  );

  const equiposQuery = useEquipos(filters);
  const pageData = equiposQuery.data;
  const isFetching = equiposQuery.isFetching;

  function update(next: Record<string, string | number | null>, resetPage = true) {
    const merged = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '' || v === 0) merged.delete(k);
      else merged.set(k, String(v));
    }
    if (resetPage && !('page' in next)) merged.delete('page');
    setSearchParams(merged, { replace: true });
  }

  const hasFilters = Boolean(rawNombre || estado || categoria);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 px-6 py-8 text-white shadow-soft sm:px-8 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('equipos.title')}</h1>
        <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{t('equipos.subtitle')}</p>
      </section>

      <FilterBar
        nombre={nombreInput}
        estado={estado}
        categoria={categoria}
        onNombre={(v) => {
          setNombreInput(v);
          update({ q: v });
        }}
        onEstado={(v) => update({ estado: v })}
        onCategoria={(v) => update({ categoria: v })}
        categorias={categorias}
        hasFilters={hasFilters}
        onClear={() => {
          setNombreInput('');
          setDebouncedNombre('');
          setSearchParams(new URLSearchParams(), { replace: true });
        }}
      />

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {pageData
            ? t('equipos.resultsCount', { count: pageData.totalElements })
            : t('common.loading')}
        </p>
        {isFetching && pageData && (
          <span className="text-xs text-ink-muted">{t('common.loading')}</span>
        )}
      </div>

      {/* States */}
      {equiposQuery.isError ? (
        <ErrorState
          message={t('auth.networkError')}
          onRetry={() => equiposQuery.refetch()}
        />
      ) : isFetching && !pageData ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : pageData && pageData.content.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageData.content.map((equipo) => (
              <EquipoCard key={equipo.idEquipo} equipo={equipo} />
            ))}
          </div>
          <Pagination
            className="mt-6"
            page={pageData.number}
            totalPages={pageData.totalPages}
            onChange={(p) => update({ page: p }, false)}
          />
        </>
      ) : (
        <EmptyState
          title={t('equipos.noResults')}
          description={t('equipos.noResultsDetail')}
          icon={<SearchX className="h-7 w-7" aria-hidden />}
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNombreInput('');
                  setDebouncedNombre('');
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
              >
                {t('equipos.clearFilters')}
              </Button>
            ) : null
          }
        />
      )}
    </div>
  );
}
