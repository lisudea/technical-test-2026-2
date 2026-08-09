package com.lis.reservas.usuario.mapper;

import com.lis.reservas.usuario.dto.UsuarioResponse;
import com.lis.reservas.usuario.entity.Usuario;
import org.mapstruct.Mapper;

import java.util.List;

/**
 * MapStruct mapper between {@link Usuario} and its response DTO.
 */
@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    UsuarioResponse toResponse(Usuario usuario);

    List<UsuarioResponse> toResponseList(List<Usuario> usuarios);
}