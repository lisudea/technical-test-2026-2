-- =====================================================================
-- V1: categorias + equipos
-- Source of truth: docs/schema_reservas_lis.sql
-- =====================================================================

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(80)  NOT NULL UNIQUE,
    descripcion  VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE equipos (
    id_equipo           INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria        INT NOT NULL,
    nombre              VARCHAR(150) NOT NULL,
    numero_serie        VARCHAR(100) UNIQUE COMMENT 'Serial del fabricante',
    mac_address         VARCHAR(17)  COMMENT 'Formato AA:BB:CC:DD:EE:FF (equipos de red)',
    descripcion         TEXT,
    estado              ENUM('DISPONIBLE','MANTENIMIENTO','BAJA') NOT NULL DEFAULT 'DISPONIBLE',
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipos_categoria
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_equipos_categoria (id_categoria),
    INDEX idx_equipos_estado    (estado),
    INDEX idx_equipos_nombre    (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
