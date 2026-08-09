import { categories, locations } from "@/services/mocks/data";
import { delay } from "@/services/mocks/latency";
import { apiRequest } from "@/services/http-client";
import type { CategoryDto, LocationDto } from "@/types";

export interface CategoryService {
  list(): Promise<CategoryDto[]>;
  listLocations(): Promise<LocationDto[]>;
}

export const MockCategoryService: CategoryService = {
  async list() {
    return delay(categories, 250);
  },
  async listLocations() {
    return delay(locations, 250);
  },
};

export const ApiCategoryService: CategoryService = {
  list: () => apiRequest<CategoryDto[]>("/catalogs/categories"),
  listLocations: () => apiRequest<LocationDto[]>("/catalogs/locations"),
};
