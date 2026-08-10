package com.lisudea.equipmentreservation.controller;

import com.lisudea.equipmentreservation.dto.response.CategoryResponse;
import com.lisudea.equipmentreservation.dto.response.OperationalStatusResponse;
import com.lisudea.equipmentreservation.repository.CategoryRepository;
import com.lisudea.equipmentreservation.repository.OperationalStatusRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CategoryRepository categoryRepository;
    private final OperationalStatusRepository operationalStatusRepository;

    public CatalogController(CategoryRepository categoryRepository, OperationalStatusRepository operationalStatusRepository) {
        this.categoryRepository = categoryRepository;
        this.operationalStatusRepository = operationalStatusRepository;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return categoryRepository.findAll().stream()
                .map(category -> new CategoryResponse(category.getId(), category.getName())).toList();
    }

    @GetMapping("/operational-statuses")
    public List<OperationalStatusResponse> operationalStatuses() {
        return operationalStatusRepository.findAll().stream()
                .map(status -> new OperationalStatusResponse(status.getId(), status.getName())).toList();
    }
}
