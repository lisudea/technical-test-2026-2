# 🖥️ Reservas LIS — Frontend (Reto 3)

Dashboard web para el **Sistema de Gestión y Reservas de Equipos del Laboratorio Integrado de Sistemas** (LIS, Universidad de Antioquia). Consume la API REST del backend para explorar, filtrar y reservar equipos del laboratorio.

---

## 🌐 Demo en vivo (AWS)

| Componente | URL | Cómo probarlo |
|-----------|-----|---------------|
| **Frontend** | [`http://reservas-lis-frontend-533267193270.s3-website-us-east-1.amazonaws.com`](http://reservas-lis-frontend-533267193270.s3-website-us-east-1.amazonaws.com) | Abrir en Firefox. Dashboard con todos los equipos, filtros, y login con Google. |
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

## Vistas

| Ruta | Vista | Auth |
|------|-------|------|
| `/` | Dashboard — grilla de equipos con filtros | Público |
| `/equipos/:id` | Detalle del equipo + formulario de reserva | Público (reserva requiere JWT) |
| `/mis-reservas` | Listado de reservas del usuario | JWT |
| `/estadisticas` | Top 5 equipos más reservados | Público |
| `/login` | Inicio de sesión con Google | — |

## Funcionalidades

- **Dashboard con filtros**: búsqueda por nombre, categoría (multi-select), estado. Filtros sincronizados con la URL (compartibles).
- **Indicadores de estado**: cada equipo muestra color + ícono + texto (verde ✔ disponible, rojo 🔒 reservado, gris 🔧 mantenimiento) — accesible para daltonismo.
- **Formulario de reserva**: validación con Zod (fecha inicio < fin, futuro, máximo 8h). Error 409 → mensaje amigable traducido.
- **Cancelación de reservas**: confirmación modal, soft delete.
- **Autenticación Google SSO**: JWT en memoria (no localStorage). Ruta `/mis-reservas` protegida.
- **Internacionalización**: ES/EN con detección del navegador, sin recarga. Selector en el header.
- **Responsive**: mobile-first, tarjetas en vez de tabla en pantallas pequeñas.
- **Lazy loading**: cada página se carga bajo demanda (code splitting de Vite).

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
│   ├── auth/         # Login Google, contexto, RequireAuth, UserMenu
│   ├── equipos/      # Dashboard, detalle, filtros, StatusBadge
│   ├── reservas/     # Formulario, listado, cancelación
│   ├── categorias/   # Hook para catálogo
│   └── estadisticas/ # Top N chart con CSS
├── i18n/             # ES/EN locales (132 strings c/u, sin hardcodeo)
└── lib/              # API client (Axios + JWT), types, utils
```

## Licencia

Proyecto académico — Prueba técnica LIS 2026-2.