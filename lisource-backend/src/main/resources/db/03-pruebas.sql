-- ============================================================================
-- 03-pruebas.sql
-- VERSION FINAL SIN TABLAS TEMPORALES · 2026-08-09
-- LISource · Sistema de Gestión y Reservas de Equipos del LIS
-- Dataset integral DEMO / QA
--
-- PRERREQUISITOS:
--   1. Ejecutar 01-estructura.sql
--   2. Ejecutar 02-semilla.sql
--   3. Ejecutar este archivo
--
-- OBJETIVO:
--   Poblar TODAS las tablas transaccionales con datos ficticios, coherentes y
--   variados para demostrar frontend, backend, seguridad, reservas, filtros,
--   estadísticas, sesiones, recuperación de contraseña y auditoría.
--
-- CREA / GARANTIZA:
--   * 12 usuarios demo con autenticación local, Google, dual e inactiva.
--   * 15 asignaciones de rol activas/inactivas.
--   * 10 sesiones activas, revocadas y expiradas.
--   * 6 recuperaciones de contraseña en distintos estados.
--   * 30 equipos distribuidos entre las 5 categorías base y 4 estados.
--   * 40 reservas: históricas, actuales, futuras, canceladas y multi-equipo.
--   * 47 relaciones reserva-equipo.
--   * auditoría abundante y sin almacenar secretos.
--   * verificaciones SQL para confirmar que las 20 tablas quedan utilizables.
--   * validación de que el dataset confirmado NO contiene solapamientos.
--
-- IMPORTANTE:
--   Este dataset es ficticio. Las credenciales siguientes son exclusivamente
--   para desarrollo, QA y demostración. No deben reutilizarse en producción.
--
-- CREDENCIALES DEMO
--   admin.demo@udea.edu.co           / DemoAdmin2026!
--   usuario.demo@udea.edu.co         / DemoUsuario2026!
--   reservas.demo@udea.edu.co        / DemoReservas2026!
--   dual.demo@udea.edu.co            / DemoDual2026!
--   inactivo.demo@udea.edu.co        / DemoInactivo2026!
--   google.demo@udea.edu.co          / SOLO GOOGLE (sin contraseña local)
--   ingles.demo@udea.edu.co          / DemoEnglish2026!
--   soporte.demo@udea.edu.co         / DemoSoporte2026!
--   redes.demo@udea.edu.co           / DemoRedes2026!
--   vr.demo@udea.edu.co              / DemoVr2026!
--   iot.demo@udea.edu.co             / DemoIot2026!
--   google2.demo@udea.edu.co         / SOLO GOOGLE (sin contraseña local)
--
-- TOKENS DEMO EN TEXTO PLANO
--   La base de datos almacena únicamente SHA-256; estos valores son para QA.
--   refresh admin:      demo-refresh-admin-2026-08
--   refresh usuario:    demo-refresh-usuario-2026-08
--   reset usuario:      demo-reset-usuario-pendiente-2026-08
--   reset VR:           demo-reset-vr-pendiente-2026-08
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. PRECONDICIÓN DE EJECUCIÓN
-- ============================================================================
-- Este archivo está diseñado para ejecutarse EXCLUSIVAMENTE después de:
--   01-estructura.sql  -> elimina/recrea toda la estructura LISource
--   02-semilla.sql     -> carga los catálogos y configuraciones base
--
-- Por esa razón NO realiza limpieza previa, NO crea tablas temporales y NO
-- intenta reutilizar datos de una ejecución anterior. El flujo oficial es
-- siempre 01 -> 02 -> 03 sobre una base recién reconstruida.

-- ============================================================================
-- 1. USUARIOS DEMO
-- ============================================================================

INSERT INTO tbl_usuario (
    correo,
    password_hash,
    google_sub,
    nombres,
    apellidos,
    id_estado_usuario,
    id_idioma,
    fecha_creacion,
    fecha_actualizacion,
    fecha_cambio_password,
    ultimo_acceso
)
VALUES
(
    'admin.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$fZJb2On0p28sNt8QFy8CEA$Y/Lp0mAV+d5x82R8w6I8yotg3mCWj6MtkJpDYyQ91qo',
    NULL,
    'Ana',
    'Administradora',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '180 days',
    now(),
    now() - interval '180 days',
    now() + (-5) * interval '1 minute'
),
(
    'usuario.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$WDurr/GByAqQMv1IlKhfLw$KlmCJ57fbwZoBDdMYRIZtB295cDYo0TeJEZrM0lWQRc',
    NULL,
    'Carlos',
    'Usuario',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '150 days',
    now(),
    now() - interval '150 days',
    now() + (-30) * interval '1 minute'
),
(
    'reservas.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$8lPSOxbgzBT8JcB5tphLdg$bKSkGkCVHOeeBEpNMTV2WaxWBewCaMSDubLHIlEmpyE',
    NULL,
    'Laura',
    'Reservas',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '145 days',
    now(),
    now() - interval '145 days',
    now() + (-60) * interval '1 minute'
),
(
    'dual.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$sZ5oShDSBjGjSWhZ+eR32A$N68XZPpIqTNEdPNKFc8yRoJJgY6SdOlUXbhi6l3fd4s',
    'google-demo-sub-dual-0001',
    'Diana',
    'Dual',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '130 days',
    now(),
    now() - interval '130 days',
    now() + (-120) * interval '1 minute'
),
(
    'inactivo.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$3E5un02uhOQTr9kuG6Tkxg$O1a63kRd5cxnNkETTmu4vut17s0npZYwLeztNIkXRvo',
    NULL,
    'Iván',
    'Inactivo',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'INACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '120 days',
    now(),
    now() - interval '120 days',
    NULL
),
(
    'google.demo@udea.edu.co',
    NULL,
    'google-demo-sub-only-0002',
    'Gabriela',
    'Google',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '100 days',
    now(),
    NULL,
    now() + (-45) * interval '1 minute'
),
(
    'ingles.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$lQloHR0iB8swwdWQ1e+Mig$yzWLSZCG7deV3HfnxBfor2fZp8gRZ7yLseFbixHYUhY',
    NULL,
    'Emily',
    'Language',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'en'),
    now() - interval '95 days',
    now(),
    now() - interval '95 days',
    now() + (-90) * interval '1 minute'
),
(
    'soporte.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$aXPEQARK5xI14DudQFhTuQ$AmrD57w//GrfPfVrOHTJWkaj9v2qGW4mOtTC97aJ/Ok',
    NULL,
    'Sofía',
    'Soporte',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '90 days',
    now(),
    now() - interval '90 days',
    now() + (-20) * interval '1 minute'
),
(
    'redes.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$k/KIzQ1GcV/0dnCGzxijyQ$LptOUYpqZagbozM92a5OgZHJbwyffj5eXV0oCgTMlj8',
    NULL,
    'René',
    'Redes',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '80 days',
    now(),
    now() - interval '80 days',
    now() + (-25) * interval '1 minute'
),
(
    'vr.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$GpMtsMzJNhSTizWgS9DNJA$RysDtnRUCKbTbLA30vpFPDwABwLw5RiDO43MdScj13w',
    NULL,
    'Valentina',
    'Realidad',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '75 days',
    now(),
    now() - interval '75 days',
    now() + (-35) * interval '1 minute'
),
(
    'iot.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$qekwoH/QuFb3kBZXNlyQ7w$eNVyw3T5GJOAVL0FegnRkJGY2sYz7lEF4NyJ+Zkep28',
    NULL,
    'Isaac',
    'IoT',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '70 days',
    now(),
    now() - interval '70 days',
    now() + (-40) * interval '1 minute'
),
(
    'google2.demo@udea.edu.co',
    NULL,
    'google-demo-sub-only-0003',
    'George',
    'Cloud',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'en'),
    now() - interval '60 days',
    now(),
    NULL,
    now() + (-55) * interval '1 minute'
);

-- ============================================================================
-- 2. ROLES DEMO
-- ============================================================================

