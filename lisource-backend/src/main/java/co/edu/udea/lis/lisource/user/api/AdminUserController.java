package co.edu.udea.lis.lisource.user.api;

import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import co.edu.udea.lis.lisource.shared.web.PagedResponse;
import co.edu.udea.lis.lisource.user.api.AdminDtos.*;
import co.edu.udea.lis.lisource.user.application.AdminUserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminUserController {
    private final AdminUserService service;
    public AdminUserController(AdminUserService service) { this.service = service; }

    @GetMapping("/users")
    public PagedResponse<AdminUser> users(@RequestParam(required=false) Integer page,
                                          @RequestParam(required=false) Integer pageSize,
                                          @RequestParam(required=false) String search,
                                          @RequestParam(required=false) String status,
                                          @RequestParam(required=false) String role) {
        return service.list(page, pageSize, search, status, role);
    }

    @GetMapping("/users/{id}")
    public AdminUser user(@PathVariable long id) { return service.get(id); }

    @PatchMapping("/users/{id}/status")
    public AdminUser status(@PathVariable long id, @Valid @RequestBody StatusChange input) {
        return service.changeStatus(id, input.status(), SecurityPrincipal.userId());
    }

    @PutMapping("/users/{id}/roles/{role}")
    public AdminUser role(@PathVariable long id, @PathVariable String role,
                          @Valid @RequestBody RoleAssignment input) {
        return service.assignRole(id, role, input.active(), SecurityPrincipal.userId());
    }

    @GetMapping("/roles")
    public List<RoleItem> roles() { return service.roles(); }

    @PatchMapping("/roles/{role}/status")
    public List<RoleItem> roleStatus(@PathVariable String role, @Valid @RequestBody StatusChange input) {
        return service.changeRoleStatus(role, input.status(), SecurityPrincipal.userId());
    }
}
