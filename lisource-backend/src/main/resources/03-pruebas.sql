-- ============================================================================
-- 03-pruebas.sql
-- Sistema de Gestión y Reservas de Equipos del LIS
-- Dataset DEMO / QA
--
-- Compatible con:
--   01-estructura-sin-funciones.sql
--   02-semilla.sql
--
-- Ejecutar con el botón normal "Run".
--
-- OBJETIVO
--   Dejar la aplicación poblada con datos ficticios pero coherentes para
--   desarrollar y demostrar frontend/backend sin partir de una BD vacía.
--
-- CREA:
--   * 6 usuarios demo.
--   * roles y una asignación inactiva de ejemplo.
--   * sesiones activas/revocadas/expiradas.
--   * recuperaciones de contraseña en distintos escenarios.
--   * 15 equipos de distintas categorías y estados.
--   * reservas históricas, actuales, futuras, canceladas y multi-equipo.
--   * auditoría de ejemplo.
--
-- NO MODIFICA:
--   * catálogos base del 02.
--   * configuraciones base.
--
-- CREDENCIALES DEMO (SOLO PARA DESARROLLO/PRUEBAS)
--
-- ADMINISTRADOR
--   correo:     admin.demo@udea.edu.co
--   contraseña: DemoAdmin2026!
--
-- USUARIO
--   correo:     usuario.demo@udea.edu.co
--   contraseña: DemoUsuario2026!
--
-- USUARIO CON VARIAS RESERVAS
--   correo:     reservas.demo@udea.edu.co
--   contraseña: DemoReservas2026!
--
-- USUARIO DUAL (GOOGLE + CONTRASEÑA LOCAL)
--   correo:     dual.demo@udea.edu.co
--   contraseña: DemoDual2026!
--
-- USUARIO INACTIVO (para probar rechazo de autenticación)
--   correo:     inactivo.demo@udea.edu.co
--   contraseña: DemoInactivo2026!
--
-- USUARIO SOLO GOOGLE
--   correo:     google.demo@udea.edu.co
--   No tiene contraseña local.
--
-- TOKENS DEMO EN TEXTO PLANO (solo para probar lógica futura del backend)
-- La BD almacena únicamente sus SHA-256:
--
-- refresh admin:
--   demo-refresh-admin-2026-08
--
-- refresh usuario:
--   demo-refresh-usuario-2026-08
--
-- recuperación pendiente usuario:
--   demo-reset-usuario-pendiente-2026-08
--
-- IMPORTANTE:
--   Estos datos son ficticios y NO deben reutilizarse en producción.
-- ============================================================================

BEGIN;


-- ============================================================================
-- 0. LIMPIEZA DE DATOS DEMO DE UNA EJECUCIÓN ANTERIOR
-- ============================================================================
-- Esto permite volver a ejecutar el 03 sin duplicar el dataset.

DELETE FROM tbl_auditoria
WHERE descripcion LIKE '[DEMO]%'
   OR id_usuario_actor IN (
        SELECT id_usuario
        FROM tbl_usuario
        WHERE correo IN (
            'admin.demo@udea.edu.co',
            'usuario.demo@udea.edu.co',
            'reservas.demo@udea.edu.co',
            'dual.demo@udea.edu.co',
            'inactivo.demo@udea.edu.co',
            'google.demo@udea.edu.co'
        )
   );

DELETE FROM tbl_recuperacion_password
WHERE id_usuario IN (
    SELECT id_usuario
    FROM tbl_usuario
    WHERE correo IN (
        'admin.demo@udea.edu.co',
        'usuario.demo@udea.edu.co',
        'reservas.demo@udea.edu.co',
        'dual.demo@udea.edu.co',
        'inactivo.demo@udea.edu.co',
        'google.demo@udea.edu.co'
    )
);

DELETE FROM tbl_sesion
WHERE id_usuario IN (
    SELECT id_usuario
    FROM tbl_usuario
    WHERE correo IN (
        'admin.demo@udea.edu.co',
        'usuario.demo@udea.edu.co',
        'reservas.demo@udea.edu.co',
        'dual.demo@udea.edu.co',
        'inactivo.demo@udea.edu.co',
        'google.demo@udea.edu.co'
    )
);

DELETE FROM tbl_reserva_equipo
WHERE id_reserva IN (
    SELECT id_reserva
    FROM tbl_reserva
    WHERE codigo_reserva LIKE 'DEMO-RES-%'
);

