# Equipos LIS — Frontend

Aplicación web para gestionar el inventario de equipos del **Laboratorio Integrado de Sistemas (LIS)**: consulta, registro y edición de equipos; creación, consulta y cancelación de reservas; y estadísticas de los equipos más solicitados.

## Stack

| Tecnología | Detalle |
|---|---|
| React | 19 |
| TypeScript | ~6.0 |
| Vite | 8 |
| React Router | 7 |
| Gestor de paquetes | pnpm |
| Estilos | CSS con tokens de diseño (`tokens.css` + `design.md`) |
| UI | Sin librerías: componentes propios (modales con `<dialog>`, badges, paginación, i18n es/en) |

## Requisitos

- **Node.js 20+** y **pnpm**
- **Backend corriendo** (rama `1022003345-reto2`); por defecto apunta a `http://localhost:8080/api`

## Instalación y ejecución

```bash
pnpm install          # instala dependencias
pnpm dev              # servidor de desarrollo (Vite)
pnpm build            # compila a producción (tsc + vite build)
pnpm preview          # sirve el build de producción
pnpm lint             # ESLint
```

### Variable de entorno

Copia `.env.example` a `.env.local` y ajusta la URL si tu backend corre en otro host/puerto:

```bash
VITE_API_URL=http://localhost:8080/api
```

Si no existe `.env.local`, se usa ese valor por defecto.

## Conexión con el backend

El frontend consume la **REST API** del backend Spring Boot (`equipos-reservas-api`). Toda la comunicación vive en `src/api/`:

| Archivo | Endpoints que consume |
|---|---|
| `src/api/equipos.ts` | `GET /equipos`, `GET /equipos/{id}`, `POST /equipos`, `PUT /equipos` |
| `src/api/reservas.ts` | `GET /reservas`, `POST /reservas`, `POST /reservas/{id}/cancelar` |
| `src/api/estadisticas.ts` | `GET /estadisticas/top-5` |

- **`src/api/client.ts`** centraliza `fetch` con timeout (15 s), envía `Accept: application/json` y lanza un `ApiError` tipado con el body uniforme del backend (`{status, error, message, path, timestamp, errors}`).
- **`src/api/types.ts`** define el contrato de tipos (equipos, reservas, paginación `PageResponse`, estados).

### Manejo de errores

- Los errores de validación (**400**) se muestran bajo cada campo del formulario.
- Los conflictos (**409**) y errores generales se muestran en alertas.
- Los errores de red se distinguen del resto de fallos de la API.

## Páginas

| Ruta | Página |
|---|---|
| `/` | **Equipos**: grid de cards con número de serie, nombre, categoría y estado |
| `/reservas` | **Reservas**: lista con usuario, rango de fechas, estado y botón de cancelar |

Ambas páginas comparten navbar, drawer móvil, selector de idioma (es/en) y footer.

### Equipos

- **Filtros** por categoría y estado (consulta paginada al backend).
- **Paginación** de 8 equipos por página ("Página X de Y").
- **Registrar equipo**: modal con id (asignado por el cliente), nombre, número de serie/MAC, categoría y estado.
- **Editar equipo**: modal precargado desde la card (el id queda bloqueado).
- Estados: `DISPONIBLE`, `RESERVADO`, `MANTENIMIENTO` con badge de color + icono.

### Reservas

- **Filtros** por equipo y estado de reserva (`ACTIVA` / `FINALIZADA` / `CANCELADA`).
- **Paginación** de 10 reservas por página.
- **Nueva reserva**: modal con nombre, correo, equipo y rango de fechas. El selector muestra equipos `DISPONIBLE` **y** `RESERVADO` (un equipo reservado se puede reservar en otra franja si no se solapa). El campo de inicio tiene `min` con la fecha/hora actuales.
- **Cancelar reserva**: solo en reservas `ACTIVA`; botón que abre un modal de confirmación (una `FINALIZADA` o `CANCELADA` responde `409`).
- **Top 5** lateral: equipos más solicitados (cuenta `ACTIVA` + `FINALIZADA`; las `CANCELADA` no cuentan).

## Reglas de negocio (aplicadas por el backend)

- La fecha de inicio debe ser futura y la de devolución posterior a la de inicio.
- No se permiten franjas solapadas sobre el mismo equipo; las adyacentes sí.
- Los equipos en `MANTENIMIENTO` no se pueden reservar.
- Las reservas activas cuya fecha de devolución ya pasó se marcan automáticamente como `FINALIZADA` al crear, cancelar o listar reservas, y el equipo se libera si no le quedan activas.

## Smoke test de la API

`scripts/smoke-api.mjs` verifica el contrato con la API real: listados y filtros, CRUD, cancelación de reservas, top 5 y reglas de negocio. Requiere el **backend corriendo**:

```bash
node scripts/smoke-api.mjs
```

Salida: una línea `PASS`/`FAIL` por verificación y un resumen final `N/N OK`.

## Estructura del proyecto

```
src/
  api/          # cliente HTTP, tipos y funciones por recurso
  components/   # UI: equipos, reservas, layout, estadísticas
  hooks/        # lógica de datos: listados con filtros, paginación y reintentos
  i18n/         # contexto de idioma y traducciones es/en
  pages/        # EquiposPage y ReservasPage
  styles/       # global.css
  utils/        # formatos de fecha, metadatos de estados
scripts/
  smoke-api.mjs # prueba de contrato contra la API real
```
