package co.edu.udea.lis.lisource.shared.config;

import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class SchemaVerifier implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(SchemaVerifier.class);
    private static final Set<String> REQUIRED_TABLES = Set.of(
            "tbl_estado_registro", "tbl_estado_usuario", "tbl_estado_equipo", "tbl_estado_reserva",
            "tbl_rol", "tbl_idioma", "tbl_usuario", "tbl_usuario_rol", "tbl_sesion",
            "tbl_recuperacion_password", "tbl_categoria_equipo", "tbl_ubicacion", "tbl_equipo",
            "tbl_reserva", "tbl_reserva_equipo", "tbl_categoria_configuracion", "tbl_configuracion",
            "tbl_nivel_auditoria", "tbl_tipo_evento_auditoria", "tbl_auditoria");

    private final JdbcClient jdbc;
    private final AppProperties properties;

    public SchemaVerifier(JdbcClient jdbc, AppProperties properties) {
        this.jdbc = jdbc;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (properties.schemaValidation() != null && !properties.schemaValidation().enabled()) return;
        List<String> tables = jdbc.sql("""
                select table_name from information_schema.tables
                where table_schema = 'public' and table_name like 'tbl\\_%' escape '\\'
                """).query(String.class).list();
        if (!Set.copyOf(tables).equals(REQUIRED_TABLES)) {
            throw new IllegalStateException("LISource schema mismatch. Expected exactly 20 tbl_* tables; found " + tables.size());
        }
        log.info("Validated LISource PostgreSQL schema: {} required tables present", tables.size());
    }
}
