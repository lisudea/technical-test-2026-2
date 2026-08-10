# API de gestión y reservas de equipos — Laboratorio Integrado de Sistemas

API REST para administrar los equipos del Laboratorio Integrado de Sistemas (LIS), su estado operacional y sus reservas. Implementa la lógica de disponibilidad, evita solapamientos y expone estadísticas de uso.

## Tecnologías

- Java 25 y Spring Boot 4
- Spring Web MVC, Validation y Data JPA
- PostgreSQL para ejecución normal; H2 en memoria para pruebas
- Springdoc OpenAPI / Swagger UI
- Gradle Wrapper

## Arquitectura

El código se organiza por capas:

- `controller`: contratos HTTP.
- `service`: reglas de negocio y transacciones.
- `repository`: persistencia con Spring Data JPA.
- `entity`: modelo relacional.
- `dto`: solicitudes y respuestas de la API.
- `config`: CORS, OpenAPI y manejo global de errores.
- `exception` y `validation`: errores de dominio y validadores.

## Requisitos

- JDK 25.
- PostgreSQL accesible para ejecutar la aplicación fuera de pruebas.
- No es necesario instalar Gradle: se usa el wrapper incluido.

## Configuración

La configuración se encuentra en `src/main/resources/application.yaml`. La plantilla `application-example.yaml` documenta las variables de entorno soportadas:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | URL JDBC de PostgreSQL. |
| `DATABASE_USERNAME` | Usuario de base de datos. |
| `DATABASE_PASSWORD` | Contraseña de base de datos. |

Ejemplo de URL: `jdbc:postgresql://localhost:5432/equipment_reservation`.

La UI de desarrollo se ejecuta en `http://localhost:3000`; CORS está configurado para ese origen.

## Ejecución

Desde esta carpeta:

```bash
./gradlew bootRun
```

En Windows:

```powershell
.\gradlew.bat bootRun
```

La API queda disponible en `http://localhost:8080`.

## Pruebas y compilación

```bash
./gradlew test
./gradlew compileJava
```

En Windows sustituye `./gradlew` por `.\gradlew.bat`.

Las pruebas de integración usan H2 en modo PostgreSQL y cubren creación de equipos y reservas, mantenimiento, conflictos de horarios y reglas del horario laboral.

## Documentación interactiva

Con la aplicación iniciada, Swagger UI está disponible en:

`http://localhost:8080/swagger-ui/index.html`

## Endpoints

### Catálogos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/categories` | Lista todas las categorías, incluso si no hay equipos asociados. |
| `GET` | `/api/operational-statuses` | Lista todos los estados operacionales. |

Los datos iniciales incluyen las categorías `MICROCONTROLLERS`, `VR`, `NETWORKING`, `AUDIOVISUAL` y `COMPUTING`; y los estados `OPERATIONAL` y `MAINTENANCE`. En la respuesta de estado, `OPERATIONAL` se publica también con el código de UI `AVAILABLE`.

### Equipos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/equipment?page=0&size=10&categoryId=&operationalStatusId=` | Lista equipos paginados; categoría y estado son filtros opcionales. |
| `POST` | `/api/equipment` | Crea un equipo. |
| `PUT` | `/api/equipment/{id}` | Actualiza un equipo existente. |
| `GET` | `/api/equipment/{id}/availability?startAt=&endAt=` | Consulta el estado del equipo para un rango puntual. |

Solicitud para crear o actualizar un equipo:

```json
{
  "name": "Arduino Uno R4",
  "serialNumber": "ARD-R4-001",
  "macAddress": "02:00:00:00:10:01",
  "categoryId": 1,
  "operationalStatusId": 1
}
```

`serialNumber` y `macAddress` son opcionales de forma individual, pero debe enviarse por lo menos uno.

La disponibilidad devuelve `AVAILABLE`, `RESERVED` o `MAINTENANCE`. Cuando existe una reserva que bloquea el rango, puede incluir `nextAvailableStartAt` y `nextReservedStartAt`.

### Reservas

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/reservations?page=0&size=10&status=` | Lista reservas paginadas; `status` es opcional. |
| `POST` | `/api/reservations` | Crea una reserva. |
| `PATCH` | `/api/reservations/{id}/cancel` | Cancela una reserva activa. |
| `GET` | `/api/equipment/{equipmentId}/reservations?page=0&size=10` | Obtiene el historial paginado de un único equipo. |

Solicitud de creación:

```json
{
  "equipmentId": 1,
  "userName": "Ana Pérez",
  "userEmail": "ana.perez@udea.edu.co",
  "startAt": "2026-08-11T08:00:00-05:00",
  "endAt": "2026-08-11T10:00:00-05:00"
}
```

### Estadísticas

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/statistics/top-reserved` | Devuelve los cinco equipos con más reservas. |

## Paginación y errores

Los listados paginados responden con:

```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 0,
  "totalPages": 0
}
```

Los errores tienen un formato uniforme:

```json
{
  "timestamp": "2026-08-11T13:00:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Reservation conflicts with an existing active reservation",
  "path": "/api/reservations"
}
```

Los códigos habituales son `400` para solicitudes inválidas, `404` para recursos inexistentes y `409` para duplicados, conflictos de reserva o estados no permitidos.

## Reglas de negocio

- Nombre, categoría y estado operacional son obligatorios para un equipo.
- El número de serie y la MAC son únicos cuando se proporcionan.
- No se puede reservar un equipo en mantenimiento.
- La reserva debe empezar en el futuro, finalizar después de comenzar y tener correo electrónico válido.
- El horario permitido es de 06:00 a 20:00 en `America/Bogota`.
- No se admiten reservas activas solapadas para el mismo equipo. La base de datos también protege esta regla con una restricción de exclusión en PostgreSQL.
- Al pasar un equipo a mantenimiento se cancelan sus reservas activas futuras.
- No se puede cancelar una reserva ya finalizada.

## Base de datos

`schema.sql` define las tablas `category`, `operational_status`, `reservation_status`, `equipment` y `reservation`. `data.sql` carga los catálogos iniciales. La migración `db/migration/V2__reservation_no_overlap.sql` añade la protección de no solapamiento para PostgreSQL.

## Mejoras adicionales al alcance base

Además de las operaciones obligatorias, esta API incorpora mejoras de diseño y seguridad de datos:

- Consulta de disponibilidad para una franja horaria y entrega del siguiente horario disponible cuando existe un conflicto.
- Catálogos independientes de categorías y estados operacionales; evitan derivar opciones de los equipos existentes.
- Listado global de reservas, historial paginado por equipo y cancelación controlada.
- Estadística histórica de los cinco equipos más reservados.
- Cancelación automática de reservas activas futuras cuando un equipo se cambia a mantenimiento.
- Validación de solapamientos tanto en la lógica de negocio como en PostgreSQL, para reducir condiciones de carrera.
- Respuestas de error uniformes y documentación OpenAPI interactiva.
