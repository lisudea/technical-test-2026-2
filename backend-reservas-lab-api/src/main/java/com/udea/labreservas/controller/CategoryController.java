package com.udea.labreservas.controller;

import com.udea.labreservas.dto.CategoryDTO;
import com.udea.labreservas.dto.CreateCategoryDTO;
import com.udea.labreservas.service.EquipmentCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categorias", description = "Categorias de equipos de laboratorio")
public class CategoryController {

    private final EquipmentCategoryService categoryService;

    @Operation(summary = "Listar todas las categorias")
    @GetMapping
    public List<CategoryDTO> listAll() {
        return categoryService.findAll();
    }

    @Operation(summary = "Consultar una categoria por id")
    @GetMapping("/{id}")
    public CategoryDTO findById(@PathVariable Integer id) {
        return categoryService.findById(id);
    }

    @Operation(summary = "Crear una categoria (solo administrador)")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @PostMapping
    public ResponseEntity<CategoryDTO> create(@Valid @RequestBody CreateCategoryDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(dto));
    }
}