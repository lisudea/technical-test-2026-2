package com.lis.reservas.common.dto;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link PagedResponse}. Pure data transform — no mocks.
 */
class PagedResponseTest {

    @Test
    void fromPageMapsAllFieldsForMultiPageResult() {
        var page = new PageImpl<>(List.of("a", "b", "c"), PageRequest.of(1, 3), 10);

        var response = PagedResponse.from(page);

        assertThat(response.content()).containsExactly("a", "b", "c");
        assertThat(response.totalElements()).isEqualTo(10);
        assertThat(response.totalPages()).isEqualTo(4); // ceil(10 / 3)
        assertThat(response.number()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(3);
    }

    @Test
    void fromPageMapsSingleFullPage() {
        var page = new PageImpl<>(List.of("x", "y", "z", "w", "k"), PageRequest.of(0, 5), 5);

        var response = PagedResponse.from(page);

        assertThat(response.content()).hasSize(5);
        assertThat(response.totalElements()).isEqualTo(5);
        assertThat(response.totalPages()).isEqualTo(1);
        assertThat(response.number()).isZero();
        assertThat(response.size()).isEqualTo(5);
    }

    @Test
    void fromPagePreservesElementType() {
        record Item(int n) {}
        var page = new PageImpl<>(List.of(new Item(1), new Item(2)), PageRequest.of(0, 10), 2);

        PagedResponse<Item> response = PagedResponse.from(page);

        assertThat(response.content()).extracting(Item::n).containsExactly(1, 2);
    }
}