DELETE FROM tbl_reserva
WHERE codigo_reserva LIKE 'DEMO-RES-%';

DELETE FROM tbl_usuario_rol
WHERE id_usuario IN (
    SELECT id_usuario
    FROM tbl_usuario
    WHERE correo IN (
        'admin.demo@udea.edu.co',
        'usuario.demo@udea.edu.co',
        'reservas.demo@udea.edu.co',
        'dual.demo@udea.edu.co',
        'inactivo.demo@udea.edu.co',
        'google.demo@udea.edu.co'
    )
);

DELETE FROM tbl_usuario
WHERE correo IN (
    'admin.demo@udea.edu.co',
    'usuario.demo@udea.edu.co',
    'reservas.demo@udea.edu.co',
    'dual.demo@udea.edu.co',
    'inactivo.demo@udea.edu.co',
    'google.demo@udea.edu.co'
);

DELETE FROM tbl_equipo
WHERE codigo_inventario LIKE 'DEMO-%';


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
    '$argon2id$v=19$m=65536,t=3,p=4$hUj7+BkHK9ufqI49nnnBCA$LyydI5IW8OEkGGhR2U1oI6KSgAuyeAW/1YwFDij+uP0',
    NULL,
    'Ana',
    'Administradora',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '90 days',
    now(),
    now() - interval '90 days',
    now() - interval '15 minutes'
),
(
    'usuario.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$fEsCA2VTDNUvNtnwNKSp0Q$gU2mG8qxppnOPopdTGY9oPN1MNK22t49mCCqsLrKE6I',
    NULL,
    'Carlos',
    'Usuario',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '60 days',
    now(),
    now() - interval '60 days',
    now() - interval '1 hour'
),
(
    'reservas.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$/HSqeKxTZMM6uQojXqt/yQ$u+QoeB2M6mPkAtL2fwO3kbLDmJps0b2y4KKL2vFujc8',
    NULL,
    'Laura',
    'Reservas',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '75 days',
    now(),
    now() - interval '75 days',
    now() - interval '2 hours'
),
(
    'dual.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$DSaXzcrc/VnIX+GBHcAOYg$dq5jPfTfrbNKkaOKjS+wlUG8xVot2P8Ksqdi0ENsf1I',
    'google-demo-sub-dual-0001',
    'Daniel',
    'Dual',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'en'),
    now() - interval '50 days',
    now(),
    now() - interval '30 days',
    now() - interval '4 hours'
),
(
    'inactivo.demo@udea.edu.co',
    '$argon2id$v=19$m=65536,t=3,p=4$PD8lJAFYsNztWDsw31qHWw$/NZ5lVces8/dXdueqjNQfO/hAfBvzT0GIJ/X3zzMSaI',
    NULL,
    'María',
    'Inactiva',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'INACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'es'),
    now() - interval '120 days',
    now(),
    now() - interval '120 days',
    now() - interval '20 days'
),
(
    'google.demo@udea.edu.co',
    NULL,
    'google-demo-sub-only-0001',
    'Juan',
    'Google',
    (SELECT id_estado_usuario FROM tbl_estado_usuario WHERE codigo = 'ACTIVO'),
    (SELECT id_idioma FROM tbl_idioma WHERE codigo = 'en'),
    now() - interval '20 days',
    now(),
    NULL,
    now() - interval '30 minutes'
);


-- ============================================================================
-- 2. ROLES DEMO
-- ============================================================================

-- Administrador: tiene ADMINISTRADOR y USUARIO activos.
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
    now() - interval '90 days',
    now()
FROM tbl_usuario u
CROSS JOIN tbl_rol r
CROSS JOIN tbl_estado_registro er
WHERE u.correo = 'admin.demo@udea.edu.co'
  AND r.codigo IN ('USUARIO', 'ADMINISTRADOR')
  AND er.codigo = 'ACTIVO';

-- Usuarios normales.
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
    u.fecha_creacion,
    now()
FROM tbl_usuario u
CROSS JOIN tbl_rol r
CROSS JOIN tbl_estado_registro er
WHERE u.correo IN (
        'usuario.demo@udea.edu.co',
        'reservas.demo@udea.edu.co',
        'dual.demo@udea.edu.co',
        'inactivo.demo@udea.edu.co',
        'google.demo@udea.edu.co'
      )
  AND r.codigo = 'USUARIO'
  AND er.codigo = 'ACTIVO';

