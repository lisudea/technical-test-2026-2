# LIS API — Gestión y Reservas de Equipos

REST API para administrar el inventario de hardware del Laboratorio Integrado de Sistemas y las reservas de sus equipos: quién usa qué, cuándo, y sin choques de horario.

**Stack:** NestJS · Prisma · PostgreSQL · Docker

---

## Quick Start

Con Docker (recomendado — levanta base de datos, migraciones, datos de ejemplo y API):

```bash
docker compose up -d
```

Listo. La API queda en `http://localhost:3000`:

| URL | Qué es |
|-----|--------|
| [`http://localhost:3000/docs`](http://localhost:3000/docs) | **Documentación interactiva** (Scalar) — explora y prueba cada endpoint |
| [`http://localhost:3000/swagger`](http://localhost:3000/swagger) | Swagger UI clásico |
| [`http://localhost:3000`](http://localhost:3000) | Healthcheck |

![Documentación Scalar](docs/capturas/scalar.jpg)

<details>
<summary><b>Modo desarrollo</b> (API local con hot-reload)</summary>

```bash
npm install
cp .env.example .env
docker compose up -d db        # solo la base de datos
npx prisma migrate dev         # crea las tablas
npm run db:seed                # carga datos de ejemplo
npm run start:dev
```
</details>

## Arquitectura

```mermaid
flowchart LR
    C[Cliente / Frontend] -->|HTTP| A[API NestJS :3000]
    A --> V[ValidationPipe + DTOs]
    V --> S[Servicios de dominio]
    S -->|Prisma| P[(PostgreSQL :5433)]

    subgraph Módulos
        E[equipos] ~~~ R[reservas] ~~~ K[estadisticas]
    end
```

- **`equipos`** — inventario: registro, actualización, consulta, listado paginado con filtros.
- **`reservas`** — ciclo de vida de la reserva y la validación de solapamiento.
- **`estadisticas`** — KPIs agregados para tableros de monitoreo.

## Probar con Postman

En [`docs/`](docs/) están la especificación **OpenAPI** (`openapi.json`) y la **colección de Postman** (`postman_collection.json`) generada a partir de ella: se importa en Postman con *File → Import* y quedan las 20 rutas organizadas por módulo. Para los endpoints protegidos, pega el token del login en *Authorization → Bearer Token*.

## Referencia de la API

### Equipos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/equipos` | Registrar un equipo |
| `GET` | `/equipos` | Listar con paginación y filtros |
| `GET` | `/equipos/:id` | Consultar un equipo |
| `GET` | `/equipos/:id/disponibilidad?desde=&hasta=` | Franjas ocupadas del equipo (sin datos personales) |
| `PATCH` | `/equipos/:id` | Actualizar un equipo 🛡️ |

El registro y la actualización de equipos requieren rol de **administrador** (🛡️).

**Filtros de `GET /equipos`:** `pagina`, `limite`, `categoria`, `estado`, `buscar` (nombre o serial, sin distinguir mayúsculas).

```bash
curl "localhost:3000/equipos?categoria=REDES&estado=DISPONIBLE&pagina=1&limite=10"
```

Categorías: `MICROCONTROLADORES` · `VR` · `REDES` · `COMPUTO` · `IMPRESION_3D`
Estados: `DISPONIBLE` · `RESERVADO` · `MANTENIMIENTO`

Toda respuesta de listado viene paginada:

```json
{ "datos": [...], "total": 12, "pagina": 1, "limite": 10, "totalPaginas": 2 }
```

### Reservas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/reservas` | Crear una reserva |
| `PATCH` | `/reservas/:id/cancelar` | Cancelar una reserva |
| `GET` | `/reservas` | Listar con paginación y filtros |

**Filtros de `GET /reservas`:** `equipoId`, `correo`, `estado`, `desde`, `hasta`, `pagina`, `limite`.

```bash
curl -X POST localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "equipoId": "<uuid>",
    "nombreUsuario": "Eduardo De la Hoz",
    "correoUsuario": "eduardo.delahoz@udea.edu.co",
    "inicio": "2026-08-11T08:00:00Z",
    "fin": "2026-08-11T10:00:00Z"
  }'
```

### Estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/estadisticas/resumen` | KPIs: equipos por estado y categoría, actividad de reservas, % de ocupación, top usuarios |
| `GET` | `/estadisticas/top-equipos?limite=5` | Equipos más solicitados históricamente |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/registro` | Crear cuenta (correo institucional `@udea.edu.co`) |
| `POST` | `/auth/login` | Iniciar sesión (devuelve access + refresh token) |
| `POST` | `/auth/google` | Iniciar sesión con Google (valida correo `@udea.edu.co`) |
| `POST` | `/auth/refresh` | Renovar la sesión (rotación de refresh token) |
| `POST` | `/auth/logout` | Cerrar sesión (revoca el refresh token) |
| `POST` | `/auth/olvide-contrasena` | Solicitar enlace de recuperación por correo |
| `POST` | `/auth/restablecer-contrasena` | Restablecer la contraseña con el token del correo |
| `GET` | `/auth/perfil` 🔒 | Datos del usuario autenticado |
| `PATCH` | `/auth/cambiar-contrasena` 🔒 | Cambiar la contraseña (requiere la actual) |

**Crear y cancelar reservas requiere autenticación** (🔒): el token que devuelven el registro, el login o Google se envía en cada petición como `Authorization: Bearer <token>`. Sin token la API responde `401`. El listado de equipos, la disponibilidad y las estadísticas agregadas son públicos.

**Roles.** El enunciado no define roles, así que se aplicó mínimo privilegio con dos niveles:

- `USUARIO` (por defecto al registrarse): reserva equipos, ve y cancela **solo sus** reservas.
- `ADMIN`: ve el historial completo, cancela cualquier reserva y gestiona el inventario (crear/actualizar equipos).

El seed crea un administrador de prueba: `admin.lis@udea.edu.co` / `lisadmin2026` (configurable con `ADMIN_PASSWORD`).

**Manejo de sesión:** el login devuelve dos tokens. El **access token** (JWT, 15 minutos) va en el header de cada petición; el **refresh token** (7 días, almacenado con hash en BD) sirve para renovar la sesión en `/auth/refresh` sin pedirle credenciales al usuario. La rotación es estricta: cada refresh entrega un par nuevo y revoca el anterior — un refresh token robado y reutilizado recibe `401`. El logout y el restablecimiento de contraseña revocan las sesiones abiertas.

**Recuperación de contraseña:** `/auth/olvide-contrasena` genera un enlace de un solo uso que vence en 1 hora y lo envía por correo ([Resend](https://resend.com)); la respuesta es idéntica exista o no la cuenta, para no revelar correos registrados. Sin `RESEND_API_KEY` configurada, el enlace se imprime en el log del servidor (modo desarrollo).

```bash
# 1. Crear cuenta (o /auth/login si ya existe)
TOKEN=$(curl -s -X POST localhost:3000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","correo":"ana@udea.edu.co","contrasena":"claveSegura1"}' | jq -r .token)

# 2. Reservar con el token
curl -X POST localhost:3000/reservas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "equipoId": "<uuid>", ... }'
```

**Flujo de Google:** el frontend muestra el botón oficial de Google Identity Services; Google devuelve un `idToken`; la API lo verifica con la librería oficial (`google-auth-library`), exige que el correo termine en `@udea.edu.co` y emite el mismo JWT del login normal. Requiere `GOOGLE_CLIENT_ID` en el `.env` — si está vacío, ese endpoint responde `503` y el resto de la API funciona normal. Las contraseñas se guardan con hash bcrypt.

## La regla de negocio crítica

Un equipo no puede tener dos reservas activas que se crucen. Dos franjas chocan cuando:

```
inicio_nueva < fin_existente  Y  fin_nueva > inicio_existente
```

- Las reservas **canceladas no bloquean** la franja.
- Los **bordes exactos no chocan**: una reserva de 8:00–10:00 y otra de 10:00–12:00 conviven.
- En conflicto la API responde **`409 Conflict`**:

```json
{ "message": "El equipo ya está reservado en esa franja horaria", "statusCode": 409 }
```

La verificación y el insert corren dentro de una **transacción con aislamiento `Serializable`**: si dos solicitudes piden la misma franja al mismo tiempo, una gana y la otra recibe el 409 — no hay ventana para que ambas se cuelen entre la validación y la escritura.

Reglas adicionales: fin posterior al inicio (`400`), equipo en mantenimiento no reservable (`400`), no se cancela dos veces (`400`), equipo inexistente (`404`). El estado del equipo pasa a `RESERVADO` mientras una reserva vigente lo cubre y vuelve a `DISPONIBLE` al liberarse.

## Tests

La regla de solapamiento tiene su propia suite e2e (9 casos: franja idéntica, solapamiento parcial, franja contenedora, bordes contiguos, cancelación que libera, validaciones de fechas y estados):

```bash
docker compose up -d db
npm run test:e2e
```

## Modelo de datos

| Tabla | Campos |
|-------|--------|
| `equipos` | `id` (uuid) · `nombre` · `serial` (único; sirve para serie o MAC) · `categoria` · `estado` · `creado_en` |
| `reservas` | `id` (uuid) · `equipo_id` (FK) · `nombre_usuario` · `correo_usuario` · `inicio` · `fin` · `estado` (`ACTIVA`/`CANCELADA`) · `creada_en` |
| `usuarios` | `id` (uuid) · `nombre` · `correo` (único) · `hash_contrasena` (nulo si la cuenta entra solo con Google) · `creado_en` |
| `tokens_refresh` | `id` · `usuario_id` (FK) · `hash_token` (único) · `expira_en` · `revocado_en` · `creado_en` |
| `tokens_recuperacion` | `id` · `usuario_id` (FK) · `hash_token` (único) · `expira_en` · `usado_en` · `creado_en` |

Esquema completo en [`prisma/schema.prisma`](prisma/schema.prisma), migraciones versionadas en `prisma/migrations/`.

## Decisiones técnicas

- **Transacción `Serializable` en vez de un simple `findFirst` + `create`** — sin ella, dos peticiones concurrentes podrían pasar la validación a la vez y crear reservas cruzadas.
- **Tokens de sesión con rotación** — access token corto (15 min) + refresh token de 7 días guardado con hash SHA-256; nunca se almacena el valor en claro, ni de sesiones ni de enlaces de recuperación.
- **Las reservas guardan nombre y correo del usuario directamente** (lo que pide el enunciado); el módulo queda listo para colgar autenticación encima sin migrar datos.
- **Paginación por `skip/take` con conteo en paralelo** — una sola vuelta a la BD por página.
- **Enums a nivel de base de datos** para categorías y estados: los valores inválidos mueren en la validación del DTO, y si algo se colara, la BD tampoco lo acepta.
- **Seed idempotente** — se puede correr mil veces sin duplicar datos.

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://lis:lis@localhost:5433/lisdb` |
| `PORT` | Puerto de la API | `3000` |
| `JWT_SECRET` | Clave de firma de los JWT | `cambia-este-secreto` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID para el login con Google (opcional) | vacío |
| `RESEND_API_KEY` | API key de Resend para correos de recuperación (opcional) | vacío |
| `FRONTEND_URL` | Base del enlace de recuperación | `http://localhost:5173` |

## Solución de problemas

- **Puerto 5433 o 3000 ocupado** → cámbialo en `docker-compose.yml` (y `DATABASE_URL` si moviste el 5433).
- **`prisma migrate dev` no conecta** → verifica que la BD esté sana: `docker compose ps` debe mostrar `lis-db (healthy)`.
- **Quiero resetear los datos** → `docker compose down -v && docker compose up -d` (borra el volumen y arranca de cero).
