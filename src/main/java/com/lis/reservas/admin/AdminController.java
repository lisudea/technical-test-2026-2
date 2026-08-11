package com.lis.reservas.admin;

import com.lis.reservas.admin.dto.CambiarRolRequest;
import com.lis.reservas.admin.dto.ResumenAdminResponse;
import com.lis.reservas.admin.service.AdminService;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.usuario.dto.UsuarioResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the {@code /api/v1/admin} surface.
 *
 * <p>The whole prefix is ADMIN-only, enforced by a single matcher in
 * {@code SecurityConfig} rather than annotation-by-annotation — one rule that
 * cannot be forgotten when a new endpoint is added here.
 *
 * <p>Equipment and category CRUD deliberately do NOT live under this prefix.
 * They keep their canonical {@code /api/v1/equipos} paths and are simply
 * ADMIN-gated by method, so there is exactly one URL per resource and the
 * public catalog and the admin catalog can never drift apart.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /**
     * Paginated user listing with optional role and free-text filters.
     */
    @Operation(summary = "Listar usuarios con filtros (ADMIN)")
    @GetMapping("/usuarios")
    public PagedResponse<UsuarioResponse> listarUsuarios(
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) String buscar,
            Pageable pageable) {
        return adminService.listarUsuarios(rol, buscar, pageable);
    }

    /**
     * Assign a role to a user.
     */
    @Operation(summary = "Cambiar el rol de un usuario (ADMIN)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rol actualizado"),
            @ApiResponse(responseCode = "400",
                    description = "Auto-degradacion, o intento de dejar el sistema sin ADMIN"),
            @ApiResponse(responseCode = "403", description = "Requiere rol ADMIN"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PatchMapping("/usuarios/{id}/rol")
    public UsuarioResponse cambiarRol(@PathVariable Integer id,
                                      @Valid @RequestBody CambiarRolRequest request) {
        return adminService.cambiarRol(id, request);
    }

    /**
     * Cross-domain snapshot: catalog, bookings, loans, sanctions and people.
     */
    @Operation(summary = "Resumen operativo del laboratorio (ADMIN)")
    @GetMapping("/resumen")
    public ResumenAdminResponse resumen() {
        return adminService.resumen();
    }
}