-- Ejemplo histórico: dual tuvo asignación ADMINISTRADOR, pero está INACTIVA.
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
    now() - interval '25 days',
    now() - interval '10 days'
FROM tbl_usuario u
CROSS JOIN tbl_rol r
CROSS JOIN tbl_estado_registro er
WHERE u.correo = 'dual.demo@udea.edu.co'
  AND r.codigo = 'ADMINISTRADOR'
  AND er.codigo = 'INACTIVO';


-- ============================================================================
-- 3. SESIONES / REFRESH TOKENS DEMO
-- ============================================================================

-- Sesión activa del administrador.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    '8030d581edb1c044d3d19505d88c884be4482f7f7bc8c77d2f13a9929a726855',
    now() - interval '1 day',
    now() + interval '6 days',
    now() - interval '15 minutes',
    NULL,
    '192.0.2.10',
    'Demo Browser / Admin'
);

-- Sesión activa de usuario normal.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    'c2ad99d844598bec677e730d01c7b074bb3449c42bb5c146db85656fc776f50a',
    now() - interval '2 days',
    now() + interval '5 days',
    now() - interval '1 hour',
    NULL,
    '192.0.2.20',
    'Demo Browser / Usuario'
);

-- Sesión revocada.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    '774480122cbcbb5bc2fb384f46fe07b9275cd7b56af5d6b8667da62d7f253220',
    now() - interval '4 days',
    now() + interval '3 days',
    now() - interval '2 days',
    now() - interval '1 day',
    '192.0.2.30',
    'Demo Browser / Sesión revocada'
);

-- Sesión expirada.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    '983ecd175c416b04fee40519786b1e5f15e978e04030301e77dd631b8dd77fc1',
    now() - interval '8 days',
    now() - interval '1 hour',
    now() - interval '7 days',
    NULL,
    '192.0.2.40',
    'Demo Browser / Sesión expirada'
);


-- ============================================================================
-- 4. RECUPERACIÓN DE CONTRASEÑA DEMO
-- ============================================================================

-- Token pendiente y válido.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    'ba9d1356315637723c6ed351f8b0e31d654e40de6ac41e1e60a1e9ff4f864406',
    now() - interval '5 minutes',
    now() + interval '25 minutes',
    NULL,
    NULL,
    '192.0.2.20',
    'Demo Browser / Recuperación pendiente'
);

-- Token ya utilizado.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    '68af0d47b58d406b0c00dc09e78783137fe25cd6be1125e010265e6604c52969',
    now() - interval '3 days',
    now() - interval '2 days 23 hours',
    now() - interval '2 days 23 hours 30 minutes',
    NULL,
    '192.0.2.30',
    'Demo Browser / Recuperación utilizada'
);

