import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CrearSancionPayload,
  PagedResponse,
  Sancion,
  SancionFilters,
} from '@/lib/types';

/** Staff listing (ADMIN / AUXILIAR). */
export function useSanciones(filters: SancionFilters) {
  return useQuery({
    queryKey: ['sanciones', filters],
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Sancion>>('/api/v1/sanciones', {
        params: {
          idUsuario: filters.idUsuario,
          estado: filters.estado || undefined,
          soloVigentes: filters.soloVigentes ?? false,
          page: filters.page ?? 0,
          size: filters.size ?? 10,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

/**
 * The signed-in user's own sanctions.
 *
 * Any authenticated user may call this — it is how a student refused at
 * booking time finds out the reason and the end date without having to ask
 * anyone.
 */
export function useMisSanciones(enabled = true) {
  return useQuery({
    queryKey: ['mis-sanciones'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Sancion>>('/api/v1/sanciones/mias', {
        params: { page: 0, size: 20 },
      });
      return data.content;
    },
  });
}

export function useCrearSancion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CrearSancionPayload) => {
      const { data } = await api.post<Sancion>('/api/v1/sanciones', payload);
      return data;
    },
    onSuccess: () => invalidarSanciones(qc),
  });
}

export function useLevantarSancion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idSancion,
      observacion,
    }: {
      idSancion: number;
      observacion?: string;
    }) => {
      const { data } = await api.patch<Sancion>(
        `/api/v1/sanciones/${idSancion}/levantar`,
        { observacion }
      );
      return data;
    },
    onSuccess: () => invalidarSanciones(qc),
  });
}

function invalidarSanciones(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sanciones'] });
  qc.invalidateQueries({ queryKey: ['mis-sanciones'] });
  qc.invalidateQueries({ queryKey: ['admin-resumen'] });
}
