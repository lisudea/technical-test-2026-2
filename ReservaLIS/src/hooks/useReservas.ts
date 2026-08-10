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
  // 401 = Google token invalid/expired → caller should prompt re-login.
  // 403 = valid token but wrong person → show ownership error, no re-login.
  async function cancelar(
    id: number,
    googleIdToken: string,
  ): Promise<{ error: string; kind: "auth" | "forbidden" | "other" } | undefined> {
    try {
      await cancelarReserva(id, googleIdToken);
      await load();
      return undefined;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401)
          return { error: "Tu sesión de Google expiró o no es válida. Inicia sesión de nuevo.", kind: "auth" };
        if (e.status === 403)
          return { error: "Esta reserva no te pertenece. Solo quien la creó puede cancelarla.", kind: "forbidden" };
        if (e.status === 409)
          return { error: "Esta reserva ya fue cancelada.", kind: "other" };
        if (e.status === 404)
          return { error: "La reserva no existe.", kind: "other" };
        return { error: e.message, kind: "other" };
      }
      return { error: "Ocurrió un error inesperado. Inténtalo de nuevo.", kind: "other" };
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
