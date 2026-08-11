import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Table, type Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  useLevantarSancion,
  useSanciones,
} from '@/features/sanciones/hooks/useSanciones';
import { errorMessage } from '@/lib/api';
import type { Sancion } from '@/lib/types';

function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function AdminSancionesPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [estado, setEstado] = useState('');
  const [soloVigentes, setSoloVigentes] = useState(false);
  const [page, setPage] = useState(0);
  const [levantando, setLevantando] = useState<Sancion | null>(null);
  const [observacion, setObservacion] = useState('');

  const sanciones = useSanciones({ estado, soloVigentes, page, size: 10 });
  const levantar = useLevantarSancion();

  async function handleLevantar() {
    if (!levantando) return;
    try {
      await levantar.mutateAsync({
        idSancion: levantando.idSancion,
        observacion: observacion.trim() || undefined,
      });
      toast.success(t('sanciones.liftSuccess'));
      setLevantando(null);
      setObservacion('');
    } catch (err) {
      toast.error(errorMessage(err, t('sanciones.liftError')));
    }
  }

  const columns: Column<Sancion>[] = [
    {
      key: 'usuario',
      header: t('sanciones.user'),
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{s.usuarioNombre}</p>
          <p className="truncate text-xs text-ink-muted">{s.correoUsuario}</p>
        </div>
      ),
    },
    {
      key: 'motivo',
      header: t('sanciones.reason'),
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate text-ink-soft">{s.motivo}</p>
          <p className="text-xs text-ink-muted">{t(`sanciones.${s.origen}`)}</p>
        </div>
      ),
    },
    {
      key: 'hasta',
      header: t('sanciones.until'),
      hideOnMobile: true,
      render: (s) => (
        <span className="whitespace-nowrap tabular-nums text-xs">
          {formatoFecha(s.fechaFin)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: t('sanciones.state'),
      render: (s) => (
        // `vigente` is computed by the backend: ACTIVA alone is not enough,
        // the window must also not have elapsed.
        <Badge tone={s.vigente ? 'reservado' : 'neutral'}>
          {s.vigente
            ? t('sanciones.vigente')
            : s.estado === 'LEVANTADA'
              ? t('sanciones.LEVANTADA')
              : t('sanciones.expirada')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: t('sanciones.actions'),
      className: 'text-right',
      render: (s) =>
        s.estado === 'ACTIVA' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLevantando(s)}
            iconLeft={<ShieldCheck className="h-4 w-4" aria-hidden />}
          >
            {t('sanciones.lift')}
          </Button>
        ) : (
          <span className="text-xs text-ink-muted">
            {s.levantadaPorNombre ?? '—'}
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[auto,auto,1fr] sm:items-end">
          <Select
            label={t('sanciones.state')}
            options={[
              { value: '', label: t('equipos.allStatuses') },
              { value: 'ACTIVA', label: t('sanciones.ACTIVA') },
              { value: 'LEVANTADA', label: t('sanciones.LEVANTADA') },
            ]}
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(0);
            }}
          />
          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-surface-line px-3.5 text-sm text-ink-soft transition-colors hover:border-primary/50">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#6CBCB9]"
              checked={soloVigentes}
              onChange={(e) => {
                setSoloVigentes(e.target.checked);
                setPage(0);
              }}
            />
            {t('sanciones.onlyActive')}
          </label>
        </div>

        {sanciones.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label={t('common.loading')} />
          </div>
        ) : sanciones.isError ? (
          <ErrorState
            message={t('sanciones.liftError')}
            onRetry={() => void sanciones.refetch()}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={sanciones.data?.content ?? []}
              rowKey={(s) => s.idSancion}
              empty={
                <EmptyState
                  icon={<Ban className="h-8 w-8 text-ink-muted" aria-hidden />}
                  title={t('sanciones.empty')}
                  description={t('sanciones.emptyDetail')}
                />
              }
            />
            {(sanciones.data?.totalPages ?? 0) > 1 && (
              <Pagination
                className="mt-4"
                page={sanciones.data?.number ?? 0}
                totalPages={sanciones.data?.totalPages ?? 0}
                onChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      <Modal
        open={levantando !== null}
        onClose={() => setLevantando(null)}
        title={t('sanciones.liftTitle')}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setLevantando(null)}
              disabled={levantar.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button loading={levantar.isPending} onClick={() => void handleLevantar()}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">{t('sanciones.liftHint')}</p>
          <Input
            label={t('sanciones.liftReason')}
            placeholder={t('sanciones.liftReasonPlaceholder')}
            value={observacion}
            maxLength={255}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
