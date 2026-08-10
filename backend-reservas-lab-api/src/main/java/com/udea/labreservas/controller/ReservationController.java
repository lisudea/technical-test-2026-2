package com.udea.labreservas.controller;

import com.udea.labreservas.dto.CreateReservationDTO;
import com.udea.labreservas.dto.ReservationDTO;
import com.udea.labreservas.security.CurrentUser;
import com.udea.labreservas.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservas", description = "Gestion de reservas de equipos con regla de no traslape de horario")
public class ReservationController {

    private final ReservationService reservationService;

    @Operation(summary = "Crear una reserva",
            description = "Rechaza con 409 si el equipo ya tiene una reserva que se traslapa con el horario solicitado")
    @PostMapping
    public ResponseEntity<EntityModel<ReservationDTO>> create(@Valid @RequestBody CreateReservationDTO dto) {
        ReservationDTO created = reservationService.create(CurrentUser.getEmail(), dto);
        Link self = linkTo(methodOn(ReservationController.class).findById(created.reservationId())).withSelfRel();
        return ResponseEntity.status(HttpStatus.CREATED).body(EntityModel.of(created, self));
    }

    @Operation(summary = "Listar reservas del usuario autenticado (paginado)")
    @GetMapping
    public PagedModel<EntityModel<ReservationDTO>> myReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").ascending());
        var reservations = reservationService.findMyReservations(CurrentUser.getEmail(), pageable);

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                reservations.getSize(),
                reservations.getNumber(),
                reservations.getTotalElements(),
                reservations.getTotalPages());

        Link link = linkTo(methodOn(ReservationController.class).myReservations(page, size)).withSelfRel();
        return PagedModel.of(reservations.stream().map(this::toModel).toList(), metadata, link);
    }

    @Operation(summary = "Listar todas las reservas (paginado)",
        description = "Solo un usuario administrador puede ver todas las reservas activas"
    )
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @GetMapping("/all")
    public PagedModel<EntityModel<ReservationDTO>> allReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").ascending());
        var reservations = reservationService.findAll(pageable);

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                reservations.getSize(),
                reservations.getNumber(),
                reservations.getTotalElements(),
                reservations.getTotalPages());

        Link link = linkTo(methodOn(ReservationController.class).allReservations(page, size)).withSelfRel();
        return PagedModel.of(reservations.stream().map(this::toModel).toList(), metadata, link);
    }

    @Operation(summary = "Consultar una reserva por id")
    @GetMapping("/{id}")
    public EntityModel<ReservationDTO> findById(@PathVariable Integer id) {
        return toModel(reservationService.findById(CurrentUser.getEmail(), id));
    }

    @Operation(summary = "Cancelar una reserva por id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Integer id) {
        reservationService.cancel(CurrentUser.getEmail(), id);
        return ResponseEntity.noContent().build();
    }

    private EntityModel<ReservationDTO> toModel(ReservationDTO dto) {
        Link self = linkTo(methodOn(ReservationController.class).findById(dto.reservationId())).withSelfRel();
        return EntityModel.of(dto, self);
    }
}