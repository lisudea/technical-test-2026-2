# Arquitectura frontend

[Inicio](../../README.md) · [API y estado](04-api-y-estado-remoto.md) · [Autenticación](05-autenticacion.md) · [Decisiones](15-decisiones-arquitectonicas.md)

## Contexto

```mermaid
flowchart LR
  Person[Estudiante o administrador] --> App[LISource React en Vercel]
  App -->|HTTPS REST| API[Spring Boot en Render]
  App <-->|STOMP sobre WebSocket| API
  App -->|Google Identity| Google[Google OAuth]
  API --> DB[(Supabase PostgreSQL)]
  API --> Storage[Supabase Storage]
```

El navegador solo se comunica con Google y con la API. PostgreSQL y Storage quedan detrás del backend; no hay conexión directa del frontend a las tablas de Supabase.

## Mapa de navegación y rutas

```mermaid
flowchart TD
  Root[Raíz TanStack Router] --> Public[Rutas públicas]
  Public --> Login["/ingreso"]
  Public --> Forgot["/recuperar"]
  Public --> Reset["/reset-password"]
  Root --> Guard[Sesión autenticada]
  Guard --> Dashboard[Dashboard /]
  Guard --> Equipment["/equipos y detalle"]
  Guard --> Reservations["/reservas"]
  Guard --> Statistics["/estadisticas"]
  Guard --> Profile["/perfil y sesiones"]
  Guard --> Role{Rol ADMIN}
  Role -->|Sí| Admin["/administracion/equipos"]
  Role -->|No| Dashboard
```

`AppShell` filtra el menú por rol y la ruta administrativa redirige a quien no sea `ADMIN`. Son medidas de experiencia y navegación; la autorización definitiva la aplica Spring Security.

## Arquitectura de componentes

```mermaid
flowchart TB
  Router[TanStack Router] --> Routes[src/routes]
  Routes --> Shell[components/layout]
  Routes --> Features[features: auth, equipment, reservations]
  Features --> Common[components/common]
  Features --> UI[components/ui: Radix y estilos]
  Features --> Query[TanStack Query]
  Features --> Forms[React Hook Form y Zod]
  Query --> Services[services]
  Services --> HTTP[http-client]
  Services --> Mock[adaptadores mock]
  Services --> Realtime[STOMP realtime]
  Routes --> I18n[i18n y locales]
  Services --> Types[types]
```

`routes` compone páginas y navegación; `features` concentra casos de interfaz; `components` aporta shell, estados y primitives; `services` elige API o mock; `lib` normaliza errores y formato; `types` describe contratos. No se atribuyen carpetas `schemas` o `queries` inexistentes: schemas y hooks viven junto a sus features.

## Flujo de datos frontend → API → frontend

```mermaid
sequenceDiagram
  participant V as Vista React
  participant Q as TanStack Query
  participant S as Servicio de dominio
  participant H as http-client
  participant B as API Spring Boot
  V->>Q: query o mutation
  Q->>S: operación tipada
  S->>H: request relativo
  H->>B: HTTPS con Bearer
  B-->>H: JSON o Problem Details
  H-->>Q: dato o ApiError
  Q-->>V: loading, success o error
  opt Evento STOMP
    B-->>S: evento de cambio
    S->>Q: invalidar query
    Q->>B: recuperar estado autoritativo
  end
```

TanStack Query conserva cache, estados e invalidación. El formulario, el diálogo abierto y los filtros son estado local o derivado; no se persisten como si fueran datos del servidor.

## Autenticación y protección de rutas

```mermaid
flowchart TD
  Entry["/ingreso"] --> Choice{Método}
  Choice -->|Local| Local[POST auth/login]
  Choice -->|Google| Google[Google Identity]
  Google --> GoogleAPI[POST auth/google]
  Local --> Roles{¿Requiere seleccionar rol?}
  GoogleAPI --> Roles
  Roles -->|Sí| Select[POST auth/select-role]
  Roles -->|No| Access[Access token en memoria]
  Select --> Access
  Access --> Guard[Rutas autenticadas]
  Guard --> Request[Request con Bearer]
  Request -->|401 recuperable| Refresh[POST auth/refresh con cookie HttpOnly]
  Refresh -->|nuevo access| Retry[Reintento único]
  Refresh -->|fallo| Logout[Limpiar sesión y volver a ingreso]
```

