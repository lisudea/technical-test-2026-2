import { useState, useEffect, useCallback, useRef } from "react";
import { listReservas, cancelarReserva, adminDeleteReserva } from "@/api/reservas";
import { ApiError } from "@/api/client";
import type { ReservaResponseDTO } from "@/api/types";

const POLL_INTERVAL_MS = 30_000;

export function useReservas(poll = false) {
  const [items, setItems] = useState<ReservaResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await listReservas({ size: 200 });
      setItems(page.content);
      setLastFetched(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pollRef = useRef(poll);
  pollRef.current = poll;
  useEffect(() => {
    if (!poll) return;
    const id = setInterval(() => {
      if (pollRef.current) load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll, load]);

  // Returns undefined on success, or an error message string on failure.
  async function cancelar(id: number, correo: string): Promise<string | undefined> {
    try {
      await cancelarReserva(id, correo);
      await load();
      return undefined;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403)
          return "El correo no coincide con el registrado en la reserva.";
        if (e.status === 409) return "Esta reserva ya fue cancelada.";
        if (e.status === 404) return "La reserva no existe.";
        return e.message;
      }
      return "Ocurrió un error inesperado. Inténtalo de nuevo.";
    }
  }

  async function eliminar(id: number): Promise<string | undefined> {
    try {
      await adminDeleteReserva(id);
      await load();
      return undefined;
    } catch (e) {
      if (e instanceof ApiError) return e.message;
      return "Ocurrió un error inesperado.";
    }
  }

  return { items, loading, lastFetched, refetch: load, cancelar, eliminar };
}
