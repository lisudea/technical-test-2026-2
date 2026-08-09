package co.edu.udea.lis.lisource.catalog.infrastructure;

import co.edu.udea.lis.lisource.catalog.api.AdminCatalogDtos.CatalogAdminItem;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AdminCatalogRepository {
    private final JdbcClient jdbc;
    public AdminCatalogRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<CatalogAdminItem> list(Type type) {
        String sql = "select c." + type.idColumn + ",c.codigo,c.nombre,c.descripcion,er.codigo='ACTIVO' from "
                + type.table + " c join tbl_estado_registro er on er.id_estado_registro=c.id_estado_registro order by c." + type.idColumn;
        return jdbc.sql(sql).query((rs,row) -> map(rs)).list();
    }

    public Optional<CatalogAdminItem> find(Type type, int id) {
        String sql = "select c." + type.idColumn + ",c.codigo,c.nombre,c.descripcion,er.codigo='ACTIVO' from "
                + type.table + " c join tbl_estado_registro er on er.id_estado_registro=c.id_estado_registro where c." + type.idColumn + "=:id";
        return jdbc.sql(sql).param("id", id).query((rs,row) -> map(rs)).optional();
    }

    public boolean conflicts(Type type, int excludedId, String code, String name) {
        String sql = "select exists(select 1 from " + type.table + " where " + type.idColumn
                + "<>:id and (codigo=:code or lower(nombre)=lower(:name)))";
        return jdbc.sql(sql).param("id", excludedId).param("code", code).param("name", name).query(Boolean.class).single();
    }

    public int insert(Type type, String code, String name, String description) {
        String sql = "insert into " + type.table + "(codigo,nombre,descripcion,id_estado_registro) "
                + "select :code,:name,:description,id_estado_registro from tbl_estado_registro where codigo='ACTIVO' returning " + type.idColumn;
        return jdbc.sql(sql).param("code", code).param("name", name).param("description", description, java.sql.Types.VARCHAR)
                .query(Integer.class).single();
    }

    public int update(Type type, int id, String code, String name, String description) {
        String sql = "update " + type.table + " set codigo=:code,nombre=:name,descripcion=:description where " + type.idColumn + "=:id";
        return jdbc.sql(sql).param("code", code).param("name", name).param("description", description, java.sql.Types.VARCHAR)
                .param("id", id).update();
    }

    public int changeStatus(Type type, int id, String status) {
        String sql = "update " + type.table + " set id_estado_registro=(select id_estado_registro from tbl_estado_registro where codigo=:status) where "
                + type.idColumn + "=:id";
        return jdbc.sql(sql).param("status", status).param("id", id).update();
    }

    private CatalogAdminItem map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new CatalogAdminItem(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getBoolean(5));
    }

    public enum Type {
        CATEGORY("tbl_categoria_equipo", "id_categoria_equipo", "CREAR_CATEGORIA_EQUIPO", "ACTUALIZAR_CATEGORIA_EQUIPO"),
        LOCATION("tbl_ubicacion", "id_ubicacion", "CREAR_UBICACION", "ACTUALIZAR_UBICACION");
        final String table; final String idColumn; public final String createEvent; public final String updateEvent;
        Type(String table, String idColumn, String createEvent, String updateEvent) {
            this.table=table; this.idColumn=idColumn; this.createEvent=createEvent; this.updateEvent=updateEvent;
        }
    }
}
