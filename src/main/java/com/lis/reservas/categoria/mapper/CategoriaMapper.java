package com.lis.reservas.categoria.mapper;

import com.lis.reservas.categoria.dto.CategoriaRequest;
import com.lis.reservas.categoria.dto.CategoriaResponse;
import com.lis.reservas.categoria.entity.Categoria;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper between {@link Categoria} and its DTOs.
 */
@Mapper(componentModel = "spring")
public interface CategoriaMapper {

    CategoriaResponse toResponse(Categoria categoria);

    List<CategoriaResponse> toResponseList(List<Categoria> categorias);

    @Mapping(target = "idCategoria", ignore = true)
    Categoria toEntity(CategoriaRequest request);
}