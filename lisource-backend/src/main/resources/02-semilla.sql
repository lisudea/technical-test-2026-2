-- ============================================================================
-- 02-semilla.sql
-- Sistema de Gestión y Reservas de Equipos del LIS
--
-- Objetivo:
--   Cargar únicamente los datos base necesarios para operar la plataforma:
--   estados, roles, idiomas, categorías, ubicaciones, configuraciones y
--   catálogos de auditoría.
--
-- Este script NO crea:
--   * usuarios
--   * sesiones
--   * tokens de recuperación
--   * equipos reales
--   * reservas
--   * registros de auditoría
--
-- Es idempotente: puede volver a ejecutarse para actualizar descripciones
-- y valores base sin duplicar los catálogos.
-- ============================================================================

BEGIN;

-- ============================================================================
-- ESTADOS BASE
-- ============================================================================

INSERT INTO tbl_estado_registro (codigo, nombre, descripcion)
VALUES
    ('ACTIVO',   'Activo',   'Registro habilitado para su uso normal en la aplicación.'),
    ('INACTIVO', 'Inactivo', 'Registro conservado históricamente pero no disponible para nuevas operaciones.')
ON CONFLICT (codigo) DO UPDATE
SET nombre      = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

INSERT INTO tbl_estado_usuario (codigo, nombre, descripcion)
VALUES
    ('ACTIVO',   'Activo',   'Usuario habilitado para autenticarse y utilizar las funciones autorizadas.'),
    ('INACTIVO', 'Inactivo', 'Usuario deshabilitado sin eliminación física de su información.')
ON CONFLICT (codigo) DO UPDATE
SET nombre      = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

INSERT INTO tbl_estado_equipo (codigo, nombre, descripcion)
VALUES
    ('OPERATIVO',      'Operativo',        'Equipo funcional y potencialmente reservable según disponibilidad temporal.'),
    ('MANTENIMIENTO',  'Mantenimiento',    'Equipo temporalmente no reservable por actividades de mantenimiento.'),
    ('FUERA_SERVICIO', 'Fuera de servicio','Equipo no disponible por falla, daño u otra condición operativa.'),
    ('RETIRADO',       'Retirado',         'Equipo retirado del servicio activo; se conserva para trazabilidad histórica.')
ON CONFLICT (codigo) DO UPDATE
SET nombre      = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

INSERT INTO tbl_estado_reserva (codigo, nombre, descripcion)
VALUES
    ('CONFIRMADA', 'Confirmada', 'Reserva creada correctamente y vigente para las reglas de disponibilidad.'),
    ('CANCELADA',  'Cancelada',  'Reserva anulada sin eliminación física, conservada para trazabilidad.')
ON CONFLICT (codigo) DO UPDATE
SET nombre      = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- ============================================================================
-- ROLES
-- ============================================================================

INSERT INTO tbl_rol (
    codigo,
    nombre,
    descripcion,
    id_estado_registro
)
SELECT
    x.codigo,
    x.nombre,
    x.descripcion,
    er.id_estado_registro
FROM (
    VALUES
        (
            'USUARIO',
            'Usuario',
            'Puede consultar equipos, revisar disponibilidad, crear reservas, listar sus reservas y cancelarlas.'
        ),
        (
            'ADMINISTRADOR',
            'Administrador',
            'Puede gestionar inventario, catálogos, configuraciones, roles y operaciones administrativas.'
        )
) AS x(codigo, nombre, descripcion)
JOIN tbl_estado_registro er
  ON er.codigo = 'ACTIVO'
ON CONFLICT (codigo) DO UPDATE
SET nombre             = EXCLUDED.nombre,
    descripcion        = EXCLUDED.descripcion,
    id_estado_registro = EXCLUDED.id_estado_registro;

-- ============================================================================
-- IDIOMAS
-- ============================================================================

INSERT INTO tbl_idioma (
    codigo,
    nombre,
    nombre_nativo,
    id_estado_registro
)
SELECT
    x.codigo,
    x.nombre,
    x.nombre_nativo,
    er.id_estado_registro