WITH asignaciones(correo, rol_codigo, estado_codigo, dias_atras) AS (
    VALUES
    ('admin.demo@udea.edu.co', 'ADMINISTRADOR', 'ACTIVO', 170),
    ('admin.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 170),
    ('usuario.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 145),
    ('reservas.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 140),
    ('dual.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 125),
    ('dual.demo@udea.edu.co', 'ADMINISTRADOR', 'ACTIVO', 120),
    ('inactivo.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 115),
    ('google.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 95),
    ('ingles.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 90),
    ('soporte.demo@udea.edu.co', 'ADMINISTRADOR', 'ACTIVO', 85),
    ('soporte.demo@udea.edu.co', 'USUARIO', 'INACTIVO', 40),
    ('redes.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 75),
    ('vr.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 70),
    ('iot.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 65),
    ('google2.demo@udea.edu.co', 'USUARIO', 'ACTIVO', 55)
)
INSERT INTO tbl_usuario_rol (
    id_usuario,
    id_rol,
    id_estado_registro,
    fecha_asignacion,
    fecha_actualizacion
)
SELECT
    u.id_usuario,
    r.id_rol,
    er.id_estado_registro,
    now() - (a.dias_atras * interval '1 day'),
    now()
FROM asignaciones a
JOIN tbl_usuario u
  ON u.correo = a.correo
JOIN tbl_rol r
  ON r.codigo = a.rol_codigo
JOIN tbl_estado_registro er
  ON er.codigo = a.estado_codigo;


-- ============================================================================
-- 3. SESIONES / REFRESH TOKENS DEMO
-- ============================================================================

INSERT INTO tbl_sesion (
    id_usuario,
    refresh_token_hash,
    fecha_creacion,
    fecha_expiracion,
    fecha_ultimo_uso,
    fecha_revocacion,
    ip_origen,
    user_agent
)
VALUES
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    '8030d581edb1c044d3d19505d88c884be4482f7f7bc8c77d2f13a9929a726855',
    now() + (-1440) * interval '1 minute',
    now() + (8640) * interval '1 minute',
    now() + (-5) * interval '1 minute',
    NULL,
    '192.0.2.10',
    'LISource QA / Admin Chrome'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    'c2ad99d844598bec677e730d01c7b074bb3449c42bb5c146db85656fc776f50a',
    now() + (-2880) * interval '1 minute',
    now() + (7200) * interval '1 minute',
    now() + (-30) * interval '1 minute',
    NULL,
    '192.0.2.20',
    'LISource QA / Usuario Edge'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    '408cee616491d5efa3166165ddcdcd3171eca11f623673c5cecf50912aafa2a3',
    now() + (-5760) * interval '1 minute',
    now() + (4320) * interval '1 minute',
    now() + (-2880) * interval '1 minute',
    now() + (-1440) * interval '1 minute',
    '192.0.2.30',
    'LISource QA / Sesión revocada'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    'b1bf84fc6ec3b7ef4e013b0cc41604dcd5e632f4f0881004dc0aa301432ac3a2',
    now() + (-11520) * interval '1 minute',
    now() + (-60) * interval '1 minute',
    now() + (-10080) * interval '1 minute',
    NULL,
    '192.0.2.40',
    'LISource QA / Sesión expirada'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'soporte.demo@udea.edu.co'),
    '72959534f712b28070145e0d7e89297b5b28497401b04cf9fa4d718633953f60',
    now() + (-720) * interval '1 minute',
    now() + (9360) * interval '1 minute',
    now() + (-20) * interval '1 minute',
    NULL,
    '192.0.2.50',
    'LISource QA / Soporte Firefox'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'redes.demo@udea.edu.co'),
    'b0b97710137f17cdccbfa1ec04344df0befe703ffd03c24967b2c25612c8bd5a',
    now() + (-4320) * interval '1 minute',
    now() + (5760) * interval '1 minute',
    now() + (-25) * interval '1 minute',
    NULL,
    '192.0.2.60',
    'LISource QA / Redes Chrome'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    '19a588228f3fb01c4d5c67bcb5aab338a13267a1a366b867f1ae9d722447b5af',
    now() + (-8640) * interval '1 minute',
    now() + (1440) * interval '1 minute',
    now() + (-5760) * interval '1 minute',
    now() + (-2880) * interval '1 minute',
    '192.0.2.70',
    'LISource QA / VR revocada'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    '512629b7da8ff7d695d09698edaa0a29877f2dfeae77ae9c8fa082aa61f2fad5',
    now() + (-14400) * interval '1 minute',
    now() + (-2880) * interval '1 minute',
    now() + (-4320) * interval '1 minute',
    NULL,
    '192.0.2.80',
    'LISource QA / IoT expirada'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    '4fc84692c5792629af41f102b15806a888ca817abad2b94b33ab652c1cd6e38d',
    now() + (-1440) * interval '1 minute',
    now() + (8640) * interval '1 minute',
    now() + (-90) * interval '1 minute',
    NULL,
    '192.0.2.90',
    'LISource QA / English locale'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    '8f75906515e54f5e47f6453b78728f46d155124bf58edfc65c0eb68c5fed6217',
    now() + (-360) * interval '1 minute',
    now() + (9720) * interval '1 minute',
    now() + (-45) * interval '1 minute',
    NULL,
    '192.0.2.100',
    'LISource QA / Google SSO'
);

-- ============================================================================
-- 4. RECUPERACIÓN DE CONTRASEÑA DEMO
-- ============================================================================

INSERT INTO tbl_recuperacion_password (
    id_usuario,
    token_hash,
    fecha_solicitud,
    fecha_expiracion,
    fecha_uso,
    fecha_revocacion,
    ip_solicitud,
    user_agent
)
VALUES
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    'ba9d1356315637723c6ed351f8b0e31d654e40de6ac41e1e60a1e9ff4f864406',
    now() + (-5) * interval '1 minute',
    now() + (25) * interval '1 minute',
    NULL,
    NULL,
    '192.0.2.20',
    'LISource QA / Reset pendiente'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    '68af0d47b58d406b0c00dc09e78783137fe25cd6be1125e010265e6604c52969',
    now() + (-4320) * interval '1 minute',
    now() + (-4260) * interval '1 minute',
    now() + (-4290) * interval '1 minute',
    NULL,
    '192.0.2.30',
    'LISource QA / Reset usado'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    'cce9833c450595acea7a207102e67db2dcef24c5bf84b2436d6fcbabc43683ad',
    now() + (-1440) * interval '1 minute',
    now() + (1440) * interval '1 minute',
    NULL,
    now() + (-1200) * interval '1 minute',
    '192.0.2.40',
    'LISource QA / Reset revocado'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'redes.demo@udea.edu.co'),
    '9a456dc35cbdfaf23aa56f9e7d919c948a667ea4b6a88c99d4a64364151ccbc7',
    now() + (-2880) * interval '1 minute',
    now() + (-2820) * interval '1 minute',
    NULL,
    NULL,
    '192.0.2.60',
    'LISource QA / Reset expirado'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    '7dcc1171715dcc817055d1123f09f0168d039dd6f58518de1f6642fc482121b4',
    now() + (-10) * interval '1 minute',
    now() + (20) * interval '1 minute',
    NULL,
    NULL,
    '192.0.2.70',
    'LISource QA / Segundo reset pendiente'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    '01eb5bb1830dde086359a70c3193f6c83d7cae8602151d504821a8d529a806f9',
    now() + (-7200) * interval '1 minute',
    now() + (-7140) * interval '1 minute',
    now() + (-7170) * interval '1 minute',
    NULL,
    '192.0.2.80',
    'LISource QA / Segundo reset usado'
);

-- ============================================================================
-- 5. EQUIPOS DEMO
-- ============================================================================

WITH datos (
    codigo_inventario,
    nombre,
    descripcion,
    numero_serie,
    direccion_mac,
    categoria_codigo,
    estado_codigo,
    ubicacion_codigo
) AS (
    VALUES
        ('DEMO-MCU-001', 'Arduino UNO R4 WiFi', 'Placa Arduino para prácticas de electrónica, control y sistemas embebidos.', 'DEMO-ARD-R4-001', NULL, 'MICROCONTROLADORES', 'OPERATIVO', 'SALA_4'),
        ('DEMO-MCU-002', 'ESP32 DevKit', 'Placa ESP32 con WiFi y Bluetooth para prácticas IoT.', 'DEMO-ESP32-002', '02:00:00:00:01:02', 'MICROCONTROLADORES', 'OPERATIVO', 'SALA_4'),
        ('DEMO-MCU-003', 'Raspberry Pi Pico W', 'Microcontrolador inalámbrico en mantenimiento preventivo.', 'DEMO-PICO-003', NULL, 'MICROCONTROLADORES', 'MANTENIMIENTO', 'ALMACEN_LIS'),
        ('DEMO-MCU-004', 'STM32 Nucleo F446RE', 'Tarjeta STM32 para prácticas de sistemas embebidos.', 'DEMO-STM32-004', NULL, 'MICROCONTROLADORES', 'OPERATIVO', 'SALA_4'),
        ('DEMO-MCU-005', 'Arduino Mega 2560', 'Placa con múltiples entradas y salidas para prototipos académicos.', 'DEMO-MEGA-005', NULL, 'MICROCONTROLADORES', 'OPERATIVO', 'SALA_4'),
        ('DEMO-MCU-006', 'Teensy 4.1', 'Placa de alto desempeño temporalmente fuera de servicio.', 'DEMO-TEENSY-006', NULL, 'MICROCONTROLADORES', 'FUERA_SERVICIO', 'ALMACEN_LIS'),
        ('DEMO-VR-001', 'Meta Quest 3', 'Visor de realidad virtual para experiencias inmersivas.', 'DEMO-QUEST3-001', NULL, 'REALIDAD_VIRTUAL', 'OPERATIVO', 'SALA_VR'),
        ('DEMO-VR-002', 'Meta Quest 2', 'Visor en mantenimiento preventivo.', 'DEMO-QUEST2-002', NULL, 'REALIDAD_VIRTUAL', 'MANTENIMIENTO', 'SALA_VR'),
        ('DEMO-VR-003', 'HTC Vive Pro 2', 'Sistema VR para prácticas de interacción y visualización.', 'DEMO-VIVE-003', NULL, 'REALIDAD_VIRTUAL', 'OPERATIVO', 'SALA_VR'),
        ('DEMO-VR-004', 'Pico 4 Enterprise', 'Visor empresarial para demostraciones y laboratorios.', 'DEMO-PICO4-004', NULL, 'REALIDAD_VIRTUAL', 'OPERATIVO', 'SALA_VR'),
        ('DEMO-VR-005', 'Valve Index', 'Equipo retirado conservado para trazabilidad histórica.', 'DEMO-INDEX-005', NULL, 'REALIDAD_VIRTUAL', 'RETIRADO', 'ALMACEN_LIS'),
        ('DEMO-RED-001', 'Cisco Catalyst 2960', 'Switch administrable para prácticas de switching.', 'DEMO-CISCO-2960-001', '02:00:00:10:00:01', 'REDES', 'OPERATIVO', 'RACK_REDES'),
        ('DEMO-RED-002', 'MikroTik hEX', 'Router compacto para routing, firewall y redes.', 'DEMO-MIKROTIK-002', '02:00:00:10:00:02', 'REDES', 'OPERATIVO', 'RACK_REDES'),
        ('DEMO-RED-003', 'Ubiquiti UniFi Access Point', 'Punto de acceso para prácticas de conectividad inalámbrica.', 'DEMO-UNIFI-003', '02:00:00:10:00:03', 'REDES', 'OPERATIVO', 'RACK_REDES'),
        ('DEMO-RED-004', 'TP-Link Managed Switch', 'Switch administrable temporalmente fuera de servicio.', 'DEMO-TPLINK-004', '02:00:00:10:00:04', 'REDES', 'FUERA_SERVICIO', 'ALMACEN_LIS'),
        ('DEMO-RED-005', 'Cisco ISR 4321', 'Router empresarial para laboratorios de WAN.', 'DEMO-CISCO-ISR-005', '02:00:00:10:00:05', 'REDES', 'OPERATIVO', 'RACK_REDES'),
        ('DEMO-RED-006', 'Fortinet FortiGate 60F', 'Appliance para prácticas controladas de seguridad de red.', 'DEMO-FGT-006', '02:00:00:10:00:06', 'REDES', 'OPERATIVO', 'RACK_REDES'),
        ('DEMO-RED-007', 'Aruba 2930F', 'Switch administrable en mantenimiento programado.', 'DEMO-ARUBA-007', '02:00:00:10:00:07', 'REDES', 'MANTENIMIENTO', 'RACK_REDES'),
        ('DEMO-COM-001', 'Intel NUC', 'Mini PC para virtualización y desarrollo.', 'DEMO-NUC-001', '02:00:00:20:00:01', 'COMPUTO', 'OPERATIVO', 'SALA_4'),
        ('DEMO-COM-002', 'Lenovo ThinkPad', 'Portátil de laboratorio destinado a desarrollo y pruebas.', 'DEMO-THINKPAD-002', '02:00:00:20:00:02', 'COMPUTO', 'OPERATIVO', 'SALA_4'),
        ('DEMO-COM-003', 'NVIDIA Jetson Nano', 'Equipo embebido retirado conservado históricamente.', 'DEMO-JETSON-003', '02:00:00:20:00:03', 'COMPUTO', 'RETIRADO', 'ALMACEN_LIS'),
        ('DEMO-COM-004', 'Dell OptiPlex Micro', 'Mini PC para laboratorios de sistemas operativos.', 'DEMO-DELL-004', '02:00:00:20:00:04', 'COMPUTO', 'OPERATIVO', 'SALA_4'),
        ('DEMO-COM-005', 'Mac mini M2', 'Equipo de cómputo para desarrollo multiplataforma.', 'DEMO-MACMINI-005', '02:00:00:20:00:05', 'COMPUTO', 'OPERATIVO', 'SALA_4'),
        ('DEMO-COM-006', 'NVIDIA Jetson Orin Nano', 'Equipo para IA en el borde, actualmente en mantenimiento.', 'DEMO-ORIN-006', '02:00:00:20:00:06', 'COMPUTO', 'MANTENIMIENTO', 'SALA_4'),
        ('DEMO-IOT-001', 'Kit de Sensores IoT', 'Kit académico con sensores ambientales y actuadores.', 'DEMO-IOT-KIT-001', NULL, 'IOT', 'OPERATIVO', 'SALA_4'),
        ('DEMO-IOT-002', 'Gateway LoRa', 'Gateway para prácticas LPWAN y telemetría.', 'DEMO-LORA-002', '02:00:00:30:00:02', 'IOT', 'OPERATIVO', 'RACK_REDES'),
        ('DEMO-IOT-003', 'Raspberry Pi 4', 'Computador de placa reducida para prototipos IoT.', 'DEMO-RPI4-003', '02:00:00:30:00:03', 'IOT', 'OPERATIVO', 'SALA_4'),
        ('DEMO-IOT-004', 'Coordinador Zigbee', 'Coordinador para redes de sensores Zigbee.', 'DEMO-ZIGBEE-004', '02:00:00:30:00:04', 'IOT', 'OPERATIVO', 'SALA_4'),
        ('DEMO-IOT-005', 'Kit ESP8266', 'Conjunto de placas WiFi para prototipos conectados.', 'DEMO-ESP8266-005', NULL, 'IOT', 'OPERATIVO', 'SALA_4'),
        ('DEMO-IOT-006', 'Siemens LOGO! 8', 'Controlador compacto para automatización e integración IoT.', 'DEMO-LOGO8-006', '02:00:00:30:00:06', 'IOT', 'OPERATIVO', 'SALA_4')
)
INSERT INTO tbl_equipo (
    codigo_inventario,
    nombre,
    descripcion,
    numero_serie,
    direccion_mac,
    imagen_url,
    id_categoria_equipo,
    id_estado_equipo,
    id_ubicacion,
    fecha_creacion,
    fecha_actualizacion
)
SELECT
    d.codigo_inventario,
    d.nombre,
    d.descripcion,
    d.numero_serie,
    d.direccion_mac,
    NULL,
    ce.id_categoria_equipo,
    ee.id_estado_equipo,
    u.id_ubicacion,
    now() - interval '180 days',
    now()
FROM datos d
JOIN tbl_categoria_equipo ce
  ON ce.codigo = d.categoria_codigo
JOIN tbl_estado_equipo ee
  ON ee.codigo = d.estado_codigo
JOIN tbl_ubicacion u
  ON u.codigo = d.ubicacion_codigo;


-- ============================================================================
-- 6. RESERVAS DEMO
-- ============================================================================
-- Las reservas CONFIRMADAS se diseñaron sin solapamientos por equipo.
-- Las CANCELADAS sí pueden coincidir temporalmente para demostrar que no bloquean.

-- DEMO-RES-001: Reserva histórica QA #001 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-001',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-129000) * interval '1 minute',
    now() + (-128850) * interval '1 minute',
    'Reserva histórica QA #001 para alimentar listados, historial y estadísticas.',
    now() + (-130440) * interval '1 minute',
    now()
);

-- DEMO-RES-002: Reserva histórica QA #002 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-002',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-120360) * interval '1 minute',
    now() + (-120180) * interval '1 minute',
    'Reserva histórica QA #002 para alimentar listados, historial y estadísticas.',
    now() + (-121800) * interval '1 minute',
    now()
);

-- DEMO-RES-003: Reserva histórica QA #003 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-003',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-111720) * interval '1 minute',
    now() + (-111600) * interval '1 minute',
    'Reserva histórica QA #003 para alimentar listados, historial y estadísticas.',
    now() + (-113160) * interval '1 minute',
    now()
);

-- DEMO-RES-004: Reserva histórica QA #004 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-004',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'redes.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-103080) * interval '1 minute',
    now() + (-102930) * interval '1 minute',
    'Reserva histórica QA #004 para alimentar listados, historial y estadísticas.',
    now() + (-104520) * interval '1 minute',
    now()
);

-- DEMO-RES-005: Reserva histórica QA #005 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-005',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-94440) * interval '1 minute',
    now() + (-94260) * interval '1 minute',
    'Reserva histórica QA #005 para alimentar listados, historial y estadísticas.',
    now() + (-95880) * interval '1 minute',
    now()
);

