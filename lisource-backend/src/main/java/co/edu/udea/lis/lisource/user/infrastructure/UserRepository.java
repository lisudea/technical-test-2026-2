package co.edu.udea.lis.lisource.user.infrastructure;

import co.edu.udea.lis.lisource.user.domain.UserAccount;
import java.sql.Types;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

@Repository
public class UserRepository {
    private static final String BASE = """
            select u.id_usuario, u.correo, u.password_hash, u.google_sub, u.nombres, u.apellidos,
                   eu.codigo estado_codigo, i.codigo idioma_codigo
            from tbl_usuario u
            join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario
            left join tbl_idioma i on i.id_idioma=u.id_idioma
            """;
    private final JdbcClient jdbc;
    private final Clock clock;

    public UserRepository(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public Optional<UserAccount> findByEmail(String email) {
        return jdbc.sql(BASE + " where u.correo=:email").param("email", email)
                .query(this::mapBase).optional().map(this::withRoles);
    }

    public Optional<UserAccount> findByGoogleSub(String sub) {
        return jdbc.sql(BASE + " where u.google_sub=:sub").param("sub", sub)
                .query(this::mapBase).optional().map(this::withRoles);
    }

    public Optional<UserAccount> findById(long id) {
        return jdbc.sql(BASE + " where u.id_usuario=:id").param("id", id)
                .query(this::mapBase).optional().map(this::withRoles);
    }

    public Set<String> findActiveRoles(long userId) {
        List<String> roles = jdbc.sql("""
                select r.codigo from tbl_usuario_rol ur
                join tbl_rol r on r.id_rol=ur.id_rol
                join tbl_estado_registro eur on eur.id_estado_registro=ur.id_estado_registro and eur.codigo='ACTIVO'
                join tbl_estado_registro er on er.id_estado_registro=r.id_estado_registro and er.codigo='ACTIVO'
                where ur.id_usuario=:userId order by r.codigo
                """).param("userId", userId).query(String.class).list();
        return java.util.Collections.unmodifiableSet(new LinkedHashSet<>(roles));
    }

    public boolean isActiveLanguage(String code) {
        return jdbc.sql("""
                select exists (
                  select 1 from tbl_idioma i
                  join tbl_estado_registro er on er.id_estado_registro=i.id_estado_registro
                  where i.codigo=:code and er.codigo='ACTIVO'
                )
                """).param("code", code).query(Boolean.class).single();
    }

    public void updateLastAccess(long id) {
        jdbc.sql("update tbl_usuario set ultimo_acceso=:now, fecha_actualizacion=:now where id_usuario=:id")
                .param("now", timestamp(Instant.now(clock))).param("id", id).update();
    }

    public long createGoogleUser(String email, String sub, String firstName, String lastName, String languageCode) {
        return jdbc.sql("""
                insert into tbl_usuario (correo, google_sub, nombres, apellidos, id_estado_usuario, id_idioma,
                                         fecha_creacion, fecha_actualizacion)
                select :email, :sub, :firstName, :lastName, eu.id_estado_usuario, i.id_idioma, :now, :now
                from tbl_estado_usuario eu
                join tbl_idioma i on i.codigo=:language
                join tbl_estado_registro eri on eri.id_estado_registro=i.id_estado_registro and eri.codigo='ACTIVO'
                where eu.codigo='ACTIVO'
                returning id_usuario
                """)
                .param("email", email).param("sub", sub).param("firstName", firstName)
                .param("lastName", lastName).param("language", languageCode)
                .param("now", timestamp(Instant.now(clock))).query(Long.class).single();
    }

    public void assignBaseRole(long userId) {
        jdbc.sql("""
                insert into tbl_usuario_rol (id_usuario, id_rol, id_estado_registro, fecha_asignacion, fecha_actualizacion)
                select :userId, r.id_rol, er.id_estado_registro, :now, :now
                from tbl_rol r
                join tbl_estado_registro er on er.codigo='ACTIVO'
                where r.codigo='USUARIO'
                on conflict (id_usuario,id_rol) do nothing
                """).param("userId", userId).param("now", timestamp(Instant.now(clock))).update();
    }

    public void linkGoogleSub(long userId, String sub) {
        jdbc.sql("update tbl_usuario set google_sub=:sub, fecha_actualizacion=:now where id_usuario=:id and google_sub is null")
                .param("sub", sub).param("now", timestamp(Instant.now(clock))).param("id", userId).update();
    }

    public void updateProfile(long userId, String firstName, String lastName, String languageCode) {
        jdbc.sql("""
                update tbl_usuario set nombres=coalesce(:firstName,nombres), apellidos=coalesce(:lastName,apellidos),
                  id_idioma=coalesce((select id_idioma from tbl_idioma i join tbl_estado_registro er
                    on er.id_estado_registro=i.id_estado_registro and er.codigo='ACTIVO' where i.codigo=:language),id_idioma),
                  fecha_actualizacion=:now
                where id_usuario=:id
                """)
                .param("firstName", firstName, Types.VARCHAR)
                .param("lastName", lastName, Types.VARCHAR)
                .param("language", languageCode, Types.VARCHAR)
                .param("now", timestamp(Instant.now(clock))).param("id", userId).update();
    }

    public void updatePassword(long userId, String hash) {
        Instant now = Instant.now(clock);
        jdbc.sql("""
                update tbl_usuario set password_hash=:hash, fecha_cambio_password=:now,
                  fecha_actualizacion=:now where id_usuario=:id
                """).param("hash", hash).param("now", timestamp(now)).param("id", userId).update();
    }

    private UserAccount mapBase(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new UserAccount(rs.getLong("id_usuario"), rs.getString("correo"),
                rs.getString("password_hash"), rs.getString("google_sub"), rs.getString("nombres"),
                rs.getString("apellidos"), rs.getString("estado_codigo"), rs.getString("idioma_codigo"), Set.of());
    }

    private UserAccount withRoles(UserAccount user) {
        return new UserAccount(user.id(), user.email(), user.passwordHash(), user.googleSub(),
                user.firstName(), user.lastName(), user.stateCode(), user.languageCode(), findActiveRoles(user.id()));
    }
}
