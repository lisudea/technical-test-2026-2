package com.udea.lis.controller;

import com.udea.lis.dto.request.CreateEquipmentRequest;
import com.udea.lis.dto.request.UpdateEquipmentRequest;
import com.udea.lis.dto.response.EquipmentResponse;
import com.udea.lis.entity.EquipmentCategory;
import com.udea.lis.entity.EquipmentStatus;
import com.udea.lis.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipment", description = "Equipment management endpoints")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @PostMapping
    @Operation(summary = "Create a new equipment")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Equipment created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Duplicate serial number or MAC address",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<EquipmentResponse> create(
            @Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentResponse response = equipmentService.createEquipment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all equipment with optional filters and pagination")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated list of equipment")
    })
    public ResponseEntity<Page<EquipmentResponse>> getAll(
            @Parameter(description = "Filter by category")
            @RequestParam(required = false) EquipmentCategory category,
            @Parameter(description = "Filter by status")
            @RequestParam(required = false) EquipmentStatus status,
            @Parameter(description = "Pagination and sorting parameters")
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<EquipmentResponse> responses = equipmentService.getAllEquipment(category, status, pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Equipment found"),
            @ApiResponse(responseCode = "404", description = "Equipment not found",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<EquipmentResponse> getById(@PathVariable Long id) {
        EquipmentResponse response = equipmentService.getEquipment(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing equipment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Equipment updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Equipment not found",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Duplicate serial number or MAC address",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<EquipmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEquipmentRequest request) {
        EquipmentResponse response = equipmentService.updateEquipment(id, request);
        return ResponseEntity.ok(response);
    }
}