El cliente mapea `ADMINISTRADOR` del backend a `ADMIN` para navegación. El refresh token nunca se lee desde JavaScript: pertenece a una cookie HttpOnly administrada por el backend y el navegador.

## Creación de reserva y tratamiento del 409

```mermaid
sequenceDiagram
  participant U as Usuario
  participant D as Diálogo
  participant API as Backend
  U->>D: equipo, inicio, fin y notas
  D->>D: validar formato e intervalo
  D->>API: POST /reservations
  alt Reserva creada
    API-->>D: 201 Created
    D->>D: cerrar, notificar e invalidar queries
  else Solapamiento
    API-->>D: 409 RESERVATION_CONFLICT
    D->>D: conservar datos y mostrar explicación
    D-->>U: cambiar horario o equipo
  end
```

Los busy slots orientan al usuario, pero el `201/409` del backend es la decisión autoritativa.

## Estrategia responsive

```mermaid
flowchart LR
  Viewport[Ancho disponible] --> Mobile{Pantalla estrecha}
  Mobile -->|Sí| Drawer[Navegación en Sheet]
  Mobile -->|Sí| Cards[Inventario y acciones en cards]
  Mobile -->|Sí| Overlay[Diálogos limitados al viewport]
  Mobile -->|No| Desktop[Header y navegación horizontal]
  Desktop --> Table[Tabla administrativa cuando cabe]
  Viewport --> Fluid[Contenedores fluidos y max-width]
  Fluid --> Reflow[Texto, filtros y acciones con wrap]
```

El inventario mantiene cards hasta `xl`; administración usa cards bajo `md` y tabla desde ese breakpoint. Las imágenes reales documentan 320, 390, 768, 1024, 1280 y 1440 px, además de overlays y menús.

## Organización de internacionalización

```mermaid
flowchart TD
  Component[Componente o ruta] --> Key[Clave semántica t]
  Key --> I18next[i18next]
  I18next --> Language{Idioma activo}
  Language --> ES[es.json]
  Language --> EN[en.json]
  Language --> FR[fr.json]
  Language --> PT[pt.json]
  Language --> DE[de.json]
  Language --> IT[it.json]
  Selector[Selector] --> Persist[Preferencia local y perfil]
  Persist --> Language
  Tests[Tests de claves] --> ES
  Tests --> EN
  Tests --> FR
  Tests --> PT
  Tests --> DE
  Tests --> IT
```

Los textos propios de producto están centralizados en catálogos. Los tests comparan claves para reducir traducciones ausentes; las respuestas de API se traducen mediante códigos conocidos cuando existe una clave.

## Estados de interfaz

```mermaid
stateDiagram-v2
  [*] --> Loading
  Loading --> Success: respuesta con datos
  Loading --> Empty: respuesta sin datos
  Loading --> Error: fallo técnico o autorización
  Success --> Loading: refetch o invalidación
  Empty --> Loading: cambiar filtros o reintentar
  Error --> Loading: reintentar
  Loading --> Conflict: mutation devuelve 409
  Conflict --> Loading: ajustar y reenviar
  Conflict --> Success: nueva franja aceptada
```

`Loading` utiliza skeletons o indicadores; `Empty` muestra texto y posible acción; `Error` usa alerta y reintento; `Conflict` mantiene el formulario y explica la corrección. Éxito y estados de equipo/reserva se comunican con texto, y cuando aplica con icono, no solo con color.

## Límites y evolución

- La UI administrativa actual cubre equipos, no todos los dominios administrativos de la API.
- El access token se pierde al recargar por diseño; la cookie refresh recupera la sesión cuando el backend lo permite.
- STOMP invalida y vuelve a consultar; no aplica deltas manuales. Es más simple y autoritativo, con el coste de un request adicional.
- Un SDK generado desde OpenAPI podría sustituir gradualmente tipos y servicios escritos a mano si el contrato crece.