-- DEMO-RES-006: Reserva histórica QA #006 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-006',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-85800) * interval '1 minute',
    now() + (-85680) * interval '1 minute',
    'Reserva histórica QA #006 para alimentar listados, historial y estadísticas.',
    now() + (-87240) * interval '1 minute',
    now()
);

-- DEMO-RES-007: Reserva histórica QA #007 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-007',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-77160) * interval '1 minute',
    now() + (-77010) * interval '1 minute',
    'Reserva histórica QA #007 para alimentar listados, historial y estadísticas.',
    now() + (-78600) * interval '1 minute',
    now()
);

-- DEMO-RES-008: Reserva histórica QA #008 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-008',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-68520) * interval '1 minute',
    now() + (-68340) * interval '1 minute',
    'Reserva histórica QA #008 para alimentar listados, historial y estadísticas.',
    now() + (-69960) * interval '1 minute',
    now()
);

-- DEMO-RES-009: Reserva histórica QA #009 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-009',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-59880) * interval '1 minute',
    now() + (-59760) * interval '1 minute',
    'Reserva histórica QA #009 para alimentar listados, historial y estadísticas.',
    now() + (-61320) * interval '1 minute',
    now()
);

-- DEMO-RES-010: Reserva histórica QA #010 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-010',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-51240) * interval '1 minute',
    now() + (-51090) * interval '1 minute',
    'Reserva histórica QA #010 para alimentar listados, historial y estadísticas.',
    now() + (-52680) * interval '1 minute',
    now()
);

