import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
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
import { useCambiarRol, useUsuarios } from '@/features/admin/hooks/useAdmin';
import { SancionFormModal } from '@/features/sanciones/components/SancionFormModal';
import { useAuth } from '@/features/auth/AuthContext';
import { errorMessage } from '@/lib/api';
import { ROLES, type Rol, type Usuario } from '@/lib/types';

const TONO_ROL: Record<Rol, 'neutral' | 'mantenimiento' | 'disponible'> = {
  ESTUDIANTE: 'neutral',
  AUXILIAR: 'mantenimiento',
  ADMIN: 'disponible',
};

/**
 * People and their roles.
 *
 * <p>The role selector writes straight through on change — no separate save
 * button — because the whole edit is one field and a two-step flow would add
 * ceremony without adding safety. The dangerous cases are refused by the
 * backend (self-demotion, demoting the last admin) and surfaced as a toast.
 */
export function AdminUsuariosPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { perfil } = useAuth();

  const [buscar, setBuscar] = useState('');
  const [rol, setRol] = useState('');
  const [page, setPage] = useState(0);
  const [sancionando, setSancionando] = useState<Usuario | null>(null);

  const usuarios = useUsuarios({ buscar, rol, page, size: 10 });
  const cambiarRol = useCambiarRol();

  async function handleRol(usuario: Usuario, nuevo: Rol) {
    try {
      await cambiarRol.mutateAsync({ idUsuario: usuario.idUsuario, rol: nuevo });
      toast.success(t('roles.changeSuccess'), t('roles.changeConfirm'));
    } catch (err) {
      toast.error(errorMessage(err, t('roles.changeError')));
    }
  }

  const columns: Column<Usuario>[] = [
    {
      key: 'usuario',
      header: t('admin.usuarios.name'),
      render: (u) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{u.nombre}</p>
          <p className="truncate text-xs text-ink-muted">{u.correo}</p>
        </div>
      ),
    },
    {
      key: 'rolActual',
      header: t('admin.usuarios.role'),
      render: (u) => <Badge tone={TONO_ROL[u.rol]}>{t(`roles.${u.rol}`)}</Badge>,
    },
    {
      key: 'acciones',
      header: t('admin.usuarios.actions'),
      className: 'text-right',
      render: (u) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select
            aria-label={t('roles.changeTitle', { nombre: u.nombre })}
            className="h-9 w-44 text-xs"
            options={ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
            value={u.rol}
            // An admin cannot demote themselves; the backend refuses it too,
            // but disabling the control explains why before they try.
            disabled={u.correo === perfil?.correo}
            onChange={(e) => void handleRol(u, e.target.value as Rol)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSancionando(u)}
            iconLeft={<Ban className="h-4 w-4" aria-hidden />}
          >
            {t('admin.usuarios.sanction')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
          <Input
            label={t('common.search')}
            placeholder={t('admin.usuarios.searchPlaceholder')}
            value={buscar}
            onChange={(e) => {
              setBuscar(e.target.value);
              setPage(0);
            }}
          />
          <Select
            label={t('roles.label')}
            options={[
              { value: '', label: t('roles.all') },
              ...ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) })),
            ]}
            value={rol}
            onChange={(e) => {
              setRol(e.target.value);
              setPage(0);
            }}
          />
        </div>

        {usuarios.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label={t('common.loading')} />
          </div>
        ) : usuarios.isError ? (
          <ErrorState
            message={t('roles.changeError')}
            onRetry={() => void usuarios.refetch()}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={usuarios.data?.content ?? []}
              rowKey={(u) => u.idUsuario}
              empty={
                <EmptyState
                  icon={<Users className="h-8 w-8 text-ink-muted" aria-hidden />}
                  title={t('admin.usuarios.noResults')}
                />
              }
            />
            {(usuarios.data?.totalPages ?? 0) > 1 && (
              <Pagination
                className="mt-4"
                page={usuarios.data?.number ?? 0}
                totalPages={usuarios.data?.totalPages ?? 0}
                onChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {sancionando && (
        <SancionFormModal
          usuario={sancionando}
          onClose={() => setSancionando(null)}
          onDone={(mensaje) => {
            toast.success(mensaje);
            setSancionando(null);
          }}
        />
      )}
    </div>
  );
}
