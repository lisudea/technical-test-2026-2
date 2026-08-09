import type { AppLanguage } from "@/i18n/languages";

/**
 * Centralized frontend DTOs for LISource.
 * These types are the contract between UI and services. When the REST API
 * lands, only the services layer changes — not the components.
 */

export type VisualStatus = "AVAILABLE" | "RESERVED" | "MAINTENANCE" | "OUT_OF_SERVICE" | "RETIRED";

export type OperationalStatusCode = "OPERATIVO" | "MANTENIMIENTO" | "FUERA_SERVICIO" | "RETIRADO";

export interface CategoryDto {
  id: number;
  code: string;
  name: string;
}

export interface LocationDto {
  id: number;
  code: string;
  name: string;
}

export interface OperationalStatusDto {
  code: OperationalStatusCode;
  name: string;
}

export interface EquipmentDto {
  id: number;
  inventoryCode: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  macAddress: string | null;
  imageUrl: string | null;
  category: CategoryDto;
  location: LocationDto | null;
  operationalStatus: OperationalStatusDto;
  visualStatus: VisualStatus;
}

export interface EquipmentQuery {
  search?: string | undefined;
  categoryCode?: string | undefined;
  visualStatus?: VisualStatus | "ALL" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ReservationStatus = "CONFIRMED" | "CANCELLED";
export type ReservationVisualStatus = "UPCOMING" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";

export interface ReservationDto {
  id: number;
  code: string;
  /** A reservation may hold several equipments in the final API. */
  equipment: Array<Pick<EquipmentDto, "id" | "name" | "inventoryCode">>;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  status: ReservationStatus;
  cancellationReason?: string | null | undefined;
  visualStatus?: ReservationVisualStatus | undefined;
  createdAt?: string | undefined;
  cancelledAt?: string | null | undefined;
}

export interface CreateReservationInput {
  equipmentIds: number[];
  startsAt: string;
  endsAt: string;
  notes?: string | undefined;
}

export interface EquipmentInput {
  inventoryCode: string;
  name: string;
  description?: string | undefined;
  serialNumber?: string | undefined;
  macAddress?: string | undefined;
  categoryId: number;
  locationId: number | null;
  operationalStatus: OperationalStatusCode;
}

export interface TopEquipmentDto {
  equipmentId: number;
  name: string;
  reservations: number;
}

export interface DashboardStatsDto {
  total: number;
  available: number;
  reserved: number;
  maintenance: number;
  outOfService?: number | undefined;
  retired?: number | undefined;
}

export type UserRole = "USER" | "ADMIN";

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  roles: string[];
  preferredLanguage: AppLanguage;
  languageCode: AppLanguage;
}

export interface AuthResponse {
  accessToken: string | null;
  tokenType: "Bearer" | null;
  expiresIn: number | null;
  user: UserDto | null;
  roleSelectionRequired: boolean;
  availableRoles: string[];
  selectionToken: string | null;
}

export interface AuthenticationResult {
  user: UserDto | null;
  roleSelectionRequired: boolean;
  availableRoles: string[];
  selectionToken: string | null;
}

export interface SessionDto {
  id: number;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  ipAddress: string | null;
  userAgent: string;
  current: boolean;
}

export interface FieldProblem {
  field: string;
  code: string;
  message: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  correlationId?: string;
  fieldErrors?: FieldProblem[];
}
