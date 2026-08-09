# Verificación

Ejecución: 8 de agosto de 2026, Windows 11, zona `America/Bogota`. Se inspeccionó únicamente la presencia de variables; este documento no contiene valores, tokens, hosts, usuarios, contraseñas ni claves.

## Resultado ejecutivo

| Componente | Prueba | Resultado | Evidencia |
|---|---|---|---|
| Docker Desktop | daemon accesible | PASS | cliente y servidor Docker respondieron |
| Backend | compilación, pruebas, JAR y JaCoCo | PASS | `.\mvnw.cmd clean verify` |
| Backend tests | 24 ejecutadas, 0 fallos, 0 errores, 0 omitidas | PASS | Surefire |
| Testcontainers | PostgreSQL 16 limpio | PASS | contenedor real iniciado por Testcontainers |
| SQL oficial | `01-estructura.sql` → `02-semilla.sql` → `03-pruebas.sql` | PASS | los tres scripts terminaron antes de crear el contexto Spring |
| Contexto Spring | servidor HTTP aleatorio, JDBC y esquema | PASS | aplicación `test` iniciada contra el contenedor |
| Tablas aisladas | exactamente 20 tablas `tbl_*` | PASS | aserción JDBC dentro del Testcontainer |
| PostgreSQL externo DNS | resolución del host configurado | PASS | `Resolve-DnsName`, sin mostrar el host |
| PostgreSQL externo TCP | puerto configurado accesible | PASS | `Test-NetConnection`, sin mostrar host/puerto |
| PostgreSQL externo JDBC | autenticación con el `.env` real | PASS | conexión JDBC real establecida contra Supabase |
| PostgreSQL externo `SELECT 1` | consulta real | PASS | resultado `1` recibido |
| PostgreSQL externo `current_database` | base activa | PASS | base `postgres` confirmada |
| PostgreSQL externo `current_user` | usuario efectivo | PASS | consulta completada correctamente |
| PostgreSQL externo 20 tablas live | coincidencia exacta del esquema público | PASS | exactamente las 20 tablas oficiales encontradas |
| SQL sobre Supabase real | DDL/semillas/pruebas | NOT RUN | prohibido deliberadamente; nunca se ejecutó 01/02/03 allí |
| Supabase Storage real | upload PNG, lectura pública y cleanup | PASS | objeto temporal creado, leído y eliminado |
| SMTP real | envío autenticado | PASS | mensaje de smoke enviado sin secretos |
| Google Client ID | presencia y coincidencia backend/frontend | PASS | comparación en memoria, sin mostrar el valor |
| Google proveedor | acceso al JWKS oficial | PASS | endpoint de certificados accesible |
| Google login interactivo | validación de un ID token real de usuario | MANUAL TEST REQUIRED | pendiente de prueba personal del usuario desde el frontend |
| WebSocket real | HTTP 101, STOMP CONNECT/SUBSCRIBE y evento after-commit | PASS | servidor Spring real sobre puerto aleatorio |
| Swagger UI | recurso HTML | PASS | prueba HTTP y renderización visual de `/swagger-ui/index.html` |
| OpenAPI | bearer, tags, operaciones, ejemplos, errores y multipart | PASS | inspección automática de `/v3/api-docs` |
| OpenAPI broken references | resolución de los `$ref` internos | PASS | 247 referencias inspeccionadas, 0 rotas |
| OpenAPI `ApiProblem` | schema común RFC 9457 extendido | PASS | componente definido con `code`, `correlationId` y `fieldErrors` |
| OpenAPI request body examples | ejemplos explícitos y útiles | PASS | 25 de 25 request bodies |
| OpenAPI Bearer Authorize | esquema HTTP bearer JWT | PASS | botón `Authorize` visible en Swagger UI |
| OpenAPI reserva 409 | ejemplo `RESERVATION_CONFLICT` | PASS | response `application/problem+json` documentada |
| Postman | JSON válido, 15 carpetas, 58 solicitudes | PASS | todas las operaciones OpenAPI están representadas |
| Postman `set-password` | request autenticada completa | PASS | método, URL, header, body, descripción y `{{accessToken}}` |
| Postman `change-password` | request autenticada completa | PASS | método, URL, header, body, descripción y `{{accessToken}}` |
| Frontend tests | 4 aprobadas, 0 fallos | PASS | `npm run test` |
| Frontend lint | sin errores | PASS | `npm run lint -- --quiet` |
| Frontend build | cliente, SSR y Nitro | PASS | `npm run build` |

## Presencia de configuración

No se registraron los valores. `PRESENTE` significa clave existente y no vacía en el archivo guardado.

| Integración | Variables requeridas | Estado |
|---|---|---|
| PostgreSQL | host, puerto, base, usuario, contraseña y SSL mode | PRESENTE |
| Google Identity backend | Client ID | PRESENTE |
| Supabase Storage | URL, secret key y bucket | PRESENTE |
| SMTP | host, puerto, usuario, contraseña, remitente, auth y STARTTLS | PRESENTE |
| JWT | secret base64 e issuer | PRESENTE |
| CORS | frontend URL y allowed origins explícitos | PRESENTE |
| Frontend API | API URL y data mode | PRESENTE |
| Frontend Google | Client ID público | PRESENTE |

