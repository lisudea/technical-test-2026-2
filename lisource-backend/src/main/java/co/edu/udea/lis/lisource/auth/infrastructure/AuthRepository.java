package co.edu.udea.lis.lisource.auth.infrastructure;

import co.edu.udea.lis.lisource.auth.domain.RecoveryRecord;
import co.edu.udea.lis.lisource.auth.domain.SessionRecord;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

@Repository
public class AuthRepository {
    private final JdbcClient jdbc;

    public AuthRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public long createSession(long userId, String hash, Instant now, Instant expiresAt,
                              String ip, String userAgent) {
        return jdbc.sql("""
                insert into tbl_sesion (id_usuario,refresh_token_hash,fecha_creacion,fecha_expiracion,ip_origen,user_agent)
                values (:userId,:hash,:now,:expires,:ip,:agent) returning id_sesion
                """).param("userId", userId).param("hash", hash).param("now", timestamp(now))
                .param("expires", timestamp(expiresAt)).param("ip", ip, java.sql.Types.VARCHAR)
                .param("agent", userAgent, java.sql.Types.VARCHAR).query(Long.class).single();
    }

    public Optional<SessionRecord> findSessionForUpdate(String hash) {
        return jdbc.sql("""
                select id_sesion,id_usuario,fecha_creacion,fecha_expiracion,fecha_ultimo_uso,fecha_revocacion
                from tbl_sesion where refresh_token_hash=:hash for update
                """).param("hash", hash).query((rs, row) -> new SessionRecord(
                        rs.getLong("id_sesion"), rs.getLong("id_usuario"),
                        instant(rs.getTimestamp("fecha_creacion")), instant(rs.getTimestamp("fecha_expiracion")),
                        instant(rs.getTimestamp("fecha_ultimo_uso")), instant(rs.getTimestamp("fecha_revocacion"))
                )).optional();
    }

    public void revokeSession(long id, Instant now, boolean markUsed) {
        jdbc.sql("""
                update tbl_sesion set fecha_revocacion=coalesce(fecha_revocacion,:now),
                  fecha_ultimo_uso=case when :markUsed then :now else fecha_ultimo_uso end
                where id_sesion=:id
                """).param("now", timestamp(now)).param("markUsed", markUsed).param("id", id).update();
    }

    public int revokeAll(long userId, Instant now) {
        return jdbc.sql("""
                update tbl_sesion set fecha_revocacion=:now
                where id_usuario=:userId and fecha_revocacion is null
                """).param("now", timestamp(now)).param("userId", userId).update();
    }

    public List<SessionView> findActiveSessions(long userId, Long currentSessionId, Instant now,
                                                Instant idleCutoff) {
        return jdbc.sql("""
                select s.id_sesion,s.fecha_creacion,s.fecha_expiracion,s.fecha_ultimo_uso,s.ip_origen,s.user_agent,
                  case when s.id_sesion=:currentSessionId then true else false end current_session
                from tbl_sesion s
                join tbl_usuario u on u.id_usuario=s.id_usuario
                join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario and eu.codigo='ACTIVO'
                where s.id_usuario=:userId and s.fecha_revocacion is null and s.fecha_expiracion>:now
                  and coalesce(s.fecha_ultimo_uso,s.fecha_creacion)>:idleCutoff
                order by current_session desc, coalesce(s.fecha_ultimo_uso,s.fecha_creacion) desc, s.id_sesion desc
                """)
                .param("currentSessionId", currentSessionId == null ? 0L : currentSessionId)
                .param("userId", userId).param("now", timestamp(now))
                .param("idleCutoff", timestamp(idleCutoff))
                .query((rs, row) -> new SessionView(rs.getLong("id_sesion"),
                        instant(rs.getTimestamp("fecha_creacion")),
                        instant(rs.getTimestamp("fecha_expiracion")),
                        instant(rs.getTimestamp("fecha_ultimo_uso")),
                        rs.getString("ip_origen"), summarizeUserAgent(rs.getString("user_agent")),
                        rs.getBoolean("current_session"))).list();
    }

    public int revokeOwnedActiveSession(long userId, long sessionId, Instant now, Instant idleCutoff) {
        return jdbc.sql("""
                update tbl_sesion set fecha_revocacion=:now
                where id_sesion=:sessionId and id_usuario=:userId and fecha_revocacion is null
                  and fecha_expiracion>:now and coalesce(fecha_ultimo_uso,fecha_creacion)>:idleCutoff
                """).param("now", timestamp(now)).param("sessionId", sessionId)
                .param("userId", userId).param("idleCutoff", timestamp(idleCutoff)).update();
    }

