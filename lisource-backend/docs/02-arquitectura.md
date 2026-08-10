# Arquitectura backend

[← Volver al README](../../README.md)

## Contexto y contenedores

```mermaid
flowchart TB
  User[Usuario / administrador] --> Web[React en Vercel]
  Web -->|HTTPS REST + Bearer| Backend[Spring Boot en Render]
  Web <-->|WebSocket STOMP + Bearer| Backend
  Backend -->|JDBC TLS| DB[(PostgreSQL Supabase)]
  Backend -->|REST Storage| Storage[Supabase Storage]
  Backend -->|OIDC/JWKS| Google[Google Identity]
  Backend -->|SMTP opcional| Mail[Servidor de correo]
```

## Componentes y paquetes

```mermaid
flowchart LR
  Security[shared.security / shared.web] --> API[api controllers]
  API --> App[application services]
  App --> Repo[infrastructure repositories]
  Repo --> PG[(PostgreSQL)]
  App --> Audit[audit]
  App --> Realtime[RealtimeEventPublisher]
```

Features reales: `auth`, `user`, `equipment`, `catalog`, `reservation`, `statistics`, `configuration`, `audit` y `shared`. `api` traduce HTTP/DTO; `application` coordina reglas/transacciones; `domain` contiene agregados donde son útiles; `infrastructure` ejecuta JDBC o integra proveedores.

## Mapeo conceptual a puertos y adaptadores

| Concepto | Correspondencia | Límite |
|---|---|---|
| Adaptador de entrada | Controllers REST y handshake STOMP | dependen de Spring MVC/Security |
| Casos de uso | Services de `application` | varios reciben repositorios concretos, no interfaces |
| Dominio | `UserAccount`, `ReservationAggregate`, `SessionRecord` | no todos los módulos requieren objetos de dominio |
| Adaptador de salida | repositorios `JdbcClient`, `GoogleIdTokenVerifier`, notifiers, Storage | algunos puertos sí son interfaces (`GoogleTokenVerifier`, `PasswordRecoveryNotifier`, `EquipmentImageStorage`) |

Por eso se describe como monolito modular con separación inspirada en Clean/ports-and-adapters, no como hexagonal pura.

## Login, refresh y Google

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as AuthController/Service
  participant P as PostgreSQL
  B->>A: POST /auth/login
  A->>P: usuario + roles
  A->>A: Argon2id + dominio + estado
  A->>P: sesión con hash del refresh
  A-->>B: access JWT + Set-Cookie HttpOnly
  B->>A: POST /auth/refresh + cookie
  A->>P: sesión FOR UPDATE
  A->>P: revocar anterior + insertar rotada
  A-->>B: JWT nuevo + cookie nueva
```

Google sustituye la comprobación Argon2 por validación de ID token (issuer, audience, firma, expiración, `email_verified`) y luego aplica dominio, roles y sesión interna.

## Auditoría y correlation ID

```mermaid
flowchart LR
  Req[HTTP X-Correlation-ID opcional] --> Filter[CorrelationIdFilter]
  Filter --> MDC[MDC + response header]
  MDC --> UseCase[Caso de uso]
  UseCase --> Publisher[AuditPublisher]
  Publisher -->|after commit / REQUIRES_NEW para rechazo| Audit[(tbl_auditoria)]
  MDC --> Problem[ProblemDetail con correlationId]
```

## Imagen, deployment y CI/CD

```mermaid
sequenceDiagram
  participant Admin
  participant API
  participant Storage as Supabase Storage
  participant DB as PostgreSQL
  Admin->>API: multipart JPEG/PNG/WebP ≤ 5 MB
  API->>Storage: upload con credencial server-side
  Storage-->>API: URL/objeto
  API->>DB: actualizar image_url
  API-->>Admin: equipo actualizado
```

```mermaid
flowchart LR
  GH[GitHub Actions] --> Q[Verify + CodeQL]
  Q --> C[Docker + Trivy]
  C --> D[Render deploy]
  D --> S[Smoke health/OpenAPI]
  GH -->|OIDC| IAM[AWS IAM role temporal]
```

Decisiones y alternativas: [ADR](adr/README.md).

## Paquetes Java reales

```mermaid
flowchart TB
  Root[co.edu.udea.lis.lisource] --> Auth[auth]
  Root --> User[user]
  Root --> Equipment[equipment]
  Root --> Catalog[catalog]
  Root --> Reservation[reservation]
  Root --> Statistics[statistics]
  Root --> Configuration[configuration]
  Root --> Audit[audit]
  Root --> Shared[shared]
  Auth --> AuthLayers[api · application · domain · infrastructure]
  Equipment --> EquipmentLayers[api · application · infrastructure]
  Reservation --> ReservationLayers[api · application · domain · infrastructure]
  Shared --> Cross[config · exception · security · util · web]
```

`shared` concentra infraestructura transversal, no reglas específicas de reservas o inventario. `audit` recibe eventos desde casos de uso; `statistics` consulta agregados; `catalog` y `configuration` administran referencias. Esta organización limita acoplamiento sin introducir la operación distribuida de microservicios.

## Crear una reserva

```mermaid
sequenceDiagram
  actor U as Usuario
  participant S as SecurityFilter
  participant C as ReservationController
  participant A as ReservationService
  participant E as EquipmentRepository
  participant R as ReservationRepository
  participant D as PostgreSQL
  U->>S: POST /reservations + Bearer
  S->>C: principal autenticado
  C->>A: DTO validado + userId
  A->>A: validar [inicio, fin) y IDs
  A->>E: lockInOrder(equipmentIds)
  E->>D: SELECT ... ORDER BY id FOR UPDATE
  A->>R: overlapExists(...)
  R->>D: inicioExistente < finNuevo AND finExistente > inicioNuevo
  D-->>R: false
  A->>R: insertar reserva y relaciones
  R->>D: COMMIT
  A-->>U: 201 Created
```

## Rechazar una reserva conflictiva

```mermaid
sequenceDiagram
  actor U as Usuario
  participant A as ReservationService
  participant E as EquipmentRepository
  participant R as ReservationRepository
  participant D as PostgreSQL
  U->>A: misma franja/equipo ya reservado
  A->>E: locks ordenados
  E->>D: FOR UPDATE
  A->>R: overlapExists(...)
  R-->>A: true
  A->>A: lanzar RESERVATION_CONFLICT
  A--xD: rollback / ninguna relación nueva
  A-->>U: 409 application/problem+json
```

## Despliegue real

```mermaid
flowchart LR
  Dev[push a rama] --> Actions[GitHub Actions]
  Actions --> Render[Render · Spring Boot]
  Actions --> Vercel[Vercel · React]
  Actions -->|OIDC · STS temporal| IAM[AWS IAM]
  Browser[Navegador] --> Vercel
  Vercel --> Render
  Render --> DB[(Supabase PostgreSQL)]
  Render --> Storage[Supabase Storage]
  Render --> Google[Google Identity]
```

AWS solo valida identidad federada de CI; Terraform no crea hosting, red ni base de datos. La evolución a hexagonal pura requeriría puertos de repositorio/integración definidos fuera de `infrastructure`, inyección solo por interfaces y pruebas de aplicación sin Spring/JDBC.