-- DEMO-RES-011: Reserva histórica QA #011 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-011',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-42600) * interval '1 minute',
    now() + (-42420) * interval '1 minute',
    'Reserva histórica QA #011 para alimentar listados, historial y estadísticas.',
    now() + (-44040) * interval '1 minute',
    now()
);

-- DEMO-RES-012: Reserva histórica QA #012 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-012',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'redes.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-39720) * interval '1 minute',
    now() + (-39600) * interval '1 minute',
    'Reserva histórica QA #012 para alimentar listados, historial y estadísticas.',
    now() + (-41160) * interval '1 minute',
    now()
);

-- DEMO-RES-013: Reserva histórica QA #013 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-013',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-36840) * interval '1 minute',
    now() + (-36690) * interval '1 minute',
    'Reserva histórica QA #013 para alimentar listados, historial y estadísticas.',
    now() + (-38280) * interval '1 minute',
    now()
);

-- DEMO-RES-014: Reserva histórica QA #014 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-014',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-33960) * interval '1 minute',
    now() + (-33780) * interval '1 minute',
    'Reserva histórica QA #014 para alimentar listados, historial y estadísticas.',
    now() + (-35400) * interval '1 minute',
    now()
);

-- DEMO-RES-015: Reserva histórica QA #015 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-015',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-31080) * interval '1 minute',
    now() + (-30960) * interval '1 minute',
    'Reserva histórica QA #015 para alimentar listados, historial y estadísticas.',
    now() + (-32520) * interval '1 minute',
    now()
);

-- DEMO-RES-016: Reserva histórica QA #016 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-016',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-28200) * interval '1 minute',
    now() + (-28050) * interval '1 minute',
    'Reserva histórica QA #016 para alimentar listados, historial y estadísticas.',
    now() + (-29640) * interval '1 minute',
    now()
);

-- DEMO-RES-017: Reserva histórica QA #017 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-017',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-25320) * interval '1 minute',
    now() + (-25140) * interval '1 minute',
    'Reserva histórica QA #017 para alimentar listados, historial y estadísticas.',
    now() + (-26760) * interval '1 minute',
    now()
);

-- DEMO-RES-018: Reserva histórica QA #018 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-018',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-22440) * interval '1 minute',
    now() + (-22320) * interval '1 minute',
    'Reserva histórica QA #018 para alimentar listados, historial y estadísticas.',
    now() + (-23880) * interval '1 minute',
    now()
);

-- DEMO-RES-019: Reserva histórica QA #019 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-019',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-19560) * interval '1 minute',
    now() + (-19410) * interval '1 minute',
    'Reserva histórica QA #019 para alimentar listados, historial y estadísticas.',
    now() + (-21000) * interval '1 minute',
    now()
);

-- DEMO-RES-020: Reserva histórica QA #020 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-020',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'redes.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-16680) * interval '1 minute',
    now() + (-16500) * interval '1 minute',
    'Reserva histórica QA #020 para alimentar listados, historial y estadísticas.',
    now() + (-18120) * interval '1 minute',
    now()
);

-- DEMO-RES-021: Reserva histórica QA #021 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-021',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-13800) * interval '1 minute',
    now() + (-13680) * interval '1 minute',
    'Reserva histórica QA #021 para alimentar listados, historial y estadísticas.',
    now() + (-15240) * interval '1 minute',
    now()
);

-- DEMO-RES-022: Reserva histórica QA #022 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-022',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-10920) * interval '1 minute',
    now() + (-10770) * interval '1 minute',
    'Reserva histórica QA #022 para alimentar listados, historial y estadísticas.',
    now() + (-12360) * interval '1 minute',
    now()
);

-- DEMO-RES-023: Reserva histórica QA #023 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-023',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-8040) * interval '1 minute',
    now() + (-7860) * interval '1 minute',
    'Reserva histórica QA #023 para alimentar listados, historial y estadísticas.',
    now() + (-9480) * interval '1 minute',
    now()
);

-- DEMO-RES-024: Reserva histórica QA #024 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-024',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-5160) * interval '1 minute',
    now() + (-5040) * interval '1 minute',
    'Reserva histórica QA #024 para alimentar listados, historial y estadísticas.',
    now() + (-6600) * interval '1 minute',
    now()
);

-- DEMO-RES-025: Reserva histórica QA #025 para alimentar listados, historial y estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-025',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-2280) * interval '1 minute',
    now() + (-2130) * interval '1 minute',
    'Reserva histórica QA #025 para alimentar listados, historial y estadísticas.',
    now() + (-3720) * interval '1 minute',
    now()
);

-- DEMO-RES-026: Reserva vigente de red para demostrar estado RESERVADO.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-026',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-30) * interval '1 minute',
    now() + (90) * interval '1 minute',
    'Reserva vigente de red para demostrar estado RESERVADO.',
    now() + (-2880) * interval '1 minute',
    now()
);

-- DEMO-RES-027: Reserva vigente de realidad virtual.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-027',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-15) * interval '1 minute',
    now() + (60) * interval '1 minute',
    'Reserva vigente de realidad virtual.',
    now() + (-1440) * interval '1 minute',
    now()
);

-- DEMO-RES-028: Reserva vigente de equipo de cómputo.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-028',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-45) * interval '1 minute',
    now() + (135) * interval '1 minute',
    'Reserva vigente de equipo de cómputo.',
    now() + (-2160) * interval '1 minute',
    now()
);

-- DEMO-RES-029: Reserva vigente de microcontrolador usada en integración.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-029',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (-60) * interval '1 minute',
    now() + (90) * interval '1 minute',
    'Reserva vigente de microcontrolador usada en integración.',
    now() + (-1800) * interval '1 minute',
    now()
);

