package co.edu.udea.lis.lisource.equipment.infrastructure;

import co.edu.udea.lis.lisource.equipment.api.EquipmentDtos.*;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Clock;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

@Repository
public class EquipmentRepository {
    private static final String VIEW = """
            select e.id_equipo,e.codigo_inventario,e.nombre,e.descripcion,e.numero_serie,e.direccion_mac,e.imagen_url,
              ce.id_categoria_equipo,ce.codigo categoria_codigo,ce.nombre categoria_nombre,
              u.id_ubicacion,u.codigo ubicacion_codigo,u.nombre ubicacion_nombre,
              ee.codigo estado_codigo,ee.nombre estado_nombre,
              case
                when ee.codigo='OPERATIVO' and exists (
                  select 1 from tbl_reserva_equipo re
                  join tbl_reserva r on r.id_reserva=re.id_reserva
                  join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                  where re.id_equipo=e.id_equipo and er.codigo='CONFIRMADA'
                    and r.fecha_inicio<=now() and r.fecha_fin>now()) then 'RESERVED'
                when ee.codigo='OPERATIVO' then 'AVAILABLE'
                when ee.codigo='MANTENIMIENTO' then 'MAINTENANCE'
                when ee.codigo='FUERA_SERVICIO' then 'OUT_OF_SERVICE'
                else 'RETIRED'
              end visual_status,
              e.fecha_creacion,e.fecha_actualizacion
            from tbl_equipo e
            join tbl_categoria_equipo ce on ce.id_categoria_equipo=e.id_categoria_equipo
            join tbl_estado_equipo ee on ee.id_estado_equipo=e.id_estado_equipo
            left join tbl_ubicacion u on u.id_ubicacion=e.id_ubicacion
            """;

    private static final Map<String, String> SORTS = Map.of(
            "name", "v.nombre", "inventoryCode", "v.codigo_inventario",
            "createdAt", "v.fecha_creacion", "updatedAt", "v.fecha_actualizacion");

    private final JdbcClient jdbc;
    private final Clock clock;

