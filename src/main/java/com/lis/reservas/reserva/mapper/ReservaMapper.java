package com.lis.reservas.reserva.mapper;

import com.lis.reservas.reserva.dto.ReservaResponse;
import com.lis.reservas.reserva.entity.Reserva;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper between {@link Reserva} and its response DTO.
 *
 * <p>The {@code equipo} and {@code usuario} associations are flattened into
 * {@code equipoNombre}, {@code idEquipo}, {@code usuarioNombre},
 * {@code idUsuario} and {@code correoUsuario}. Reservation creation is
 * assembled by {@code ReservaService} (it resolves equipo/usuario
 * entities), so there is no create-request {@code toEntity} here.
 */
@Mapper(componentModel = "spring")
public interface ReservaMapper {

    @Mapping(target = "equipoNombre", source = "equipo.nombre")
    @Mapping(target = "idEquipo", source = "equipo.idEquipo")
    @Mapping(target = "usuarioNombre", source = "usuario.nombre")
    @Mapping(target = "idUsuario", source = "usuario.idUsuario")
    @Mapping(target = "correoUsuario", source = "usuario.correo")
    @Mapping(target = "entregadoPorNombre", source = "entregadoPor.nombre")
    @Mapping(target = "recibidoPorNombre", source = "recibidoPor.nombre")
    ReservaResponse toResponse(Reserva reserva);

    List<ReservaResponse> toResponseList(List<Reserva> reservas);
}