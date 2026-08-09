package co.edu.udea.lis.lisource.catalog.infrastructure;

import co.edu.udea.lis.lisource.catalog.api.CatalogDtos.CatalogItem;
import co.edu.udea.lis.lisource.catalog.api.CatalogDtos.LanguageItem;
import co.edu.udea.lis.lisource.catalog.api.CatalogDtos.StatusItem;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class CatalogRepository {
    private final JdbcClient jdbc;

    public CatalogRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<CatalogItem> categories() {
        return activeCatalog("tbl_categoria_equipo", "id_categoria_equipo");
    }

    public List<CatalogItem> locations() {
        return activeCatalog("tbl_ubicacion", "id_ubicacion");
    }

    public List<StatusItem> equipmentStatuses() {
        return jdbc.sql("select codigo,nombre from tbl_estado_equipo order by id_estado_equipo")
                .query((rs, row) -> new StatusItem(rs.getString(1), rs.getString(2))).list();
    }

    public List<LanguageItem> languages() {
        return jdbc.sql("""
                select i.id_idioma,i.codigo,i.nombre,i.nombre_nativo from tbl_idioma i
                join tbl_estado_registro er on er.id_estado_registro=i.id_estado_registro and er.codigo='ACTIVO'
                order by i.id_idioma
                """).query((rs, row) -> new LanguageItem(rs.getInt(1), rs.getString(2),
                        rs.getString(3), rs.getString(4))).list();
    }

    public Optional<Integer> activeCategoryId(int id) {
        return activeId("tbl_categoria_equipo", "id_categoria_equipo", id);
    }

    public Optional<Integer> activeLocationId(int id) {
        return activeId("tbl_ubicacion", "id_ubicacion", id);
    }

    public Optional<Integer> equipmentStateId(String code) {
        return jdbc.sql("select id_estado_equipo from tbl_estado_equipo where codigo=:code")
                .param("code", code).query(Integer.class).optional();
    }

    public Optional<Integer> reservationStateId(String code) {
        return jdbc.sql("select id_estado_reserva from tbl_estado_reserva where codigo=:code")
                .param("code", code).query(Integer.class).optional();
    }

    private List<CatalogItem> activeCatalog(String table, String idColumn) {
        String sql = "select c." + idColumn + ",c.codigo,c.nombre from " + table + " c "
                + "join tbl_estado_registro er on er.id_estado_registro=c.id_estado_registro "
                + "where er.codigo='ACTIVO' order by c.nombre";
        return jdbc.sql(sql).query((rs, row) -> new CatalogItem(rs.getInt(1), rs.getString(2), rs.getString(3))).list();
    }

    private Optional<Integer> activeId(String table, String idColumn, int id) {
        String sql = "select c." + idColumn + " from " + table + " c join tbl_estado_registro er "
                + "on er.id_estado_registro=c.id_estado_registro and er.codigo='ACTIVO' where c." + idColumn + "=:id";
        return jdbc.sql(sql).param("id", id).query(Integer.class).optional();
    }
}

