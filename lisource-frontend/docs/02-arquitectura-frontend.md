# Arquitectura frontend

[Inicio](../../README.md) · [API y estado](04-api-y-estado-remoto.md) · [Auth](05-autenticacion.md)

## Contexto y componentes

```mermaid
flowchart LR
  Person[Estudiante / administrador] --> App[LISource React en Vercel]
  App -->|HTTPS REST| API[Spring Boot en Render]
  App <-->|STOMP /ws| API
  App -->|Google Identity| Google[Google]
  API --> DB[(Supabase PostgreSQL/Storage)]
```

```mermaid
flowchart TB
  Router[TanStack Router] --> Routes[routes]
  Routes --> Shell[components/layout]
  Routes --> Features[features/auth · equipment · reservations]
  Features --> UI[components/ui + common]
  Features --> Services[services]
  Features --> Query[TanStack Query]
  Services --> HTTP[http-client]
  Services --> Mock[services/mocks]
  Routes --> I18n[i18n + locales]
  Services --> Types[types]
  Forms[React Hook Form + Zod] --> Features
```

Responsabilidades reales: `routes` compone páginas/guards; `components` contiene shell, estados y primitives Radix; `features` encapsula auth/equipos/reservas y hooks de query; `hooks` contiene detección móvil; `services` selecciona API/mock y realtime; `lib` maneja errores, formato y Google; `i18n`/`locales` traducciones; `types` contratos compartidos. No existen carpetas separadas `schemas` o `queries`: los schemas/forms y hooks están junto a su feature.

## Routing

```mermaid
flowchart TD
  Root[__root] --> Public[/ingreso · /recuperar · /reset-password]
  Root --> Protected[/ dashboard]
  Protected --> Eq[/equipos · /equipos/:id]
  Protected --> Res[/reservas]
  Protected --> Stats[/estadisticas]
  Protected --> Profile[/perfil]
  Protected --> Admin[/administracion/equipos · administrador]
```

## Auth y datos

```mermaid
sequenceDiagram
  participant V as Vista
  participant Q as TanStack Query
  participant S as Service
  participant H as http-client
  participant B as Backend
  V->>Q: query/mutation
  Q->>S: función de dominio
  S->>H: request
  H->>B: Bearer access
  alt 401 recuperable
    H->>B: refresh con cookie
    B-->>H: nuevo access
    H->>B: retry una vez
  end
  B-->>Q: dato o Problem Details
  Q-->>V: loading/success/error
```

`AuthContext` conserva el access token en memoria. El refresh HttpOnly pertenece al backend/browser. `VITE_DATA_MODE` escoge adaptador API o mock. STOMP recibe cambios y provoca invalidación de queries, de modo que las vistas recuperan datos autoritativos en vez de fusionar eventos manualmente.

## Reservas y 409

```mermaid
flowchart LR
  F[Formulario válido] --> M[mutation create]
  M --> API[POST reservations]
  API -->|201| I[invalidate reservations/equipment]
  API -->|409 Problem Details| E[ApiError]
  E --> A[Mensaje: conflicto · conservar contexto · ajustar]
```

## i18n, responsive, CI y deploy

Las claves semánticas son consumidas con `react-i18next`; el selector persiste la preferencia y los tests comprueban paridad de catálogos ES/EN/FR/PT/DE/IT. El layout parte de móvil, limita ancho, usa cards bajo `xl` y overlays acotados al viewport. GitHub Actions ejecuta quality → CodeQL → Docker → Trivy; en push despliega Vercel y hace smoke, mientras AWS OIDC valida identidad temporal.
