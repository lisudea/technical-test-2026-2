package com.lis.reservas.usuario.mapper;

import com.lis.reservas.usuario.dto.UsuarioResponse;
import com.lis.reservas.usuario.entity.Rol;
import com.lis.reservas.usuario.entity.Usuario;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the generated {@link UsuarioMapper} implementation.
 */
class UsuarioMapperTest {

    private final UsuarioMapper mapper = new UsuarioMapperImpl();

    @Test
    void toResponseMapsAllFields() {
        Usuario usuario = Usuario.builder()
                .idUsuario(11).nombre("Maria Gomez").correo("maria@udea.edu.co")
                .rol(Rol.ADMIN).build();

        UsuarioResponse response = mapper.toResponse(usuario);

        assertThat(response.idUsuario()).isEqualTo(11);
        assertThat(response.nombre()).isEqualTo("Maria Gomez");
        assertThat(response.correo()).isEqualTo("maria@udea.edu.co");
        assertThat(response.rol()).isEqualTo(Rol.ADMIN);
    }

    @Test
    void toResponseListMapsAllElements() {
        List<Usuario> usuarios = List.of(
                Usuario.builder().idUsuario(1).nombre("A").correo("a@udea.edu.co").build(),
                Usuario.builder().idUsuario(2).nombre("B").correo("b@udea.edu.co").build());

        List<UsuarioResponse> responses = mapper.toResponseList(usuarios);

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(UsuarioResponse::correo).containsExactly("a@udea.edu.co", "b@udea.edu.co");
    }
}