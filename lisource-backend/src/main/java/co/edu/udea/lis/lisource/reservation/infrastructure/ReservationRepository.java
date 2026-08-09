package co.edu.udea.lis.lisource.reservation.infrastructure;

import co.edu.udea.lis.lisource.reservation.api.ReservationDtos.BusySlot;
import co.edu.udea.lis.lisource.reservation.domain.ReservationAggregate;
import co.edu.udea.lis.lisource.reservation.domain.ReservedEquipment;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Clock;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

@Repository
public class ReservationRepository {
    private static final String SELECT = """
            select r.id_reserva,r.codigo_reserva,r.id_usuario,er.codigo estado_codigo,
              r.fecha_inicio,r.fecha_fin,r.observaciones,r.fecha_creacion,r.fecha_cancelacion,r.motivo_cancelacion,
              e.id_equipo,e.codigo_inventario,e.nombre equipo_nombre
            from tbl_reserva r
            join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
            join tbl_reserva_equipo re on re.id_reserva=r.id_reserva
            join tbl_equipo e on e.id_equipo=re.id_equipo
            """;
    private final JdbcClient jdbc;
    private final Clock clock;

    public ReservationRepository(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public boolean overlapExists(List<Long> equipmentIds, Instant startsAt, Instant endsAt) {
        return Boolean.TRUE.equals(jdbc.sql("""
                select exists(select 1 from tbl_reserva_equipo re
                  join tbl_reserva r on r.id_reserva=re.id_reserva
                  join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                  where re.id_equipo in (:ids) and er.codigo='CONFIRMADA'
                    and r.fecha_inicio<:endsAt and r.fecha_fin>:startsAt)
                """).param("ids", equipmentIds).param("endsAt", timestamp(endsAt)).param("startsAt", timestamp(startsAt))
                .query(Boolean.class).single());
    }

    public long insert(String code, long userId, int stateId, Instant startsAt, Instant endsAt, String notes) {
        Instant now = Instant.now(clock);
        return jdbc.sql("""
                insert into tbl_reserva (codigo_reserva,id_usuario,id_estado_reserva,fecha_inicio,fecha_fin,
                  observaciones,fecha_creacion,fecha_actualizacion)
                values (:code,:userId,:state,:startsAt,:endsAt,:notes,:now,:now) returning id_reserva
                """).param("code", code).param("userId", userId).param("state", stateId)
                .param("startsAt", timestamp(startsAt)).param("endsAt", timestamp(endsAt))
                .param("notes", notes, Types.VARCHAR).param("now", timestamp(now)).query(Long.class).single();
    }

    public void insertEquipment(long reservationId, List<Long> equipmentIds) {
        for (Long equipmentId : equipmentIds) {
            jdbc.sql("insert into tbl_reserva_equipo (id_reserva,id_equipo) values (:reservation,:equipment)")
                    .param("reservation", reservationId).param("equipment", equipmentId).update();
        }
    }

    public boolean codeExists(String code) {
        return Boolean.TRUE.equals(jdbc.sql("select exists(select 1 from tbl_reserva where codigo_reserva=:code)")
                .param("code", code).query(Boolean.class).single());
    }

    public List<ReservationAggregate> findByOwner(long ownerId) {
        List<Flat> rows = jdbc.sql(SELECT + " where r.id_usuario=:owner order by r.fecha_inicio desc,r.id_reserva desc,e.id_equipo")
                .param("owner", ownerId).query(this::mapFlat).list();
        return aggregate(rows);
    }

    public Optional<ReservationAggregate> findById(long id) {
        List<ReservationAggregate> results = aggregate(jdbc.sql(SELECT + " where r.id_reserva=:id order by e.id_equipo")
                .param("id", id).query(this::mapFlat).list());
        return results.stream().findFirst();
    }

    public int cancel(long id, int cancelledStateId, long cancelledBy, String reason) {
        Instant now = Instant.now(clock);
        return jdbc.sql("""
                update tbl_reserva set id_estado_reserva=:state,fecha_cancelacion=:now,
                  id_usuario_cancelacion=:cancelledBy,motivo_cancelacion=:reason,fecha_actualizacion=:now
                where id_reserva=:id
                """).param("state", cancelledStateId).param("now", timestamp(now)).param("cancelledBy", cancelledBy)
                .param("reason", reason, Types.VARCHAR).param("id", id).update();
    }

    public List<BusySlot> busySlots(long equipmentId, Instant from) {
        return jdbc.sql("""
                select r.fecha_inicio,r.fecha_fin from tbl_reserva_equipo re
                join tbl_reserva r on r.id_reserva=re.id_reserva
                join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                where re.id_equipo=:equipment and er.codigo='CONFIRMADA' and r.fecha_fin>:from
                order by r.fecha_inicio limit 100
                """).param("equipment", equipmentId).param("from", timestamp(from))
                .query((rs, row) -> new BusySlot(instant(rs.getTimestamp(1)), instant(rs.getTimestamp(2)))).list();
    }

    private Flat mapFlat(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new Flat(rs.getLong("id_reserva"), rs.getString("codigo_reserva"), rs.getLong("id_usuario"),
                rs.getString("estado_codigo"), instant(rs.getTimestamp("fecha_inicio")),
                instant(rs.getTimestamp("fecha_fin")), rs.getString("observaciones"),
                instant(rs.getTimestamp("fecha_creacion")), instant(rs.getTimestamp("fecha_cancelacion")),
                rs.getString("motivo_cancelacion"), new ReservedEquipment(rs.getLong("id_equipo"),
                        rs.getString("codigo_inventario"), rs.getString("equipo_nombre")));
    }

    private List<ReservationAggregate> aggregate(List<Flat> rows) {
        Map<Long, Builder> grouped = new LinkedHashMap<>();
        for (Flat row : rows) {
            Builder builder = grouped.computeIfAbsent(row.id, ignored -> new Builder(row));
            builder.equipment.add(row.equipment);
        }
        return grouped.values().stream().map(Builder::build).toList();
    }

    private static Instant instant(Timestamp value) { return value == null ? null : value.toInstant(); }
    private record Flat(long id, String code, long ownerId, String status, Instant startsAt,
                        Instant endsAt, String notes, Instant createdAt, Instant cancelledAt,
                        String cancellationReason, ReservedEquipment equipment) {}
    private static final class Builder {
        private final Flat header;
        private final List<ReservedEquipment> equipment = new ArrayList<>();
        private Builder(Flat header) { this.header = header; }
        private ReservationAggregate build() {
            return new ReservationAggregate(header.id, header.code, header.ownerId, header.status,
                    header.startsAt, header.endsAt, header.notes, header.createdAt, header.cancelledAt,
                    header.cancellationReason, List.copyOf(equipment));
        }
    }
}