-- DEMO-RES-030: Reserva consecutiva que empieza exactamente al terminar DEMO-RES-027; demuestra [inicio, fin).
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-030',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (60) * interval '1 minute',
    now() + (180) * interval '1 minute',
    'Reserva consecutiva que empieza exactamente al terminar DEMO-RES-027; demuestra [inicio, fin).',
    now() + (-30) * interval '1 minute',
    now()
);

-- DEMO-RES-031: Reserva futura multi-equipo de microcontroladores.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-031',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (1440) * interval '1 minute',
    now() + (1620) * interval '1 minute',
    'Reserva futura multi-equipo de microcontroladores.',
    now() + (-60) * interval '1 minute',
    now()
);

-- DEMO-RES-032: Reserva futura multi-equipo IoT.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-032',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (2880) * interval '1 minute',
    now() + (3060) * interval '1 minute',
    'Reserva futura multi-equipo IoT.',
    now() + (-50) * interval '1 minute',
    now()
);

-- DEMO-RES-033: Reserva futura de router empresarial.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-033',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'redes.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (4320) * interval '1 minute',
    now() + (4440) * interval '1 minute',
    'Reserva futura de router empresarial.',
    now() + (-40) * interval '1 minute',
    now()
);

-- DEMO-RES-034: Reserva futura de visor VR.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-034',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'vr.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (5760) * interval '1 minute',
    now() + (5880) * interval '1 minute',
    'Reserva futura de visor VR.',
    now() + (-35) * interval '1 minute',
    now()
);

-- DEMO-RES-035: Reserva futura multi-equipo de cómputo para demostración administrativa.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-035',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (7200) * interval '1 minute',
    now() + (7380) * interval '1 minute',
    'Reserva futura multi-equipo de cómputo para demostración administrativa.',
    now() + (-30) * interval '1 minute',
    now()
);

-- DEMO-RES-036: Reserva futura de coordinador Zigbee.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-036',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'iot.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + (8640) * interval '1 minute',
    now() + (8760) * interval '1 minute',
    'Reserva futura de coordinador Zigbee.',
    now() + (-25) * interval '1 minute',
    now()
);

-- DEMO-RES-037: Reserva cancelada que se solapa con una vigente sin bloquear disponibilidad.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion,
    fecha_cancelacion, id_usuario_cancelacion, motivo_cancelacion
)
VALUES (
    'DEMO-RES-037',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CANCELADA'),
    now() + (-30) * interval '1 minute',
    now() + (90) * interval '1 minute',
    'Reserva cancelada que se solapa con una vigente sin bloquear disponibilidad.',
    now() + (-3000) * interval '1 minute',
    now() + (-1440) * interval '1 minute',
    now() + (-1440) * interval '1 minute',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    'Cambio de agenda del usuario.'
);

-- DEMO-RES-038: Reserva cancelada sobre los mismos microcontroladores de una reserva futura confirmada.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion,
    fecha_cancelacion, id_usuario_cancelacion, motivo_cancelacion
)
VALUES (
    'DEMO-RES-038',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CANCELADA'),
    now() + (1440) * interval '1 minute',
    now() + (1620) * interval '1 minute',
    'Reserva cancelada sobre los mismos microcontroladores de una reserva futura confirmada.',
    now() + (-2880) * interval '1 minute',
    now() + (-60) * interval '1 minute',
    now() + (-60) * interval '1 minute',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    'Se liberó la práctica antes de su inicio.'
);

-- DEMO-RES-039: Reserva histórica cancelada de VR.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion,
    fecha_cancelacion, id_usuario_cancelacion, motivo_cancelacion
)
VALUES (
    'DEMO-RES-039',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CANCELADA'),
    now() + (-21000) * interval '1 minute',
    now() + (-20880) * interval '1 minute',
    'Reserva histórica cancelada de VR.',
    now() + (-23040) * interval '1 minute',
    now() + (-21300) * interval '1 minute',
    now() + (-21300) * interval '1 minute',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    'La sesión académica fue reprogramada.'
);

-- DEMO-RES-040: Reserva cancelada de cómputo que no debe afectar la franja confirmada.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion,
    fecha_cancelacion, id_usuario_cancelacion, motivo_cancelacion
)
VALUES (
    'DEMO-RES-040',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CANCELADA'),
    now() + (60) * interval '1 minute',
    now() + (240) * interval '1 minute',
    'Reserva cancelada de cómputo que no debe afectar la franja confirmada.',
    now() + (-1440) * interval '1 minute',
    now() + (-120) * interval '1 minute',
    now() + (-120) * interval '1 minute',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'ingles.demo@udea.edu.co'),
    'Reserva duplicada cancelada por el usuario.'
);

-- ============================================================================
-- 7. EQUIPOS ASOCIADOS A RESERVAS
-- ============================================================================

WITH pares(codigo_reserva, codigo_equipo) AS (
    VALUES
        ('DEMO-RES-001', 'DEMO-MCU-001'),
        ('DEMO-RES-002', 'DEMO-RED-001'),
        ('DEMO-RES-003', 'DEMO-VR-001'),
        ('DEMO-RES-004', 'DEMO-MCU-001'),
        ('DEMO-RES-005', 'DEMO-COM-001'),
        ('DEMO-RES-006', 'DEMO-RED-001'),
        ('DEMO-RES-007', 'DEMO-IOT-001'),
        ('DEMO-RES-008', 'DEMO-MCU-001'),
        ('DEMO-RES-009', 'DEMO-VR-001'),
        ('DEMO-RES-010', 'DEMO-RED-001'),
        ('DEMO-RES-011', 'DEMO-MCU-001'),
        ('DEMO-RES-011', 'DEMO-MCU-002'),
        ('DEMO-RES-012', 'DEMO-COM-001'),
        ('DEMO-RES-013', 'DEMO-RED-001'),
        ('DEMO-RES-014', 'DEMO-VR-001'),
        ('DEMO-RES-015', 'DEMO-IOT-001'),
        ('DEMO-RES-016', 'DEMO-MCU-001'),
        ('DEMO-RES-017', 'DEMO-RED-001'),
        ('DEMO-RES-017', 'DEMO-RED-002'),
        ('DEMO-RES-018', 'DEMO-COM-001'),
        ('DEMO-RES-019', 'DEMO-VR-001'),
        ('DEMO-RES-020', 'DEMO-MCU-001'),
        ('DEMO-RES-021', 'DEMO-IOT-001'),
        ('DEMO-RES-021', 'DEMO-IOT-002'),
        ('DEMO-RES-022', 'DEMO-RED-001'),
        ('DEMO-RES-023', 'DEMO-COM-001'),
        ('DEMO-RES-024', 'DEMO-VR-001'),
        ('DEMO-RES-025', 'DEMO-MCU-001'),
        ('DEMO-RES-026', 'DEMO-RED-003'),
        ('DEMO-RES-027', 'DEMO-VR-003'),
        ('DEMO-RES-028', 'DEMO-COM-002'),
        ('DEMO-RES-029', 'DEMO-MCU-002'),
        ('DEMO-RES-030', 'DEMO-VR-003'),
        ('DEMO-RES-031', 'DEMO-MCU-004'),
        ('DEMO-RES-031', 'DEMO-MCU-005'),
        ('DEMO-RES-032', 'DEMO-IOT-002'),
        ('DEMO-RES-032', 'DEMO-IOT-003'),
        ('DEMO-RES-033', 'DEMO-RED-005'),
        ('DEMO-RES-034', 'DEMO-VR-004'),
        ('DEMO-RES-035', 'DEMO-COM-004'),
        ('DEMO-RES-035', 'DEMO-COM-005'),
        ('DEMO-RES-036', 'DEMO-IOT-004'),
        ('DEMO-RES-037', 'DEMO-RED-003'),
        ('DEMO-RES-038', 'DEMO-MCU-004'),
        ('DEMO-RES-038', 'DEMO-MCU-005'),
        ('DEMO-RES-039', 'DEMO-VR-001'),
        ('DEMO-RES-040', 'DEMO-COM-002')
)
INSERT INTO tbl_reserva_equipo (
    id_reserva,
    id_equipo
)
SELECT
    r.id_reserva,
    e.id_equipo
FROM pares p
JOIN tbl_reserva r
  ON r.codigo_reserva = p.codigo_reserva
JOIN tbl_equipo e
  ON e.codigo_inventario = p.codigo_equipo;


-- ============================================================================
-- 8. AUDITORÍA DEMO
-- ============================================================================
-- Ningún JSON de auditoría contiene contraseñas, refresh tokens, access tokens,
-- secretos de Google, credenciales de BD ni otras claves sensibles.

