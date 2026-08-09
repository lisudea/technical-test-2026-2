import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EquipoTop } from '@/lib/types';

export function useTopEquipos(limit: number) {
  return useQuery({
    queryKey: ['estadisticas-top', limit],
    queryFn: async () => {
      const { data } = await api.get<EquipoTop[]>('/api/v1/estadisticas/equipos-top', {
        params: { limit },
      });
      return data;
    },
  });
}
