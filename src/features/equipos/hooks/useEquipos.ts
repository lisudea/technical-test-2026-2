import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Equipo, EquipoFilters, PagedResponse } from '@/lib/types';

export function useEquipos(filters: EquipoFilters) {
  return useQuery({
    queryKey: ['equipos', filters],
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Equipo>>('/api/v1/equipos', {
        params: {
          nombre: filters.nombre || undefined,
          estado: filters.estado || undefined,
          categoria: filters.categoria || undefined,
          page: filters.page ?? 0,
          size: filters.size ?? 9,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useEquipo(id: number | undefined) {
  return useQuery({
    queryKey: ['equipo', id],
    enabled: id !== undefined,
    queryFn: async () => {
      const { data } = await api.get<Equipo>(`/api/v1/equipos/${id}`);
      return data;
    },
  });
}
