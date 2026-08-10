# Equipos Reservas API

API REST para la gestión de equipos y reservas de un laboratorio. Construida con Spring Boot 4 (Java 21) y MySQL.

## Requisitos

- **Java 21** o superior
- **MySQL 8** instalado y corriendo en el puerto 3306 (ver [Problemas comunes](#problemas-comunes))
- No se requiere Maven instalado: el proyecto incluye el wrapper (`mvnw` / `mvnw.cmd`)

## Configuración local (sin Docker) — 4 pasos

### 1. Crear la base de datos

JPA crea las tablas automáticamente al arrancar la aplicación (`ddl-auto: update`), pero **no** crea el esquema. Crea la base de datos ejecutando desde la raíz del proyecto:

```bash
mysql -u root -p < db/init.sql
```

(Equivale a ejecutar `CREATE DATABASE equipos_lis;` en MySQL Workbench.)

### 2. Configurar tus credenciales

Copia la plantilla y coloca los datos de tu MySQL local:

```bash
copy .env.example .env
```

```bash
# .env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=equipos_lis
DB_USERNAME=root
DB_PASSWORD=tu_contraseña
```

El archivo `.env` está en `.gitignore`, así que tus credenciales nunca se suben al repositorio. Si no creas el `.env`, la aplicación usa los valores por defecto (`root`/`simon123`).

### 3. Arrancar la aplicación

```bash
./mvnw.cmd spring-boot:run
```

La primera vez se crean las tablas en `equipos_lis` y se insertan **20 equipos y 20 reservas** de ejemplo (si la base estaba vacía). Ver [Datos de ejemplo (seeder)](#datos-de-ejemplo-seeder).

### 4. Verificar

- API: `http://localhost:8080/api/equipos`
- Consola MySQL: `equipos_lis` con las tablas `equipos`, `reservas`, `usuarios`

## Probar los endpoints con Postman

1. Abre Postman → **Import** → selecciona `postman/equipos-reservas-api.postman_collection.json`
2. La colección usa la variable `{{baseUrl}}` (por defecto `http://localhost:8080`)
3. Las variables `{{equipoId}}` y `{{reservaId}}` se editan en la pestaña de variables de la colección según los ids que devuelva la API

## Endpoints

### Equipos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/equipos` | Registra un equipo. El `id` lo asigna el cliente. → `201` |
| PUT | `/api/equipos` | Actualiza el equipo con el `id` del body → `200` |
| GET | `/api/equipos/{id}` | Consulta un equipo por id → `200` |
| GET | `/api/equipos` | Lista paginada. Filtros opcionales: `categoria`, `estado`, `page`, `size` → `200` |

Categorías: `MICROCONTROLADORES`, `VR`, `REDES`. Estados de equipo: `DISPONIBLE`, `RESERVADO`, `MANTENIMIENTO`.

Ejemplo de body:

```json
{
  "id": 10,
  "nombre": "Arduino Uno",
  "numeroSerie": "SN-001",
  "categoria": "MICROCONTROLADORES",
  "estado": "DISPONIBLE"
}
```

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/reservas` | Crea una reserva. El usuario se crea solo si no existe (por correo) → `201` |
| POST | `/api/reservas/{id}/cancelar` | Cancela la reserva (soft delete) → `200` |
| GET | `/api/reservas` | Lista paginada. Filtros opcionales: `equipoId`, `estado` (`ACTIVA`/`FINALIZADA`/`CANCELADA`), `page`, `size` → `200` |

Estados de reserva: `ACTIVA` (vigente), `FINALIZADA` (su fecha de devolución ya pasó), `CANCELADA` (soft delete).

Reglas de negocio:

- Un equipo en `MANTENIMIENTO` no se puede reservar. Un equipo `DISPONIBLE` o `RESERVADO` sí puede recibir reservas siempre que la franja no se solape con otra reserva activa (un equipo puede tener varias reservas activas simultáneas).
- La fecha de inicio de la reserva debe ser posterior a la fecha actual, y la fecha de devolución posterior a la de inicio.
- Solo las reservas `ACTIVA` se pueden cancelar: una `FINALIZADA` o `CANCELADA` devuelve `409`.
- Al crear, cancelar o listar reservas, las reservas activas cuya fecha de devolución ya pasó se marcan automáticamente como `FINALIZADA` y el equipo se libera (`DISPONIBLE`) si no le quedan reservas activas.
- El top 5 de equipos más solicitados cuenta las reservas `ACTIVA` y `FINALIZADA`; las `CANCELADA` no cuentan.

Ejemplo de body (fechas en formato ISO-8601 `yyyy-MM-ddTHH:mm:ss`):

```json
{
  "nombreUsuario": "Ana Pérez",
  "correoUsuario": "ana.perez@udea.edu.co",
  "equipoId": 1,
  "fechaReserva": "2026-08-10T08:00:00",
  "fechaDevolucion": "2026-08-10T12:00:00"
}
```

### Estadísticas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estadisticas/top-5` | Top 5 de equipos más solicitados históricamente |

## Códigos de error

| Código | Significado |
|---|---|
| `400` | Datos inválidos o formato incorrecto (validación de beans, JSON mal formado, enum no válido) |
| `404` | Recurso no encontrado |
| `409` | Conflicto: equipo ya registrado (id o serie duplicados), equipo en mantenimiento, fecha de inicio en el pasado, horario en conflicto, reserva ya cancelada o ya finalizada |

### Contrato de errores para el frontend

Todos los errores devuelven un body uniforme (no el formato por defecto de Spring):

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "El equipo Arduino Uno ya está reservado en el horario solicitado",
  "path": "/api/reservas",
  "timestamp": "2026-08-09T12:34:56.789"
}
```

Los errores de validación (`400`) además incluyen la lista de errores por campo:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Los datos enviados no son válidos",
  "path": "/api/equipos",
  "timestamp": "2026-08-09T12:34:56.789",
  "errors": [
    { "campo": "correoUsuario", "mensaje": "El correo del usuario no tiene un formato válido" },
    { "campo": "id", "mensaje": "El id del equipo es obligatorio" }
  ]
}
```

## Datos de ejemplo (seeder)

Al arrancar contra una base de datos vacía, el componente `DataSeeder` inserta automáticamente:

- **20 equipos** (ids 1 a 20) de las tres categorías (`MICROCONTROLADORES`, `VR`, `REDES`), con estados `DISPONIBLE`, `RESERVADO` y `MANTENIMIENTO` (equipos 4, 16 y 18).
- **20 reservas** de 9 usuarios distintos, repartidas así:
  - **7 `ACTIVA`** en el futuro, incluyendo **tres reservas activas no solapadas sobre el equipo 1** (Arduino Uno) para demostrar que un equipo puede tener varias reservas activas simultáneas.
  - **7 `FINALIZADA`** con fechas pasadas, para probar el top 5 y el filtro por estado.
  - **6 `CANCELADA`** (algunas con fecha futura y otras pasadas) para probar el historial.

Los equipos que quedan con reservas activas se marcan como `RESERVADO`.

> Para volver a sembrar los datos: borra el contenido de las tablas (o elimina la base `equipos_lis` y créala de nuevo con `db/init.sql`) y reinicia la aplicación. El seeder solo corre si las tablas de equipos y reservas están vacías.
