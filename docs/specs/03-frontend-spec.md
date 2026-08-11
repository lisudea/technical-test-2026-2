# Spec 03 — Frontend

## Decisión: React + Vite, no Astro
Astro está optimizado para sitios mayormente estáticos con islas puntuales de
interactividad. El reto 3 es un **dashboard de monitoreo** con filtros dinámicos,
consumo continuo de una API, modales de reserva y manejo de errores — es una SPA
detrás (opcionalmente) de un login. React + Vite da mejor ergonomía para ese
caso sin la complejidad de islas que aquí no se aprovecharía.

## Stack
- React 18 + TypeScript + Vite
- React Router (rutas protegidas si se activa el login)
- TanStack Query (data fetching, caché, refetch, invalidación tras crear/cancelar reservas)
- React Hook Form + Zod (formulario de reserva con validación de fechas)
- Tailwind CSS + shadcn/ui (componentes accesibles, personalizables con el sistema de diseño)
- **react-i18next** (bonus de internacionalización ES/EN)
- Axios con interceptor para el JWT
- **Google Identity Services** (`@react-oauth/google`) para el SSO del bonus

## Estructura de carpetas (por feature)
```
src/
├── app/                # rutas, layout raíz, providers (Query, i18n, Auth)
├── features/
│   ├── auth/           # login con Google, hook useAuth, contexto de sesión
│   ├── equipos/        # lista, filtros, tarjeta de equipo, badge de estado
│   ├── reservas/       # formulario de reserva, listado, cancelación
│   ├── prestamos/      # consola del auxiliar: agenda y acciones de préstamo
│   ├── sanciones/      # hooks y formulario de sanción
│   ├── admin/          # consola de administración (4 secciones)
│   └── estadisticas/   # panel Top 5 (bonus)
├── components/         # componentes compartidos (UI genérica)
├── i18n/               # configuración de react-i18next
│   └── locales/
│       ├── es.json
│       └── en.json
├── lib/                # cliente HTTP, utilidades, hooks compartidos
└── styles/
```

## Sistema de diseño

**Paleta** — turquesa como color de marca (confiable + dinámico), con un acento
oscuro para contraste y jerarquía, y grises neutros para el resto:

| Uso | Color | Hex |
|---|---|---|
| Primario (marca) | Turquesa | `#6CBCB9` |
| Primario oscuro (hover, énfasis, headers) | Turquesa profundo | `#3E7F7C` |
| Texto principal / superficies oscuras | Azul pizarra | `#1F2D3D` |
| Fondo | Gris muy claro | `#F7F9F9` |
| **Disponible** | Verde | `#3E8E5B` |
| **Reservado / franja ocupada** | Rojo terracota | `#C4544A` |
| **Mantenimiento** | Gris neutro | `#8A94A6` |
| Advertencia | Ámbar | `#D9A441` |

Tipografía: **Inter** — sans-serif moderna, alta legibilidad en tablas y
formularios.

Tono visual: superficies planas, sin gradientes ni sombras pesadas, esquinas
redondeadas moderadas (`8px`–`12px`).

## Vistas
| Vista | Contenido |
|---|---|
| **Dashboard** (ruta `/`) | Grilla/tabla responsive con todos los equipos, badge de estado con color e ícono (verde/rojo/gris), botón "Reservar" habilitado solo si `estado='disponible'`. Panel lateral/superior con filtros por categoría y estado, buscador por nombre. |
| **Detalle de equipo** | Información completa + listado de reservas futuras + formulario para nueva reserva (fecha inicio/fin) con validación cliente. |
| **Mis reservas** | Listado de reservas del usuario autenticado (filtrado por su correo), con acción "Cancelar". |
| **Estadísticas** (bonus) | Barra/tabla con Top 5 de equipos más reservados. |
| **Login** (bonus, ruta `/login`) | Botón "Sign in with Google". Al retornar, se envía `id_token` a `/api/v1/auth/google`, se guarda el JWT y se redirige al dashboard. |
| **Mesa de préstamos** (`/auxiliar`, rol `AUXILIAR`+) | Cola del día en vez de tabla CRUD: alguien está en el mostrador y hace falta la siguiente acción en un clic. Las acciones se derivan del estado del préstamo, así que nunca se ofrece una transición ilegal. |
| **Administración** (`/admin`, rol `ADMIN`) | Cuatro secciones: Resumen (indicadores en vivo), Equipos (alta, edición y cambio de estado), Usuarios (asignación de rol) y Sanciones (crear, filtrar y levantar). Cada pestaña es una ruta real, para que se pueda enlazar y usar el botón «atrás». |

### Control de acceso en la interfaz

`RequireRole` distingue los dos modos de fallo en vez de colapsarlos: a un
visitante anónimo lo manda a login (puede arreglarlo), y a alguien
autenticado sin el rol le muestra un rechazo (no puede). Rebotar el segundo
caso a `/login` lo devolvería a la misma identidad recién rechazada.