-- Token revocado.
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
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    'cce9833c450595acea7a207102e67db2dcef24c5bf84b2436d6fcbabc43683ad',
    now() - interval '1 day',
    now() + interval '1 day',
    NULL,
    now() - interval '20 hours',
    '192.0.2.40',
    'Demo Browser / Recuperación revocada'
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
        (
            'DEMO-MCU-001',
            'Arduino UNO R4 WiFi',
            'Placa de desarrollo para prácticas de electrónica y sistemas embebidos.',
            'DEMO-ARD-R4-001',
            NULL,
            'MICROCONTROLADORES',
            'OPERATIVO',
            'SALA_4'
        ),
        (
            'DEMO-MCU-002',
            'ESP32 DevKit',
            'Placa ESP32 con conectividad WiFi y Bluetooth para prácticas IoT.',
            'DEMO-ESP32-002',
            '02:00:00:00:01:02',
            'MICROCONTROLADORES',
            'OPERATIVO',
            'SALA_4'
        ),
        (
            'DEMO-MCU-003',
            'Raspberry Pi Pico W',
            'Microcontrolador con conectividad inalámbrica; actualmente en mantenimiento.',
            'DEMO-PICO-003',
            NULL,
            'MICROCONTROLADORES',
            'MANTENIMIENTO',
            'ALMACEN_LIS'
        ),
        (
            'DEMO-VR-001',
            'Meta Quest 3',
            'Visor de realidad virtual para experiencias inmersivas y prácticas académicas.',
            'DEMO-QUEST3-001',
            NULL,
            'REALIDAD_VIRTUAL',
            'OPERATIVO',
            'SALA_VR'
        ),
        (
            'DEMO-VR-002',
            'Meta Quest 2',
            'Visor de realidad virtual en mantenimiento preventivo.',
            'DEMO-QUEST2-002',
            NULL,
            'REALIDAD_VIRTUAL',
            'MANTENIMIENTO',
            'SALA_VR'
        ),
        (
            'DEMO-RED-001',
            'Cisco Catalyst 2960',
            'Switch administrable para laboratorios de redes.',
            'DEMO-CISCO-2960-001',
            '02:00:00:10:00:01',
            'REDES',
            'OPERATIVO',
            'RACK_REDES'
        ),
        (
            'DEMO-RED-002',
            'MikroTik hEX',
            'Router compacto para prácticas de routing, firewall y redes.',
            'DEMO-MIKROTIK-002',
            '02:00:00:10:00:02',
            'REDES',
            'OPERATIVO',
            'RACK_REDES'
        ),
        (
            'DEMO-RED-003',
            'Ubiquiti UniFi Access Point',
            'Punto de acceso inalámbrico para prácticas de conectividad.',
            'DEMO-UNIFI-003',
            '02:00:00:10:00:03',
            'REDES',
            'OPERATIVO',
            'RACK_REDES'
        ),
        (
            'DEMO-RED-004',
            'TP-Link Managed Switch',
            'Switch administrable marcado temporalmente fuera de servicio.',
            'DEMO-TPLINK-004',
            '02:00:00:10:00:04',
            'REDES',
            'FUERA_SERVICIO',
            'ALMACEN_LIS'
        ),
        (
            'DEMO-COM-001',
            'Intel NUC',
            'Mini PC para prácticas de virtualización y desarrollo.',
            'DEMO-NUC-001',
            '02:00:00:20:00:01',
            'COMPUTO',
            'OPERATIVO',
            'SALA_4'
        ),
        (
            'DEMO-COM-002',
            'Lenovo ThinkPad',
            'Portátil de laboratorio destinado a desarrollo y pruebas.',
            'DEMO-THINKPAD-002',
            '02:00:00:20:00:02',
            'COMPUTO',
            'OPERATIVO',
            'SALA_4'
        ),
        (
            'DEMO-COM-003',
            'NVIDIA Jetson Nano',
            'Equipo de cómputo embebido conservado históricamente como retirado.',
            'DEMO-JETSON-003',
            '02:00:00:20:00:03',
            'COMPUTO',
            'RETIRADO',
            'ALMACEN_LIS'
        ),
        (
            'DEMO-IOT-001',
            'Kit de Sensores IoT',
            'Kit académico con sensores ambientales y actuadores.',
            'DEMO-IOT-KIT-001',
            NULL,
            'IOT',
            'OPERATIVO',
            'SALA_4'
        ),
        (
            'DEMO-IOT-002',
            'Gateway LoRa',
            'Gateway para prácticas de redes LPWAN y telemetría.',
            'DEMO-LORA-002',
            '02:00:00:30:00:02',
            'IOT',
            'OPERATIVO',
            'RACK_REDES'
        ),
        (
            'DEMO-IOT-003',
            'Raspberry Pi 4',
            'Computador de placa reducida utilizado en prototipos IoT.',
            'DEMO-RPI4-003',
            '02:00:00:30:00:03',
            'IOT',
            'OPERATIVO',
            'SALA_4'
        )
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
    now() - interval '120 days',
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

-- 001: histórica confirmada.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-001',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '40 days',
    now() - interval '39 days 22 hours',
    'Reserva histórica de Arduino UNO R4.',
    now() - interval '41 days',
    now() - interval '41 days'
);

-- 002: histórica, multi-equipo.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-002',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '30 days',
    now() - interval '29 days 21 hours',
    'Práctica histórica de routing con dos equipos.',
    now() - interval '31 days',
    now() - interval '31 days'
);

-- 003: cancelada.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion,
    fecha_cancelacion, id_usuario_cancelacion, motivo_cancelacion
)
VALUES (
    'DEMO-RES-003',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CANCELADA'),
    now() - interval '20 days',
    now() - interval '19 days 22 hours',
    'Reserva de VR posteriormente cancelada.',
    now() - interval '22 days',
    now() - interval '21 days',
    now() - interval '21 days',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    'El usuario ya no requería el equipo.'
);

