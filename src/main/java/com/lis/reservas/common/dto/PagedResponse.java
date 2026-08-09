package com.lis.reservas.common.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic pagination envelope returned by every list endpoint. Mirrors the
 * fields the spec requires: {@code content}, {@code totalElements},
 * {@code totalPages}, {@code number} (current page) and {@code size}.
 *
 * <p>Use {@link #from(Page)} to build one from a Spring Data {@link Page}.
 *
 * @param <T> the element type carried by the page
 */
public record PagedResponse<T>(List<T> content, long totalElements, int totalPages, int number, int size) {

    /**
     * Build a {@link PagedResponse} from a Spring Data {@link Page}.
     */
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }
}