package com.lis.reservas.sancion.mapper;

import com.lis.reservas.sancion.dto.SancionResponse;
import com.lis.reservas.sancion.entity.Sancion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper between {@link Sancion} and its response DTO.
 *
 * <p>The usuario / creadaPor / levantadaPor / reserva associations are
 * flattened so clients never receive nested entity graphs. {@code vigente}
 * is filled from {@link Sancion#estaVigente()} rather than left to the
 * client to re-derive from the raw dates.
 *
 * <p>Sanction creation is assembled by the service (it resolves the target
 * user and the acting admin), so there is no {@code toEntity} here.
 */
@Mapper(componentModel = "spring")
public interface SancionMapper {

    @Mapping(target = "idUsuario", source = "usuario.idUsuario")
    @Mapping(target = "usuarioNombre", source = "usuario.nombre")
    @Mapping(target = "correoUsuario", source = "usuario.correo")
    @Mapping(target = "idReserva", source = "reserva.idReserva")
    @Mapping(target = "creadaPorNombre", source = "creadaPor.nombre")
    @Mapping(target = "levantadaPorNombre", source = "levantadaPor.nombre")
    @Mapping(target = "vigente", expression = "java(sancion.estaVigente())")
    SancionResponse toResponse(Sancion sancion);

    List<SancionResponse> toResponseList(List<Sancion> sanciones);
}