**Ocultar un enlace no es control de acceso.** La navegación condicional y el
guard son comodidad; quien manda es el backend, que revalida el rol en cada
endpoint.

Los roles son **acumulativos** (`hasRole` compara por posición en la tupla
`ROLES`), así que un `ADMIN` alcanza también la consola del auxiliar.

## Indicadores de estado (requisito del reto)
Cada equipo se muestra con **color + ícono + texto** — no solo color, para
cumplir accesibilidad (daltonismo):

- 🟢 `disponible` — verde, ícono check-circle
- 🔴 `reservado` — rojo terracota, ícono lock
- ⚪ `mantenimiento` — gris, ícono wrench

El estado se calcula combinando el `estado` persistido del equipo con las
reservas activas cuya franja incluya el momento actual (consultado al backend).

## Filtros dinámicos (requisito del reto)
- Categoría (multi-select, opciones cargadas desde `/api/v1/categorias`)
- Estado (multi-select)
- Buscador de texto libre por nombre

Los filtros se aplican **sin recargar la página**: se traducen a query params y
disparan un refetch de TanStack Query. Los filtros también se serializan en la
URL (`?categoria=VR&estado=disponible`) para que el estado del dashboard sea
compartible y sobreviva al refresh.

## `401` y `403` se tratan distinto

El interceptor descarta la sesión y redirige a login solo en `401` («no sé
quién eres»). En `403` («sé quién eres y no puedes») únicamente muestra el
mensaje: es un fallo de rol o una sanción, y volver a iniciar sesión no lo
arregla. Confundirlos expulsaría a un administrador válido en cuanto tocara
una pantalla sin permisos.

Para las sanciones esto importa doble: el `detail` del `403` nombra el motivo
y la fecha de fin, que es información que el usuario necesita ver, no un
mensaje genérico de «sin permisos».

## Manejo de errores en UI (requisito del reto)
El interceptor de Axios y el `onError` de las mutaciones de TanStack Query
capturan la respuesta Problem Details del backend y disparan un **toast** con
mensaje amigable + traducido:

| HTTP | Mensaje mostrado |
|---|---|
| 409 al crear reserva | "Este equipo ya tiene una reserva en esa franja horaria. Por favor elige otro horario." |
| 400 validación | "Revisa los datos: {detalle del backend, traducido}" |
| 401/403 | "Tu sesión expiró. Inicia sesión de nuevo." → redirige a `/login` |
| 5xx | "Hubo un problema del lado del servidor. Intenta de nuevo en unos segundos." |
| Red caída | "No se pudo conectar con el servidor. Verifica tu conexión." |

## Internacionalización (bonus)
- **react-i18next** con dos locales de partida: `es.json` (por defecto) y `en.json`.
- **Ninguna cadena hardcoded** en JSX: siempre `t('reservas.conflicto')`.
- Claves organizadas por feature (`equipos.*`, `reservas.*`, `auth.*`, `common.*`).
- Selector de idioma en el header (bandera o dropdown), persistiendo la
  selección en `localStorage`.
- Formato de fechas y horas vía `Intl.DateTimeFormat` con la locale activa.
- Detección inicial: idioma del navegador con fallback a `es`.

Estructura de mensajes con placeholders (interpolación de i18next):
```json
{
  "reservas": {
    "conflicto": "El equipo {{nombre}} ya está reservado entre {{inicio}} y {{fin}}",
    "creada_ok": "Reserva creada para {{nombre}}"
  }
}
```

## Autenticación en el cliente (bonus)
JWT devuelto por `/api/v1/auth/google` se guarda **en memoria** (contexto de
React), no en `localStorage`, para reducir riesgo de XSS. Refresh silencioso vía
re-login con Google si el token expira. Rutas protegidas con un componente
`RequireAuth` que redirige a `/login`.

## Build y despliegue
`vite build` genera estático puro → sube a S3 y se invalida CloudFront en cada
deploy (ver [05-infra-devops.md](./05-infra-devops.md)). En local, `vite dev`
con proxy hacia el backend en `localhost:8080` para evitar configurar CORS en
desarrollo.

Variables de entorno relevantes (`.env`):
- `VITE_API_BASE_URL` — URL del backend
- `VITE_GOOGLE_CLIENT_ID` — Client ID de Google OAuth (público, va en el bundle)

## Accesibilidad y responsive
- Contraste AA mínimo en todos los pares texto/fondo
- Estado de equipos siempre con **color + ícono + texto** (no solo color)
- Diseño mobile-first: la tabla del dashboard colapsa a tarjetas en `<md`
- Componentes de shadcn/ui ya cumplen ARIA básico; revisión manual en el
  formulario de reserva (labels asociados, mensajes de error con `aria-describedby`)
