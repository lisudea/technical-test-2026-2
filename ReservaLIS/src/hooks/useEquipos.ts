import { useState, useEffect, useCallback } from "react";
import { listEquipos } from "@/api/equipos";
import { listReservas } from "@/api/reservas";
import type { EquipoConEstado, EquipoResponseDTO, EstadoFisico } from "@/api/types";

function deriveStatus(
  equipo: EquipoResponseDTO,
  activeReservas: { equipoId: number; inicio: Date; fin: Date }[],
  now: Date,
): EquipoConEstado["statusUI"] {
  if (equipo.estadoFisico === "MANTENIMIENTO") return "mantenimiento";
  if (equipo.estadoFisico === "DE_BAJA") return "baja";
  // DISPONIBLE — check if a current active reservation covers right now
  const currentlyReserved = activeReservas.some(
    (r) => r.equipoId === equipo.id && r.inicio <= now && r.fin >= now,
  );
  return currentlyReserved ? "reservado" : "disponible";
}

export function useEquipos() {
  const [equipos, setEquipos] = useState<EquipoConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [equiposPage, reservasPage] = await Promise.all([
        listEquipos({ size: 200 }),
        listReservas({ estadoReserva: "ACTIVA", size: 500 }),
      ]);

      const now = new Date();
      const activeSlots = reservasPage.content.map((r) => ({
        equipoId: r.equipo.id,
        inicio: new Date(r.fechaHoraInicio),
        fin: new Date(r.fechaHoraFin),
      }));

      const derived: EquipoConEstado[] = equiposPage.content.map((e) => ({
        ...e,
        statusUI: deriveStatus(e, activeSlots, now),
      }));
      setEquipos(derived);
    } catch (e) {
      setError("No se pudo cargar el inventario. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { equipos, loading, error, refetch: load };
}

// Mapping from backend EstadoFisico to the frontend EquipoStatus
// (used in admin contexts where "reservado" is not relevant).
export function estadoFisicoToStatusUI(
  ef: EstadoFisico,
): Exclude<EquipoConEstado["statusUI"], "reservado"> {
  if (ef === "MANTENIMIENTO") return "mantenimiento";
  if (ef === "DE_BAJA") return "baja";
  return "disponible";
}
