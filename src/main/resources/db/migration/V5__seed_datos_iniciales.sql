-- =====================================================================
-- V5: Seed data for demo / development
--   - 4 categorias (base lab categories)
--   - 10 equipos across categories with varied estados
--   - 3 usuarios @udea.edu.co
--   - 5 reservas (some past, some future, one cancelled) so filters,
--     statistics and the Top-N view have something to show.
-- Uses deterministic ids (relies on AUTO_INCREMENT starting at 1).
-- =====================================================================

-- Categorias ----------------------------------------------------------
INSERT INTO categorias (nombre, descripcion) VALUES
('Microcontroladores', 'Arduino, ESP32, Raspberry Pi, kits de desarrollo embebido'),
('VR',                 'Cascos de realidad virtual, controladores, sensores'),
('Redes',              'Routers, switches, analizadores, cables de red'),
('Impresion 3D',       'Impresoras y accesorios de fabricacion aditiva');

-- Equipos (id_categoria 1..4) ----------------------------------------
INSERT INTO equipos (id_categoria, nombre, numero_serie, mac_address, descripcion, estado) VALUES
(1, 'Arduino Uno R3',          'ARD-UNO-001', NULL,           'Placa microcontrolador ATmega328P',           'disponible'),
(1, 'ESP32 DevKit V1',         'ESP32-DK-002', 'A4:CF:12:9D:00:01', 'WiFi + Bluetooth dual-core',          'disponible'),
(1, 'Raspberry Pi 4 Model B',  'RPi4-003',     'DC:A6:32:1F:00:03', '4GB RAM, SBC para prototipado',       'disponible'),
(2, 'Meta Quest 2 (128GB)',    'MQ2-VR-004',   NULL,           'Casco VR autonomo 6DoF',                      'disponible'),
(2, 'HTC Vive Pro 2',          'VIVE-005',     NULL,           'Casco VR PC-tethered alta resolucion',       'mantenimiento'),
(3, 'Router MikroTik hAP ac2', 'MTK-RTR-006',  'D4:CA:6D:11:22:06', 'Router dual-band 4x ethernet',         'disponible'),
(3, 'Switch TP-Link TL-SG105E','TPL-SW-007',   'EC:08:6B:55:0A:07', 'Switch gestionado 5 puertos gigabit',  'disponible'),
(3, 'Analizador Fluke LinkIQ',  'FLK-LIQ-008', NULL,           'Certificador de cables de red',              'disponible'),
(4, 'Creality Ender 3 V2',     'CRE-3D-009',   NULL,           'Impresora FDM 220x220x250mm',               'disponible'),
(4, 'Bambu Lab A1 Mini',       'BAM-3D-010',   NULL,           'Impresora FDM rapida CoreXY',               'baja');

-- Usuarios ------------------------------------------------------------
INSERT INTO usuarios (nombre, correo) VALUES
('Maria Gomez Lopez',   'maria.gomez@udea.edu.co'),
('Juan Restrepo Perez', 'juan.restrepo@udea.edu.co'),
('Ana Torres Quintero', 'ana.torres@udea.edu.co');

-- Reservas ------------------------------------------------------------
-- Deterministic timestamps relative to a fixed demo date so the dataset is
-- stable regardless of when migrations run. Some past, some future, one
-- cancelled. usuario ids: 1,2,3 ; equipo ids: 1..10.
INSERT INTO reservas (id_equipo, id_usuario, fecha_hora_inicio, fecha_hora_fin, estado, motivo) VALUES
(1, 1, '2026-08-04 09:00:00', '2026-08-04 13:00:00', 'COMPLETADA',  'Practica de IoT semanal'),
(4, 2, '2026-08-06 14:00:00', '2026-08-06 17:00:00', 'ACTIVA',      'Sesion de prototipado VR'),
(6, 3, '2026-08-10 08:00:00', '2026-08-10 10:00:00', 'ACTIVA',      'Configuracion de red de laboratorio'),
(2, 1, '2026-08-11 15:00:00', '2026-08-11 19:00:00', 'ACTIVA',      'Proyecto ESP32BLE'),
(3, 2, '2026-08-05 10:00:00', '2026-08-05 12:00:00', 'CANCELADA',   'Suspendido por mantenimiento');
