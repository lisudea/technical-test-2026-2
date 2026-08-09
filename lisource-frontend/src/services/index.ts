/**
 * Single place where the app chooses its data source.
 * Swapping mocks for the REST API later means changing only this file.
 */
import { ApiAuthService, MockAuthService } from "./auth.service";
import { ApiCategoryService, MockCategoryService } from "./category.service";
import { ApiEquipmentService, MockEquipmentService } from "./equipment.service";
import { ApiReservationService, MockReservationService } from "./reservation.service";
import { ApiStatisticsService, MockStatisticsService } from "./statistics.service";

export const dataMode = import.meta.env.VITE_DATA_MODE === "mock" ? "mock" : "api";
export const equipmentService = dataMode === "mock" ? MockEquipmentService : ApiEquipmentService;
export const categoryService = dataMode === "mock" ? MockCategoryService : ApiCategoryService;
export const reservationService =
  dataMode === "mock" ? MockReservationService : ApiReservationService;
export const statisticsService = dataMode === "mock" ? MockStatisticsService : ApiStatisticsService;
export const authService = dataMode === "mock" ? MockAuthService : ApiAuthService;

export type { EquipmentService } from "./equipment.service";
export type { CategoryService } from "./category.service";
export type { ReservationService } from "./reservation.service";
export type { StatisticsService } from "./statistics.service";
export type { AuthService } from "./auth.service";