-- 004: reserva vigente AHORA.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-004',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '30 minutes',
    now() + interval '90 minutes',
    'Reserva vigente para demostrar estado RESERVADO en el dashboard.',
    now() - interval '2 days',
    now()
);

-- 005: otra reserva vigente AHORA.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-005',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '15 minutes',
    now() + interval '45 minutes',
    'Reserva vigente de visor VR.',
    now() - interval '1 day',
    now()
);

-- 006: futura, multi-equipo.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-006',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + interval '1 day',
    now() + interval '1 day 2 hours',
    'Reserva futura de dos microcontroladores.',
    now(),
    now()
);

-- 007: futura, multi-equipo IoT.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-007',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + interval '2 days',
    now() + interval '2 days 3 hours',
    'Reserva futura para práctica IoT.',
    now(),
    now()
);

-- 008: histórica de cómputo.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-008',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '10 days',
    now() - interval '9 days 22 hours',
    'Reserva histórica de Intel NUC.',
    now() - interval '11 days',
    now() - interval '11 days'
);

-- 009: empieza exactamente cuando termina 005. Demuestra [inicio, fin).
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-009',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() + interval '45 minutes',
    now() + interval '2 hours',
    'Reserva consecutiva sin solapamiento respecto a DEMO-RES-005.',
    now(),
    now()
);

-- 010: cancelada; puede coincidir temporalmente con una confirmada.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion,
    fecha_cancelacion, id_usuario_cancelacion, motivo_cancelacion
)
VALUES (
    'DEMO-RES-010',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CANCELADA'),
    now() - interval '1 hour',
    now() + interval '2 hours',
    'Reserva cancelada que no debe bloquear disponibilidad.',
    now() - interval '3 days',
    now() - interval '1 day',
    now() - interval '1 day',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'dual.demo@udea.edu.co'),
    'Cancelada antes de utilizar el recurso.'
);

-- 011: histórica para alimentar estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-011',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'reservas.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '5 days',
    now() - interval '4 days 22 hours',
    'Otra reserva histórica de Arduino UNO R4.',
    now() - interval '6 days',
    now() - interval '6 days'
);

-- 012: histórica para alimentar estadísticas.
INSERT INTO tbl_reserva (
    codigo_reserva, id_usuario, id_estado_reserva,
    fecha_inicio, fecha_fin, observaciones,
    fecha_creacion, fecha_actualizacion
)
VALUES (
    'DEMO-RES-012',
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_estado_reserva FROM tbl_estado_reserva WHERE codigo = 'CONFIRMADA'),
    now() - interval '3 days',
    now() - interval '2 days 22 hours',
    'Tercera reserva histórica de Arduino UNO R4.',
    now() - interval '4 days',
    now() - interval '4 days'
);


-- ============================================================================
-- 7. EQUIPOS ASOCIADOS A LAS RESERVAS
-- ============================================================================

WITH pares(codigo_reserva, codigo_equipo) AS (
    VALUES
        ('DEMO-RES-001', 'DEMO-MCU-001'),

        ('DEMO-RES-002', 'DEMO-RED-001'),
        ('DEMO-RES-002', 'DEMO-RED-002'),

        ('DEMO-RES-003', 'DEMO-VR-001'),

        ('DEMO-RES-004', 'DEMO-RED-003'),

        ('DEMO-RES-005', 'DEMO-VR-001'),

        ('DEMO-RES-006', 'DEMO-MCU-001'),
        ('DEMO-RES-006', 'DEMO-MCU-002'),

        ('DEMO-RES-007', 'DEMO-IOT-001'),
        ('DEMO-RES-007', 'DEMO-IOT-002'),

        ('DEMO-RES-008', 'DEMO-COM-001'),

        ('DEMO-RES-009', 'DEMO-VR-001'),

        ('DEMO-RES-010', 'DEMO-RED-003'),

        ('DEMO-RES-011', 'DEMO-MCU-001'),
        ('DEMO-RES-012', 'DEMO-MCU-001')
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

-- Login administrador.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_LOCAL_EXITOSO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    '[DEMO] Inicio de sesión local correcto del administrador.',
    NULL,
    '{"metodo":"LOCAL"}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '15 minutes'
);