-- Autenticaciones exitosas.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
VALUES
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_LOCAL_EXITOSO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    '[DEMO] Login local correcto del administrador.',
    NULL, '{"metodo":"LOCAL","resultado":"OK"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000001', now() - interval '5 minutes'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_LOCAL_EXITOSO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    '[DEMO] Login local correcto de usuario.',
    NULL, '{"metodo":"LOCAL","resultado":"OK"}'::jsonb,
    '192.0.2.20', 'LISource QA / Usuario',
    '10000000-0000-0000-0000-000000000002', now() - interval '30 minutes'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_GOOGLE_EXITOSO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    '[DEMO] Login Google correcto.',
    NULL, '{"metodo":"GOOGLE","resultado":"OK"}'::jsonb,
    '192.0.2.100', 'LISource QA / Google',
    '10000000-0000-0000-0000-000000000003', now() - interval '45 minutes'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google2.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_GOOGLE_EXITOSO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google2.demo@udea.edu.co'),
    '[DEMO] Segundo login Google correcto con preferencia EN.',
    NULL, '{"metodo":"GOOGLE","idioma":"en","resultado":"OK"}'::jsonb,
    '192.0.2.101', 'LISource QA / Google EN',
    '10000000-0000-0000-0000-000000000004', now() - interval '55 minutes'
);

-- Intentos rechazados de autenticación.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
VALUES
(
    NULL,
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_FALLIDO'),
    NULL,
    '[DEMO] Login rechazado por credenciales incorrectas.',
    NULL, '{"motivo":"CREDENCIALES_INVALIDAS"}'::jsonb,
    '192.0.2.200', 'LISource QA / Login fallido',
    '10000000-0000-0000-0000-000000000005', now() - interval '2 hours'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'inactivo.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_FALLIDO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'inactivo.demo@udea.edu.co'),
    '[DEMO] Login rechazado porque el usuario está inactivo.',
    NULL, '{"motivo":"USUARIO_INACTIVO"}'::jsonb,
    '192.0.2.201', 'LISource QA / Usuario inactivo',
    '10000000-0000-0000-0000-000000000006', now() - interval '3 hours'
);

-- Creación de usuarios mediante Google.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
SELECT
    u.id_usuario,
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CREAR_USUARIO_GOOGLE'),
    u.id_usuario,
    '[DEMO] Usuario interno creado mediante Google SSO: ' || u.correo,
    NULL,
    jsonb_build_object('correo', u.correo, 'origen', 'GOOGLE'),
    '192.0.2.100',
    'LISource QA / Google',
    (
        '11000000-0000-0000-0000-' ||
        lpad(u.id_usuario::text, 12, '0')
    )::uuid,
    u.fecha_creacion
FROM tbl_usuario u
WHERE u.correo IN ('google.demo@udea.edu.co', 'google2.demo@udea.edu.co');

-- Alta de una muestra de equipos.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
SELECT
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CREAR_EQUIPO'),
    e.id_equipo,
    '[DEMO] Equipo registrado: ' || e.codigo_inventario,
    NULL,
    jsonb_build_object('codigo_inventario', e.codigo_inventario, 'nombre', e.nombre),
    '192.0.2.10',
    'LISource QA / Admin',
    (
        '12000000-0000-0000-0000-' ||
        lpad(e.id_equipo::text, 12, '0')
    )::uuid,
    e.fecha_creacion
FROM tbl_equipo e
WHERE e.codigo_inventario IN (
    'DEMO-MCU-001', 'DEMO-VR-001', 'DEMO-RED-001',
    'DEMO-COM-001', 'DEMO-IOT-001', 'DEMO-RED-007'
);

-- Cambios de estado representativos.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
VALUES
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CAMBIAR_ESTADO_EQUIPO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-MCU-003'),
    '[DEMO] Microcontrolador enviado a mantenimiento.',
    '{"estado":"OPERATIVO"}'::jsonb, '{"estado":"MANTENIMIENTO"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000010', now() - interval '2 days'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CAMBIAR_ESTADO_EQUIPO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-RED-004'),
    '[DEMO] Switch marcado fuera de servicio.',
    '{"estado":"OPERATIVO"}'::jsonb, '{"estado":"FUERA_SERVICIO"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000011', now() - interval '7 days'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CAMBIAR_ESTADO_EQUIPO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-VR-005'),
    '[DEMO] Visor retirado del inventario activo.',
    '{"estado":"OPERATIVO"}'::jsonb, '{"estado":"RETIRADO"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000012', now() - interval '30 days'
);

-- Se registra la creación de TODAS las reservas demo, incluidas las que luego fueron canceladas.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
SELECT
    r.id_usuario,
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CREAR_RESERVA'),
    r.id_reserva,
    '[DEMO] Reserva creada: ' || r.codigo_reserva,
    NULL,
    jsonb_build_object(
        'codigo_reserva', r.codigo_reserva,
        'fecha_inicio', r.fecha_inicio,
        'fecha_fin', r.fecha_fin
    ),
    '192.0.2.20',
    'LISource QA / Reservas',
    (
        '20000000-0000-0000-0000-' ||
        lpad(right(r.codigo_reserva, 3), 12, '0')
    )::uuid,
    r.fecha_creacion
FROM tbl_reserva r
WHERE r.codigo_reserva LIKE 'DEMO-RES-%';

-- Cancelaciones.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
SELECT
    r.id_usuario_cancelacion,
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CANCELAR_RESERVA'),
    r.id_reserva,
    '[DEMO] Reserva cancelada: ' || r.codigo_reserva,
    '{"estado":"CONFIRMADA"}'::jsonb,
    jsonb_build_object('estado', 'CANCELADA', 'motivo', r.motivo_cancelacion),
    '192.0.2.20',
    'LISource QA / Cancelación',
    (
        '30000000-0000-0000-0000-' ||
        lpad(right(r.codigo_reserva, 3), 12, '0')
    )::uuid,
    r.fecha_cancelacion
FROM tbl_reserva r
JOIN tbl_estado_reserva er
  ON er.id_estado_reserva = r.id_estado_reserva
WHERE r.codigo_reserva LIKE 'DEMO-RES-%'
  AND er.codigo = 'CANCELADA';

-- Conflicto simulado: se registra el intento, NO se inserta una reserva inválida.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'RESERVA_CONFLICTO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-RED-003'),
    '[DEMO] Intento rechazado por solapamiento con una reserva confirmada vigente.',
    NULL,
    '{"codigo_equipo":"DEMO-RED-003","resultado":"CONFLICTO","http_esperado":409}'::jsonb,
    '192.0.2.20', 'LISource QA / Conflicto',
    '10000000-0000-0000-0000-000000000020', now() - interval '10 minutes'
);

-- Roles, recuperación, refresh y configuración.
INSERT INTO tbl_auditoria (
    id_usuario_actor, id_tipo_evento_auditoria, id_registro_afectado,
    descripcion, datos_anteriores, datos_nuevos,
    ip_origen, user_agent, correlation_id, fecha_evento
)
VALUES
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'ASIGNAR_ROL'),
    (SELECT ur.id_usuario_rol FROM tbl_usuario_rol ur
       JOIN tbl_usuario u ON u.id_usuario = ur.id_usuario
       JOIN tbl_rol r ON r.id_rol = ur.id_rol
      WHERE u.correo = 'dual.demo@udea.edu.co' AND r.codigo = 'ADMINISTRADOR'),
    '[DEMO] Rol ADMINISTRADOR asignado al usuario dual.',
    NULL, '{"rol":"ADMINISTRADOR","estado":"ACTIVO"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000021', now() - interval '120 days'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'DESACTIVAR_ROL_USUARIO'),
    (SELECT ur.id_usuario_rol FROM tbl_usuario_rol ur
       JOIN tbl_usuario u ON u.id_usuario = ur.id_usuario
       JOIN tbl_rol r ON r.id_rol = ur.id_rol
      WHERE u.correo = 'soporte.demo@udea.edu.co' AND r.codigo = 'USUARIO'),
    '[DEMO] Asignación USUARIO desactivada para la cuenta de soporte.',
    '{"estado":"ACTIVO"}'::jsonb, '{"estado":"INACTIVO"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000022', now() - interval '40 days'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'SOLICITAR_RECUPERACION_PASSWORD'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    '[DEMO] Solicitud de recuperación de contraseña creada.',
    NULL, '{"resultado":"SOLICITUD_GENERADA"}'::jsonb,
    '192.0.2.20', 'LISource QA / Reset',
    '10000000-0000-0000-0000-000000000023', now() - interval '5 minutes'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'RESTABLECER_PASSWORD'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    '[DEMO] Restablecimiento de contraseña completado.',
    NULL, '{"resultado":"PASSWORD_ACTUALIZADO"}'::jsonb,
    '192.0.2.30', 'LISource QA / Reset',
    '10000000-0000-0000-0000-000000000024', now() - interval '3 days'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'REFRESH_TOKEN'),
    (SELECT id_sesion FROM tbl_sesion WHERE refresh_token_hash = '8030d581edb1c044d3d19505d88c884be4482f7f7bc8c77d2f13a9929a726855'),
    '[DEMO] Renovación correcta del access token del administrador.',
    NULL, '{"resultado":"RENOVADO"}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000025', now() - interval '5 minutes'
),
(
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'ACTUALIZAR_CONFIGURACION'),
    (SELECT id_configuracion FROM tbl_configuracion WHERE clave = 'TAMANO_PAGINA_DEFECTO'),
    '[DEMO] Trazabilidad de actualización de configuración de paginación.',
    '{"valor":10}'::jsonb, '{"valor":20}'::jsonb,
    '192.0.2.10', 'LISource QA / Admin',
    '10000000-0000-0000-0000-000000000026', now() - interval '30 days'
);


