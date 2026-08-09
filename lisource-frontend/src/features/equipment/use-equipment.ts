import { useQuery } from "@tanstack/react-query";

import { categoryService, equipmentService } from "@/services";
import type { EquipmentQuery } from "@/types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => categoryService.listLocations(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEquipmentList(query: EquipmentQuery) {
  return useQuery({
    queryKey: ["equipment", query],
    queryFn: () => equipmentService.list(query),
    placeholderData: (previous) => previous,
  });
}

export function useEquipmentDetail(id: number) {
  return useQuery({
    queryKey: ["equipment", "detail", id],
    queryFn: () => equipmentService.getById(id),
    retry: false,
  });
}
