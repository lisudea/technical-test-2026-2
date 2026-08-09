package co.edu.udea.lis.lisource.user.application;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import co.edu.udea.lis.lisource.shared.web.PagedResponse;
import co.edu.udea.lis.lisource.user.api.AdminDtos.AdminUser;
import co.edu.udea.lis.lisource.user.api.AdminDtos.RoleItem;
import co.edu.udea.lis.lisource.user.infrastructure.AdminUserRepository;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {
    private static final Set<String> USER_STATES = Set.of("ACTIVO", "INACTIVO");
    private final AdminUserRepository repository;
    private final AuditPublisher audit;

    public AdminUserService(AdminUserRepository repository, AuditPublisher audit) {
        this.repository = repository;
        this.audit = audit;
    }

    public PagedResponse<AdminUser> list(Integer pageValue, Integer sizeValue, String search, String status, String role) {
        int page = pageValue == null ? 1 : pageValue;
        int size = sizeValue == null ? 20 : sizeValue;
        if (page < 1 || size < 1 || size > 100) throw validation("Pagination must use page >= 1 and pageSize between 1 and 100.");
        if (status != null && !status.isBlank() && !USER_STATES.contains(status.toUpperCase(Locale.ROOT)))
            throw validation("Unknown user status.");
        var result = repository.list(page, size, search, status, role);
        return PagedResponse.of(result.items(), page, size, result.total());
    }

    public AdminUser get(long id) { return required(id); }
    public List<RoleItem> roles() { return repository.roles(); }

    @Transactional
    public AdminUser changeStatus(long id, String requestedStatus, long actorId) {
        String status = requestedStatus.toUpperCase(Locale.ROOT);
        if (!USER_STATES.contains(status)) throw validation("Unknown user status.");
        AdminUser before = required(id);
        repository.lockAdminRole();
        if (status.equals("INACTIVO") && before.roles().contains("ADMINISTRADOR")
                && repository.activeAdministrators() <= 1) throw lastAdmin();
        repository.changeUserStatus(id, status);
        if (status.equals("INACTIVO")) repository.revokeSessions(id);
        AdminUser after = required(id);
        audit.success("ACTUALIZAR_PERFIL", actorId, id, "Administrator changed user status", before, after);
        return after;
    }

    @Transactional
    public AdminUser assignRole(long id, String requestedRole, boolean active, long actorId) {
        AdminUser before = required(id);
        String role = normalizeRole(requestedRole);
        if (!repository.roleExists(role)) throw notFound("Role was not found.");
        repository.lockAdminRole();
        if (!active && role.equals("ADMINISTRADOR") && repository.activeAssignment(id, role)
                && before.status().equals("ACTIVO") && repository.activeAdministrators() <= 1) throw lastAdmin();
        repository.setAssignment(id, role, active);
        AdminUser after = required(id);
        audit.success(active ? (before.roles().contains(role) ? "REACTIVAR_ROL_USUARIO" : "ASIGNAR_ROL")
                        : "DESACTIVAR_ROL_USUARIO", actorId, id,
                active ? "Administrator assigned user role" : "Administrator deactivated user role", before, after);
        return after;
    }

    @Transactional
    public List<RoleItem> changeRoleStatus(String requestedRole, String requestedStatus, long actorId) {
        String role = normalizeRole(requestedRole);
        String status = requestedStatus.toUpperCase(Locale.ROOT);
        if (!USER_STATES.contains(status)) throw validation("Unknown record status.");
        if (!repository.roleExists(role)) throw notFound("Role was not found.");
        repository.lockAdminRole();
        if (role.equals("ADMINISTRADOR") && status.equals("INACTIVO")) throw lastAdmin();
        repository.setRoleStatus(role, status);
        audit.success(status.equals("ACTIVO") ? "REACTIVAR_ROL_USUARIO" : "DESACTIVAR_ROL_USUARIO",
                actorId, null, "Administrator changed role catalog status", null,
                java.util.Map.of("role", role, "status", status));
        return roles();
    }

    private AdminUser required(long id) { return repository.find(id).orElseThrow(() -> notFound("User was not found.")); }
    private String normalizeRole(String role) {
        if (role == null || !role.trim().matches("[A-Za-z0-9_]{1,30}")) throw validation("Invalid role code.");
        return role.trim().toUpperCase(Locale.ROOT);
    }
    private AppException validation(String detail) { return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, detail); }
    private AppException notFound(String detail) { return new AppException(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND, detail); }
    private AppException lastAdmin() { return new AppException(HttpStatus.CONFLICT, ErrorCode.LAST_ADMIN_PROTECTION,
            "The operation would leave the system without an active administrator."); }
}
