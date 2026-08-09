package co.edu.udea.lis.lisource.configuration.infrastructure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import co.edu.udea.lis.lisource.configuration.domain.ConfigurationValue;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import static co.edu.udea.lis.lisource.shared.util.JdbcValues.timestamp;

@Repository
public class ConfigurationRepository {
    private static final String BASE_QUERY = """
            select c.id_configuracion, c.clave, c.valor, c.descripcion,
                   cc.codigo categoria_codigo, cc.nombre categoria_nombre
            from tbl_configuracion c
            join tbl_categoria_configuracion cc on cc.id_categoria_configuracion=c.id_categoria_configuracion
            join tbl_estado_registro ec on ec.id_estado_registro=c.id_estado_registro and ec.codigo='ACTIVO'
            join tbl_estado_registro ecc on ecc.id_estado_registro=cc.id_estado_registro and ecc.codigo='ACTIVO'
            """;

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final Clock clock;

    public ConfigurationRepository(JdbcClient jdbc, ObjectMapper mapper, Clock clock) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.clock = clock;
    }

    public Optional<ConfigurationValue> findActive(String key) {
        return jdbc.sql(BASE_QUERY + " where c.clave=:key")
                .param("key", key)
                .query(this::map)
                .optional();
    }

    public List<ConfigurationValue> findAllActive() {
        return jdbc.sql(BASE_QUERY + " order by cc.codigo, c.clave")
                .query(this::map).list();
    }

    public boolean update(String key, JsonNode value) {
        return jdbc.sql("""
                update tbl_configuracion set valor=cast(:value as jsonb), fecha_actualizacion=:now
                where clave=:key
                """)
                .param("value", value.toString())
                .param("now", timestamp(Instant.now(clock)))
                .param("key", key)
                .update() == 1;
    }

    private ConfigurationValue map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        Object raw = rs.getObject("valor");
        String json = String.valueOf(raw);
        try {
            return new ConfigurationValue(rs.getLong("id_configuracion"), rs.getString("clave"),
                    mapper.readTree(json), rs.getString("descripcion"),
                    rs.getString("categoria_codigo"), rs.getString("categoria_nombre"));
        } catch (JsonProcessingException exception) {
            throw new java.sql.SQLException("Invalid JSON configuration", exception);
        }
    }
}
