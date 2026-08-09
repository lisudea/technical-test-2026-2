import { ApiError } from "@/lib/api-error";
import { occupiedSlots, reservations as seedReservations, equipment } from "@/services/mocks/data";
import { delay } from "@/services/mocks/latency";
import { apiRequest } from "@/services/http-client";
import type { CreateReservationInput, ReservationDto } from "@/types";

export interface ReservationService {
  listMine(): Promise<ReservationDto[]>;
  busySlots(equipmentId: number): Promise<Array<{ startsAt: string; endsAt: string }>>;
  create(input: CreateReservationInput): Promise<ReservationDto>;
  cancel(id: number, reason?: string): Promise<ReservationDto>;
}

const store: ReservationDto[] = seedReservations.map((item) => ({ ...item }));
let nextId = store.length + 1;
let sequence = 200;

/** Intervals are half-open: [start, end). 10-12 and 12-14 do not overlap. */
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function allSlotsFor(equipmentId: number) {
  const fromReservations = store
    .filter(
      (reservation) =>
        reservation.status === "CONFIRMED" &&
        reservation.equipment.some((item) => item.id === equipmentId),
    )
    .map(({ startsAt, endsAt }) => ({ startsAt, endsAt }));
  const external = occupiedSlots
    .filter((slot) => slot.equipmentId === equipmentId)
    .map(({ startsAt, endsAt }) => ({ startsAt, endsAt }));
  return [...external, ...fromReservations].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export const MockReservationService: ReservationService = {
  async listMine() {
    return delay([...store], 500);
  },

  async busySlots(equipmentId) {
    return delay(allSlotsFor(equipmentId), 300);
  },

  async create(input) {
    const conflict = input.equipmentIds.some((equipmentId) =>
      allSlotsFor(equipmentId).some((slot) =>
        overlaps(input.startsAt, input.endsAt, slot.startsAt, slot.endsAt),
      ),
    );
    if (conflict) {
      // Mirrors the HTTP 409 Conflict the REST API will return.
      await delay(null, 500);
      throw new ApiError(409);
    }

    const created: ReservationDto = {
      id: nextId++,
      code: `RSV-${new Date().getFullYear()}-0${sequence++}`,
      equipment: input.equipmentIds.map((id) => {
        const item = equipment.find((e) => e.id === id);
        if (!item) throw new ApiError(404);
        return { id: item.id, name: item.name, inventoryCode: item.inventoryCode };
      }),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      status: "CONFIRMED",
    };
    store.unshift(created);
    return delay(created, 600);
  },

  async cancel(id, reason) {
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) throw new ApiError(404);
    const updated: ReservationDto = {
      ...store[index]!,
      status: "CANCELLED",
      cancellationReason: reason?.trim() || null,
    };
    store[index] = updated;
    return delay(updated, 450);
  },
};

export const ApiReservationService: ReservationService = {
  listMine: () => apiRequest<ReservationDto[]>("/reservations/me"),
  busySlots: (equipmentId) =>
    apiRequest<Array<{ startsAt: string; endsAt: string }>>(`/equipment/${equipmentId}/busy-slots`),
  create: (input) =>
    apiRequest<ReservationDto>("/reservations", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  cancel: (id, reason) =>
    apiRequest<ReservationDto>(`/reservations/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
