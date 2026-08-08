-- =====================================================================
-- V3: reservas + log_actividad + estadisticas_equipos_top VIEW
-- Structure only (tables, foreign keys, CHECK constraint). Performance
-- indexes live in V4__indices_conflicto_y_top.sql so the index inventory
-- is auditable in one place. The no-overlap rule is enforced in the
-- application layer inside a transaction with SELECT ... FOR UPDATE
-- (MySQL 8 has no exclusion constraint); idx_reservas_conflicto (V4)
-- makes that query cheap.
-- =====================================================================

CREATE TABLE reservas (
    id_reserva           BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_equipo            INT NOT NULL,
    id_usuario           INT NOT NULL,
    fecha_hora_inicio    DATETIME NOT NULL,
    fecha_hora_fin       DATETIME NOT NULL,
    estado               ENUM('ACTIVA','CANCELADA','COMPLETADA') NOT NULL DEFAULT 'ACTIVA',
    motivo               VARCHAR(255) COMMENT 'Opcional: por que el usuario reserva',
    fecha_creacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion    DATETIME NULL,
    CONSTRAINT fk_reservas_equipo
        FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservas_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_reservas_franja_valida
        CHECK (fecha_hora_inicio < fecha_hora_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional audit log: who created/cancelled what and when.
CREATE TABLE log_actividad (
    id_log               BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario           INT NULL,
    accion               VARCHAR(80) NOT NULL COMMENT 'crear_reserva, cancelar_reserva, crear_equipo, ...',
    tabla_afectada       VARCHAR(80),
    id_registro_afectado BIGINT,
    detalle              JSON,
    fecha_hora           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen            VARCHAR(45),
    CONSTRAINT fk_log_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View backing GET /api/v1/estadisticas/equipos-top (bonus).
-- Excludes cancelled reservations from the count.
CREATE OR REPLACE VIEW estadisticas_equipos_top AS
SELECT
    e.id_equipo,
    e.nombre,
    c.nombre AS categoria,
    COUNT(r.id_reserva) AS total_reservas
FROM equipos e
LEFT JOIN categorias c ON c.id_categoria = e.id_categoria
LEFT JOIN reservas   r ON r.id_equipo    = e.id_equipo
                       AND r.estado <> 'cancelada'
GROUP BY e.id_equipo, e.nombre, c.nombre;
