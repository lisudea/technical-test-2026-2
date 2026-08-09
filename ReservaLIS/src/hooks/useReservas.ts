import { useState, useEffect, useCallback, useRef } from "react";
import { reservas as mockReservas, type Reserva } from "@/data/mock";

// In-memory store so both Reservas and Admin see the same data within a session.
// When the real API is connected, replace `mockStore` with actual fetch calls.
let mockStore: Reserva[] = [...mockReservas];

export function resetMockStore() {
  mockStore = [...mockReservas];
}

async function fetchReservas(): Promise<Reserva[]> {
  // TODO: replace with real API call:
  // const res = await fetch('/api/reservas');
  // if (!res.ok) throw new Error('Error al cargar reservas');
  // return res.json();
  return [...mockStore];
}

async function cancelarReserva(id: number): Promise<void> {
  // TODO: replace with real API call:
  // await fetch(`/api/reservas/${id}/cancelar`, { method: 'PATCH' });
  mockStore = mockStore.map((r) => (r.id === id ? { ...r, estado: "cancelada" } : r));
}

async function eliminarReserva(id: number): Promise<void> {
  // TODO: replace with real API call:
  // await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
  mockStore = mockStore.filter((r) => r.id !== id);
}

const POLL_INTERVAL_MS = 30_000;

export function useReservas(poll = false) {
  const [items, setItems] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const data = await fetchReservas();
    setItems(data);
    setLastFetched(new Date());
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Optional polling while the component is mounted
  const pollRef = useRef(poll);
  pollRef.current = poll;
  useEffect(() => {
    if (!poll) return;
    const id = setInterval(() => {
      if (pollRef.current) load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll, load]);

  async function cancelar(id: number) {
    await cancelarReserva(id);
    await load();
  }

  async function eliminar(id: number) {
    await eliminarReserva(id);
    await load();
  }

  return { items, loading, lastFetched, refetch: load, cancelar, eliminar };
}
