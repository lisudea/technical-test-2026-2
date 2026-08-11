-- =====================================================================
-- V9: sanciones
--
-- A sanction temporarily bars a user from creating reservations. It is a
-- row with a validity window, never a flag on `usuarios`: the lab needs the
-- history (who was sanctioned, why, by whom, and whether it was lifted
-- early), and a boolean column cannot carry any of that.
--
-- "Currently in force" is therefore a query, not a stored state:
--     estado = 'ACTIVA' AND fecha_fin > NOW()
-- An expired sanction stays ACTIVA on the row and simply stops matching.
-- Nothing has to sweep the table on a schedule to keep it honest, and the
-- history stays intact for audit.
--
-- LEVANTADA is the explicit early lift by an ADMIN, which is a different
-- fact from "the window elapsed" and is worth distinguishing in the record.
-- =====================================================================

CREATE TABLE sanciones (
    id_sancion                BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario                INT NOT NULL,
    motivo                    VARCHAR(255) NOT NULL,
    fecha_inicio              DATETIME NOT NULL,
    fecha_fin                 DATETIME NOT NULL,
    estado                    ENUM('ACTIVA','LEVANTADA') NOT NULL DEFAULT 'ACTIVA',
    origen                    ENUM('MANUAL','AUTOMATICA') NOT NULL DEFAULT 'MANUAL'
                              COMMENT 'AUTOMATICA: raised by the loan desk on a no-show',
    id_reserva                BIGINT NULL
                              COMMENT 'The unclaimed reservation that triggered an AUTOMATICA sanction',
    creada_por                INT NULL,
    levantada_por             INT NULL,
    fecha_levantamiento       DATETIME NULL,
    observacion_levantamiento VARCHAR(255) NULL,
    fecha_creacion            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sanciones_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sanciones_reserva
        FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sanciones_creada_por
        FOREIGN KEY (creada_por) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sanciones_levantada_por
        FOREIGN KEY (levantada_por) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_sanciones_ventana_valida
        CHECK (fecha_inicio < fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Covers the hot path: "does this user have a sanction in force right now?",
-- run on every reservation attempt. Column order matches the predicate.
CREATE INDEX idx_sanciones_vigencia ON sanciones (id_usuario, estado, fecha_fin);
