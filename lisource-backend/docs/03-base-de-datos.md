# Base de datos PostgreSQL

[← Volver al README](../../README.md)

> [!CAUTION]
> `01-estructura.sql` elimina y reconstruye objetos. No lo ejecute contra una base con información que deba conservarse.

## Orden obligatorio

1. `src/main/resources/db/01-estructura.sql`: estructura, PK/FK, `CHECK`, índices y RLS.
2. `02-semilla.sql`: estados, roles, idiomas, configuración y taxonomía de auditoría.
3. `03-pruebas.sql`: datos QA/demostración; no es una migración de producción.

## Modelo conceptual

![Modelo relacional de LISource](assets/database/modelo-relacional.png)

La imagen muestra identidad y roles, inventario/catálogos, reservas multi-equipo, configuración tipada y auditoría. `tbl_usuario_rol` y `tbl_reserva_equipo` resuelven relaciones N:M. Estados se normalizan en catálogos para conservar historia y evitar valores libres.

## Modelo lógico de 20 tablas

| Área | Tablas | Relaciones relevantes |
|---|---|---|
| Estados | `tbl_estado_registro`, `tbl_estado_usuario`, `tbl_estado_equipo`, `tbl_estado_reserva` | referenciadas por entidades con ciclo de vida |
| Identidad | `tbl_rol`, `tbl_idioma`, `tbl_usuario`, `tbl_usuario_rol` | usuario–rol N:M; idioma preferido |
| Credenciales | `tbl_sesion`, `tbl_recuperacion_password` | usuario 1:N; hashes, expiración y revocación |
| Inventario | `tbl_categoria_equipo`, `tbl_ubicacion`, `tbl_equipo` | categoría 1:N equipo; ubicación opcional |
| Reservas | `tbl_reserva`, `tbl_reserva_equipo` | usuario 1:N reserva; reserva–equipo N:M |
| Configuración | `tbl_categoria_configuracion`, `tbl_configuracion` | valores JSONB validados por aplicación |
| Auditoría | `tbl_nivel_auditoria`, `tbl_tipo_evento_auditoria`, `tbl_auditoria` | tipo→nivel y actor/correlation ID |

La normalización separa catálogos y relaciones; JSONB se limita a configuración y detalle de auditoría, donde la forma varía. PK numéricas, códigos únicos y FK aseguran identidad; índices cubren filtros, fechas, estados y correlation ID. RLS queda habilitado y el backend se conecta con un rol server-side adecuado: el frontend nunca posee credenciales PostgreSQL.

## Reservas

`tbl_reserva` conserva ventana, propietario, estado y cancelación. `tbl_reserva_equipo` permite reservar varios equipos. La regla de overlap se ejecuta en la transacción de aplicación tras bloquear filas de `tbl_equipo`; no depende de una lectura eventual.

