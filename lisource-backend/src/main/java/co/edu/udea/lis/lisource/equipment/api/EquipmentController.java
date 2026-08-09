package co.edu.udea.lis.lisource.equipment.api;

import co.edu.udea.lis.lisource.equipment.api.EquipmentDtos.*;
import co.edu.udea.lis.lisource.equipment.application.EquipmentService;
import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import co.edu.udea.lis.lisource.shared.web.PagedResponse;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/v1/equipment")
public class EquipmentController {
    private final EquipmentService service;
    public EquipmentController(EquipmentService service) { this.service = service; }

    @GetMapping
    public PagedResponse<EquipmentResponse> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String sort) {
        return service.list(page, pageSize, search, category, status, operationalStatus, sort);
    }

    @GetMapping("/{id}")
    public EquipmentResponse get(@PathVariable long id) { return service.get(id); }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody EquipmentInput input) {
        EquipmentResponse result = service.create(input, SecurityPrincipal.userId());
        return ResponseEntity.created(URI.create("/api/v1/equipment/" + result.id())).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public EquipmentResponse update(@PathVariable long id, @Valid @RequestBody EquipmentInput input) {
        return service.update(id, input, SecurityPrincipal.userId());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public EquipmentResponse changeStatus(@PathVariable long id, @Valid @RequestBody ChangeStatusRequest input) {
        return service.changeStatus(id, input.operationalStatus(), SecurityPrincipal.userId());
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public EquipmentResponse uploadImage(@PathVariable long id, @RequestPart("file") MultipartFile file) {
        return service.replaceImage(id, file, SecurityPrincipal.userId());
    }

    @DeleteMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public EquipmentResponse deleteImage(@PathVariable long id) {
        return service.deleteImage(id, SecurityPrincipal.userId());
    }
}
