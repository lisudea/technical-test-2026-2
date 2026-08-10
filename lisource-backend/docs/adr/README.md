# Decisiones arquitectónicas (ADR)

[Inicio](../../../README.md) · [Arquitectura](../02-arquitectura.md)

| Decisión | Alternativa | Por qué encaja en LISource | Trade-off | Cuándo elegiría la alternativa |
|---|---|---|---|---|
| PostgreSQL | MongoDB / Firebase | relaciones, constraints, auditoría, agregados y locks para reservas | esquema y migraciones explícitas | documentos muy variables sin transacciones relacionales centrales |
| `JdbcClient` + SQL visible | JPA/Hibernate | hace verificables filtros, ranking y `FOR UPDATE` | más mapeo manual y SQL específico | CRUD extenso con dominio estable donde ORM reduzca código sin ocultar queries críticas |
| Spring Boot | Node/NestJS u otro stack | Security, validation, JDBC, transacciones, OpenAPI y testing integrados | mayor consumo/base inicial | equipo centrado en TypeScript o servicio muy pequeño |
| Monolito modular | microservicios | una transacción protege reserva y puente; un despliegue para la prueba | límites dependen de disciplina interna | equipos independientes, escalado desigual o dominios con ciclos separados |
| Separación inspirada en ports-and-adapters | hexagonal estricta | conserva `api/application/infrastructure` sin interfaces ceremoniales en todo módulo | algunos servicios dependen de repositorios concretos | producto de larga vida con múltiples adaptadores intercambiables y testing por puertos |
| JWT access corto + refresh opaco HttpOnly rotado | token largo en `localStorage` | limita exposición del access y permite sesiones/revocación de refresh | persistencia y rotación adicionales; access emitido vive hasta expirar | clientes máquina-a-máquina sin navegador/cookie |
| Google SSO + login local | solamente local | cumple federación institucional y deja cuentas demo/evaluación | dos flujos y configuración OAuth | sistema sin proveedor institucional o con política de identidad única |
| Argon2id | bcrypt/PBKDF2/hash rápido | función memory-hard adecuada para contraseñas | costo CPU/memoria configurable | plataforma con módulo FIPS/política que exija otro KDF aprobado |
| Supabase Storage | `BYTEA` en PostgreSQL | separa objetos del OLTP y evita inflar backups/consultas | servicio y permisos adicionales | pocos archivos pequeños que deban compartir transacción estricta con datos |
| Supabase PostgreSQL | PostgreSQL autogestionado | base administrada y TLS para una prueba con tiempo limitado | dependencia del proveedor/planes | control operativo, extensiones o aislamiento no ofrecidos por el servicio |
| Render backend | servidor administrado | despliegue simple mediante hook y health | cold start y límites del plan | requisitos de latencia/SLA o red privada que exijan infraestructura dedicada |
| Vercel frontend | hosting tradicional | CDN/build/deploy adecuado para React/TanStack | acoplamiento al build del proveedor | runtime especializado, red privada o control total del servidor |
| GitHub Actions | deploy manual | quality/security/deploy/smoke repetibles por rama | tiempo de CI y mantenimiento YAML | prototipo descartable sin entregas repetidas |
| AWS OIDC | access keys estáticas | STS temporal y trust por repositorio/rama | configuración IAM inicial | runner fuera de OIDC con mecanismo de identidad equivalente |
| Terraform | IAM manual | provider/roles/trust policies revisables y reproducibles | state y ciclo plan/apply | experimento único sin infraestructura persistente |
| CodeQL + Trivy | solo build/test | SAST y vulnerabilidades de imagen complementan pruebas | falsos positivos/tiempo y necesidad de revisar SARIF | ejercicio local sin contenedor ni superficie desplegada |
| Testcontainers | mocks/DB embebida | prueba SQL, locks y concurrencia contra PostgreSQL 16 real | requiere Docker y más tiempo | unidad pura o entorno sin contenedores, manteniendo integración en otra capa |

Estas son decisiones del estado actual, no afirmaciones de arquitectura hexagonal pura. Los módulos separan responsabilidades, pero algunos servicios dependen directamente de adaptadores concretos.

## ADR-01 · Spring Boot, monolito modular y JDBC explícito

- **Contexto:** inventario, identidad y reserva comparten constraints y una transacción PostgreSQL.
- **Decisión:** Java 21/Spring Boot en un monolito por feature, capas `api/application/domain/infrastructure` cuando aportan valor y repositorios con `JdbcClient`.
- **Razón:** Spring integra Security, Validation, transacciones y OpenAPI; SQL visible permite auditar filtros, ranking y `FOR UPDATE`.
- **Alternativas:** microservicios, hexagonal pura y JPA/Hibernate.
- **Por qué no:** microservicios complican la atomicidad/operación; puertos para cada clase añaden ceremonia a este alcance; ORM puede ocultar SQL crítico y locking.
- **Consecuencias positivas:** un despliegue, transacciones locales, queries verificables y módulos identificables.
- **Limitaciones:** repositorios concretos acoplan application a JDBC en varios features; más mapeo manual.
- **Evolución:** introducir interfaces de puerto en application/domain, adaptadores externos e integración por eventos solo cuando existan múltiples implementaciones o equipos independientes.

## ADR-02 · PostgreSQL y Supabase

