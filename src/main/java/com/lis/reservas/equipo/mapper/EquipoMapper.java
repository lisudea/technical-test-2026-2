package com.lis.reservas.equipo.mapper;

import com.lis.reservas.equipo.dto.EquipoCreateRequest;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.dto.EquipoUpdateRequest;
import com.lis.reservas.equipo.entity.Equipo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

/**
 * MapStruct mapper between {@link Equipo} and its DTOs.
 *
 * <p>The {@code categoria} association is NOT mapped here: requests carry an
 * {@code idCategoria} (Integer) which the service resolves to a managed
 * {@link com.lis.reservas.categoria.entity.Categoria} entity. Response
 * mapping flattens the association to {@code idCategoria} +
 * {@code categoriaNombre}.
 *
 * <p>{@code componentModel = "spring"} makes the generated implementation a
 * Spring bean injectable into services.
 */
@Mapper(componentModel = "spring")
public interface EquipoMapper {

    @Mapping(target = "categoriaNombre", source = "categoria.nombre")
    @Mapping(target = "idCategoria", source = "categoria.idCategoria")
    EquipoResponse toResponse(Equipo equipo);

    List<EquipoResponse> toResponseList(List<Equipo> equipos);

    @Mapping(target = "categoria", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "idEquipo", ignore = true)
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    Equipo toEntity(EquipoCreateRequest request);

    @Mapping(target = "categoria", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "idEquipo", ignore = true)
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    void updateEntity(EquipoUpdateRequest request, @MappingTarget Equipo equipo);
}