package co.edu.udea.lis.lisource.shared.web;

import java.util.List;

public record PagedResponse<T>(List<T> items, int page, int pageSize, long totalItems, int totalPages) {
    public static <T> PagedResponse<T> of(List<T> items, int page, int pageSize, long totalItems) {
        int pages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / pageSize);
        return new PagedResponse<>(items, page, pageSize, totalItems, pages);
    }
}

