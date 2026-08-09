package co.edu.udea.lis.lisource.audit.infrastructure;

import co.edu.udea.lis.lisource.audit.domain.AuditEvent;
import java.sql.Types;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

@Repository
public class AuditRepository {
    private final JdbcClient jdbc;

    public AuditRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(AuditEvent event) {
        jdbc.sql("""
                insert into tbl_auditoria (
                  id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado, descripcion,
                  datos_anteriores, datos_nuevos, ip_origen, user_agent, correlation_id, fecha_evento)
                select :actor, te.id_tipo_evento_auditoria, :record, :description,
                  cast(:oldData as jsonb), cast(:newData as jsonb), :ip, :agent, :correlation, :occurred
                from tbl_tipo_evento_auditoria te
                join tbl_estado_registro er on er.id_estado_registro=te.id_estado_registro and er.codigo='ACTIVO'
                where te.codigo=:eventCode
                """)
                .param("actor", event.actorId(), Types.BIGINT)
                .param("record", event.affectedRecordId(), Types.BIGINT)
                .param("description", event.description(), Types.VARCHAR)
                .param("oldData", event.oldData() == null ? null : event.oldData().toString(), Types.VARCHAR)
                .param("newData", event.newData() == null ? null : event.newData().toString(), Types.VARCHAR)
                .param("ip", event.sourceIp(), Types.VARCHAR)
                .param("agent", event.userAgent(), Types.VARCHAR)
                .param("correlation", event.correlationId(), Types.OTHER)
                .param("occurred", timestamp(event.occurredAt()))
                .param("eventCode", event.eventCode())
                .update();
    }

    public List<AuditView> list(int limit, int offset, String eventCode, String correlationId) {
        StringBuilder sql = new StringBuilder("""
                select a.id_auditoria, te.codigo event_code, na.codigo level_code,
                  u.correo actor_email, a.id_registro_afectado, a.descripcion,
                  a.correlation_id, a.fecha_evento
                from tbl_auditoria a
                join tbl_tipo_evento_auditoria te on te.id_tipo_evento_auditoria=a.id_tipo_evento_auditoria
                join tbl_nivel_auditoria na on na.id_nivel_auditoria=te.id_nivel_auditoria
                left join tbl_usuario u on u.id_usuario=a.id_usuario_actor
                where 1=1
                """);
        if (eventCode != null && !eventCode.isBlank()) sql.append(" and te.codigo=:eventCode");
        if (correlationId != null && !correlationId.isBlank()) sql.append(" and a.correlation_id::text=:correlationId");
        sql.append(" order by a.fecha_evento desc limit :limit offset :offset");
        JdbcClient.StatementSpec statement = jdbc.sql(sql.toString()).param("limit", limit).param("offset", offset);
        if (eventCode != null && !eventCode.isBlank()) statement = statement.param("eventCode", eventCode);
        if (correlationId != null && !correlationId.isBlank()) statement = statement.param("correlationId", correlationId);
        return statement.query((rs, row) -> new AuditView(
                rs.getLong("id_auditoria"), rs.getString("event_code"), rs.getString("level_code"),
                rs.getString("actor_email"), (Long) rs.getObject("id_registro_afectado"),
                rs.getString("descripcion"), rs.getString("correlation_id"),
                rs.getTimestamp("fecha_evento").toInstant())).list();
    }

    public record AuditView(long id, String eventCode, String levelCode, String actorEmail,
                            Long affectedRecordId, String description, String correlationId,
                            java.time.Instant occurredAt) {}
}