No se cambió CORS a wildcard, no se abrió `/api/**`, no se expusieron secretos y no se agregó JPA.

## PostgreSQL externo: verificación live

1. PostgreSQL externo JDBC: PASS.
2. `SELECT 1`: PASS.
3. `current_database`: PASS; base `postgres` confirmada.
4. `current_user`: PASS.
5. 20 tablas live: PASS; coincidencia exacta con las 20 tablas oficiales.

Todas las consultas live se ejecutaron en modo read-only. No se ejecutaron `01-estructura.sql`, `02-semilla.sql`, `03-pruebas.sql`, DDL ni mutaciones contra Supabase real.

## Flujo Testcontainers comprobado

```text
PostgreSQL 16 limpio
→ 01-estructura.sql
→ 02-semilla.sql
→ 03-pruebas.sql
→ esquema de 20 tablas
→ contexto Spring + Tomcat
→ Swagger/OpenAPI
→ autenticación y RBAC
→ administración y LAST_ADMIN_PROTECTION
→ reservas concurrentes/rollback/Top 5
→ WebSocket STOMP autenticado y evento after-commit
```

Resultado final: 24 pruebas, 0 skipped. Los 7 skipped del reporte anterior desaparecieron al iniciar Docker Desktop.

## Uso funcional de las 20 tablas

| # | Tabla | Uso funcional verificado/implementado |
|---:|---|---|
| 1 | `tbl_estado_registro` | activación lógica de roles, asignaciones, catálogos, configuración y auditoría |
| 2 | `tbl_estado_usuario` | login e inactivación administrativa |
| 3 | `tbl_estado_equipo` | inventario y disponibilidad operacional |
| 4 | `tbl_estado_reserva` | confirmación, cancelación, conflictos y Top 5 |
| 5 | `tbl_rol` | RBAC, selector/cambio de rol y administración lógica |
| 6 | `tbl_idioma` | catálogo y preferencia real del perfil |
| 7 | `tbl_usuario` | identidad, login local/Google, perfil y administración |
| 8 | `tbl_usuario_rol` | asignaciones, activeRole y protección del último administrador |
| 9 | `tbl_sesion` | refresh, rotación, listado, revocación y logout-all |
| 10 | `tbl_recuperacion_password` | token de un solo uso, expiración y reset |
| 11 | `tbl_categoria_equipo` | filtros, equipos y CRUD lógico administrativo |
| 12 | `tbl_ubicacion` | ubicación del inventario y CRUD lógico administrativo |
| 13 | `tbl_equipo` | inventario, imágenes, estado y locking |
| 14 | `tbl_reserva` | ciclo de vida completo de reservas |
| 15 | `tbl_reserva_equipo` | reserva multi-equipo, conflictos y estadísticas |
| 16 | `tbl_categoria_configuracion` | agrupación real de configuración |
| 17 | `tbl_configuracion` | paginación, TTL, Top 5 y edición tipada |
| 18 | `tbl_nivel_auditoria` | clasificación consultable de eventos |
| 19 | `tbl_tipo_evento_auditoria` | catálogo activo de eventos persistidos |
| 20 | `tbl_auditoria` | trazabilidad, filtros y correlation ID |

## Administración entregada

- Usuarios paginados y filtrables por texto, estado y rol.
- Consulta de detalle y cambio lógico `ACTIVO/INACTIVO`.
- Revocación de sesiones cuando un usuario se inactiva.
- Listado y activación lógica de roles.
- Activación/desactivación histórica de asignaciones `tbl_usuario_rol`.
- Protección transaccional del último administrador, incluida concurrencia serializada mediante bloqueo del rol.
- Categorías y ubicaciones con listado completo, creación, edición y activación lógica.
- Auditoría de cambios administrativos.
- Autorización exclusiva mediante `activeRole=ADMINISTRADOR`.

## Swagger y Postman

Swagger organiza todas las operaciones reales en 14 tags, describe nivel de acceso, parámetros, cuerpos, respuestas y errores aplicables. Incluye Bearer JWT en `Authorize`, ejemplos explícitos para los 25 request bodies, paginación, filtros, multipart de imagen y un ejemplo visible `RESERVATION_CONFLICT` 409 que explica el rollback atómico. La auditoría recursiva resolvió las 247 referencias internas con 0 `$ref` rotos; `ApiProblem` está definido una sola vez como el modelo común de error.

La colección Postman contiene 15 carpetas y 58 solicitudes. Incluye login local, Google, select-role, switch-role, set-password, change-password, refresh/cookies, sesiones, equipos, imágenes, reservas, conflicto 409, dashboard, Top 5, usuarios, roles, categorías, ubicaciones, configuración, auditoría y casos 401/403. Todas las operaciones expuestas por OpenAPI están representadas sin duplicar las existentes.

## Bloqueos restantes

1. El login Google end-to-end requiere interacción de navegador para obtener un ID token real; configuración y conectividad del proveedor sí están verificadas.
