# 🖥️ Reservas LIS — Frontend (Reto 3)

Dashboard web para el **Sistema de Gestión y Reservas de Equipos del Laboratorio Integrado de Sistemas** (LIS, Universidad de Antioquia). Consume la API REST del backend para explorar, filtrar y reservar equipos del laboratorio.

---

## 🌐 Demo en vivo (AWS)

| Componente | URL | Cómo probarlo |
|-----------|-----|---------------|
| **Frontend** | [`http://reservas-lis-frontend-533267193270.s3-website-us-east-1.amazonaws.com`](http://reservas-lis-frontend-533267193270.s3-website-us-east-1.amazonaws.com) | Abrir en Firefox. Dashboard con todos los equipos, filtros, y login con Google. |
| **Consola admin** | `…/admin` | Requiere iniciar sesión con una cuenta de rol `ADMIN`. |
| **Mesa de préstamos** | `…/auxiliar` | Requiere rol `AUXILIAR` o `ADMIN`. |
| **API** | `http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com` | Los GET públicos responden sin autenticación. |
| **Swagger** | [`http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com/swagger-ui/index.html`](http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com/swagger-ui/index.html) | Documentación interactiva de la API. Probar endpoints directamente. |

### Flujo de prueba para el evaluador

1. Abrir el **Frontend** en Firefox
2. Explorar el **Dashboard** — ver los 10 equipos con sus estados (verde = disponible, rojo = reservado, gris = mantenimiento)
3. Usar los **filtros** — buscar por nombre, seleccionar categoría (Microcontroladores, VR, Redes, Impresión 3D), filtrar por estado
4. Hacer click en un equipo → ver detalle y formulario de reserva
5. Iniciar sesión con **Google** (correo @udea.edu.co) → botón "Continuar con Google"
6. Crear una **reserva** — seleccionar fecha/hora
7. Ir a **Mis reservas** — ver la reserva creada, cancelarla
8. Ver **Estadísticas** — Top 5 equipos más reservados
9. Cambiar idioma a **English** — toda la interfaz se traduce sin recargar

### Flujo de prueba de las consolas (admin y auxiliar)

Inicie sesión con **`isaac.mesag@udea.edu.co`**, que ya tiene rol `ADMIN`. En
el header aparecerán dos entradas más: **Administración** y **Mesa de
préstamos**.

Los roles son **acumulativos**, así que esa única cuenta alcanza para recorrer
ambas consolas: un `ADMIN` tiene también todo lo del `AUXILIAR`.

10. **Administración → Resumen** — doce indicadores del laboratorio en vivo.
11. **Administración → Equipos** — registrar uno nuevo, editarlo, y cambiar su
    estado desde el selector. El cambio se refleja de inmediato en el
    dashboard público: ambas vistas comparten la misma query.
12. **Administración → Usuarios** — cambiar el rol de alguien. Su propio
    selector aparece deshabilitado: un administrador no puede degradarse a sí
    mismo.
13. **Administración → Sanciones** — sancionar a un usuario desde la fila de
    Usuarios, filtrar por «solo vigentes» y levantar una sanción con
    justificación.
14. **Mesa de préstamos** — crear antes una reserva cuya hora de inicio caiga
    dentro de los próximos minutos; aparecerá como *Por entregar*. Desde ahí:
    entregar, devolver (con la opción de mandar el equipo a mantenimiento) o
    marcar «no se presentó».

> **Los usuarios semilla no sirven para iniciar sesión.** `maria.gomez@`,
> `juan.restrepo@` y `ana.torres@` son filas de la base de datos, no cuentas
> de Google: existen para que las reservas y la agenda tengan datos. Para
> probar con una persona real, que inicie sesión con su cuenta `@udea.edu.co`
> (entra como `ESTUDIANTE`) y promuévala desde **Administración → Usuarios**.
>
> **Tras cambiar un rol, la persona debe cerrar sesión y volver a entrar.** El
> rol viaja dentro del JWT; hasta que no pida un token nuevo sigue viendo la
> interfaz anterior. Es el paso que más se olvida.

> **Las reservas semilla se ven corridas 5 horas** (y por eso la agenda de hoy
> puede aparecer casi vacía). El backend las insertó como texto pensado en
> hora de Bogotá mientras la sesión de MySQL es UTC. Lo que se crea desde esta
> interfaz hace round-trip exacto; solo afecta a las filas de demo.

### Probar la API directamente

```bash
# Listar equipos (público)
curl -s "http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com/api/v1/equipos?page=0&size=3" | jq .

# Obtener categorías (público)
curl -s "http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com/api/v1/categorias" | jq .

# Estadísticas Top 5 (público)
curl -s "http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com/api/v1/estadisticas/equipos-top" | jq .

# Swagger UI (abrir en navegador)
open http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com/swagger-ui/index.html
```

---

## Stack

- **React 18** + **TypeScript** + **Vite**
- **TanStack Query** (data fetching, caché, invalidación)
- **React Router v6** (rutas protegidas)
- **React Hook Form** + **Zod** (formularios con validación)
- **Tailwind CSS** (sistema de diseño propio con paleta turquesa)
- **react-i18next** (internacionalización ES/EN)
- **Axios** (cliente HTTP con interceptor JWT)
- **@react-oauth/google** (Google SSO)
- **lucide-react** (íconos)

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173)
# El proxy de Vite redirige /api/* a localhost:8080
npm run dev
```

Abrir `http://localhost:5173`.