-- Login Google.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_GOOGLE_EXITOSO'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    '[DEMO] Inicio de sesión Google correcto.',
    NULL,
    '{"metodo":"GOOGLE"}'::jsonb,
    '192.0.2.50',
    'Demo Browser / Google',
    '10000000-0000-0000-0000-000000000002',
    now() - interval '30 minutes'
);

-- Login fallido sin usuario autenticado.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    NULL,
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'LOGIN_FALLIDO'),
    NULL,
    '[DEMO] Intento de autenticación rechazado.',
    NULL,
    '{"motivo":"CREDENCIALES_INVALIDAS"}'::jsonb,
    '192.0.2.99',
    'Demo Browser / Login fallido',
    '10000000-0000-0000-0000-000000000003',
    now() - interval '2 hours'
);

-- Creación de usuario Google.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CREAR_USUARIO_GOOGLE'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'google.demo@udea.edu.co'),
    '[DEMO] Usuario interno creado mediante Google SSO.',
    NULL,
    '{"correo":"google.demo@udea.edu.co","origen":"GOOGLE"}'::jsonb,
    '192.0.2.50',
    'Demo Browser / Google',
    '10000000-0000-0000-0000-000000000004',
    now() - interval '20 days'
);

-- Equipo creado.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CREAR_EQUIPO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-MCU-001'),
    '[DEMO] Registro de equipo Arduino UNO R4 WiFi.',
    NULL,
    '{"codigo_inventario":"DEMO-MCU-001","estado":"OPERATIVO"}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000005',
    now() - interval '120 days'
);

-- Cambio de estado de equipo.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CAMBIAR_ESTADO_EQUIPO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-MCU-003'),
    '[DEMO] Equipo enviado a mantenimiento.',
    '{"estado":"OPERATIVO"}'::jsonb,
    '{"estado":"MANTENIMIENTO"}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000006',
    now() - interval '2 days'
);

-- Creación de reservas.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
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
    'Demo Browser / Reservas',
    (
        '20000000-0000-0000-0000-' ||
        lpad(r.id_reserva::text, 12, '0')
    )::uuid,
    r.fecha_creacion
FROM tbl_reserva r
WHERE r.codigo_reserva IN (
    'DEMO-RES-001',
    'DEMO-RES-002',
    'DEMO-RES-004',
    'DEMO-RES-005',
    'DEMO-RES-006',
    'DEMO-RES-007',
    'DEMO-RES-008',
    'DEMO-RES-009',
    'DEMO-RES-011',
    'DEMO-RES-012'
);

-- Cancelaciones.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
SELECT
    r.id_usuario_cancelacion,
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'CANCELAR_RESERVA'),
    r.id_reserva,
    '[DEMO] Reserva cancelada: ' || r.codigo_reserva,
    '{"estado":"CONFIRMADA"}'::jsonb,
    jsonb_build_object(
        'estado', 'CANCELADA',
        'motivo', r.motivo_cancelacion
    ),
    '192.0.2.20',
    'Demo Browser / Cancelación',
    (
        '30000000-0000-0000-0000-' ||
        lpad(r.id_reserva::text, 12, '0')
    )::uuid,
    r.fecha_cancelacion
FROM tbl_reserva r
WHERE r.codigo_reserva IN ('DEMO-RES-003', 'DEMO-RES-010');

-- Conflicto simulado para probar UI/observabilidad sin insertar una reserva inválida.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'RESERVA_CONFLICTO'),
    (SELECT id_equipo FROM tbl_equipo WHERE codigo_inventario = 'DEMO-RED-003'),
    '[DEMO] Intento de reserva rechazado por solapamiento temporal.',
    NULL,
    '{"codigo_equipo":"DEMO-RED-003","resultado":"CONFLICTO"}'::jsonb,
    '192.0.2.20',
    'Demo Browser / Usuario',
    '10000000-0000-0000-0000-000000000020',
    now() - interval '10 minutes'
);

-- Asignación de rol.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'ASIGNAR_ROL'),
    (
        SELECT ur.id_usuario_rol
        FROM tbl_usuario_rol ur
        JOIN tbl_usuario u ON u.id_usuario = ur.id_usuario
        JOIN tbl_rol r ON r.id_rol = ur.id_rol
        WHERE u.correo = 'dual.demo@udea.edu.co'
          AND r.codigo = 'ADMINISTRADOR'
    ),
    '[DEMO] Asignación histórica de rol ADMINISTRADOR.',
    NULL,
    '{"rol":"ADMINISTRADOR"}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000021',
    now() - interval '25 days'
);

