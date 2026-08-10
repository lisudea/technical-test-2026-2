# 🖥️ Reservas LIS — Frontend (Reto 3)

Dashboard web para el **Sistema de Gestión y Reservas de Equipos del Laboratorio Integrado de Sistemas** (LIS, Universidad de Antioquia). Consume la API REST del backend para explorar, filtrar y reservar equipos del laboratorio.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **TanStack Query** (data fetching, caché, invalidación)
- **React Router v6** (rutas protegidas)
- **React Hook Form** + **Zod** (formularios con validación)
- **Tailwind CSS** (sistema de diseño propio)
- **react-i18next** (internacionalización ES/EN)
- **Axios** (cliente HTTP con interceptor JWT)
- **lucide-react** (íconos)

## Requisitos

- Node.js 18+
- npm 9+

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

El frontend se despliega como SPA estática en **S3 + CloudFront** (ver `infra/terraform/modules/frontend/`).

```bash
# Construir con la URL del backend en AWS
VITE_API_BASE_URL=http://reservas-lis-alb-159049455.us-east-1.elb.amazonaws.com npm run build

# Subir a S3
aws s3 sync dist/ s3://reservas-lis-frontend-XXXXX --delete

# Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

URL del frontend: **`https://dp79t8r6h8wrj.cloudfront.net`**

> ⚠️ El frontend se sirve sobre HTTPS pero la API de momento es HTTP. Para evitar bloqueos de contenido mixto, usa `npm run dev` local con el proxy.

## Vistas

| Ruta | Vista | Auth |
|------|-------|------|
| `/` | Dashboard — grilla de equipos con filtros | Público |
| `/equipos/:id` | Detalle del equipo + formulario de reserva | Público (reserva requiere JWT) |
| `/mis-reservas` | Listado de reservas del usuario | JWT |
| `/estadisticas` | Top 5 equipos más reservados | Público |
| `/login` | Inicio de sesión con Google | — |

## Funcionalidades

- **Dashboard con filtros**: búsqueda por nombre, categoría (multi-select), estado. Filtros sincronizados con la URL.
- **Indicadores de estado**: cada equipo muestra color + ícono + texto (verde ✔ disponible, rojo 🔒 reservado, gris 🔧 mantenimiento) — accesible para daltonismo.
- **Formulario de reserva**: validación con Zod (fecha inicio < fin, futuro, máximo 8h). Error 409 → mensaje amigable.
- **Cancelación de reservas**: confirmación modal, soft delete.
- **Autenticación Google SSO**: JWT en memoria (no localStorage). Ruta `/mis-reservas` protegida.
- **Internacionalización**: ES/EN con detección del navegador, sin recarga.

## Variables de entorno

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=  # Opcional: Google OAuth Client ID
```

## Estructura

```
src/
├── app/              # App, rutas, providers
├── components/       # UI components (Button, Card, Modal, Toast...)
├── features/
│   ├── auth/         # Login, contexto, RequireAuth
│   ├── equipos/      # Dashboard, detalle, filtros
│   ├── reservas/     # Formulario, listado, cancelación
│   ├── categorias/   # Hook para catálogo
│   └── estadisticas/ # Top N chart
├── i18n/             # ES/EN locales (132 strings c/u)
└── lib/              # API client, types, utils
```

## Licencia

Proyecto académico — Prueba técnica LIS 2026-2.