-- ============================================================================
-- 9. VALIDACIONES TRANSACCIONALES DEL DATASET
-- ============================================================================
-- Cualquier incumplimiento aborta el 03 completo.

DO $$
DECLARE
    v_tabla text;
    v_cantidad bigint;
BEGIN
    IF (SELECT COUNT(*) FROM tbl_usuario WHERE correo LIKE '%.demo@udea.edu.co') <> 12 THEN
        RAISE EXCEPTION 'Dataset QA inválido: se esperaban 12 usuarios demo';
    END IF;

    IF (SELECT COUNT(*) FROM tbl_equipo WHERE codigo_inventario LIKE 'DEMO-%') <> 30 THEN
        RAISE EXCEPTION 'Dataset QA inválido: se esperaban 30 equipos demo';
    END IF;

    IF (SELECT COUNT(*) FROM tbl_reserva WHERE codigo_reserva LIKE 'DEMO-RES-%') <> 40 THEN
        RAISE EXCEPTION 'Dataset QA inválido: se esperaban 40 reservas demo';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM tbl_reserva_equipo re
        JOIN tbl_reserva r ON r.id_reserva = re.id_reserva
        WHERE r.codigo_reserva LIKE 'DEMO-RES-%'
    ) <> 47 THEN
        RAISE EXCEPTION 'Dataset QA inválido: se esperaban 47 relaciones reserva-equipo';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM tbl_sesion s
        JOIN tbl_usuario u ON u.id_usuario = s.id_usuario
        WHERE u.correo LIKE '%.demo@udea.edu.co'
    ) <> 10 THEN
        RAISE EXCEPTION 'Dataset QA inválido: se esperaban 10 sesiones demo';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM tbl_recuperacion_password rp
        JOIN tbl_usuario u ON u.id_usuario = rp.id_usuario
        WHERE u.correo LIKE '%.demo@udea.edu.co'
    ) <> 6 THEN
        RAISE EXCEPTION 'Dataset QA inválido: se esperaban 6 recuperaciones demo';
    END IF;

    -- Cada una de las 20 tablas debe contener al menos un registro después de 01+02+03.
    FOREACH v_tabla IN ARRAY ARRAY[
        'tbl_estado_registro',
        'tbl_estado_usuario',
        'tbl_estado_equipo',
        'tbl_estado_reserva',
        'tbl_rol',
        'tbl_idioma',
        'tbl_usuario',
        'tbl_usuario_rol',
        'tbl_sesion',
        'tbl_recuperacion_password',
        'tbl_categoria_equipo',
        'tbl_ubicacion',
        'tbl_equipo',
        'tbl_reserva',
        'tbl_reserva_equipo',
        'tbl_categoria_configuracion',
        'tbl_configuracion',
        'tbl_nivel_auditoria',
        'tbl_tipo_evento_auditoria',
        'tbl_auditoria'
    ] LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', v_tabla) INTO v_cantidad;
        IF v_cantidad = 0 THEN
            RAISE EXCEPTION 'Dataset QA inválido: la tabla % quedó vacía', v_tabla;
        END IF;
    END LOOP;

    -- El dataset CONFIRMADO no debe contener dos reservas solapadas del mismo equipo.
    IF EXISTS (
        SELECT 1
        FROM tbl_reserva_equipo re1
        JOIN tbl_reserva r1
          ON r1.id_reserva = re1.id_reserva
        JOIN tbl_estado_reserva er1
          ON er1.id_estado_reserva = r1.id_estado_reserva
        JOIN tbl_reserva_equipo re2
          ON re2.id_equipo = re1.id_equipo
         AND re2.id_reserva > re1.id_reserva
        JOIN tbl_reserva r2
          ON r2.id_reserva = re2.id_reserva
        JOIN tbl_estado_reserva er2
          ON er2.id_estado_reserva = r2.id_estado_reserva
        WHERE er1.codigo = 'CONFIRMADA'
          AND er2.codigo = 'CONFIRMADA'
          AND r1.codigo_reserva LIKE 'DEMO-RES-%'
          AND r2.codigo_reserva LIKE 'DEMO-RES-%'
          AND r1.fecha_inicio < r2.fecha_fin
          AND r2.fecha_inicio < r1.fecha_fin
    ) THEN
        RAISE EXCEPTION
            'Dataset QA inválido: existen reservas CONFIRMADAS solapadas para un mismo equipo';
    END IF;
END;
$$;

COMMIT;


-- ============================================================================
-- 10. CONSULTAS DE VERIFICACIÓN / SMOKE TESTS SQL
-- ============================================================================

-- 10.1 Resumen general.
SELECT 'Usuarios demo' AS elemento, COUNT(*)::bigint AS cantidad
FROM tbl_usuario
WHERE correo LIKE '%.demo@udea.edu.co'
UNION ALL
SELECT 'Asignaciones de rol demo', COUNT(*)::bigint
FROM tbl_usuario_rol ur
JOIN tbl_usuario u ON u.id_usuario = ur.id_usuario
WHERE u.correo LIKE '%.demo@udea.edu.co'
UNION ALL
SELECT 'Equipos demo', COUNT(*)::bigint
FROM tbl_equipo
WHERE codigo_inventario LIKE 'DEMO-%'
UNION ALL
SELECT 'Reservas demo', COUNT(*)::bigint
FROM tbl_reserva
WHERE codigo_reserva LIKE 'DEMO-RES-%'
UNION ALL
SELECT 'Relaciones reserva-equipo demo', COUNT(*)::bigint
FROM tbl_reserva_equipo re
JOIN tbl_reserva r ON r.id_reserva = re.id_reserva
WHERE r.codigo_reserva LIKE 'DEMO-RES-%'
UNION ALL
SELECT 'Sesiones demo', COUNT(*)::bigint
FROM tbl_sesion s
JOIN tbl_usuario u ON u.id_usuario = s.id_usuario
WHERE u.correo LIKE '%.demo@udea.edu.co'
UNION ALL
SELECT 'Recuperaciones demo', COUNT(*)::bigint
FROM tbl_recuperacion_password rp
JOIN tbl_usuario u ON u.id_usuario = rp.id_usuario
WHERE u.correo LIKE '%.demo@udea.edu.co'
UNION ALL
SELECT 'Auditorías demo', COUNT(*)::bigint
FROM tbl_auditoria
WHERE descripcion LIKE '[DEMO]%';

-- 10.2 Usuarios, estado, idioma y roles.
SELECT
    u.correo,
    eu.codigo AS estado_usuario,
    i.codigo AS idioma,
    r.codigo AS rol,
    er.codigo AS estado_asignacion_rol,
    (u.password_hash IS NOT NULL) AS tiene_password_local,
    (u.google_sub IS NOT NULL) AS tiene_google
FROM tbl_usuario u
JOIN tbl_estado_usuario eu
  ON eu.id_estado_usuario = u.id_estado_usuario
LEFT JOIN tbl_idioma i
  ON i.id_idioma = u.id_idioma
LEFT JOIN tbl_usuario_rol ur
  ON ur.id_usuario = u.id_usuario
LEFT JOIN tbl_rol r
  ON r.id_rol = ur.id_rol
