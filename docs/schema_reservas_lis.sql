-- =====================================================================
-- BASE DE DATOS: Sistema de Gestión y Reservas de Equipos del LIS
-- Motor:  MySQL 8.0+ (InnoDB, integridad referencial)
-- Prueba técnica LIS 2026-2 — Reto 2
-- =====================================================================

CREATE DATABASE IF NOT EXISTS reservas_lis
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE reservas_lis;

-- =====================================================================
-- Tabla: categorias
-- Catálogo de tipos de equipo del laboratorio (Microcontroladores, VR,
-- Redes, Impresión 3D, ...). Se mantiene como tabla para permitir alta
-- de nuevas categorías sin cambios de esquema.
-- =====================================================================
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(80)  NOT NULL UNIQUE,
    descripcion  VARCHAR(255)
) ENGINE=InnoDB;

-- =====================================================================
-- Tabla: equipos
-- Cada equipo físico gestionado por el laboratorio. Un equipo tiene un
-- estado global (disponible / mantenimiento / baja); la ocupación puntual
-- en una franja no se persiste aquí, se deriva de las reservas activas.
-- =====================================================================
CREATE TABLE equipos (
    id_equipo           INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria        INT NOT NULL,
    nombre              VARCHAR(150) NOT NULL,
    numero_serie        VARCHAR(100) UNIQUE COMMENT 'Serial del fabricante',
    mac_address         VARCHAR(17)  COMMENT 'Formato AA:BB:CC:DD:EE:FF (equipos de red)',
    descripcion         TEXT,
    estado              ENUM('disponible','mantenimiento','baja') NOT NULL DEFAULT 'disponible',
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipos_categoria
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_equipos_categoria (id_categoria),
    INDEX idx_equipos_estado    (estado),
    INDEX idx_equipos_nombre    (nombre)
) ENGINE=InnoDB;

-- =====================================================================
-- Tabla: usuarios
-- Identidad mínima requerida por el enunciado: nombre + correo. El correo
-- es la clave natural (UNIQUE). Con Google SSO (bonus) llega verificado y
-- validado contra el dominio @udea.edu.co.
-- =====================================================================
CREATE TABLE usuarios (
    id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    correo         VARCHAR(150) NOT NULL UNIQUE,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_correo (correo)
) ENGINE=InnoDB;

-- =====================================================================
-- Tabla: reservas
-- Franja horaria [fecha_hora_inicio, fecha_hora_fin) de un equipo por un
-- usuario. La regla de no-solape se valida a nivel de aplicación con
-- SELECT ... FOR UPDATE dentro de una transacción (MySQL 8 no soporta
-- constraints de exclusión temporal nativas).
-- =====================================================================
CREATE TABLE reservas (
    id_reserva           BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_equipo            INT NOT NULL,
    id_usuario           INT NOT NULL,
    fecha_hora_inicio    DATETIME NOT NULL,
    fecha_hora_fin       DATETIME NOT NULL,
    estado               ENUM('activa','cancelada','completada') NOT NULL DEFAULT 'activa',
    motivo               VARCHAR(255) COMMENT 'Opcional: por qué el usuario reserva',
    fecha_creacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion    DATETIME NULL,
    CONSTRAINT fk_reservas_equipo
        FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservas_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_reservas_franja_valida
        CHECK (fecha_hora_inicio < fecha_hora_fin),
    -- Índice compuesto que optimiza la validación de solape:
    -- SELECT ... WHERE id_equipo = ? AND estado = 'activa'
    --                AND fecha_hora_inicio < ? AND fecha_hora_fin > ?
    INDEX idx_reservas_conflicto (id_equipo, estado, fecha_hora_inicio, fecha_hora_fin),
    INDEX idx_reservas_usuario   (id_usuario),
    INDEX idx_reservas_equipo    (id_equipo),
    INDEX idx_reservas_estado    (estado)
) ENGINE=InnoDB;

-- =====================================================================
-- Tabla: log_actividad (opcional pero recomendada)
-- Auditoría ligera: quién creó/canceló qué y cuándo. Útil para explicar
-- historial en la demo y como base para métricas.
-- =====================================================================
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
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_log_fecha (fecha_hora),
    INDEX idx_log_usuario (id_usuario)
) ENGINE=InnoDB;

-- =====================================================================
-- Vista: estadisticas_equipos_top
-- Base para el endpoint GET /api/v1/estadisticas/equipos-top (bonus).
-- Excluye reservas canceladas del conteo.
-- =====================================================================
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

-- =====================================================================
-- Datos semilla — categorías base del laboratorio
-- El resto del seed vive en V5__seed_datos_iniciales.sql de Flyway.
-- =====================================================================
INSERT INTO categorias (nombre, descripcion) VALUES
('Microcontroladores', 'Arduino, ESP32, Raspberry Pi, kits de desarrollo embebido'),
('VR',                 'Cascos de realidad virtual, controladores, sensores'),
('Redes',              'Routers, switches, analizadores, cables de red'),
('Impresión 3D',       'Impresoras y accesorios de fabricación aditiva');
