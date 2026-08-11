# Equipment API — Sistema de Gestión y Reservas de Equipos del LIS

**Reto 2 · Prueba Técnica 2026-2 · Laboratorio Integrado de Sistemas — Universidad de Antioquia**

API REST para gestionar el inventario de hardware del laboratorio (microcontroladores, VR y redes) y las reservas que hacen los usuarios sobre esos equipos.

> El frontend que consume esta API (Reto 3) está en el proyecto `equipment-frontend`.

---

## Índice

1. [Stack](#stack)
2. [Puesta en marcha](#puesta-en-marcha)
3. [Documentación interactiva (Swagger)](#documentación-interactiva-swagger)
4. [Endpoints](#endpoints)
5. [La regla de negocio crítica: solapamiento de reservas](#la-regla-de-negocio-crítica-solapamiento-de-reservas)
6. [Autenticación y permisos](#autenticación-y-permisos)
7. [Formato de errores](#formato-de-errores)
8. [Cómo probar la API paso a paso](#cómo-probar-la-api-paso-a-paso)
9. [Arquitectura](#arquitectura)
10. [Modelo de datos](#modelo-de-datos)
11. [Tests](#tests)
12. [Decisiones técnicas](#decisiones-técnicas)
13. [Cobertura de los requisitos del enunciado](#cobertura-de-los-requisitos-del-enunciado)
14. [Limitaciones conocidas](#limitaciones-conocidas)

---

## Stack

| Componente | Versión / elección |
|---|---|
| Lenguaje | Java **17** |
| Framework | Spring Boot **4.1.0** (Spring Framework 7, Jackson 3) |
| Persistencia | Spring Data JPA + Hibernate |
| Base de datos | **PostgreSQL en la nube** (compatible con Neon, Supabase, Railway…) |
| Seguridad | Spring Security · OAuth2 Client (Google) · OAuth2 Resource Server (JWT) |
| JWT | JJWT 0.13.0, firma **HS384**, vigencia 1 hora |
| Validación | Jakarta Bean Validation |
| Documentación | springdoc-openapi 3.0.0 (Swagger UI) |
| Tests | JUnit 5 · Mockito · AssertJ · H2 en memoria |
| Build | Maven (wrapper incluido) |

---

## Puesta en marcha

### 1. Requisitos

- **JDK 17 o superior**
- Una base de datos PostgreSQL accesible (local o en la nube)
- Credenciales de Google OAuth2 *(solo si quieres probar el SSO; la API funciona sin ellas para todo lo obligatorio, pero deben estar definidas para que arranque)*

### 2. Variables de entorno

Copia `.env.example` a `.env` y rellena los valores. Son **6 obligatorias**:

| Variable | Para qué sirve |
|---|---|
| `DB_URL` | URL JDBC, p. ej. `jdbc:postgresql://HOST/BD?sslmode=require` |
| `DB_USERNAME` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `JWT_SECRET` | Clave de firma. **Mínimo 48 caracteres** (lo exige HS384) |
| `GOOGLE_CLIENT_ID` | Credencial de Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Credencial de Google Cloud Console |

Opcionales (con valor por defecto): `FRONTEND_REDIRECT_URI`, `CORS_ALLOWED_ORIGINS`, `PROTECT_EQUIPMENT`, `PROTECT_RESERVATIONS`, `RESERVATION_MAX_HOURS`, `SEED_ENABLED`.

### 3. Arrancar

**Windows (PowerShell):**

```powershell
# Cargar el .env en la sesión actual
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
  }
}

.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
set -a && source .env && set +a
./mvnw spring-boot:run
```

La API queda en `http://localhost:8080`.

Al arrancar se completa el catálogo con **15 equipos de ejemplo**, un usuario demo y 6 reservas, para poder evaluar la API (y ver el dashboard del frontend) sin trabajo previo. La semilla es **idempotente**: inserta solo los números de serie que aún no existen, así que amplía un catálogo ya poblado sin duplicar nada. Se desactiva con `SEED_ENABLED=false`.

Si prefieres no reiniciar la aplicación, [`docs/seed-equipos.sql`](docs/seed-equipos.sql) aplica el mismo catálogo directamente sobre la base de datos con `psql`.

### 4. Comprobar que responde

```powershell
curl.exe "http://localhost:8080/api/equipment?size=3"
```

---

## Documentación interactiva (Swagger)

Con la aplicación arrancando:

| Recurso | URL |
|---|---|
| **Swagger UI** | http://localhost:8080/swagger-ui.html |
| Especificación OpenAPI (JSON) | http://localhost:8080/v3/api-docs |

Además hay:

- **[`docs/API.md`](docs/API.md)** — referencia completa con ejemplos `curl` de cada endpoint y de cada código de respuesta.
- **[`docs/equipment-api.postman_collection.json`](docs/equipment-api.postman_collection.json)** — colección importable en Postman, con un flujo guionizado que incluye la reproducción del error 409.

---

## Endpoints

Base: `http://localhost:8080`

### Equipos

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/equipment` | Listado **paginado y filtrable** | Pública |
| `GET` | `/api/equipment/{id}` | Detalle de un equipo | Pública |
| `POST` | `/api/equipment` | Registrar un equipo → `201` | Ver [permisos](#autenticación-y-permisos) |
| `PUT` | `/api/equipment/{id}` | Actualizar un equipo | Ver [permisos](#autenticación-y-permisos) |

Parámetros de `GET /api/equipment`:

| Parámetro | Valores | Por defecto |
|---|---|---|
| `category` | `MICROCONTROLLERS` · `VR` · `NETWORKS` | sin filtro |
| `status` | `AVAILABLE` · `RESERVED` · `MAINTENANCE` | sin filtro |
| `page` | número de página (empieza en 0) | `0` |
| `size` | tamaño de página (máx. 100) | `12` |
| `sort` | p. ej. `name,asc` | sin orden |

Los filtros son **combinables**:

```
GET /api/equipment?category=VR&status=AVAILABLE&page=0&size=5&sort=name,asc
```

### Reservas

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/reservations` | Todas las reservas | Pública |
| `GET` | `/api/reservations/equipment/{id}` | Reservas de un equipo | Pública |
| `POST` | `/api/reservations` | Crear reserva → `201` / **`409`** | Ver modos |
| `DELETE` | `/api/reservations/{id}` | Cancelar reserva propia → `204` | Ver modos |

### Estadísticas *(bonus)*

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/statistics/top-equipment` | Top 5 de equipos más solicitados históricamente |

### Autenticación *(bonus)*

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/oauth2/authorization/google` | Inicia el login con Google |
| `GET` | `/api/auth/me` | Datos del usuario autenticado |

---

## La regla de negocio crítica: solapamiento de reservas

> *"Durante la creación de una reserva, el sistema debe validar de forma estricta que el equipo solicitado no se encuentre ya reservado por otro usuario en la misma franja de tiempo."*

### El algoritmo

Dos intervalos se solapan **si y solo si**:

```
A.inicio < B.fin   Y   A.fin > B.inicio
```

Se implementa en [`ReservationRepository.existsOverlappingReservation`](src/main/java/equipment_api/repository/ReservationRepository.java):

```sql
SELECT COUNT(r) > 0
FROM Reservation r
WHERE r.equipment.id = :equipmentId
  AND r.status = ACTIVE
  AND r.startTime < :endTime
  AND r.endTime   > :startTime
```

### Por qué las comparaciones son estrictas

Las franjas se tratan como intervalos **semiabiertos** `[inicio, fin)`. Esto hace que dos reservas **contiguas no sean conflicto**, que es el comportamiento deseable:

```
Reserva existente:            10:00 ●━━━━━━━━━━━━━━━● 12:00

 08:00 ●━━━━━● 10:00                                    → 201  (contigua, termina cuando empieza)
                              10:30 ●━━━━━━● 11:30      → 409  (contenida)
 09:00 ●━━━━━━━━━━━━● 11:00                             → 409  (cruza el inicio)
                       11:00 ●━━━━━━━━━━━━● 13:00       → 409  (cruza el final)
 09:00 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━● 13:00           → 409  (la envuelve)
                                     12:00 ●━━━● 14:00  → 201  (contigua, empieza cuando termina)
```

Este comportamiento está cubierto por **13 tests parametrizados** que ejecutan la consulta real contra una base de datos ([`ReservationRepositoryTest`](src/test/java/equipment_api/repository/ReservationRepositoryTest.java)).

### Protección frente a concurrencia

Comprobar y luego insertar no basta: dos peticiones simultáneas pueden pasar ambas la comprobación antes de que ninguna haya guardado, y producir una **doble reserva**.

Por eso `createReservation` es `@Transactional` y carga el equipo con **bloqueo pesimista** (`SELECT … FOR UPDATE`) mediante `EquipmentRepository.findByIdForUpdate`. Eso serializa las reservas **por equipo**: dos usuarios reservando equipos distintos no se estorban entre sí.

### Cancelación lógica

Cancelar **no borra** la fila: la marca como `CANCELLED`.

- La franja queda libre de inmediato, porque la consulta de solapamiento solo mira reservas `ACTIVE`.
- El histórico se conserva, que es lo que necesita el "Top 5 de equipos más solicitados **históricamente**".

---

## Autenticación y permisos

El enunciado plantea dos exigencias que, tomadas al pie de la letra, se contradicen:

- **Obligatorio:** *"Permitir que un usuario (identificado por **nombre y correo**) cree, cancele y liste reservas"*.
- **Bonus:** *"emita un token de acceso (ej. JWT) para **proteger la creación de reservas**"*.

Si todo queda protegido tras el SSO de Google, un evaluador sin cuenta `@udea.edu.co` no puede probar **ningún** requisito obligatorio de escritura. Pero dejarlo todo abierto significa que cualquiera puede editar el inventario del laboratorio.

La API resuelve ambas cosas separando **qué tipo de acción** se protege, en lugar de aplicar un único interruptor:

| Acción | Endpoints | Por defecto | Propiedad |
|---|---|---|---|
| **Consultar** | todos los `GET` | 🔓 pública | — |
| **Reservar y cancelar** | `POST` y `DELETE /api/reservations` | 🔓 pública | `app.security.protect-reservations=false` |
| **Gestionar el inventario** | `POST` y `PUT /api/equipment` | 🔒 **requiere sesión** | `app.security.protect-equipment=true` |

El criterio es el uso real del laboratorio: **quien pasa por allí reserva un equipo, pero no da de alta ni edita el catálogo**. Administrar el inventario es una acción de gestión.

Esto no bloquea la evaluación: los evaluadores de la prueba tienen correo `@udea.edu.co`, así que pueden iniciar sesión y probar el alta y la edición sin barrera alguna. Y si se prefiere dejarlo abierto para revisarlo más rápido, basta con arrancar así:

```bash
PROTECT_EQUIPMENT=false ./mvnw spring-boot:run
```

### Modo abierto *(reservas, por defecto)*

El usuario se identifica con `userName` y `userEmail` en el cuerpo, y se da de alta automáticamente la primera vez:

```json
POST /api/reservations
{
  "equipmentId": 1,
  "userName": "Jose Mesa",
  "userEmail": "jose.mesar@udea.edu.co",
  "startTime": "2026-08-12T10:00:00",
  "endTime":   "2026-08-12T11:00:00"
}
```

Para cancelar, el correo se pasa como parámetro y debe coincidir con el de quien creó la reserva:

```
DELETE /api/reservations/1?email=jose.mesar@udea.edu.co
```

Si no coincide → **403**.

### Modo protegido *(inventario siempre; reservas si se activa)*

Exige `Authorization: Bearer <jwt>` con rol `USER`. El token se obtiene iniciando sesión con Google desde `/oauth2/authorization/google`; solo se aceptan correos `@udea.edu.co`.

Sin sesión, `POST` o `PUT` sobre `/api/equipment` responden **403**. Con `app.security.protect-reservations=true` se extiende la misma exigencia a las reservas, que es el modo descrito por el bonus del enunciado.

### En ambos modos: el token manda

Si la petición trae un JWT válido, **la identidad se toma del token y se ignoran `userName`/`userEmail` del cuerpo**. Es imposible reservar en nombre de otra persona aunque se manipule el JSON.

### Cómo se obtiene un token

1. Abrir en el navegador `http://localhost:8080/oauth2/authorization/google`
2. Iniciar sesión con una cuenta `@udea.edu.co`
3. El backend redirige a `FRONTEND_REDIRECT_URI` con `?token=<jwt>` (el frontend lo recoge solo)

Para obtenerlo desde Postman o curl sin frontend, pedir JSON explícitamente:

```
Accept: application/json
```

y la respuesta será `{"token":"…","email":"…","name":"…"}`.

---

## Reglas de negocio al crear una reserva

Se comprueban en este orden, y cada una devuelve un `code` propio para que el cliente pueda distinguirlas sin leer el texto del mensaje:

| # | Regla | Respuesta | `code` |
|---|---|---|---|
| 1 | La hora de inicio debe ser anterior a la de fin | `400` | `INVALID_TIME_RANGE` |
| 2 | La reserva no puede superar **8 horas** *(configurable con `app.reservations.max-hours`)* | `400` | `RESERVATION_TOO_LONG` |
| 3 | El equipo debe existir | `404` | `EQUIPMENT_NOT_FOUND` |
| 4 | El equipo **no puede estar en mantenimiento** | `409` | `EQUIPMENT_IN_MAINTENANCE` |
| 5 | Debe saberse quién reserva: token, o `userName` + `userEmail` | `400` | `IDENTITY_REQUIRED` |
| 6 | **La franja no puede cruzarse con otra reserva activa** | `409` | `RESERVATION_OVERLAP` |

Dos apuntes sobre el diseño:

- **El orden importa.** Las validaciones baratas van primero: una reserva de tres semanas se rechaza sin llegar a tocar la base de datos ni a bloquear la fila del equipo.
- **`RESERVED` no impide reservar.** Ese estado describe que el equipo *tiene* reservas, no que esté inutilizable; la disponibilidad de una franja concreta la decide la comprobación de solapamiento. `MAINTENANCE` sí lo impide, porque el equipo no está operativo.

La regla del mantenimiento vive en la API, no solo en la interfaz: el frontend ya deshabilita el botón, pero sin la comprobación en el servidor bastaría una petición directa con `curl` para saltársela.

---

## Formato de errores

**Todas** las respuestas de error comparten el mismo contrato, para que el frontend necesite un solo parser:

```json
{
  "timestamp": "2026-08-10T09:41:12.183",
  "status": 409,
  "error": "Conflict",
  "code": "RESERVATION_OVERLAP",
  "message": "El equipo con id 1 ya tiene una reserva que se cruza con la franja horaria solicitada",
  "path": "/api/reservations",
  "errors": []
}
```

**Sobre el campo `code`:** el estado HTTP no siempre basta. "La franja está ocupada" y "el equipo está en mantenimiento" son ambas un `409`, y la interfaz debe mostrar mensajes distintos. Un identificador estable permite decidirlo sin interpretar el texto, que cambia con el idioma. Los valores están en [`ErrorCode.java`](src/main/java/equipment_api/exception/ErrorCode.java) y forman parte del contrato público de la API.

En los errores de validación, `errors` detalla campo a campo:

```json
{
  "status": 400,
  "message": "Hay campos invalidos en la peticion",
  "errors": [
    { "field": "name",         "message": "El nombre del equipo es obligatorio" },
    { "field": "serialNumber", "message": "El numero de serie (o MAC) es obligatorio" }
  ]
}
```

| Código | Cuándo |
|---|---|
| `200` / `201` / `204` | Éxito |
| `400` | Validación fallida, fechas incoherentes, JSON o enum inválido |
| `403` | Intento de cancelar una reserva ajena; o falta de permisos en modo protegido |
| `404` | Equipo, reserva o usuario inexistente |
| **`409`** | **Franja horaria ocupada** · número de serie duplicado |
| `500` | Error inesperado (se registra en el log, no se expone el detalle) |

---

## Cómo probar la API paso a paso

Con la aplicación arrancando y los datos semilla cargados.

### 1. Listado paginado y filtrado

```powershell
curl.exe "http://localhost:8080/api/equipment?size=3"
curl.exe "http://localhost:8080/api/equipment?category=VR&status=AVAILABLE"
```

### 2. Registrar un equipo

```powershell
curl.exe -X POST http://localhost:8080/api/equipment `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Arduino Nano\",\"serialNumber\":\"MCU-NAN-9001\",\"category\":\"MICROCONTROLLERS\",\"status\":\"AVAILABLE\"}'
```
→ `201`

### 3. Ver la validación en acción

```powershell
curl.exe -X POST http://localhost:8080/api/equipment `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"\",\"serialNumber\":\"\"}'
```
→ `400` con el detalle por campo.

### 4. Crear una reserva

```powershell
curl.exe -X POST http://localhost:8080/api/reservations `
  -H "Content-Type: application/json" `
  -d '{\"equipmentId\":1,\"userName\":\"Jose\",\"userEmail\":\"jose.mesar@udea.edu.co\",\"startTime\":\"2026-09-01T10:00:00\",\"endTime\":\"2026-09-01T11:00:00\"}'
```
→ `201`

### 5. ⭐ Provocar el conflicto 409

Repetir la llamada con una franja que **se cruce** (no que se toque):

```powershell
curl.exe -X POST http://localhost:8080/api/reservations `
  -H "Content-Type: application/json" `
  -d '{\"equipmentId\":1,\"userName\":\"Ana\",\"userEmail\":\"ana@udea.edu.co\",\"startTime\":\"2026-09-01T10:30:00\",\"endTime\":\"2026-09-01T11:30:00\"}'
```
→ **`409 Conflict`**

> ⚠️ Si en vez de `10:30–11:30` se usa `11:00–12:00`, la respuesta es `201`: son franjas **contiguas**, no solapadas. Es el comportamiento correcto, no un fallo.

### 6. Cancelar y comprobar que libera la franja

```powershell
curl.exe -X DELETE "http://localhost:8080/api/reservations/1?email=otro@udea.edu.co"   # → 403
curl.exe -X DELETE "http://localhost:8080/api/reservations/1?email=jose.mesar@udea.edu.co" # → 204
```

Repetir ahora el paso 5: devuelve `201`, porque la reserva cancelada ya no bloquea.

### 7. Estadísticas

```powershell
curl.exe http://localhost:8080/api/statistics/top-equipment
```

### 8. Comprobar CORS

```powershell
curl.exe -X OPTIONS http://localhost:8080/api/equipment `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: GET" -i
```
→ debe aparecer la cabecera `Access-Control-Allow-Origin`.

---

## Arquitectura

Arquitectura clásica por capas: cada capa solo conoce a la de debajo.

```
HTTP
 │
 ▼
controller/          Traduce HTTP ↔ objetos. No contiene lógica de negocio.
 │   EquipmentController · ReservationController
 │   StatisticsController · AuthController
 ▼
service/             Reglas de negocio (solapamiento, identidad, cancelación).
 │   EquipmentService · ReservationService
 │   StatisticsService · JwtService · CustomOAuth2UserService
 ▼
repository/          Acceso a datos con Spring Data JPA + consultas JPQL.
 │   EquipmentRepository · ReservationRepository · UserRepository
 ▼
entity/              Modelo persistente.
     Equipment · Reservation · User + enums

dto/                 Contratos de entrada/salida, desacoplados de las entidades.
exception/           Excepciones de dominio + manejador global (@RestControllerAdvice).
config/              SecurityConfig · OpenApiConfig · DataSeeder
                     OAuth2AuthenticationSuccessHandler
```

**Por qué DTOs y no entidades en las respuestas de reserva:** `ReservationResponse` aplana la relación `Reservation → Equipment/User` para evitar exponer el grafo de entidades y las referencias circulares, y para que el frontend reciba justo lo que necesita.

---

## Modelo de datos

```
┌──────────────────┐         ┌────────────────────────┐         ┌──────────────┐
│    equipment     │         │      reservations      │         │    users     │
├──────────────────┤         ├────────────────────────┤         ├──────────────┤
│ id          PK   │◄───────┤ equipment_id       FK   │        ┌│ id       PK  │
│ name             │  1    N │ user_id            FK  ├────────┘│ name         │
│ serial_number  U │         │ start_time             │ N     1 │ email      U │
│ category    enum │         │ end_time               │         └──────────────┘
│ status      enum │         │ status  enum(ACTIVE/   │
│ created_at       │         │              CANCELLED)│
│ updated_at       │         │ created_at             │
└──────────────────┘         └────────────────────────┘
```

| Enum | Valores |
|---|---|
| `EquipmentCategory` | `MICROCONTROLLERS` · `VR` · `NETWORKS` |
| `EquipmentStatus` | `AVAILABLE` · `RESERVED` · `MAINTENANCE` |
| `ReservationStatus` | `ACTIVE` · `CANCELLED` |

El esquema lo genera Hibernate (`ddl-auto=update`).

---

## Tests

```powershell
.\mvnw.cmd test
```

**37 tests**, ninguno depende de la base de datos de producción (usan H2 en memoria).

| Clase | Qué cubre |
|---|---|
| `ReservationRepositoryTest` | **13 tests parametrizados** que ejecutan la consulta JPQL de solapamiento contra una BD real: solapamiento idéntico, contenido, por delante, por detrás, envolvente, por un minuto, contiguo (no conflicto), reserva cancelada libera franja, otro equipo no bloquea |
| `ReservationServiceTest` | Reglas del servicio con Mockito: rechazo por conflicto, validación de fechas, bloqueo pesimista, prioridad del token sobre el cuerpo, alta de usuario anónimo, cancelación lógica e idempotente, 403 por no ser el dueño |
| `ReservationControllerTest` | Contrato HTTP: 201, **409**, 400 con detalle por campo, 404, 204, 403 — y que el cuerpo de error siempre tenga la misma forma |
| `EquipmentApiApplicationTests` | El contexto de Spring arranca correctamente |

---

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| **Bloqueo pesimista por equipo** en lugar de `SERIALIZABLE` o constraint `EXCLUDE` | `SERIALIZABLE` penaliza toda la aplicación; una constraint `EXCLUDE` de PostgreSQL exige la extensión `btree_gist` y ata el proyecto a ese motor. El bloqueo por fila resuelve la carrera exactamente donde ocurre. |
| **Cancelación lógica** en vez de `DELETE` | Preserva el histórico que necesitan las estadísticas y permite auditar. |
| **Contrato de error único** (`ApiErrorResponse`) | Antes convivían tres formatos distintos (el propio, el de Spring Security y el `ProblemDetail` de Bean Validation). Con uno solo, el frontend escribe un único parser. |
| **Permisos separados por tipo de acción** | Un único interruptor obligaba a elegir entre "todo abierto" o "todo cerrado". Separando inventario y reservas se cumple el requisito obligatorio (reservar sin cuenta institucional) sin dejar el catálogo del laboratorio expuesto a cualquiera. |
| **Campo `code` en los errores** | Dos situaciones distintas comparten el `409`. Un identificador estable permite al cliente elegir el mensaje sin interpretar texto que cambia con el idioma. |
| **Semilla idempotente por número de serie** | Un seeder que solo actúa con la tabla vacía es inútil en cuanto hay un registro. Insertando solo los números de serie ausentes, el catálogo se puede ampliar sobre una base ya en uso. |
| **Datos semilla activados por defecto** | La API se puede evaluar recién clonada, sin insertar nada a mano. |
| **`open-in-view=false`** | Evita mantener la sesión de Hibernate abierta durante el renderizado; las consultas quedan acotadas a la capa de servicio. |
| **H2 solo en tests** | `mvnw test` funciona en cualquier máquina sin credenciales de producción. |
| **`serialNumber` como texto libre** | El enunciado dice "número de serie **o** MAC": un único campo `String` único admite ambos formatos sin duplicar columnas. |

---

## Cobertura de los requisitos del enunciado

| Requisito | Dónde está |
|---|---|
| Persistencia en base de datos (no en memoria) | PostgreSQL en la nube · `application.properties` |
| Gestión de equipos: registro, actualización, visualización | `EquipmentController` |
| Campos: ID único, nombre, nº de serie/MAC, categoría, estado | `entity/Equipment.java` |
| **Listado paginado** | `GET /api/equipment` → `Page<Equipment>` |
| **Filtros por categoría o estado** | `EquipmentService.getAllEquipment()` |
| Gestión de reservas: crear, cancelar, listar | `ReservationController` |
| Usuario identificado por nombre y correo | `ReservationRequest` + `ReservationService.resolveUser()` |
| Fecha/hora de inicio y de fin | `entity/Reservation.java` |
| **Regla crítica: no reservar franja ocupada** | `ReservationRepository.existsOverlappingReservation` |
| **Código HTTP adecuado en conflicto** | **409** · `GlobalExceptionHandler` |
| *Bonus:* Top 5 de equipos más solicitados | `GET /api/statistics/top-equipment` |
| *Bonus:* SSO con proveedor externo | `CustomOAuth2UserService` (Google) |
| *Bonus:* validar correo institucional | `CustomOAuth2UserService` → sufijo `@udea.edu.co` |
| *Bonus:* emitir JWT | `JwtService` (HS384, 1 h) |
| *Bonus:* proteger la creación de reservas | `app.security.protect-reservations=true` |
| Documentación para probar los servicios | Swagger UI · `docs/API.md` · colección Postman · este README |

---

## Limitaciones conocidas

Trabajo pendiente, consciente y priorizado:

- **Sin búsqueda por nombre en la API.** El listado filtra por categoría y estado; el frontend hace la búsqueda textual en cliente sobre la página cargada. Lo correcto sería un parámetro `q` con `LIKE` en servidor.
- **Sin paginación en el listado de reservas.** `GET /api/reservations` devuelve todas. Con volumen alto habría que paginarlo igual que los equipos.
- **El estado del equipo no se sincroniza solo.** Crear una reserva no cambia el `status` del equipo a `RESERVED`; son conceptos independientes (el estado refleja la disponibilidad física, no la agenda). Se gestiona con `PUT /api/equipment/{id}`.
- **Se puede reservar un equipo en `MAINTENANCE`.** La API no lo impide; el frontend sí deshabilita el botón.
- **Rol único.** Todos los usuarios autenticados reciben `ROLE_USER`; no hay perfil de administrador.
- **Sin migraciones versionadas.** Se usa `ddl-auto=update`. Para producción convendría Flyway o Liquibase.
- **JWT sin refresco.** El token dura 1 hora; al expirar hay que volver a iniciar sesión.