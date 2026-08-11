import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AgendaFilters,
  PagedResponse,
  Reserva,
  ResumenPrestamos,
} from '@/lib/types';

/**
 * The loan desk's working queue for a day.
 *
 * The backend also folds in equipment handed over on previous days and not
 * yet returned, so an auxiliar starting a shift sees what is still out
 * rather than only today's bookings.
 */
export function useAgenda(filters: AgendaFilters) {
  return useQuery({
    queryKey: ['prestamos-agenda', filters],
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Reserva>>('/api/v1/prestamos/agenda', {
        params: {
          fecha: filters.fecha || undefined,
          estadoPrestamo: filters.estadoPrestamo || undefined,
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          sort: 'fechaHoraInicio,asc',
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
    // The desk is a live view: someone is standing at the counter.
    staleTime: 10_000,
  });
}

export function useResumenPrestamos(fecha?: string) {
  return useQuery({
    queryKey: ['prestamos-resumen', fecha],
    queryFn: async () => {
      const { data } = await api.get<ResumenPrestamos>('/api/v1/prestamos/resumen', {
        params: { fecha: fecha || undefined },
      });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useEntregar() {
  return usePrestamoAction((id) => `/api/v1/prestamos/${id}/entrega`);
}

export function useDevolver() {
  return usePrestamoAction((id) => `/api/v1/prestamos/${id}/devolucion`);
}

export function useMarcarNoReclamado() {
  return usePrestamoAction((id) => `/api/v1/prestamos/${id}/no-reclamado`);
}

interface PrestamoActionPayload {
  idReserva: number;
  observaciones?: string;
  requiereMantenimiento?: boolean;
  sancionar?: boolean;
}

/**
 * The three desk actions are the same POST shape against different paths,
 * with the same invalidation fan-out. Factoring it keeps the three hooks
 * from drifting — an easy way to end up with a screen that silently stops
 * refreshing after one of them.
 */
function usePrestamoAction(path: (idReserva: number) => string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ idReserva, ...body }: PrestamoActionPayload) => {
      const { data } = await api.post<Reserva>(path(idReserva), body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestamos-agenda'] });
      qc.invalidateQueries({ queryKey: ['prestamos-resumen'] });
      // A hand-over or return also changes the booking and possibly the
      // equipment state, so the public-facing views refresh too.
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['equipos'] });
      qc.invalidateQueries({ queryKey: ['sanciones'] });
      qc.invalidateQueries({ queryKey: ['admin-resumen'] });
    },
  });
}