-- Desactivación de rol.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'DESACTIVAR_ROL_USUARIO'),
    (
        SELECT ur.id_usuario_rol
        FROM tbl_usuario_rol ur
        JOIN tbl_usuario u ON u.id_usuario = ur.id_usuario
        JOIN tbl_rol r ON r.id_rol = ur.id_rol
        WHERE u.correo = 'dual.demo@udea.edu.co'
          AND r.codigo = 'ADMINISTRADOR'
    ),
    '[DEMO] Desactivación histórica de rol ADMINISTRADOR.',
    '{"estado":"ACTIVO"}'::jsonb,
    '{"estado":"INACTIVO"}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000022',
    now() - interval '10 days'
);

-- Solicitud de recuperación.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'SOLICITAR_RECUPERACION_PASSWORD'),
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'usuario.demo@udea.edu.co'),
    '[DEMO] Solicitud de recuperación de contraseña.',
    NULL,
    '{"resultado":"SOLICITUD_GENERADA"}'::jsonb,
    '192.0.2.20',
    'Demo Browser / Usuario',
    '10000000-0000-0000-0000-000000000023',
    now() - interval '5 minutes'
);

-- Refresh.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'REFRESH_TOKEN'),
    (SELECT id_sesion FROM tbl_sesion WHERE refresh_token_hash = '8030d581edb1c044d3d19505d88c884be4482f7f7bc8c77d2f13a9929a726855'),
    '[DEMO] Renovación correcta del access token.',
    NULL,
    '{"resultado":"RENOVADO"}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000024',
    now() - interval '15 minutes'
);

-- Configuración.
INSERT INTO tbl_auditoria (
    id_usuario_actor,
    id_tipo_evento_auditoria,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    ip_origen,
    user_agent,
    correlation_id,
    fecha_evento
)
VALUES (
    (SELECT id_usuario FROM tbl_usuario WHERE correo = 'admin.demo@udea.edu.co'),
    (SELECT id_tipo_evento_auditoria FROM tbl_tipo_evento_auditoria WHERE codigo = 'ACTUALIZAR_CONFIGURACION'),
    (SELECT id_configuracion FROM tbl_configuracion WHERE clave = 'TAMANO_PAGINA_DEFECTO'),
    '[DEMO] Ejemplo de trazabilidad de una configuración.',
    '{"valor":10}'::jsonb,
    '{"valor":20}'::jsonb,
    '192.0.2.10',
    'Demo Browser / Admin',
    '10000000-0000-0000-0000-000000000025',
    now() - interval '30 days'
);


COMMIT;


-- ============================================================================
-- 9. VERIFICACIONES / SMOKE TESTS
-- ============================================================================

-- Resumen general del dataset.
SELECT 'Usuarios demo' AS elemento, COUNT(*)::bigint AS cantidad
FROM tbl_usuario
WHERE correo LIKE '%.demo@udea.edu.co'

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


-- Usuarios y roles.
SELECT
    u.correo,
    eu.codigo AS estado_usuario,
    r.codigo AS rol,
    er.codigo AS estado_asignacion_rol
FROM tbl_usuario u
JOIN tbl_estado_usuario eu
  ON eu.id_estado_usuario = u.id_estado_usuario
LEFT JOIN tbl_usuario_rol ur
  ON ur.id_usuario = u.id_usuario
LEFT JOIN tbl_rol r
  ON r.id_rol = ur.id_rol
LEFT JOIN tbl_estado_registro er
  ON er.id_estado_registro = ur.id_estado_registro
WHERE u.correo LIKE '%.demo@udea.edu.co'
ORDER BY u.correo, r.codigo;


-- Estado visual ACTUAL calculado con SQL puro.
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


-- Top 5 histórico: reservas CONFIRMADAS.
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


-- ============================================================================
-- RESULTADO ESPERADO DEL RESUMEN
--
-- Usuarios demo:                  6
-- Equipos demo:                  15
-- Reservas demo:                 12
-- Relaciones reserva-equipo:     15
-- Sesiones demo:                  4
-- Recuperaciones demo:            3
-- Auditorías demo:               varias (>= 20)
--
-- Este script NO inserta intencionalmente una reserva solapada inválida.
-- La validación estricta y transaccional de solapamientos se implementará
-- en el backend. Allí debe responderse HTTP 409 Conflict.
-- ============================================================================