FROM (
    VALUES
        ('es', 'Español',   'Español'),
        ('en', 'Inglés',    'English'),
        ('fr', 'Francés',    'Français'),
        ('pt', 'Portugués',  'Português'),
        ('de', 'Alemán',     'Deutsch'),
        ('it', 'Italiano',   'Italiano')
) AS x(codigo, nombre, nombre_nativo)
JOIN tbl_estado_registro er
  ON er.codigo = 'ACTIVO'
ON CONFLICT (codigo) DO UPDATE
SET nombre             = EXCLUDED.nombre,
    nombre_nativo      = EXCLUDED.nombre_nativo,
    id_estado_registro = EXCLUDED.id_estado_registro;

-- ============================================================================
-- CATEGORÍAS DE EQUIPO
-- ============================================================================

INSERT INTO tbl_categoria_equipo (
    codigo,
    nombre,
    descripcion,
    id_estado_registro
)
SELECT
    x.codigo,
    x.nombre,
    x.descripcion,
    er.id_estado_registro
FROM (
    VALUES
        (
            'MICROCONTROLADORES',
            'Microcontroladores',
            'Placas y dispositivos de desarrollo embebido, como Arduino, ESP32 y similares.'
        ),
        (
            'REALIDAD_VIRTUAL',
            'Realidad Virtual',
            'Visores, controles y accesorios asociados a experiencias de realidad virtual.'
        ),
        (
            'REDES',
            'Redes',
            'Routers, switches, puntos de acceso y otros recursos para prácticas de redes.'
        ),
        (
            'COMPUTO',
            'Cómputo',
            'Equipos y recursos orientados a procesamiento y prácticas de cómputo.'
        ),
        (
            'IOT',
            'IoT',
            'Sensores, actuadores y dispositivos orientados a Internet de las Cosas.'
        )
) AS x(codigo, nombre, descripcion)
JOIN tbl_estado_registro er
  ON er.codigo = 'ACTIVO'
ON CONFLICT (codigo) DO UPDATE
SET nombre             = EXCLUDED.nombre,
    descripcion        = EXCLUDED.descripcion,
    id_estado_registro = EXCLUDED.id_estado_registro;

-- ============================================================================
-- UBICACIONES INICIALES
-- ============================================================================

INSERT INTO tbl_ubicacion (
    codigo,
    nombre,
    descripcion,
    id_estado_registro
)
SELECT
    x.codigo,
    x.nombre,
    x.descripcion,
    er.id_estado_registro
FROM (
    VALUES
        (
            'SALA_4',
            'Sala 4',
            'Ubicación inicial de referencia para recursos almacenados o utilizados en Sala 4.'
        ),
        (
            'SALA_VR',
            'Sala VR',
            'Ubicación destinada a recursos de realidad virtual cuando aplique.'
        ),
        (
            'ALMACEN_LIS',
            'Almacén LIS',
            'Ubicación de almacenamiento general de equipos del laboratorio.'
        ),
        (
            'RACK_REDES',
            'Rack de Redes',
            'Ubicación de referencia para equipos y recursos asociados a infraestructura de red.'
        )
) AS x(codigo, nombre, descripcion)
JOIN tbl_estado_registro er
  ON er.codigo = 'ACTIVO'
ON CONFLICT (codigo) DO UPDATE
SET nombre             = EXCLUDED.nombre,
    descripcion        = EXCLUDED.descripcion,
    id_estado_registro = EXCLUDED.id_estado_registro;

-- ============================================================================
-- CATEGORÍAS DE CONFIGURACIÓN
-- ============================================================================

INSERT INTO tbl_categoria_configuracion (
    codigo,
    nombre,
    descripcion,
    id_estado_registro
)
SELECT
    x.codigo,
    x.nombre,
    x.descripcion,
    er.id_estado_registro