    public boolean isActiveSession(long userId, long sessionId, Instant now, Instant idleCutoff) {
        return jdbc.sql("""
                select exists (
                  select 1 from tbl_sesion s
                  join tbl_usuario u on u.id_usuario=s.id_usuario
                  join tbl_estado_usuario eu on eu.id_estado_usuario=u.id_estado_usuario and eu.codigo='ACTIVO'
                  where s.id_sesion=:sessionId and s.id_usuario=:userId
                    and s.fecha_revocacion is null and s.fecha_expiracion>:now
                    and coalesce(s.fecha_ultimo_uso,s.fecha_creacion)>:idleCutoff
                )
                """).param("sessionId", sessionId).param("userId", userId)
                .param("now", timestamp(now)).param("idleCutoff", timestamp(idleCutoff))
                .query(Boolean.class).single();
    }

    public int revokeOtherActiveSessions(long userId, long currentSessionId, Instant now,
                                         Instant idleCutoff) {
        return jdbc.sql("""
                update tbl_sesion set fecha_revocacion=:now
                where id_usuario=:userId and id_sesion<>:currentSessionId and fecha_revocacion is null
                  and fecha_expiracion>:now and coalesce(fecha_ultimo_uso,fecha_creacion)>:idleCutoff
                """).param("now", timestamp(now)).param("userId", userId)
                .param("currentSessionId", currentSessionId)
                .param("idleCutoff", timestamp(idleCutoff)).update();
    }

    public int revokeExcessActiveSessions(long userId, long currentSessionId, Instant now,
                                          Instant idleCutoff, int maximum) {
        return jdbc.sql("""
                update tbl_sesion set fecha_revocacion=:now
                where id_sesion in (
                  select id_sesion from tbl_sesion
                  where id_usuario=:userId and fecha_revocacion is null and fecha_expiracion>:now
                    and coalesce(fecha_ultimo_uso,fecha_creacion)>:idleCutoff
                  order by case when id_sesion=:currentSessionId then 0 else 1 end,
                           coalesce(fecha_ultimo_uso,fecha_creacion) desc, id_sesion desc
                  offset :maximum
                )
                """).param("now", timestamp(now)).param("userId", userId)
                .param("currentSessionId", currentSessionId).param("idleCutoff", timestamp(idleCutoff))
                .param("maximum", maximum).update();
    }

    public void revokePendingRecoveries(long userId, Instant now) {
        jdbc.sql("""
                update tbl_recuperacion_password set fecha_revocacion=:now
                where id_usuario=:userId and fecha_uso is null and fecha_revocacion is null
                """).param("now", timestamp(now)).param("userId", userId).update();
    }

    public long createRecovery(long userId, String hash, Instant now, Instant expiresAt,
                               String ip, String userAgent) {
        return jdbc.sql("""
                insert into tbl_recuperacion_password
                  (id_usuario,token_hash,fecha_solicitud,fecha_expiracion,ip_solicitud,user_agent)
                values (:userId,:hash,:now,:expires,:ip,:agent) returning id_recuperacion_password
                """).param("userId", userId).param("hash", hash).param("now", timestamp(now))
                .param("expires", timestamp(expiresAt)).param("ip", ip, java.sql.Types.VARCHAR)
                .param("agent", userAgent, java.sql.Types.VARCHAR).query(Long.class).single();
    }

    public Optional<RecoveryRecord> findRecoveryForUpdate(String hash) {
        return jdbc.sql("""
                select id_recuperacion_password,id_usuario,fecha_solicitud,fecha_expiracion,fecha_uso,fecha_revocacion
                from tbl_recuperacion_password where token_hash=:hash for update
                """).param("hash", hash).query((rs, row) -> new RecoveryRecord(
                        rs.getLong("id_recuperacion_password"), rs.getLong("id_usuario"),
                        instant(rs.getTimestamp("fecha_solicitud")), instant(rs.getTimestamp("fecha_expiracion")),
                        instant(rs.getTimestamp("fecha_uso")), instant(rs.getTimestamp("fecha_revocacion"))
                )).optional();
    }

    public void markRecoveryUsed(long id, Instant now) {
        jdbc.sql("update tbl_recuperacion_password set fecha_uso=:now where id_recuperacion_password=:id")
                .param("now", timestamp(now)).param("id", id).update();
    }

    private static Instant instant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }

    private static String summarizeUserAgent(String value) {
        if (value == null || value.isBlank()) return "Unknown client";
        String normalized = value.replaceAll("[\\r\\n]", " ").trim();
        return normalized.length() <= 120 ? normalized : normalized.substring(0, 117) + "...";
    }

    public record SessionView(long id, Instant createdAt, Instant expiresAt, Instant lastUsedAt,
                              String ipAddress, String userAgent, boolean current) {}
}
