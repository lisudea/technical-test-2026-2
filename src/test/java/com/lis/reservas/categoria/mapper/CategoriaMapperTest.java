package com.lis.reservas.categoria.mapper;

import com.lis.reservas.categoria.dto.CategoriaRequest;
import com.lis.reservas.categoria.dto.CategoriaResponse;
import com.lis.reservas.categoria.entity.Categoria;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the generated {@link CategoriaMapper} implementation.
 */
class CategoriaMapperTest {

    private final CategoriaMapper mapper = new CategoriaMapperImpl();

    @Test
    void toResponseMapsAllFields() {
        Categoria categoria = Categoria.builder()
                .idCategoria(3).nombre("Impresión 3D").descripcion("Fabricación aditiva")
                .build();

        CategoriaResponse response = mapper.toResponse(categoria);

        assertThat(response.idCategoria()).isEqualTo(3);
        assertThat(response.nombre()).isEqualTo("Impresión 3D");
        assertThat(response.descripcion()).isEqualTo("Fabricación aditiva");
    }

    @Test
    void toResponseListMapsAllElements() {
        List<Categoria> categorias = List.of(
                Categoria.builder().idCategoria(1).nombre("VR").build(),
                Categoria.builder().idCategoria(2).nombre("Redes").build());

        List<CategoriaResponse> responses = mapper.toResponseList(categorias);

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(CategoriaResponse::nombre).containsExactly("VR", "Redes");
    }

    @Test
    void toEntityIgnoresIdCategoria() {
        var request = new CategoriaRequest("Nueva", "desc");

        Categoria entity = mapper.toEntity(request);

        assertThat(entity.getNombre()).isEqualTo("Nueva");
        assertThat(entity.getDescripcion()).isEqualTo("desc");
        assertThat(entity.getIdCategoria()).isNull();
    }
}