FROM (
    VALUES
        (
            'AUTENTICACION',
            'Autenticación',
            'Parámetros no secretos relacionados con autenticación, JWT, sesiones y recuperación de contraseña.'
        ),
        (
            'PAGINACION',
            'Paginación',
            'Parámetros globales utilizados por los listados paginados de la API.'
        ),
        (
            'INTERNACIONALIZACION',
            'Internacionalización',
            'Parámetros generales relacionados con idiomas e i18n.'
        ),
        (
            'RESERVAS',
            'Reservas',
            'Parámetros generales relacionados con consultas y funcionalidades de reservas.'
        )
) AS x(codigo, nombre, descripcion)
JOIN tbl_estado_registro er
  ON er.codigo = 'ACTIVO'
ON CONFLICT (codigo) DO UPDATE
SET nombre             = EXCLUDED.nombre,
    descripcion        = EXCLUDED.descripcion,
    id_estado_registro = EXCLUDED.id_estado_registro;

-- ============================================================================
-- CONFIGURACIONES GLOBALES
-- ============================================================================
-- IMPORTANTE:
-- Estos valores NO son secretos. JWT_SECRET, GOOGLE_CLIENT_SECRET,
-- contraseñas de BD y API keys deben permanecer fuera de PostgreSQL.

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'DOMINIO_CORREO_INSTITUCIONAL',
    to_jsonb('udea.edu.co'::text),
    'Dominio institucional obligatorio para autenticación de usuarios.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'AUTENTICACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave, valor, descripcion, id_categoria_configuracion, id_estado_registro
)
SELECT
    'TIMEOUT_INACTIVIDAD_SESION_HORAS',
    to_jsonb(24),
    'Tiempo máximo sin renovar una sesión antes de considerarla inactiva, expresado en horas.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'AUTENTICACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave, valor, descripcion, id_categoria_configuracion, id_estado_registro
)
SELECT
    'MAXIMO_SESIONES_ACTIVAS_USUARIO',
    to_jsonb(5),
    'Cantidad máxima de sesiones vigentes simultáneas por usuario.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'AUTENTICACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'DURACION_ACCESS_TOKEN_MINUTOS',
    to_jsonb(15),
    'Duración recomendada del access token JWT en minutos.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'AUTENTICACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'DURACION_REFRESH_TOKEN_DIAS',
    to_jsonb(7),
    'Duración base de una sesión renovable mediante refresh token, expresada en días.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'AUTENTICACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'DURACION_RECUPERACION_PASSWORD_MINUTOS',
    to_jsonb(30),
    'Tiempo de validez de un token de recuperación de contraseña, expresado en minutos.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'AUTENTICACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'TAMANO_PAGINA_DEFECTO',
    to_jsonb(20),
    'Cantidad de elementos retornados por defecto en listados paginados.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'PAGINACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'TAMANO_PAGINA_MAXIMO',
    to_jsonb(100),
    'Cantidad máxima permitida de elementos por página para proteger la API.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'PAGINACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'IDIOMA_PREDETERMINADO',
    to_jsonb('es'::text),
    'Código del idioma utilizado por defecto cuando el usuario aún no ha seleccionado uno.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'INTERNACIONALIZACION'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

INSERT INTO tbl_configuracion (
    clave,
    valor,
    descripcion,
    id_categoria_configuracion,
    id_estado_registro
)
SELECT
    'LIMITE_TOP_EQUIPOS',
    to_jsonb(5),
    'Cantidad de equipos retornados por defecto en la estadística de equipos más solicitados.',
    cc.id_categoria_configuracion,
    er.id_estado_registro
FROM tbl_categoria_configuracion cc
JOIN tbl_estado_registro er ON er.codigo = 'ACTIVO'
WHERE cc.codigo = 'RESERVAS'
ON CONFLICT (clave) DO UPDATE
SET valor                       = EXCLUDED.valor,
    descripcion                 = EXCLUDED.descripcion,
    id_categoria_configuracion = EXCLUDED.id_categoria_configuracion,
    id_estado_registro          = EXCLUDED.id_estado_registro,
    fecha_actualizacion         = now();

