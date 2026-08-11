import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  EquipoPayload,
  PagedResponse,
  ResumenAdmin,
  Rol,
  Usuario,
  UsuarioFilters,
} from '@/lib/types';

/** Cross-domain snapshot for the admin dashboard. */
export function useResumenAdmin() {
  return useQuery({
    queryKey: ['admin-resumen'],
    queryFn: async () => {
      const { data } = await api.get<ResumenAdmin>('/api/v1/admin/resumen');
      return data;
    },
    // The numbers move as the loan desk works; a short staleTime keeps the
    // dashboard honest without hammering the endpoint.
    staleTime: 15_000,
  });
}

export function useUsuarios(filters: UsuarioFilters) {
  return useQuery({
    queryKey: ['admin-usuarios', filters],
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<Usuario>>('/api/v1/admin/usuarios', {
        params: {
          rol: filters.rol || undefined,
          buscar: filters.buscar || undefined,
          page: filters.page ?? 0,
          size: filters.size ?? 10,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCambiarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ idUsuario, rol }: { idUsuario: number; rol: Rol }) => {
      const { data } = await api.patch<Usuario>(
        `/api/v1/admin/usuarios/${idUsuario}/rol`,
        { rol }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin-resumen'] });
    },
  });
}

// --- Catalog administration ---------------------------------------------
// These hit the canonical /api/v1/equipos paths, not an /admin mirror: one
// URL per resource means the public catalog and the admin catalog cannot
// drift apart.

export function useCrearEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EquipoPayload) => {
      const { data } = await api.post('/api/v1/equipos', payload);
      return data;
    },
    onSuccess: () => invalidarCatalogo(qc),
  });
}

export function useActualizarEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idEquipo,
      payload,
    }: {
      idEquipo: number;
      payload: EquipoPayload;
    }) => {
      const { data } = await api.put(`/api/v1/equipos/${idEquipo}`, payload);
      return data;
    },
    onSuccess: () => invalidarCatalogo(qc),
  });
}

export function useCambiarEstadoEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ idEquipo, estado }: { idEquipo: number; estado: string }) => {
      const { data } = await api.patch(`/api/v1/equipos/${idEquipo}/estado`, { estado });
      return data;
    },
    onSuccess: () => invalidarCatalogo(qc),
  });
}

/**
 * A catalog write changes what the dashboard, the detail page and the admin
 * summary all show, so all of them are invalidated together rather than
 * leaving one stale view behind.
 */
function invalidarCatalogo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['equipos'] });
  qc.invalidateQueries({ queryKey: ['equipo'] });
  qc.invalidateQueries({ queryKey: ['admin-resumen'] });
}