    public EquipmentRepository(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public EquipmentPage list(int page, int pageSize, String search, String category,
                              String visualStatus, String operationalStatus, String sort) {
        QueryParts parts = filters(search, category, visualStatus, operationalStatus);
        String orderBy = sortClause(sort);
        JdbcClient.StatementSpec data = bind(jdbc.sql("select * from (" + VIEW + ") v " + parts.where
                        + " order by " + orderBy + " limit :limit offset :offset"), parts)
                .param("limit", pageSize).param("offset", (page - 1) * pageSize);
        List<EquipmentResponse> items = data.query(this::map).list();
        long count = bind(jdbc.sql("select count(*) from (" + VIEW + ") v " + parts.where), parts)
                .query(Long.class).single();
        return new EquipmentPage(items, count);
    }

    public Optional<EquipmentResponse> findById(long id) {
        return jdbc.sql("select * from (" + VIEW + ") v where v.id_equipo=:id")
                .param("id", id).query(this::map).optional();
    }

    public boolean identifierConflict(String inventoryCode, String serialNumber, String macAddress, Long excludedId) {
        Long count = jdbc.sql("""
                select count(*) from tbl_equipo
                where (:excluded is null or id_equipo<>:excluded)
                  and (codigo_inventario=:inventory
                    or (:serial is not null and numero_serie=:serial)
                    or (:mac is not null and direccion_mac=:mac))
                """)
                .param("excluded", excludedId, Types.BIGINT)
                .param("inventory", inventoryCode)
                .param("serial", serialNumber, Types.VARCHAR)
                .param("mac", macAddress, Types.VARCHAR)
                .query(Long.class).single();
        return count > 0;
    }

    public long insert(NormalizedEquipment input, int categoryId, Integer locationId, int stateId) {
        Instant now = Instant.now(clock);
        return jdbc.sql("""
                insert into tbl_equipo (codigo_inventario,nombre,descripcion,numero_serie,direccion_mac,imagen_url,
                  id_categoria_equipo,id_estado_equipo,id_ubicacion,fecha_creacion,fecha_actualizacion)
                values (:inventory,:name,:description,:serial,:mac,:image,:category,:state,:location,:now,:now)
                returning id_equipo
                """).param("inventory", input.inventoryCode()).param("name", input.name())
                .param("description", input.description(), Types.VARCHAR)
                .param("serial", input.serialNumber(), Types.VARCHAR)
                .param("mac", input.macAddress(), Types.VARCHAR)
                .param("image", input.imageUrl(), Types.VARCHAR)
                .param("category", categoryId).param("state", stateId)
                .param("location", locationId, Types.INTEGER).param("now", timestamp(now))
                .query(Long.class).single();
    }

    public int update(long id, NormalizedEquipment input, int categoryId, Integer locationId, int stateId) {
        return jdbc.sql("""
                update tbl_equipo set codigo_inventario=:inventory,nombre=:name,descripcion=:description,
                  numero_serie=:serial,direccion_mac=:mac,imagen_url=:image,id_categoria_equipo=:category,
                  id_estado_equipo=:state,id_ubicacion=:location,fecha_actualizacion=:now
                where id_equipo=:id
                """).param("inventory", input.inventoryCode()).param("name", input.name())
                .param("description", input.description(), Types.VARCHAR)
                .param("serial", input.serialNumber(), Types.VARCHAR)
                .param("mac", input.macAddress(), Types.VARCHAR)
                .param("image", input.imageUrl(), Types.VARCHAR)
                .param("category", categoryId).param("state", stateId)
                .param("location", locationId, Types.INTEGER).param("now", timestamp(Instant.now(clock)))
                .param("id", id).update();
    }

    public int changeStatus(long id, int stateId) {
        return jdbc.sql("""
                update tbl_equipo set id_estado_equipo=:state,fecha_actualizacion=:now where id_equipo=:id
                """).param("state", stateId).param("now", timestamp(Instant.now(clock))).param("id", id).update();
    }

    public int updateImageUrl(long id, String imageUrl) {
        return jdbc.sql("""
                update tbl_equipo set imagen_url=:imageUrl,fecha_actualizacion=:now where id_equipo=:id
                """).param("imageUrl", imageUrl, Types.VARCHAR)
                .param("now", timestamp(Instant.now(clock))).param("id", id).update();
    }

    public boolean hasConfirmedCurrentOrFutureReservation(long equipmentId) {
        return Boolean.TRUE.equals(jdbc.sql("""
                select exists(select 1 from tbl_reserva_equipo re
                  join tbl_reserva r on r.id_reserva=re.id_reserva
                  join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                  where re.id_equipo=:id and er.codigo='CONFIRMADA' and r.fecha_fin>now())
                """).param("id", equipmentId).query(Boolean.class).single());
    }

    public List<EquipmentLock> lockInOrder(List<Long> ids) {
        return jdbc.sql("""
                select e.id_equipo,ee.codigo from tbl_equipo e
                join tbl_estado_equipo ee on ee.id_estado_equipo=e.id_estado_equipo
                where e.id_equipo in (:ids) order by e.id_equipo for update of e
                """).param("ids", ids).query((rs, row) -> new EquipmentLock(rs.getLong(1), rs.getString(2))).list();
    }

    private QueryParts filters(String search, String category, String visualStatus, String operationalStatus) {
        List<String> conditions = new ArrayList<>();
        Map<String, Object> params = new LinkedHashMap<>();
        if (search != null && !search.isBlank()) {
            conditions.add("(lower(v.nombre) like :search or lower(v.codigo_inventario) like :search)");
            params.put("search", "%" + search.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            conditions.add("v.categoria_codigo=:category"); params.put("category", category.toUpperCase(Locale.ROOT));
        }
        if (visualStatus != null && !visualStatus.isBlank() && !visualStatus.equalsIgnoreCase("ALL")) {
            conditions.add("v.visual_status=:visualStatus"); params.put("visualStatus", visualStatus.toUpperCase(Locale.ROOT));
        }
        if (operationalStatus != null && !operationalStatus.isBlank()) {
            conditions.add("v.estado_codigo=:operationalStatus"); params.put("operationalStatus", operationalStatus.toUpperCase(Locale.ROOT));
        }
        return new QueryParts(conditions.isEmpty() ? "" : "where " + String.join(" and ", conditions), params);
    }

    private JdbcClient.StatementSpec bind(JdbcClient.StatementSpec spec, QueryParts parts) {
        JdbcClient.StatementSpec result = spec;
        for (Map.Entry<String, Object> entry : parts.params.entrySet()) result = result.param(entry.getKey(), entry.getValue());
        return result;
    }

    private String sortClause(String sort) {
        if (sort == null || sort.isBlank()) return "v.codigo_inventario asc";
        String[] values = sort.split(",", 2);
        String column = SORTS.get(values[0]);
        if (column == null) return "v.codigo_inventario asc";
        String direction = values.length > 1 && values[1].equalsIgnoreCase("desc") ? "desc" : "asc";
        return column + " " + direction + ", v.id_equipo asc";
    }

    private EquipmentResponse map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        Integer locationId = (Integer) rs.getObject("id_ubicacion");
        CatalogRef location = locationId == null ? null : new CatalogRef(locationId,
                rs.getString("ubicacion_codigo"), rs.getString("ubicacion_nombre"));
        return new EquipmentResponse(rs.getLong("id_equipo"), rs.getString("codigo_inventario"),
                rs.getString("nombre"), rs.getString("descripcion"), rs.getString("numero_serie"),
                rs.getString("direccion_mac"), rs.getString("imagen_url"),
                new CatalogRef(rs.getInt("id_categoria_equipo"), rs.getString("categoria_codigo"),
                        rs.getString("categoria_nombre")), location,
                new StatusRef(rs.getString("estado_codigo"), rs.getString("estado_nombre")),
                rs.getString("visual_status"), instant(rs.getTimestamp("fecha_creacion")),
                instant(rs.getTimestamp("fecha_actualizacion")));
    }

    private Instant instant(Timestamp timestamp) { return timestamp == null ? null : timestamp.toInstant(); }
    private record QueryParts(String where, Map<String, Object> params) {}
    public record EquipmentPage(List<EquipmentResponse> items, long total) {}
    public record EquipmentLock(long id, String operationalStatus) {}
    public record NormalizedEquipment(String inventoryCode, String name, String description,
                                      String serialNumber, String macAddress, String imageUrl) {}
}
