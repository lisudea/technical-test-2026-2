package co.edu.udea.lis.lisource.user.infrastructure;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

import co.edu.udea.lis.lisource.user.api.AdminDtos.AdminUser;
import co.edu.udea.lis.lisource.user.api.AdminDtos.RoleItem;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AdminUserRepository {
    private static final String FILTER = """
            where (:search is null or lower(u.correo) like :pattern or lower(u.nombres || ' ' || u.apellidos) like :pattern)
              and (:status is null or eu.codigo=:status)
              and (:role is null or exists (
                select 1 from tbl_usuario_rol urf join tbl_rol rf on rf.id_rol=urf.id_rol
                join tbl_estado_registro erf on erf.id_estado_registro=urf.id_estado_registro and erf.codigo='ACTIVO'
                join tbl_estado_registro errf on errf.id_estado_registro=rf.id_estado_registro and errf.codigo='ACTIVO'
                where urf.id_usuario=u.id_usuario and rf.codigo=:role))
            """;
    private final JdbcClient jdbc;
    private final Clock clock;

    public AdminUserRepository(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public Page list(int page, int size, String search, String status, String role) {
        String normalizedSearch = blankToNull(search == null ? null : search.toLowerCase());
        String normalizedStatus = upperOrNull(status);
        String normalizedRole = upperOrNull(role);
        String select = """
                select u.id_usuario,u.correo,u.nombres,u.apellidos,eu.codigo estado_codigo,
                       i.codigo idioma_codigo,u.fecha_creacion,u.ultimo_acceso,
                       coalesce(string_agg(r.codigo,',' order by r.codigo) filter (where era.codigo='ACTIVO' and err.codigo='ACTIVO'),'') roles
                from tbl_usuario u
                join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario
                left join tbl_idioma i on i.id_idioma=u.id_idioma
                left join tbl_usuario_rol ur on ur.id_usuario=u.id_usuario
                left join tbl_rol r on r.id_rol=ur.id_rol
                left join tbl_estado_registro era on era.id_estado_registro=ur.id_estado_registro
                left join tbl_estado_registro err on err.id_estado_registro=r.id_estado_registro
                """ + FILTER + """
                group by u.id_usuario,u.correo,u.nombres,u.apellidos,eu.codigo,i.codigo,u.fecha_creacion,u.ultimo_acceso
                order by u.id_usuario
                limit :limit offset :offset
                """;
        List<AdminUser> items = params(jdbc.sql(select), normalizedSearch, normalizedStatus, normalizedRole)
                .param("limit", size).param("offset", (page - 1) * size)
                .query((rs, row) -> map(rs)).list();
        long total = params(jdbc.sql("select count(*) from tbl_usuario u join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario " + FILTER),
                normalizedSearch, normalizedStatus, normalizedRole).query(Long.class).single();
        return new Page(items, total);
    }

    public Optional<AdminUser> find(long id) {
        return jdbc.sql("""
                select u.id_usuario,u.correo,u.nombres,u.apellidos,eu.codigo estado_codigo,
                       i.codigo idioma_codigo,u.fecha_creacion,u.ultimo_acceso,
                       coalesce(string_agg(r.codigo,',' order by r.codigo) filter (where era.codigo='ACTIVO' and err.codigo='ACTIVO'),'') roles
                from tbl_usuario u join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario
                left join tbl_idioma i on i.id_idioma=u.id_idioma
                left join tbl_usuario_rol ur on ur.id_usuario=u.id_usuario
                left join tbl_rol r on r.id_rol=ur.id_rol
                left join tbl_estado_registro era on era.id_estado_registro=ur.id_estado_registro
                left join tbl_estado_registro err on err.id_estado_registro=r.id_estado_registro
                where u.id_usuario=:id
                group by u.id_usuario,u.correo,u.nombres,u.apellidos,eu.codigo,i.codigo,u.fecha_creacion,u.ultimo_acceso
                """).param("id", id).query((rs, row) -> map(rs)).optional();
    }

    public List<RoleItem> roles() {
        return jdbc.sql("""
                select r.id_rol,r.codigo,r.nombre,r.descripcion,er.codigo='ACTIVO'
                from tbl_rol r join tbl_estado_registro er on er.id_estado_registro=r.id_estado_registro
                order by r.id_rol
                """).query((rs, row) -> new RoleItem(rs.getInt(1), rs.getString(2), rs.getString(3),
                        rs.getString(4), rs.getBoolean(5))).list();
    }

    public boolean roleExists(String code) {
        return jdbc.sql("select exists(select 1 from tbl_rol where codigo=:code)")
                .param("code", code).query(Boolean.class).single();
    }

    public boolean activeAssignment(long userId, String role) {
        return jdbc.sql("""
                select exists(select 1 from tbl_usuario_rol ur join tbl_rol r on r.id_rol=ur.id_rol
                join tbl_estado_registro er on er.id_estado_registro=ur.id_estado_registro
                where ur.id_usuario=:userId and r.codigo=:role and er.codigo='ACTIVO')
                """).param("userId", userId).param("role", role).query(Boolean.class).single();
    }

    public void lockAdminRole() {
        jdbc.sql("select id_rol from tbl_rol where codigo='ADMINISTRADOR' for update")
                .query(Integer.class).optional();
    }

    public long activeAdministrators() {
        return jdbc.sql("""
                select count(distinct u.id_usuario) from tbl_usuario u
                join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario and eu.codigo='ACTIVO'
                join tbl_usuario_rol ur on ur.id_usuario=u.id_usuario
                join tbl_rol r on r.id_rol=ur.id_rol and r.codigo='ADMINISTRADOR'
                join tbl_estado_registro eur on eur.id_estado_registro=ur.id_estado_registro and eur.codigo='ACTIVO'
                join tbl_estado_registro err on err.id_estado_registro=r.id_estado_registro and err.codigo='ACTIVO'
                """).query(Long.class).single();
    }

    public int changeUserStatus(long id, String status) {
        return jdbc.sql("""
                update tbl_usuario set id_estado_usuario=(select id_estado_usuario from tbl_estado_usuario where codigo=:status),
                fecha_actualizacion=:now where id_usuario=:id
                """).param("status", status).param("now", timestamp(Instant.now(clock))).param("id", id).update();
    }

    public void revokeSessions(long userId) {
        jdbc.sql("update tbl_sesion set fecha_revocacion=coalesce(fecha_revocacion,:now) where id_usuario=:id and fecha_revocacion is null")
                .param("now", timestamp(Instant.now(clock))).param("id", userId).update();
    }

    public void setAssignment(long userId, String role, boolean active) {
        jdbc.sql("""
                insert into tbl_usuario_rol(id_usuario,id_rol,id_estado_registro,fecha_asignacion,fecha_actualizacion)
                select :userId,r.id_rol,er.id_estado_registro,:now,:now from tbl_rol r
                join tbl_estado_registro er on er.codigo=:status where r.codigo=:role
                on conflict(id_usuario,id_rol) do update set id_estado_registro=excluded.id_estado_registro,
                fecha_actualizacion=excluded.fecha_actualizacion
                """).param("userId", userId).param("role", role)
                .param("status", active ? "ACTIVO" : "INACTIVO")
                .param("now", timestamp(Instant.now(clock))).update();
    }

    public void setRoleStatus(String role, String status) {
        jdbc.sql("""
                update tbl_rol set id_estado_registro=(select id_estado_registro from tbl_estado_registro where codigo=:status)
                where codigo=:role
                """).param("status", status).param("role", role).update();
    }

    private JdbcClient.StatementSpec params(JdbcClient.StatementSpec spec, String search, String status, String role) {
        return spec.param("search", search, java.sql.Types.VARCHAR)
                .param("pattern", search == null ? null : "%" + search + "%", java.sql.Types.VARCHAR)
                .param("status", status, java.sql.Types.VARCHAR).param("role", role, java.sql.Types.VARCHAR);
    }

    private AdminUser map(java.sql.ResultSet rs) throws java.sql.SQLException {
        String roles = rs.getString("roles");
        return new AdminUser(rs.getLong("id_usuario"), rs.getString("correo"), rs.getString("nombres"),
                rs.getString("apellidos"), rs.getString("estado_codigo"), rs.getString("idioma_codigo"),
                roles == null || roles.isBlank() ? List.of() : Arrays.asList(roles.split(",")),
                rs.getTimestamp("fecha_creacion").toInstant(),
                rs.getTimestamp("ultimo_acceso") == null ? null : rs.getTimestamp("ultimo_acceso").toInstant());
    }

    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String upperOrNull(String value) {
        String normalized = blankToNull(value);
        return normalized == null ? null : normalized.toUpperCase(java.util.Locale.ROOT);
    }

    public record Page(List<AdminUser> items, long total) {}
}