## Build producción

```bash
npm run build
# Output en dist/
```

Para apuntar a un backend diferente:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run build
```

## Despliegue en AWS

El frontend se despliega como SPA estática en **S3** (ver `infra/terraform/modules/frontend/`).

```bash
# Construir con la URL del backend en AWS
VITE_API_BASE_URL=http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com npm run build

# Subir a S3
aws s3 sync dist/ s3://reservas-lis-frontend-533267193270 --delete
```

**Despliegue el backend primero.** Si sube el frontend antes, las consolas
pedirán rutas (`/api/v1/admin/…`, `/api/v1/prestamos/…`) que la versión
anterior de la API todavía no publica, y las pantallas fallarán con 404 sin
que nada lo explique.

El `VITE_API_BASE_URL` queda **incrustado en el bundle** en tiempo de build:
no es una variable de entorno de ejecución. Cambiar de backend obliga a
reconstruir y volver a sincronizar.

## Vistas

| Ruta | Vista | Auth |
|------|-------|------|
| `/` | Dashboard — grilla de equipos con filtros | Público |
| `/equipos/:id` | Detalle del equipo + formulario de reserva | Público (reserva requiere JWT) |
| `/mis-reservas` | Listado de reservas del usuario | JWT |
| `/estadisticas` | Top 5 equipos más reservados | Público |
| `/auxiliar` | Mesa de préstamos: entrega, devolución y no-show | **AUXILIAR** o ADMIN |
| `/admin` | Resumen operativo del laboratorio | **ADMIN** |
| `/admin/equipos` | Alta, edición y cambio de estado del catálogo | **ADMIN** |
| `/admin/usuarios` | Asignación de roles y sanciones | **ADMIN** |
| `/admin/sanciones` | Listado y levantamiento de sanciones | **ADMIN** |
| `/login` | Inicio de sesión con Google | — |

## Roles y consolas

La app tiene tres niveles: `ESTUDIANTE` (por defecto), `AUXILIAR` y `ADMIN`.
El rol llega en el JWT y en `GET /auth/me`.

**Ocultar un enlace no es control de acceso.** La navegación condicional y el
guard `RequireRole` son comodidad; quien manda es el backend, que revalida el
rol en cada endpoint. Un usuario que edite su perfil en devtools verá menús de
más y recibirá un 403 al primer clic.

### Consola del auxiliar (`/auxiliar`)

Está diseñada como una **cola**, no como una tabla CRUD: alguien está parado en
el mostrador y el auxiliar necesita la siguiente acción en un clic.

- Selector de fecha, filtro por estado de préstamo y cinco contadores del día.
- Las acciones disponibles se derivan del estado del préstamo, así que nunca se
  ofrece una transición ilegal. `PENDIENTE` → Entregar / No se presentó;
  `ENTREGADO` → Devolver; `DEVUELTO` y `NO_RECLAMADO` son terminales.
- Al devolver se puede marcar «enviar a mantenimiento» en el mismo gesto: el
  mostrador es donde se descubre el daño.
- Los rechazos del backend (entregar demasiado pronto, declarar no-show antes
  del margen) se muestran **junto al botón**, no como toast: el mensaje explica
  una regla y menciona una hora concreta.

### Consola del admin (`/admin`)

Cuatro secciones detrás de un único guard en la ruta del layout, para que una
pestaña nueva no pueda quedar desprotegida por descuido:

- **Resumen** — doce indicadores agrupados por la pregunta que responden.
- **Equipos** — alta, edición y cambio de estado en un paso. Usa la misma query
  que el dashboard público, así que un cambio aquí refresca allá.
- **Usuarios** — asignación de rol. Un admin no puede degradarse a sí mismo
  (control deshabilitado en la UI y rechazado por el backend).
- **Sanciones** — filtro por estado y «solo vigentes», levantamiento con
  justificación.

### Cómo entrar como admin o auxiliar

El rol se asigna en el backend. En el entorno de demo,
`isaac.mesag@udea.edu.co` ya es **ADMIN** y `ana.torres@udea.edu.co` es
**AUXILIAR**; para otros correos, un ADMIN los promueve desde
`/admin/usuarios`, o se listan en las variables `ADMIN_EMAILS` /
`AUXILIAR_EMAILS` del backend.

> Un cambio de rol se aplica en el **siguiente inicio de sesión**: el rol viaja
> dentro del JWT y los tokens son stateless (expiran a los 30 minutos).

## Funcionalidades

- **Dashboard con filtros**: búsqueda por nombre, categoría (multi-select), estado. Filtros sincronizados con la URL (compartibles).
- **Indicadores de estado**: cada equipo muestra color + ícono + texto (verde ✔ disponible, rojo 🔒 reservado, gris 🔧 mantenimiento) — accesible para daltonismo.
- **Formulario de reserva**: validación con Zod (fecha inicio < fin, futuro, máximo 8h). Error 409 → mensaje amigable traducido.
- **Cancelación de reservas**: confirmación modal, soft delete.
- **Autenticación Google SSO**: JWT en memoria (no localStorage). Ruta `/mis-reservas` protegida.
- **Internacionalización**: ES/EN con detección del navegador, sin recarga. Selector en el header.
- **Responsive**: mobile-first, tarjetas en vez de tabla en pantallas pequeñas.
- **Roles y consolas**: navegación condicional, guard por rol y consolas de
  auxiliar y administrador (ver [Roles y consolas](#roles-y-consolas)).
- **Sanciones visibles para el usuario**: un estudiante sancionado ve el motivo
  y la fecha de fin en «Mis reservas», en vez de armar una reserva y chocar con
  un 403 al enviar.
- **401 y 403 se tratan distinto**: en `401` (no sé quién eres) se descarta el
  token y se manda a login; en `403` (sé quién eres y no puedes) solo se
  muestra el mensaje. Confundirlos expulsaría a un administrador válido en
  cuanto tocara una pantalla sin permisos, devolviéndolo a un login que le
  entrega la misma identidad recién rechazada.
- **Lazy loading**: cada página se carga bajo demanda (code splitting de Vite).
  Las consolas privilegiadas van en bundles aparte: un estudiante nunca
  descarga el código de administración.

## Variables de entorno

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=391965674757-2jn5t2li28g2fqpmpgv2p26hi4jfvo0o.apps.googleusercontent.com
```

## Estructura

```
src/
├── app/              # App, rutas, providers (Query, Auth, i18n)
├── components/       # UI components (Button, Card, Modal, Toast, Badge...)
├── features/
│   ├── auth/         # Login Google, contexto con rol, RequireAuth/RequireRole
│   ├── equipos/      # Dashboard, detalle, filtros, StatusBadge
│   ├── reservas/     # Formulario, listado, cancelación
│   ├── categorias/   # Hook para catálogo
│   ├── prestamos/    # Mesa del auxiliar: agenda y acciones de préstamo
│   ├── sanciones/    # Hooks y formulario de sanción
│   ├── admin/        # Consola de administración (4 secciones)
│   └── estadisticas/ # Top N chart con CSS
├── i18n/             # ES/EN locales (253 strings c/u, sin hardcodeo)
└── lib/              # API client (Axios + JWT), types, utils
```

## Licencia

Proyecto académico — Prueba técnica LIS 2026-2.