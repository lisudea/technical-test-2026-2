import { equipment, topEquipmentRanking } from "@/services/mocks/data";
import { delay } from "@/services/mocks/latency";
import { apiRequest } from "@/services/http-client";
import type { DashboardStatsDto, TopEquipmentDto } from "@/types";

export interface StatisticsService {
  dashboard(): Promise<DashboardStatsDto>;
  topEquipment(): Promise<TopEquipmentDto[]>;
}

export const MockStatisticsService: StatisticsService = {
  async dashboard() {
    const count = (status: string) =>
      equipment.filter((item) => item.visualStatus === status).length;
    return delay(
      {
        total: equipment.length,
        available: count("AVAILABLE"),
        reserved: count("RESERVED"),
        maintenance: count("MAINTENANCE"),
      },
      400,
    );
  },
  async topEquipment() {
    return delay(topEquipmentRanking, 450);
  },
};

export const ApiStatisticsService: StatisticsService = {
  dashboard: () => apiRequest<DashboardStatsDto>("/dashboard/summary"),
  topEquipment: () => apiRequest<TopEquipmentDto[]>("/statistics/top-equipment"),
};
