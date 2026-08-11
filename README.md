# Reservas LIS — Backend (Reto 2)

API REST para la **gestión y reserva de equipos del Laboratorio Integrado de
Sistemas (LIS)** de la Universidad de Antioquia: microcontroladores, kits de
realidad virtual, equipos de red e impresoras 3D.

Este repositorio corresponde al **Reto 2 (Backend)** de la prueba técnica LIS
2026-2. El frontend (Reto 3) y la infraestructura como código (Reto 4) viven
en ramas separadas del mismo repositorio (ver [Estructura de ramas](#estructura-de-ramas)).

> La documentación de diseño completa está en [`docs/specs/`](docs/specs/).
> Las decisiones técnicas con trade-offs se justifican en
> [`docs/adr/`](docs/adr/).

## Stack

| Capa | Tecnología |
|------|------------|
| Lenguaje / runtime | Java 21 LTS |
| Framework | Spring Boot 3.x (Spring Web, Security, OAuth2 Client, Data JPA, Validation) |
| Build | Maven (wrapper incluido: `./mvnw`) |
| Base de datos | MySQL 8 (Flyway gestiona el esquema) |
| Documentación API | springdoc-openapi (Swagger UI autogenerado) |
| Tests | JUnit 5 + Mockito + Testcontainers (MySQL 8 real) |
| Contenedor local | Podman / Docker (`infra/compose.yaml`) |
| Empaquetado prod | Imagen OCI multi-stage (`infra/containers/backend.containerfile`) |

## Prerrequisitos

- **Java 21 LTS** (`java -version`).
- **Maven 3.9+** (o usar el wrapper `./mvnw` que ya está en el repo).
- **Podman** (recomendado en Fedora) o **Docker** para levantar MySQL local.
- **MySQL 8** (solo si no se usa el contenedor): accesible en `localhost:3306`
  con base de datos `reservas_lis`.

No se necesita Node.js para este reto (el frontend es el Reto 3).

## Inicio rápido

### Opción A — Con MySQL local ya corriendo

```bash
./mvnw spring-boot:run
```

Flyway aplica las migraciones `V1__`…`V5__` al arrancar, incluyendo datos
semilla (4 categorías, 10 equipos, 3 usuarios `@udea.edu.co`, 5 reservas).
La API queda en `http://localhost:8080`.

Variables por defecto (en `src/main/resources/application.yml`):

| Variable | Default | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/reservas_lis?...` | URL de conexión |
| `DB_USERNAME` | `reservas` | Usuario de la base |
| `DB_PASSWORD` | `reservas` | Contraseña |
| `JWT_SECRET` | `dev-secret-change-me...` | Clave de firma JWT (cambiar en prod) |
| `GOOGLE_SSO_ENABLED` | `false` | Activa la validación real del id_token de Google |
| `GOOGLE_CLIENT_ID` | _(vacío)_ | Client ID OAuth de Google Cloud Console |
| `CORS_ALLOWED_ORIGINS` | `*` | Orígenes permitidos (dominio CloudFront en prod) |
| `ADMIN_EMAILS` | `isaac.mesag@udea.edu.co` | Correos promovidos a ADMIN al iniciar sesión |
| `AUXILIAR_EMAILS` | `ana.torres@udea.edu.co` | Correos promovidos a AUXILIAR al iniciar sesión |

### Opción B — Todo en contenedores (recomendado)

Levanta MySQL 8 + backend ya empaquetado, sin instalar Java ni MySQL en la
máquina:

```bash
podman-compose -f infra/compose.yaml up
# o: docker compose -f infra/compose.yaml up
```

El backend espera a que MySQL reporte healthy antes de conectar; Flyway corre
las migraciones en el arranque. La API queda en `http://localhost:8080`.

## Documentación de la API (Swagger)

Una vez levantado el backend:

```
http://localhost:8080/swagger-ui.html
```

El OpenAPI se genera desde el código (`@Operation`, `@ApiResponse`, `@Schema`)
para que la documentación nunca se desincronice de la implementación. La
colección de Postman versionada en [`docs/postman/`](docs/postman/reservas-lis.postman_collection.json)
complementa el Swagger con ejemplos de request/response y los casos de
conflicto (409) y bonus (Google SSO, Top 5).

## Roles: administrador y auxiliar

El sistema tiene tres niveles de autoridad. Todo usuario nuevo entra como
`ESTUDIANTE`; los privilegios se otorgan, nunca se heredan.

| Superficie | ESTUDIANTE | AUXILIAR | ADMIN |
|---|---|---|---|
| Catálogo (GET) y estadísticas | público | público | público |
| Reservas propias (crear / listar / cancelar) | sí | sí | sí |
| Ver o cancelar reservas ajenas | no (404) | sí | sí |
| Mesa de préstamos `/prestamos` | — | sí | sí |
| Cambiar estado de un equipo | — | sí | sí |
| CRUD de equipos y categorías | — | — | sí |
| Crear / levantar sanciones | — | — | sí |
| Listar sanciones de otros | — | sí | sí |
| `/admin` (usuarios, roles, resumen) | — | — | sí |

Un ESTUDIANTE **solo puede reservar a su propio nombre**: el `correoUsuario`
del cuerpo se ignora y se reemplaza por el del token. El personal
(AUXILIAR/ADMIN) sí puede reservar a nombre de quien esté en el mostrador.

### Cómo obtener acceso de admin o auxiliar

Hay un problema de arranque: asignar roles es un endpoint que requiere ADMIN,
así que en una base nueva nadie podría otorgar el primero. Se resuelve por
configuración, no con SQL manual en producción:

```bash
# Los correos listados se promueven automáticamente al iniciar sesión.
export ADMIN_EMAILS="isaac.mesag@udea.edu.co,otro.admin@udea.edu.co"
export AUXILIAR_EMAILS="ana.torres@udea.edu.co"
```

La promoción es **solo hacia arriba**: quitar un correo de la lista no degrada
a nadie. Degradar es siempre un `PATCH` explícito, que queda registrado.

Para el entorno de demo, la migración `V8` ya deja
`isaac.mesag@udea.edu.co` como **ADMIN** y `ana.torres@udea.edu.co` como
**AUXILIAR**.

Una vez dentro, un ADMIN reparte roles desde la API o desde la consola web:

```bash
curl -s -X PATCH http://localhost:8080/api/v1/admin/usuarios/2/rol \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"rol":"AUXILIAR"}'
```

> El rol viaja dentro del JWT. Un cambio de rol se hace efectivo en el
> **siguiente inicio de sesión** del usuario afectado (los tokens son
> stateless y no hay lista de revocación); la expiración de 30 minutos acota
> esa ventana.

### Mesa de préstamos (auxiliar)

La reserva es una promesa; el préstamo es el hecho físico. Son dos ciclos de
vida distintos sobre la misma fila: `estado` (ACTIVA/CANCELADA/COMPLETADA) es
lo que ocupa la franja, y `estadoPrestamo` es lo que pasó en el mostrador.

```
PENDIENTE --entrega----> ENTREGADO --devolución--> DEVUELTO
    |
    +------no-reclamado-----------------------> NO_RECLAMADO
```

```bash
# Cola del día (incluye equipos aún sin devolver de días anteriores)
curl -s "http://localhost:8080/api/v1/prestamos/agenda?fecha=2026-08-12" \
  -H "Authorization: Bearer $TOKEN_AUXILIAR" | jq

# Entregar (se rechaza más de 30 min antes del inicio, o pasada la franja)
curl -s -X POST http://localhost:8080/api/v1/prestamos/42/entrega \
  -H "Authorization: Bearer $TOKEN_AUXILIAR" \
  -H "Content-Type: application/json" \
  -d '{"observaciones":"Sin rayones, con cable"}'

# Devolver y mandar a mantenimiento en el mismo gesto
curl -s -X POST http://localhost:8080/api/v1/prestamos/42/devolucion \
  -H "Authorization: Bearer $TOKEN_AUXILIAR" \
  -H "Content-Type: application/json" \
  -d '{"observaciones":"Puerto USB flojo","requiereMantenimiento":true}'

# No se presentó (solo después de 1h del inicio; libera la franja)
curl -s -X POST http://localhost:8080/api/v1/prestamos/42/no-reclamado \
  -H "Authorization: Bearer $TOKEN_AUXILIAR" \
  -H "Content-Type: application/json" \
  -d '{"observaciones":"No asistió","sancionar":true}'
```

Los márgenes son configurables (`reservas.prestamo.*`). Existen por una razón
concreta: entregar un equipo horas antes rompe en silencio la reserva
siguiente, porque la validación de solape conoce franjas reservadas, no
equipos que ya no están físicamente en el laboratorio.

### Sanciones (admin)

Una sanción es una fila con ventana de vigencia, no un booleano en `usuarios`:
el laboratorio necesita el historial (quién, por qué, quién la puso, si se
levantó antes). «Vigente» se deriva de la fecha, así que nada tiene que barrer
la tabla para mantenerla honesta.

```bash
# Sancionar 7 días
curl -s -X POST http://localhost:8080/api/v1/sanciones \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"idUsuario":2,"motivo":"Devolvió el equipo dañado","dias":7}'

# Levantarla antes de tiempo (queda registrado quién y por qué)
curl -s -X PATCH http://localhost:8080/api/v1/sanciones/1/levantar \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"observacion":"Repuso el equipo"}'

# Un usuario sancionado consulta el motivo por su cuenta
curl -s http://localhost:8080/api/v1/sanciones/mias \
  -H "Authorization: Bearer $TOKEN" | jq
```

Un usuario sancionado que intenta reservar recibe **403** con
`type: .../usuario-sancionado` y un `detail` que nombra el motivo y la fecha
de fin. No es 409: nada en la franja pedida está en conflicto, simplemente no
puede reservar.

## Cómo probar los endpoints

Todas las URLs llevan prefijo `/api/v1/`. Los `GET` de equipos, categorías y
estadísticas, y `POST /auth/google`, son **públicos**; el resto requiere JWT.

### Reserva válida (espera 201)

```bash
curl -i -X POST http://localhost:8080/api/v1/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombreUsuario": "Maria Gomez Lopez",
    "correoUsuario": "maria.gomez@udea.edu.co",
    "idEquipo": 1,
    "fechaHoraInicio": "2026-08-12T14:00:00-05:00",
    "fechaHoraFin": "2026-08-12T16:00:00-05:00",
    "motivo": "Práctica de IoT"
  }'
```

### Reserva en conflicto (espera 409)

Mismo equipo, franja solapada con la anterior:

```bash
curl -i -X POST http://localhost:8080/api/v1/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombreUsuario": "Juan Restrepo Perez",
    "correoUsuario": "juan.restrepo@udea.edu.co",
    "idEquipo": 1,
    "fechaHoraInicio": "2026-08-12T15:30:00-05:00",
    "fechaHoraFin": "2026-08-12T17:00:00-05:00"
  }'
```

La respuesta es un RFC 7807 Problem Details con `status: 409` y un `detail`
que nombra el equipo y la franja en conflicto. La validación de solape se hace
con `SELECT ... FOR UPDATE` dentro de transacción (ver
[ADR 0002](docs/adr/0002-validar-solape-en-app-no-en-mysql.md)).

### Listado paginado y filtrado de equipos (público)

```bash
curl -s "http://localhost:8080/api/v1/equipos?categoria=VR&estado=disponible&page=0&size=20&sort=nombre,asc" | jq
```

### Top 5 de equipos más reservados (público)

```bash
curl -s "http://localhost:8080/api/v1/estadisticas/equipos-top?limit=5" | jq
```

### Obtener un JWT (Google SSO, bonus)

```bash
# id_token real obtenido en el frontend con Google Identity Services.
# El backend valida firma, email_verified y dominio @udea.edu.co.
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "eyJhbGciOiJSUzI1NiIs...google-id-token..."}' | jq -r .token)

curl -s http://localhost:8080/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq
```

> Con `GOOGLE_SSO_ENABLED=false` (default de dev) el endpoint de autenticación
> está presente pero la validación real del id_token requiere configurar
> `GOOGLE_CLIENT_ID` en Google Cloud Console. Para pruebas locales sin
> Google, los endpoints de escritura pueden probarse desactivando
> temporalmente la seguridad o inyectando un JWT de desarrollo.

## Cómo correr los tests

```bash
# Tests unitarios (rápido, sin contenedores)
./mvnw test

# Tests de integración con Testcontainers (requiere Podman/Docker corriendo)
./mvnw verify
```

Cobertura objetivo: >70% de línea en `service/`, con foco en el módulo
`reserva/` (lógica de solape y concurrencia). Hay un test dedicado que lanza
dos reservas simultáneas sobre la misma franja y verifica que exactamente una
gana y la otra recibe 409.

## Credenciales y datos semilla

Flyway (`V5__seed_datos_iniciales.sql`) carga:

- **Base de datos local**: usuario `reservas` / contraseña `reservas` /
  esquema `reservas_lis`.
- **Usuarios semilla** (`@udea.edu.co`) con sus roles:
  - `isaac.mesag@udea.edu.co` — **ADMIN**
  - `ana.torres@udea.edu.co` — **AUXILIAR**
  - `maria.gomez@udea.edu.co` — ESTUDIANTE
  - `juan.restrepo@udea.edu.co` — ESTUDIANTE
- **Categorías**: Microcontroladores, VR, Redes, Impresion 3D.
- **Equipos**: 10 (Arduino Uno R3, ESP32, Raspberry Pi 4, Meta Quest 2, HTC
  Vive Pro 2, Router MikroTik, Switch TP-Link, Fluke LinkIQ, Creality Ender 3,
  Bambu Lab A1 Mini).
- **Reservas**: 5 (pasadas, futuras y una cancelada) para ejercitar filtros,
  estadísticas y la view `estadisticas_equipos_top`.

El esquema físico completo está documentado en
[`docs/schema_reservas_lis.sql`](docs/schema_reservas_lis.sql).

> **Nota sobre Flyway**: `V5` había sido editada a mano después de haberse
> aplicado, lo que rompe su checksum. Se restauró a su contenido original y el
> seed adicional se movió a `V7` (idempotente): una migración aplicada es
> inmutable, los datos nuevos siempre llegan en una versión nueva.
>
> El RDS desplegado tiene aplicadas `V1`–`V6` con el `V5` **original** (se
> verificó contra la API: 5 reservas semilla, no 10), así que el checksum
> coincide y `V7`–`V10` deberían aplicar sin intervención. Si aun así una base
> concreta falla la validación al arrancar, ejecute una vez
> `./mvnw flyway:repair` y vuelva a arrancar.

## Estructura de ramas

> **Importante**: este repositorio es **compartido entre todos los aspirantes**
> y `main` está protegido. **Nunca se hace push a `main` ni merge back desde
> las ramas de reto.**

Cada reto se entrega en una rama `<documento>-reto<N>` nacida de `main`. La
rama de este reto es `1007239188-reto2`. Dentro de ella se usa GitHub Flow
interno (ramas `feature/*`, `fix/*`, `test/*`, `docs/*` que se mergean vía PR
y se eliminan). El evaluador revisa cada rama de reto de forma independiente.

Ver [ADR 0004](docs/adr/0004-una-rama-por-reto-sin-merge-a-main.md) y
[`docs/specs/06-branching-strategy.md`](docs/specs/06-branching-strategy.md)
para el razonamiento completo.

## Estructura del proyecto

```
com.lis.reservas
├── config/         Seguridad, CORS, OpenAPI, beans
├── equipo/         CRUD de equipos + cambio de estado
├── categoria/      Catálogo de categorías
├── reserva/        Lógica de reserva y validación de conflicto (SELECT FOR UPDATE)
├── usuario/        Persistencia mínima de usuarios (nombre, correo)
├── auth/           Google SSO + emisión/validación de JWT + roles
├── prestamo/       Mesa de préstamos del auxiliar (entrega/devolución/no-show)
├── sancion/        Sanciones con ventana de vigencia
├── admin/          Administración de usuarios, roles y resumen operativo
├── estadisticas/   Endpoint Top N (bonus)
└── common/         Excepciones, RFC 7807, paginación
```

Organización **por dominio** (no por capa técnica global): cada módulo agrupa
su `controller/service/repository/dto/entity`.

## Licencia

Prueba técnica LIS 2026-2 — Universidad de Antioquia.
