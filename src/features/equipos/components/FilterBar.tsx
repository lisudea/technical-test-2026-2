import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Categoria, EstadoEquipo } from '@/lib/types';

interface FilterBarProps {
  nombre: string;
  estado: string;
  categoria: string;
  onNombre: (v: string) => void;
  onEstado: (v: string) => void;
  onCategoria: (v: string) => void;
  categorias: Categoria[];
  hasFilters: boolean;
  onClear: () => void;
}

const ESTADOS: EstadoEquipo[] = ['DISPONIBLE', 'MANTENIMIENTO', 'BAJA'];

export function FilterBar({
  nombre,
  estado,
  categoria,
  onNombre,
  onEstado,
  onCategoria,
  categorias,
  hasFilters,
  onClear,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('equipos.filters')}
      className="card-base mb-6 p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
        {t('equipos.filters')}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Input
            type="search"
            value={nombre}
            onChange={(e) => onNombre(e.target.value)}
            placeholder={t('equipos.searchPlaceholder')}
            aria-label={t('common.search')}
            className="h-11"
          />
        </div>
        <Select
          aria-label={t('equipos.category')}
          value={categoria}
          onChange={(e) => onCategoria(e.target.value)}
          options={[
            { value: '', label: t('equipos.allCategories') },
            ...categorias.map((c) => ({ value: String(c.idCategoria), label: c.nombre })),
          ]}
        />
        <Select
          aria-label={t('equipos.status')}
          value={estado}
          onChange={(e) => onEstado(e.target.value)}
          options={[
            { value: '', label: t('equipos.allStatuses') },
            ...ESTADOS.map((s) => ({ value: s, label: t(`status.${s}`) })),
          ]}
        />
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            iconLeft={<X className="h-4 w-4" aria-hidden />}
          >
            {t('equipos.clearFilters')}
          </Button>
        </div>
      )}
    </section>
  );
}

export { Search };