LEFT JOIN tbl_estado_registro er
  ON er.id_estado_registro = ur.id_estado_registro
WHERE u.correo LIKE '%.demo@udea.edu.co'
ORDER BY u.correo, r.codigo;

-- 10.3 Distribución de equipos por categoría y estado.
SELECT
    ce.nombre AS categoria,
    ee.codigo AS estado,
    COUNT(*) AS total
FROM tbl_equipo e
JOIN tbl_categoria_equipo ce
  ON ce.id_categoria_equipo = e.id_categoria_equipo
JOIN tbl_estado_equipo ee
  ON ee.id_estado_equipo = e.id_estado_equipo
WHERE e.codigo_inventario LIKE 'DEMO-%'
GROUP BY ce.nombre, ee.codigo
ORDER BY ce.nombre, ee.codigo;

-- 10.4 Estado visual ACTUAL calculado con la misma regla temporal [inicio, fin).
SELECT
    e.codigo_inventario,
    e.nombre,
    ce.nombre AS categoria,
    ee.codigo AS estado_operativo,
    CASE
        WHEN ee.codigo = 'OPERATIVO'
             AND EXISTS (
                 SELECT 1
                 FROM tbl_reserva_equipo re
                 JOIN tbl_reserva r
                   ON r.id_reserva = re.id_reserva
                 JOIN tbl_estado_reserva er
                   ON er.id_estado_reserva = r.id_estado_reserva
                 WHERE re.id_equipo = e.id_equipo
                   AND er.codigo = 'CONFIRMADA'
                   AND r.fecha_inicio <= now()
                   AND r.fecha_fin > now()
             )
        THEN 'RESERVADO'
        WHEN ee.codigo = 'OPERATIVO'
        THEN 'DISPONIBLE'
        ELSE ee.codigo
    END AS estado_visual
FROM tbl_equipo e
JOIN tbl_categoria_equipo ce
  ON ce.id_categoria_equipo = e.id_categoria_equipo
JOIN tbl_estado_equipo ee
  ON ee.id_estado_equipo = e.id_estado_equipo
WHERE e.codigo_inventario LIKE 'DEMO-%'
ORDER BY ce.nombre, e.codigo_inventario;

-- 10.5 Ejemplo de listado paginado/filtrado equivalente a la API.
SELECT
    e.codigo_inventario,
    e.nombre,
    ce.nombre AS categoria,
    ee.codigo AS estado
FROM tbl_equipo e
JOIN tbl_categoria_equipo ce
  ON ce.id_categoria_equipo = e.id_categoria_equipo
JOIN tbl_estado_equipo ee
  ON ee.id_estado_equipo = e.id_estado_equipo
WHERE ce.codigo = 'REDES'
  AND ee.codigo = 'OPERATIVO'
ORDER BY e.codigo_inventario
LIMIT 5 OFFSET 0;

-- 10.6 Top 5 histórico de equipos por reservas CONFIRMADAS.
SELECT
    e.codigo_inventario,
    e.nombre,
    COUNT(*) AS total_reservas
FROM tbl_reserva_equipo re
JOIN tbl_reserva r
  ON r.id_reserva = re.id_reserva
JOIN tbl_estado_reserva er
  ON er.id_estado_reserva = r.id_estado_reserva
JOIN tbl_equipo e
  ON e.id_equipo = re.id_equipo
WHERE er.codigo = 'CONFIRMADA'
  AND e.codigo_inventario LIKE 'DEMO-%'
GROUP BY e.id_equipo, e.codigo_inventario, e.nombre
ORDER BY total_reservas DESC, e.codigo_inventario
LIMIT 5;

-- 10.7 Comprobación de solapamientos CONFIRMADOS.
-- RESULTADO ESPERADO: 0 filas.
SELECT
    e.codigo_inventario,
    r1.codigo_reserva AS reserva_1,
    r2.codigo_reserva AS reserva_2,
    r1.fecha_inicio AS inicio_1,
    r1.fecha_fin AS fin_1,
    r2.fecha_inicio AS inicio_2,
    r2.fecha_fin AS fin_2
FROM tbl_reserva_equipo re1
JOIN tbl_reserva r1 ON r1.id_reserva = re1.id_reserva
JOIN tbl_estado_reserva er1 ON er1.id_estado_reserva = r1.id_estado_reserva
JOIN tbl_reserva_equipo re2
  ON re2.id_equipo = re1.id_equipo
 AND re2.id_reserva > re1.id_reserva
JOIN tbl_reserva r2 ON r2.id_reserva = re2.id_reserva
JOIN tbl_estado_reserva er2 ON er2.id_estado_reserva = r2.id_estado_reserva
JOIN tbl_equipo e ON e.id_equipo = re1.id_equipo
WHERE er1.codigo = 'CONFIRMADA'
  AND er2.codigo = 'CONFIRMADA'
  AND r1.codigo_reserva LIKE 'DEMO-RES-%'
  AND r2.codigo_reserva LIKE 'DEMO-RES-%'
  AND r1.fecha_inicio < r2.fecha_fin
  AND r2.fecha_inicio < r1.fecha_fin
ORDER BY e.codigo_inventario;

-- 10.8 Reserva que debe provocar conflicto si se intenta crear AHORA desde la API.
SELECT
    e.id_equipo,
    e.codigo_inventario,
    e.nombre,
    r.codigo_reserva,
    r.fecha_inicio,
    r.fecha_fin,
    409 AS http_esperado_si_se_intenta_solapar
FROM tbl_equipo e
JOIN tbl_reserva_equipo re ON re.id_equipo = e.id_equipo
JOIN tbl_reserva r ON r.id_reserva = re.id_reserva
JOIN tbl_estado_reserva er ON er.id_estado_reserva = r.id_estado_reserva
WHERE e.codigo_inventario = 'DEMO-RED-003'
  AND er.codigo = 'CONFIRMADA'
  AND r.fecha_inicio <= now()
  AND r.fecha_fin > now();

-- 10.9 Estado de sesiones.
SELECT
    u.correo,
    CASE
        WHEN s.fecha_revocacion IS NOT NULL THEN 'REVOCADA'
        WHEN s.fecha_expiracion <= now() THEN 'EXPIRADA'
        ELSE 'ACTIVA'
    END AS estado_sesion,
    s.fecha_expiracion,
    s.fecha_ultimo_uso
FROM tbl_sesion s
JOIN tbl_usuario u ON u.id_usuario = s.id_usuario
WHERE u.correo LIKE '%.demo@udea.edu.co'
ORDER BY u.correo, s.fecha_creacion;

-- 10.10 Estado de recuperaciones.
SELECT
    u.correo,
    CASE
        WHEN rp.fecha_uso IS NOT NULL THEN 'USADA'
        WHEN rp.fecha_revocacion IS NOT NULL THEN 'REVOCADA'
        WHEN rp.fecha_expiracion <= now() THEN 'EXPIRADA'
        ELSE 'PENDIENTE'
    END AS estado_recuperacion,
    rp.fecha_solicitud,
    rp.fecha_expiracion
FROM tbl_recuperacion_password rp
JOIN tbl_usuario u ON u.id_usuario = rp.id_usuario
WHERE u.correo LIKE '%.demo@udea.edu.co'
ORDER BY rp.fecha_solicitud DESC;

-- 10.11 Distribución de auditoría.
SELECT
    tea.codigo AS tipo_evento,
    na.codigo AS nivel,
    COUNT(*) AS total
FROM tbl_auditoria a
JOIN tbl_tipo_evento_auditoria tea
  ON tea.id_tipo_evento_auditoria = a.id_tipo_evento_auditoria
JOIN tbl_nivel_auditoria na
  ON na.id_nivel_auditoria = tea.id_nivel_auditoria
WHERE a.descripcion LIKE '[DEMO]%'
GROUP BY tea.codigo, na.codigo
ORDER BY total DESC, tea.codigo;

-- ============================================================================
-- RESULTADO ESPERADO DEL RESUMEN
--   Usuarios demo:                  12
--   Asignaciones de rol demo:       15
--   Equipos demo:                   30
--   Reservas demo:                  40
--   Relaciones reserva-equipo:      47
--   Sesiones demo:                  10
--   Recuperaciones demo:            6
--   Solapamientos confirmados:       0
--
-- El backend sigue siendo la autoridad para rechazar concurrencia/solapamientos
-- durante operaciones reales y responder HTTP 409 Conflict.
-- ============================================================================

