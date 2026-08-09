package co.edu.udea.lis.lisource.statistics.infrastructure;

import co.edu.udea.lis.lisource.statistics.api.StatisticsDtos.DashboardSummary;
import co.edu.udea.lis.lisource.statistics.api.StatisticsDtos.TopEquipment;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class StatisticsRepository {
    private final JdbcClient jdbc;
    public StatisticsRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<TopEquipment> topEquipment(int limit) {
        List<TopRow> rows = jdbc.sql("""
                select e.id_equipo,e.codigo_inventario,e.nombre,ce.nombre categoria,count(*) total
                from tbl_reserva_equipo re
                join tbl_reserva r on r.id_reserva=re.id_reserva
                join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                join tbl_equipo e on e.id_equipo=re.id_equipo
                join tbl_categoria_equipo ce on ce.id_categoria_equipo=e.id_categoria_equipo
                where er.codigo='CONFIRMADA'
                group by e.id_equipo,e.codigo_inventario,e.nombre,ce.nombre
                order by total desc,e.id_equipo asc limit :limit
                """).param("limit", limit).query((rs, row) -> new TopRow(rs.getLong(1), rs.getString(2),
                        rs.getString(3), rs.getString(4), rs.getLong(5))).list();
        java.util.concurrent.atomic.AtomicInteger position = new java.util.concurrent.atomic.AtomicInteger();
        return rows.stream().map(row -> new TopEquipment(position.incrementAndGet(), row.id, row.code,
                row.name, row.category, row.total, row.total)).toList();
    }

    public DashboardSummary dashboard() {
        return jdbc.sql("""
                with states as (
                  select e.id_equipo,
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
                      else 'RETIRED' end visual_status
                  from tbl_equipo e join tbl_estado_equipo ee on ee.id_estado_equipo=e.id_estado_equipo)
                select count(*) total,
                  count(*) filter(where visual_status='AVAILABLE') available,
                  count(*) filter(where visual_status='RESERVED') reserved,
                  count(*) filter(where visual_status='MAINTENANCE') maintenance,
                  count(*) filter(where visual_status='OUT_OF_SERVICE') out_of_service,
                  count(*) filter(where visual_status='RETIRED') retired
                from states
                """).query((rs, row) -> new DashboardSummary(rs.getLong("total"), rs.getLong("available"),
                        rs.getLong("reserved"), rs.getLong("maintenance"), rs.getLong("out_of_service"),
                        rs.getLong("retired"))).single();
    }

    private record TopRow(long id, String code, String name, String category, long total) {}
}

