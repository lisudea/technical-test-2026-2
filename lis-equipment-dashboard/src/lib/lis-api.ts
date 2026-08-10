import type { TranslationKey } from "@/i18n/translations";
import { getToken } from "@/lib/auth-context";

export type EquipmentStatus = "available" | "reserved" | "maintenance" | "decommissioned";

export type Equipment = {
  id: string;
  name: string;
  serial: string;
  category: string;
  status: EquipmentStatus;
  requests?: number | undefined;
};

export type ReservationInput = {
  equipmentId: string;
  startAt: string;
  endAt: string;
};

export type Reservation = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userName: string;
  userEmail: string;
  startAt: string;
  endAt: string;
  status: "ACTIVE" | "CANCELLED";
};

export type CategoryStat = { category: string; count: number };

export type CancellationRate = {
  total: number;
  active: number;
  cancelled: number;
  percentage: number;
};

export const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  messageKey: TranslationKey;
  status: number;
  detail?: string | undefined;

  constructor(status: number, detail?: string) {
    super(detail ?? `HTTP ${status}`);
    this.status = status;
    this.detail = detail;
    this.messageKey =
      status === 409
        ? "error.conflict"
        : status === 404
          ? "error.notFound"
          : status === 401 || status === 403
            ? "error.unauthorized"
            : status === 400 || status === 422
              ? "error.validation"
              : status === 0
                ? "error.network"
                : "error.server";
  }
}

const STATUS_MAP: Record<string, EquipmentStatus> = {
  disponible: "available",
  en_mantenimiento: "maintenance",
  dado_de_baja: "decommissioned",
};

function normalizeStatus(value: unknown): EquipmentStatus {
  return STATUS_MAP[String(value ?? "").toLowerCase()] ?? "maintenance";
}

function normalizeEquipment(raw: Record<string, unknown>): Equipment {
  return {
    id: String(raw["id"] ?? "—"),
    name: String(raw["name"] ?? "—"),
    serial: String(raw["macSerialNumber"] ?? "—"),
    category: String(raw["category"] ?? "General"),
    status: normalizeStatus(raw["status"]),
  };
}

function normalizeReservation(raw: Record<string, unknown>): Reservation {
  return {
    id: String(raw["id"]),
    equipmentId: String(raw["equipmentId"]),
    equipmentName: String(raw["equipmentName"] ?? "—"),
    userName: String(raw["userName"] ?? "—"),
    userEmail: String(raw["userEmail"] ?? "—"),
    startAt: String(raw["dateStartTime"]),
    endAt: String(raw["dateEndTime"]),
    status: (raw["status"] as "ACTIVE" | "CANCELLED") ?? "ACTIVE",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0);
  }
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      detail = String(body["message"] ?? body["detail"] ?? body["error"] ?? "") || undefined;
    } catch {
      detail = undefined;
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function fetchAllEquipment(): Promise<Equipment[]> {
  const data = await request<{ content: Record<string, unknown>[] }>(`/equipment?page=0&size=500`);
  return data.content.map(normalizeEquipment);
}

export async function fetchActiveReservations(): Promise<Reservation[]> {
  const data = await request<{ content: Record<string, unknown>[] }>(`/reservation?size=500`);
  return data.content.map(normalizeReservation).filter((r) => r.status === "ACTIVE");
}

export async function fetchReservations(): Promise<Reservation[]> {
  const data = await request<{ content: Record<string, unknown>[] }>(`/reservation?size=500`);
  return data.content.map(normalizeReservation);
}

export async function cancelReservation(id: string): Promise<void> {
  await request<unknown>(`/reservation/${id}/cancellation`, { method: "PATCH" });
}

export async function fetchTopEquipment(): Promise<Equipment[]> {
  const data = await request<Record<string, unknown>[]>("/stats/top-equipment");
  return data.map((raw) => ({
    id: String(raw["equipmentId"]),
    name: String(raw["equipmentName"]),
    serial: "",
    category: String(raw["category"]),
    status: "available",
    requests: Number(raw["reservationCount"] ?? 0),
  }));
}

export async function fetchReservationsByCategory(): Promise<CategoryStat[]> {
  const data = await request<Record<string, unknown>[]>("/stats/reservations-by-category");
  return data.map((raw) => ({
    category: String(raw["category"]),
    count: Number(raw["reservationCount"] ?? 0),
  }));
}

export async function fetchCancellationRate(): Promise<CancellationRate> {
  const raw = await request<Record<string, unknown>>("/stats/cancellation-rate");
  return {
    total: Number(raw["totalReservations"] ?? 0),
    active: Number(raw["activeReservations"] ?? 0),
    cancelled: Number(raw["cancelledReservations"] ?? 0),
    percentage: Number(raw["cancellationRatePercentage"] ?? 0),
  };
}

export async function createReservation(input: ReservationInput): Promise<void> {
  await request<unknown>("/reservation", {
    method: "POST",
    body: JSON.stringify({
      equipmentId: Number(input.equipmentId),
      dateStartTime: input.startAt,
      dateEndTime: input.endAt,
    }),
  });

}

export type EquipmentInput = {
  name: string;
  macSerialNumber: string;
  category: string;
  status: string;
};

export type EquipmentUpdateInput = {
  name: string;
  category: string;
  status: string;
};

export async function createEquipment(input: EquipmentInput): Promise<void> {
  await request<unknown>("/equipment", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateEquipment(id: string, input: EquipmentUpdateInput): Promise<void> {
  await request<unknown>(`/equipment/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function fetchReservationsForEquipment(equipmentId: string): Promise<Reservation[]> {
  const data = await request<{ content: Record<string, unknown>[] }>(
    `/reservation?equipmentId=${equipmentId}&size=200`,
  );
  return data.content.map(normalizeReservation).filter((r) => r.status === "ACTIVE");
}