-- ============================================================================
-- NIVELES DE AUDITORÍA
-- ============================================================================

INSERT INTO tbl_nivel_auditoria (codigo, nombre, descripcion)
VALUES
    (
        'INFO',
        'Información',
        'Evento normal del ciclo de operación que se conserva para trazabilidad.'
    ),
    (
        'ADVERTENCIA',
        'Advertencia',
        'Situación no fatal que merece seguimiento o que impidió completar una operación esperada.'
    ),
    (
        'ERROR',
        'Error',
        'Falla técnica o de integración relevante para diagnóstico.'
    ),
    (
        'SEGURIDAD',
        'Seguridad',
        'Evento relacionado con autenticación, autorización, credenciales, sesiones o cambios sensibles.'
    )
ON CONFLICT (codigo) DO UPDATE
SET nombre      = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- ============================================================================
-- TIPOS DE EVENTO DE AUDITORÍA
-- ============================================================================

WITH eventos (
    codigo,
    nombre,
    descripcion,
    nivel_codigo
) AS (
    VALUES
        ('LOGIN_GOOGLE_EXITOSO', 'Inicio de sesión Google exitoso', 'Autenticación mediante Google SSO completada correctamente.', 'INFO'),
        ('LOGIN_LOCAL_EXITOSO', 'Inicio de sesión local exitoso', 'Autenticación mediante correo institucional y contraseña local completada correctamente.', 'INFO'),
        ('LOGIN_FALLIDO', 'Inicio de sesión fallido', 'Intento de autenticación rechazado por credenciales, estado de usuario o validación de seguridad.', 'SEGURIDAD'),
        ('ERROR_INTEGRACION_GOOGLE', 'Error de integración con Google', 'Falla técnica al validar o procesar la autenticación con el proveedor Google.', 'ERROR'),
        ('REFRESH_TOKEN', 'Renovación de access token', 'Uso correcto de un refresh token válido para emitir un nuevo access token.', 'INFO'),
        ('CERRAR_SESION', 'Cierre de sesión', 'Revocación de una sesión específica del usuario.', 'INFO'),
        ('CERRAR_TODAS_SESIONES', 'Cierre de todas las sesiones', 'Revocación de todas las sesiones activas del usuario.', 'SEGURIDAD'),
        ('SOLICITAR_RECUPERACION_PASSWORD', 'Solicitud de recuperación de contraseña', 'Generación de un flujo de recuperación de contraseña local.', 'SEGURIDAD'),
        ('RESTABLECER_PASSWORD', 'Restablecimiento de contraseña', 'Cambio de contraseña realizado mediante un token de recuperación válido.', 'SEGURIDAD'),
        ('CONFIGURAR_PASSWORD', 'Configuración de contraseña', 'Usuario autenticado mediante SSO configura por primera vez una contraseña local.', 'SEGURIDAD'),
        ('CAMBIAR_PASSWORD', 'Cambio de contraseña', 'Usuario cambia voluntariamente su contraseña local.', 'SEGURIDAD'),
        ('CREAR_USUARIO_GOOGLE', 'Creación de usuario por Google SSO', 'Creación del usuario interno después de validar correctamente su identidad institucional.', 'INFO'),
        ('ACTUALIZAR_PERFIL', 'Actualización de perfil', 'Modificación controlada de información de perfil del usuario.', 'INFO'),
        ('ASIGNAR_ROL', 'Asignación de rol', 'Asignación de un rol a un usuario.', 'SEGURIDAD'),
        ('DESACTIVAR_ROL_USUARIO', 'Desactivación de rol de usuario', 'Desactivación lógica de una asignación de rol.', 'SEGURIDAD'),
        ('REACTIVAR_ROL_USUARIO', 'Reactivación de rol de usuario', 'Reactivación de una asignación de rol previamente inactiva.', 'SEGURIDAD'),
        ('CREAR_EQUIPO', 'Creación de equipo', 'Registro de una nueva unidad física en el inventario.', 'INFO'),
        ('ACTUALIZAR_EQUIPO', 'Actualización de equipo', 'Modificación de información de una unidad física del inventario.', 'INFO'),
        ('CAMBIAR_ESTADO_EQUIPO', 'Cambio de estado de equipo', 'Cambio del estado operativo persistente de un equipo.', 'INFO'),
        ('CREAR_CATEGORIA_EQUIPO', 'Creación de categoría de equipo', 'Registro de una nueva categoría de inventario.', 'INFO'),
        ('ACTUALIZAR_CATEGORIA_EQUIPO', 'Actualización de categoría de equipo', 'Modificación o desactivación lógica de una categoría de inventario.', 'INFO'),
        ('CREAR_UBICACION', 'Creación de ubicación', 'Registro de una nueva ubicación física.', 'INFO'),
        ('ACTUALIZAR_UBICACION', 'Actualización de ubicación', 'Modificación o desactivación lógica de una ubicación física.', 'INFO'),
        ('CREAR_RESERVA', 'Creación de reserva', 'Reserva creada correctamente con uno o varios equipos.', 'INFO'),
        ('CANCELAR_RESERVA', 'Cancelación de reserva', 'Reserva cancelada conservando su historial.', 'INFO'),
        ('RESERVA_CONFLICTO', 'Conflicto de reserva', 'Intento de reserva rechazado porque al menos un equipo ya estaba reservado en la franja solicitada.', 'ADVERTENCIA'),
        ('ACTUALIZAR_CONFIGURACION', 'Actualización de configuración', 'Cambio de un parámetro global no secreto de la aplicación.', 'SEGURIDAD')
)
INSERT INTO tbl_tipo_evento_auditoria (
    codigo,
    nombre,
    descripcion,
    id_nivel_auditoria,
    id_estado_registro
)
SELECT
    e.codigo,
    e.nombre,
    e.descripcion,
    na.id_nivel_auditoria,
    er.id_estado_registro
