# AGENTS.md — technical-test-2026-2

## What this is

Technical test for applicants to **Auxiliar de Programación** at LIS (Universidad de Antioquia). A web app to manage lab equipment reservations: microcontrollers, VR kits, networking gear, 3D printers.

Each challenge lives in a **separate branch** named `<documento>-reto<N>` (e.g. `1007239188-reto2`). Multiple applicants share the same remote, each with their own prefix. Current branch is `1007239188-reto2` — **Backend**.

## Branching (critical — easy to get wrong)

- **Never push to `main`.** It's shared across applicants and protected.
- `1007239188-reto2` is the delivery branch. Internal feature branches (`feature/*`, `fix/*`, `test/*`) branch off it and merge back via PR.
- No merge back to `main`. The evaluator inspects each reto branch independently.
- Conventional commits: `feat(scope)`, `fix(scope)`, `test(scope)`, `docs(scope)`, `chore(scope)`, `ci(scope)`, `refactor(scope)`.
- Semantic versioning tags on delivery: `v0.2.0-reto2`.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Spring Boot 3.x, Java 21 LTS, Maven |
| Frontend (reto 3) | React 18 + Vite + TypeScript, TanStack Query, Tailwind, shadcn/ui |
| Database | MySQL 8, Flyway migrations |
| Container | Podman (local), OCI images |
| Infra | ECS Fargate, Terraform, GitHub Actions |
| Auth | Google SSO + JWT (bonus) |

## Package structure convention

All backend code under `com.lis.reservas`, organized **by domain** (not by technical layer):

```
com.lis.reservas
├── config/         # Security, CORS, OpenAPI, beans
├── equipo/         # controller, service, repository, dto, entity, mapper
├── categoria/
├── reserva/        # Conflict validation logic lives here
├── usuario/        # Includes the Rol enum (ESTUDIANTE/AUXILIAR/ADMIN)
├── auth/           # Google SSO + JWT (carries the rol claim) + CurrentUser
├── prestamo/       # Loan desk: entrega / devolucion / no-reclamado
├── sancion/        # Time-boxed sanctions, validity derived from the date
├── admin/          # User administration, role assignment, ops summary
├── estadisticas/   # Top 5 endpoint (bonus)
└── common/         # Exceptions, RFC 7807, pagination
```

Roles are cumulative and compared by position in the `Rol` enum, so "at least
AUXILIAR" is one rule rather than a growing list of equality checks. The role
travels inside the JWT, so a role change only takes effect on the user's next
sign-in.

Each domain package owns its full vertical. No global `controller/` / `service/` / `repository/`.

## API conventions

- Prefix: `/api/v1/`
- Resources in plural kebab-case: `/api/v1/equipos`, `/api/v1/reservas`
- Pagination: Spring Data `Page<T>` with `page`, `size`, `sort` params
- Errors: **RFC 7807 Problem Details** via `@RestControllerAdvice`
- Dates: ISO-8601 with explicit offset (`America/Bogota` UTC-5)
- Auth: creation/modification endpoints require JWT; read-only `GET /equipos` is public

## Critical business rule — conflict validation

This is the hardest part and must be done right:

- Reject overlapping reservations with **HTTP 409 Conflict**.
- Query: `SELECT ... FROM reservas WHERE id_equipo = ? AND estado = 'activa' AND fecha_hora_inicio < ? AND fecha_hora_fin > ? FOR UPDATE`
- Must run inside a **transaction with `FOR UPDATE`** to prevent race conditions between concurrent requests.
- Also validate: start < end, start is not in the past, max duration (configurable, e.g. 8h), equipment must be `disponible`.
- Index on `(id_equipo, estado, fecha_hora_inicio, fecha_hora_fin)` makes this query fast.
- MySQL 8 has no exclusion constraint — this is an application-layer concern.

## Database

- Flyway migrations at `src/main/resources/db/migration/V1__...V5__`
- Schema is documented in `docs/schema_reservas_lis.sql` (source of truth for the physical model)
- 4 domain tables: `categorias`, `equipos`, `usuarios`, `reservas` + optional `log_actividad`
- Email (`correo`) is the user identity key (UNIQUE)
- Equipment state is persisted in `equipos.estado` (`disponible`/`mantenimiento`/`baja`); current occupancy is derived from active reservations, not a separate field

## Testing

- Unit: JUnit 5 + Mockito for service logic
- Integration: Testcontainers with real MySQL 8
- Concurrency: dedicated test for simultaneous overlapping reservation attempts (exactly one must succeed)
- API contract: MockMvc for status codes, Problem Details shape, pagination
- Target: >70% line coverage in `service/`, focus on `reserva/` module

## Key commands

```bash
# Local dev with Podman (not Docker)
podman-compose -f infra/compose.yaml up

# Or run backend standalone
./mvnw spring-boot:run

# Tests
./mvnw test
# Single test class
./mvnw test -Dtest=ReservaServiceTest
# With Testcontainers (requires Docker/Podman running)
./mvnw verify

# Build image
podman build -f infra/containers/backend.containerfile -t reservas-backend .

# Flyway (applied automatically on boot via spring-boot-starter-flyway)
./mvnw flyway:migrate
```

## Notes

- The backend is fully implemented and deployed; see CHANGELOG.md for scope.
- A `.gitignore` is committed and covers Java/Maven, Terraform and Node output.
- Local container engine is **Podman** (Fedora default). Docker commands work too via aliases.
- The frontend lives on `1007239188-reto3`. This branch is backend + infra.
- Secrets (RDS password, Google client secret, JWT signing key) never committed — use env vars or AWS Secrets Manager.
- Error responses follow RFC 7807, not ad-hoc JSON shapes.
- 401 and 403 are NOT interchangeable. 401 = "I don't know who you are"
  (client should re-authenticate); 403 = "I know who you are and you may not"
  (a role check or a sanction). `SecurityConfig` must keep BOTH the
  `authenticationEntryPoint` and the explicit `accessDeniedHandler`, plus
  `DispatcherType.ERROR` permitted — otherwise the internal forward to
  `/error` re-enters the chain without the JWT filter and rewrites 403 as 401.
  MockMvc does not reproduce that dispatch, so tests alone will not catch it.
- Migrations are immutable once applied. New data goes in a new version; never
  edit an applied `V*.sql`.