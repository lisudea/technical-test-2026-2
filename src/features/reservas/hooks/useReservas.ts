import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CrearReservaPayload,
  PagedResponse,
  Reserva,
  ReservaFilters,
} from '@/lib/types';

export function useReservas(filters: ReservaFilters) {
  return useQuery({
    queryKey: ['reservas', filters],
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Reserva>>('/api/v1/reservas', {
        params: {
          idEquipo: filters.idEquipo,
          correo: filters.correo || undefined,
          fechaHoraInicio: filters.fechaHoraInicio,
          fechaHoraFin: filters.fechaHoraFin,
          estado: filters.estado || undefined,
          page: filters.page ?? 0,
          size: filters.size ?? 20,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Upcoming reservations for a given equipment (active, future-dated). */
export function useReservasPorEquipo(idEquipo: number | undefined) {
  return useQuery({
    queryKey: ['reservas-equipo', idEquipo],
    enabled: idEquipo !== undefined,
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Reserva>>('/api/v1/reservas', {
        params: { idEquipo, estado: 'ACTIVA', page: 0, size: 10 },
      });
      return data.content;
    },
  });
}

export function useCrearReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CrearReservaPayload) => {
      const { data } = await api.post<Reserva>('/api/v1/reservas', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['reservas-equipo'] });
      qc.invalidateQueries({ queryKey: ['estadisticas-top'] });
    },
  });
}

export function useCancelarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (idReserva: number) => {
      const { data } = await api.delete<Reserva>(`/api/v1/reservas/${idReserva}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['reservas-equipo'] });
      qc.invalidateQueries({ queryKey: ['estadisticas-top'] });
    },
  });
}