FROM eventos e
JOIN tbl_nivel_auditoria na
  ON na.codigo = e.nivel_codigo
JOIN tbl_estado_registro er
  ON er.codigo = 'ACTIVO'
ON CONFLICT (codigo) DO UPDATE
SET nombre               = EXCLUDED.nombre,
    descripcion          = EXCLUDED.descripcion,
    id_nivel_auditoria   = EXCLUDED.id_nivel_auditoria,
    id_estado_registro   = EXCLUDED.id_estado_registro;

-- ============================================================================
-- VALIDACIONES FINALES DE LA SEMILLA
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tbl_estado_registro WHERE codigo = 'ACTIVO'
    ) THEN
        RAISE EXCEPTION 'Semilla inválida: falta estado de registro ACTIVO';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM tbl_rol WHERE codigo = 'ADMINISTRADOR'
    ) THEN
        RAISE EXCEPTION 'Semilla inválida: falta rol ADMINISTRADOR';
    END IF;

    IF EXISTS (
        SELECT codigo
          FROM (VALUES ('es'), ('en'), ('fr'), ('pt'), ('de'), ('it')) AS esperado(codigo)
         WHERE NOT EXISTS (
             SELECT 1 FROM tbl_idioma i WHERE i.codigo = esperado.codigo
         )
    ) THEN
        RAISE EXCEPTION 'Semilla inválida: deben existir los idiomas es, en, fr, pt, de e it';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM tbl_configuracion
         WHERE clave = 'DOMINIO_CORREO_INSTITUCIONAL'
           AND valor #>> '{}' = 'udea.edu.co'
    ) THEN
        RAISE EXCEPTION
            'Semilla inválida: falta DOMINIO_CORREO_INSTITUCIONAL=udea.edu.co';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM tbl_tipo_evento_auditoria WHERE codigo = 'RESERVA_CONFLICTO'
    ) THEN
        RAISE EXCEPTION
            'Semilla inválida: falta el tipo de auditoría RESERVA_CONFLICTO';
    END IF;
END;
$$;

COMMIT;

-- ============================================================================
-- FIN 02-semilla.sql
-- ============================================================================
