import { ApiError } from "@/lib/api-error";
import {
  equipment as seedEquipment,
  categories,
  locations,
  operationalStatusNames,
} from "@/services/mocks/data";
import { delay } from "@/services/mocks/latency";
import { apiRequest } from "@/services/http-client";
import type {
  EquipmentDto,
  EquipmentInput,
  EquipmentQuery,
  OperationalStatusCode,
  Paginated,
  VisualStatus,
} from "@/types";

export interface EquipmentService {
  list(query?: EquipmentQuery): Promise<Paginated<EquipmentDto>>;
  getById(id: number): Promise<EquipmentDto>;
  create(input: EquipmentInput): Promise<EquipmentDto>;
  update(id: number, input: EquipmentInput): Promise<EquipmentDto>;
  changeStatus(id: number, status: OperationalStatusCode): Promise<EquipmentDto>;
  uploadImage(id: number, file: File): Promise<EquipmentDto>;
  deleteImage(id: number): Promise<EquipmentDto>;
}

/** In-memory store standing in for the future REST API. */
const store: EquipmentDto[] = seedEquipment.map((item) => ({ ...item }));
let nextId = store.length + 1;

function visualStatusFor(status: OperationalStatusCode, previous?: VisualStatus): VisualStatus {
  switch (status) {
    case "MANTENIMIENTO":
      return "MAINTENANCE";
    case "FUERA_SERVICIO":
      return "OUT_OF_SERVICE";
    case "RETIRADO":
      return "RETIRED";
    default:
      return previous === "RESERVED" ? "RESERVED" : "AVAILABLE";
  }
}

function matches(item: EquipmentDto, query: EquipmentQuery): boolean {
  const search = query.search?.trim().toLowerCase();
  if (search) {
    const haystack = `${item.name} ${item.inventoryCode}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (query.categoryCode && query.categoryCode !== "ALL") {
    if (item.category.code !== query.categoryCode) return false;
  }
  if (query.visualStatus && query.visualStatus !== "ALL") {
    if (item.visualStatus !== query.visualStatus) return false;
  }
  return true;
}

export const MockEquipmentService: EquipmentService = {
  async list(query = {}) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 8;
    const filtered = store.filter((item) => matches(item, query));
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const items = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    return delay({ items, page: safePage, pageSize, totalItems, totalPages });
  },

  async getById(id) {
    const found = store.find((item) => item.id === id);
    if (!found) throw new ApiError(404);
    return delay(found, 350);
  },

  async create(input) {
    const category = categories.find((c) => c.id === input.categoryId);
    if (!category) throw new ApiError(422);
    const created: EquipmentDto = {
      id: nextId++,
      inventoryCode: input.inventoryCode,
      name: input.name,
      description: input.description ?? null,
      serialNumber: input.serialNumber || null,
      macAddress: input.macAddress || null,
      imageUrl: null,
      category,
      location: locations.find((l) => l.id === input.locationId) ?? null,
      operationalStatus: {
        code: input.operationalStatus,
        name: operationalStatusNames[input.operationalStatus],
      },
      visualStatus: visualStatusFor(input.operationalStatus),
    };
    store.unshift(created);
    return delay(created, 450);
  },

  async update(id, input) {
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) throw new ApiError(404);
    const category = categories.find((c) => c.id === input.categoryId);
    if (!category) throw new ApiError(422);
    const current = store[index]!;
    const updated: EquipmentDto = {
      ...current,
      inventoryCode: input.inventoryCode,
      name: input.name,
      description: input.description ?? null,
      serialNumber: input.serialNumber || null,
      macAddress: input.macAddress || null,
      category,
      location: locations.find((l) => l.id === input.locationId) ?? null,
      operationalStatus: {
        code: input.operationalStatus,
        name: operationalStatusNames[input.operationalStatus],
      },
      visualStatus: visualStatusFor(input.operationalStatus, current.visualStatus),
    };
    store[index] = updated;
    return delay(updated, 450);
  },

  async changeStatus(id, status) {
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) throw new ApiError(404);
    const current = store[index]!;
    const updated: EquipmentDto = {
      ...current,
      operationalStatus: { code: status, name: operationalStatusNames[status] },
      visualStatus: visualStatusFor(status, current.visualStatus),
    };
    store[index] = updated;
    return delay(updated, 350);
  },
  async uploadImage(id, file) {
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) throw new ApiError(404);
    const updated = { ...store[index]!, imageUrl: URL.createObjectURL(file) };
    store[index] = updated;
    return updated;
  },
  async deleteImage(id) {
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) throw new ApiError(404);
    const updated = { ...store[index]!, imageUrl: null };
    store[index] = updated;
    return updated;
  },
};

export const ApiEquipmentService: EquipmentService = {
  async list(query = {}) {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.categoryCode && query.categoryCode !== "ALL")
      params.set("category", query.categoryCode);
    if (query.visualStatus && query.visualStatus !== "ALL")
      params.set("status", query.visualStatus);
    return apiRequest<Paginated<EquipmentDto>>(`/equipment?${params.toString()}`);
  },
  getById: (id) => apiRequest<EquipmentDto>(`/equipment/${id}`),
  create: (input) =>
    apiRequest<EquipmentDto>("/equipment", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id, input) =>
    apiRequest<EquipmentDto>(`/equipment/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  changeStatus: (id, operationalStatus) =>
    apiRequest<EquipmentDto>(`/equipment/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ operationalStatus }),
    }),
  uploadImage: (id, file) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<EquipmentDto>(`/equipment/${id}/image`, { method: "POST", body });
  },
  deleteImage: (id) => apiRequest<EquipmentDto>(`/equipment/${id}/image`, { method: "DELETE" }),
};
