package com.udea.labreservas.controller;

import com.udea.labreservas.dto.CreateEquipmentDTO;
import com.udea.labreservas.dto.EquipmentDTO;
import com.udea.labreservas.dto.UpdateEquipmentDTO;
import com.udea.labreservas.entity.EquipmentStatus;
import com.udea.labreservas.service.EquipmentService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipos", description = "Gestion de equipos de laboratorio (solo administrador puede modificar)")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @Operation(summary = "Listar equipos con paginacion y filtros por categoria y estado")
    @GetMapping
    public PagedModel<EntityModel<EquipmentDTO>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("equipmentId").ascending());
        EquipmentStatus statusEnum = parseStatus(status);

        var equipmentPage = equipmentService.findAll(categoryId, statusEnum, pageable);

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                equipmentPage.getSize(),
                equipmentPage.getNumber(),
                equipmentPage.getTotalElements(),
                equipmentPage.getTotalPages());

        Link selfLink = linkTo(methodOn(EquipmentController.class)
                .listAll(page, size, categoryId, status)).withSelfRel();

        return PagedModel.of(equipmentPage.stream().map(this::toModel).toList(), metadata, selfLink);
    }

    @Operation(summary = "Consultar un equipo por id")
    @GetMapping("/{id}")
    public EntityModel<EquipmentDTO> findById(@PathVariable Integer id) {
        return toModel(equipmentService.findById(id));
    }

    @Operation(summary = "Registrar equipo (solo administrador)")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @PostMapping
    public ResponseEntity<EntityModel<EquipmentDTO>> create(@Valid @RequestBody CreateEquipmentDTO dto) {
        EquipmentDTO created = equipmentService.create(dto);
        Link selfLink = linkTo(methodOn(EquipmentController.class).findById(created.equipmentId())).withSelfRel();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EntityModel.of(created, selfLink));
    }

    @Operation(summary = "Actualizar equipo por id (solo administrador)")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<EquipmentDTO>> update(@PathVariable Integer id,
                                                             @Valid @RequestBody UpdateEquipmentDTO dto) {
        EquipmentDTO updated = equipmentService.update(id, dto);
        Link link = linkTo(methodOn(EquipmentController.class).findById(id)).withSelfRel();
        return ResponseEntity.ok(EntityModel.of(updated, link));
    }

    @Operation(summary = "Eliminar equipo por id (solo administrador)")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        equipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private EntityModel<EquipmentDTO> toModel(EquipmentDTO dto) {
        Link self = linkTo(methodOn(EquipmentController.class).findById(dto.equipmentId())).withSelfRel();
        Link collection = linkTo(methodOn(EquipmentController.class)
                .listAll(0, 10, null, null)).withRel("equipments");
        return EntityModel.of(dto, self, collection);
    }

    private EquipmentStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return EquipmentStatus.fromDbValue(raw);
        } catch (IllegalArgumentException e) {
            throw new com.udea.labreservas.exception.InvalidRequestException(
                    "Estado invalido. Valores permitidos: Disponible, Reservado, En prestamo, En mantenimiento");
        }
    }
}