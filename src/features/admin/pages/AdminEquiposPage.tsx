import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Table, type Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { EquipoFormModal } from '@/features/admin/components/EquipoFormModal';
import { useCambiarEstadoEquipo } from '@/features/admin/hooks/useAdmin';
import { useCategorias } from '@/features/categorias/hooks/useCategorias';
import { StatusBadge } from '@/features/equipos/components/StatusBadge';
import { useEquipos } from '@/features/equipos/hooks/useEquipos';
import { errorMessage } from '@/lib/api';
import type { Equipo } from '@/lib/types';

const ESTADOS = ['DISPONIBLE', 'MANTENIMIENTO', 'BAJA'] as const;

/**
 * Catalog administration.
 *
 * <p>Reuses the same public `useEquipos` query the dashboard uses instead of
 * an admin-only mirror: one query key means a create or edit here refreshes
 * the public catalog too, and the two views cannot show different truths.
 */
export function AdminEquiposPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(0);
  const [editando, setEditando] = useState<Equipo | null>(null);
  const [creando, setCreando] = useState(false);

  const equipos = useEquipos({ nombre, estado, page, size: 10 });
  const categorias = useCategorias();
  const cambiarEstado = useCambiarEstadoEquipo();

  async function handleEstado(equipo: Equipo, nuevo: string) {
    try {
      await cambiarEstado.mutateAsync({ idEquipo: equipo.idEquipo, estado: nuevo });
      toast.success(t('admin.equipos.stateSuccess'));
    } catch (err) {
      toast.error(errorMessage(err, t('admin.equipos.saveError')));
    }
  }

  const columns: Column<Equipo>[] = [
    {
      key: 'nombre',
      header: t('admin.equipos.name'),
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{e.nombre}</p>
          <p className="truncate text-xs text-ink-muted">{e.categoriaNombre}</p>
        </div>
      ),
    },
    {
      key: 'serial',
      header: t('admin.equipos.serial'),
      hideOnMobile: true,
      render: (e) => (
        <span className="text-xs tabular-nums text-ink-muted">{e.numeroSerie || '—'}</span>
      ),
    },
    {
      key: 'estado',
      header: t('admin.equipos.state'),
      render: (e) => <StatusBadge estado={e.estado} />,
    },
    {
      key: 'acciones',
      header: t('admin.equipos.actions'),
      className: 'text-right',
      render: (e) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* The state change is a one-step select rather than a modal: it is
              the most frequent catalog edit by far. */}
          <Select
            aria-label={t('admin.equipos.changeState')}
            className="h-9 w-44 text-xs"
            options={ESTADOS.map((s) => ({ value: s, label: t(`status.${s}`) }))}
            value={e.estado}
            onChange={(ev) => void handleEstado(e, ev.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditando(e)}
            iconLeft={<Pencil className="h-4 w-4" aria-hidden />}
          >
            {t('admin.equipos.edit')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr,auto,auto] sm:items-end">
          <Input
            label={t('common.search')}
            placeholder={t('equipos.searchPlaceholder')}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setPage(0);
            }}
          />
          <Select
            label={t('admin.equipos.state')}
            options={[
              { value: '', label: t('equipos.allStatuses') },
              ...ESTADOS.map((s) => ({ value: s, label: t(`status.${s}`) })),
            ]}
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(0);
            }}
          />
          <Button
            onClick={() => setCreando(true)}
            iconLeft={<Plus className="h-4 w-4" aria-hidden />}
          >
            {t('admin.equipos.new')}
          </Button>
        </div>

        {equipos.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label={t('common.loading')} />
          </div>
        ) : equipos.isError ? (
          <ErrorState
            message={t('admin.equipos.saveError')}
            onRetry={() => void equipos.refetch()}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={equipos.data?.content ?? []}
              rowKey={(e) => e.idEquipo}
              empty={
                <EmptyState
                  icon={<Boxes className="h-8 w-8 text-ink-muted" aria-hidden />}
                  title={t('equipos.noResults')}
                  description={t('equipos.noResultsDetail')}
                />
              }
            />
            {(equipos.data?.totalPages ?? 0) > 1 && (
              <Pagination
                className="mt-4"
                page={equipos.data?.number ?? 0}
                totalPages={equipos.data?.totalPages ?? 0}
                onChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {(creando || editando) && (
        <EquipoFormModal
          equipo={editando}
          categorias={categorias.data ?? []}
          onClose={() => {
            setCreando(false);
            setEditando(null);
          }}
          onDone={(mensaje) => {
            toast.success(mensaje);
            setCreando(false);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