- **Contexto:** roles N:M, reservas multi-equipo, historia, catálogos, auditoría y conflictos requieren integridad relacional.
- **Decisión:** PostgreSQL administrado por Supabase; 20 tablas normalizadas y Storage separado para imágenes.
- **Razón:** FK, unique/check, índices, transacciones y locks cubren el núcleo; Storage evita binarios en el OLTP.
- **Alternativas:** MongoDB/Firebase, PostgreSQL autogestionado y `BYTEA`.
- **Por qué no:** un modelo documental trasladaría integridad/concurrencia a aplicación; autogestión aumenta operación; binarios inflan consultas/backups.
- **Consecuencias positivas:** consistencia fuerte y menor operación de plataforma.
- **Limitaciones:** SQL específico, dependencia de proveedor/plan y credencial server-side de Storage.
- **Evolución:** migraciones versionadas incrementales, backups/observabilidad y Storage abstraído si cambia el proveedor.

## ADR-03 · Sesión con JWT corto, refresh HttpOnly y rol activo

- **Contexto:** el navegador necesita autorización eficiente, múltiples roles y capacidad de revocar sesiones.
- **Decisión:** access JWT corto en memoria, refresh opaco rotado en cookie HttpOnly, sesión persistida por hash y `activeRole` firmado.
- **Razón:** evita refresh/localStorage accesible a JavaScript, mantiene API stateless durante la vida del access y permite listar/revocar refresh.
- **Alternativas:** access largo en `localStorage`, sesión server-side en cada request o JWT con todos los privilegios simultáneos.
- **Por qué no:** mayor exposición XSS, lookup obligatorio por request o ambigüedad de privilegios.
- **Consecuencias positivas:** menor ventana de exposición y contexto de rol explícito.
- **Limitaciones:** cookie/CORS/SameSite requieren configuración; logout no invalida un access emitido sin blacklist.
- **Evolución:** denylist/introspección para revocación inmediata solo si el riesgo justifica estado/latencia.

## ADR-04 · Google institucional más credencial local

- **Contexto:** la prueba solicita SSO institucional, pero QA necesita cuentas reproducibles.
- **Decisión:** verificar Google ID token y dominio exacto, manteniendo autenticación local Argon2id y cuentas duales.
- **Razón:** SSO mejora experiencia institucional y el flujo local permite evaluación automatizada.
- **Alternativa:** exclusivamente Google o exclusivamente local.
- **Por qué no:** solo Google depende de cuenta/client ID interactivo; solo local no cumple federación.
- **Consecuencias positivas:** flexibilidad y pruebas deterministas.
- **Limitaciones:** dos ciclos de credencial y configuración externa.
- **Evolución:** proveedor institucional único/SCIM si la organización centraliza identidad.

## ADR-05 · Intervalos `[inicio, fin)` y validación transaccional

- **Contexto:** una consulta de disponibilidad previa tiene carrera entre usuarios.
- **Decisión:** aceptar adyacencia, bloquear equipos por ID ordenado, consultar overlap en la misma transacción y rechazar todo el agregado con `409`.
- **Razón:** `[inicio, fin)` modela franjas consecutivas; el orden reduce deadlocks y el rollback preserva atomicidad multi-equipo.
- **Alternativas:** confiar en frontend, check-then-insert sin lock o serializar globalmente.
- **Por qué no:** las dos primeras tienen race conditions; el lock global reduce concurrencia innecesariamente.
- **Consecuencias positivas:** exactamente un ganador bajo concurrencia y semántica temporal clara.
- **Limitaciones:** contención por equipo y dependencia de transacciones PostgreSQL.
- **Evolución:** constraint de exclusión/range types si el modelo se simplifica a una relación por recurso y se evalúa su compatibilidad multi-equipo.

## ADR-06 · Auditoría y correlation ID

- **Contexto:** operaciones sensibles y rechazos deben ser trazables sin guardar secretos.
- **Decisión:** correlation ID por request, Problem Details y eventos sanitizados en `tbl_auditoria` después de commit o en transacción separada para rechazos.
- **Alternativa:** solo logs de aplicación.
- **Por qué no:** logs pueden rotar y no ofrecen consulta relacional de actor/tipo/registro.
- **Consecuencias positivas:** diagnóstico cruzado y rastro de negocio.
- **Limitaciones:** almacenamiento adicional y necesidad de revisar sanitización/retención.
- **Evolución:** exportar métricas/trazas a observabilidad central y definir política de retención.

## ADR-07 · Vercel, Render, Supabase, GitHub Actions y AWS OIDC

- **Contexto:** una prueba necesita despliegue reproducible con operación reducida y demostrar identidad cloud segura.
- **Decisión:** Vercel para frontend, Render para API, Supabase para datos/Storage; Actions automatiza gates/deploy y asume dos roles AWS temporales creados con Terraform.
- **Alternativas:** servidor único/manual y access keys AWS permanentes.
- **Por qué no:** mayor operación, procesos irrepetibles y secretos de larga duración.
- **Consecuencias positivas:** separación de responsabilidades, CI auditable y credenciales STS efímeras.
- **Limitaciones:** cold starts, varios proveedores y state Terraform que debe custodiarse.
- **Evolución:** IaC también para servicios de producción, remote state y entornos separados si el proyecto supera el alcance de evaluación.

AWS no aloja la aplicación y los roles actuales no incluyen permisos de aplicación: únicamente trust para comprobar identidad OIDC por rama.
