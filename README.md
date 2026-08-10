<div align="center">
<h1>Prueba Técnica LIS 2026-2 — Reto 3: Frontend</h1>
<h3>Dashboard de Monitoreo de Recursos</h3>
<p>
<strong>Karen Jimenez Castro</strong><br/>
Estudiante de Ingeniería de Sistemas<br/>
Universidad de Antioquia
</p>
<p>
<img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
<img alt="Vitest" src="https://img.shields.io/badge/Vitest-Testing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white">
<img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white">
</p>
</div>

<details>
<summary><strong>📚 Tabla de contenidos</strong></summary>

- 0) Contexto y requerimientos del reto
- 1) Requisitos previos
- 2) Clonar el repositorio y ubicarse en la rama
- 3) Variables de entorno
- 4) Ejecutar localmente
- 5) Verificar que la app responde
- 6) Estructura del proyecto
- 7) Autenticación (Google SSO vía backend)
- 8) Funcionalidades principales
- 9) Internacionalización (i18n)
- 10) Despliegue en Cloudflare Workers
- 11) Resolución de problemas


</details>

## 0) Contexto y requerimientos del reto

El objetivo es desarrollar un **Dashboard de Monitoreo de Recursos** que consuma la API REST construida en 1094244076 - Reto 2, cumpliendo los siguientes requerimientos funcionales:

1) **Dashboard principal**: listado de equipos consumido en vivo desde la API, no datos estáticos.
2) **Indicadores visuales de estado**: color e ícono distintivo según el estado del equipo.
3) **Filtro dinámico**: filtro por categoría y búsqueda, sin recargar la página completa.
4) **Manejo de errores en UI**: los errores de la API (por ejemplo un conflicto `409` al reservar un horario ocupado) se traducen en mensajes claros para el usuario, no en errores genéricos o pantallas rotas.

Adicionalmente implementé el bonus de nivel avanzado:

- **Internacionalización (i18n)**: cambio de idioma Español/Inglés sin recargar la página, con todos los textos centralizados.

Y extendí el alcance más allá del dashboard mínimo, agregando dos páginas adicionales que consumen el resto de la API del Reto 2: **gestión de reservas** (listar y cancelar) y **estadísticas** (top de equipos, reservas por categoría, tasa de cancelación), además de un módulo de **creación/edición de equipos** restringido al rol `ADMIN`.

## 1) Requisitos previos

Instala lo siguiente antes de continuar. Usa Windows PowerShell (recomendado desde VS Code: Terminal > New Terminal).

**1) Git**
```powershell
git --version
```

**2) Node.js 20+**
```powershell
node -v
npm -v
```

**3) El backend del Reto 2 corriendo** (local). Ver el README de `1094244076-reto2` para instrucciones.


**Recomendación:**
La app ya está desplegada y lista para usar en:
`https://lisudea-technical-test-2026-2-lis-equipment-dashboard.karen-jimenez.workers.dev`, consumiendo el backend en `https://technical-test-2026-2.onrender.com` (Render duerme la app tras inactividad, puede tardar un par de minutos en despertar). 

## 2) Clonar el repositorio y ubicarse en la rama

```powershell
git clone https://github.com/lisudea/technical-test-2026-2.git
cd technical-test-2026-2
git fetch --all
git checkout 1094244076-reto3
git branch --show-current
```

Salida esperada:
```text
1094244076-reto3
```

Entra a la carpeta del proyecto:
```powershell
cd lis-equipment-dashboard
```

## 3) Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_BACKEND_ORIGIN` | Origen del backend (usado por el botón de "Iniciar sesión con Google") |
| `VITE_API_BASE_URL` | Base URL de la API REST consumida por el cliente HTTP |

```powershell
Copy-Item .env.example .env
```

Edita `.env` con la URL de tu backend local:
```properties
VITE_BACKEND_ORIGIN=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**Importante:** estas variables se incrustan en el bundle en tiempo de *build*, no se leen en runtime. Para producción se definen en `.env.production` (no versionado) antes de correr `npm run build`.

También asegúrate de que el backend tenga `FRONTEND_URL` (o `frontend.url`) apuntando al puerto donde corre este proyecto (por defecto `http://localhost:8081`) — si no coinciden, el login con Google y las peticiones CORS fallan.

## 4) Ejecutar localmente

```powershell
npm install
npm run dev
```

Al arrancar correctamente verás en consola algo como:
```text
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:8081/
```

## 5) Verificar que la app responde

Con el frontend y el backend corriendo, abre `http://localhost:8081` en el navegador. Deberías ver el dashboard con el listado de equipos (vacío o con datos, según el estado de tu base). Si el equipo se ve pero la lista queda vacía indefinidamente o marca error, revisa la consola del navegador: normalmente es un problema de CORS por `FRONTEND_URL` desincronizado (ver sección 13).

## 6) Estructura del proyecto

```text
lis-equipment-dashboard/
├── public/
│   └── penguin-favicon.svg      # favicon personalizado
├── src/
│   ├── components/lis/          # componentes del dominio: Header, EquipmentCard, ReserveDialog, StatusBadge, etc.
│   ├── i18n/translations.ts     # textos ES/EN centralizados
│   ├── lib/
│   │   ├── lis-api.ts           # cliente HTTP contra el backend, normalización de datos
│   │   └── auth-context.tsx     # contexto de autenticación (JWT en localStorage)
│   └── routes/                  # rutas de TanStack Router: index, reservas, estadisticas, auth.callback
├── .env.example                 # variables de entorno requeridas (sin secretos)
└── vite.config.ts
```

## 7) Autenticación (Google SSO vía backend)

El login se delega completamente al backend: el botón "Iniciar sesión con Google" redirige a `VITE_BACKEND_ORIGIN`, que maneja el flujo OAuth2/OIDC restringido a correos `@udea.edu.co`. Al finalizar, el backend redirige de vuelta a `/auth/callback?token=...&email=...&role=...`.

El frontend guarda `token`, `email` y `role` en `localStorage` (`lis-token`, `lis-email`, `lis-role`) y los usa para:
- Adjuntar `Authorization: Bearer <token>` en cada request a la API.
- Condicionar la UI según el rol (por ejemplo, el botón "Nuevo equipo" y el botón de edición solo aparecen para `ADMIN`).

## 8) Funcionalidades principales

**Dashboard (`/`)**
- Listado de equipos con estado visual: **disponible**, **reservado**, **en mantenimiento**, **dado de baja**.
- Filtro por categoría, por estado y búsqueda por texto — todo client-side, sin recargar.
- Estadísticas rápidas por estado y top 5 de equipos más solicitados.
- Creación y edición de equipos, restringida a rol `ADMIN`. Puedes probarlo ingresando con laboratorio.lis@udea.edu.co, que ya cuenta con rol Admin.

**Reservas (`/reservas`)**
- Listado completo de reservas: equipo, responsable, horario, estado.
- Cancelación de reservas (dueño de la reserva o admin).
- Al crear una reserva, el formulario muestra los horarios ya ocupados de ese equipo (resaltados en el calendario y listados debajo), para no reservar a ciegas.
- Un conflicto de horario (`409`) se muestra como mensaje claro.

**Estadísticas (`/estadisticas`)**
- Tasa de cancelación de reservas.
- Top 5 de equipos más reservados.
- Gráfico de barras de reservas por categoría.

## 9) Internacionalización (i18n)

Cambio de idioma Español/Inglés desde el header, sin recargar la página. Todos los textos de la aplicación están centralizados en `src/i18n/translations.ts`, evitando strings sueltos por los componentes.


## 10) Despliegue en Cloudflare Workers

El proyecto se despliega como Cloudflare Worker usando el motor Nitro de TanStack Start (preset `cloudflare-module`):

```powershell
npm run build
npx nitro deploy --prebuilt
```

Antes de desplegar, `.env.production` debe apuntar a la URL real del backend (Render), y el backend debe tener configurado `FRONTEND_URL` con la URL final del Worker para que CORS y el redirect de login funcionen. El comando maneja el login a Cloudflare vía OAuth y publica el build ya generado.

## 11) Resolución de problemas

| Síntoma | Causa probable |
|---|---|
| CORS / `403 Forbidden` en las peticiones | `FRONTEND_URL` del backend no coincide con el origen actual del frontend, o el backend no se reinició tras cambiar la variable |
| Redirige a `/auth/callback` pero "no conecta" | El servidor de desarrollo del frontend (`npm run dev`) no está corriendo |
| Cambié `.env` y no se refleja en producción | Las variables `VITE_*` se incrustan en el build; hay que volver a correr `npm run build` (y usar `.env.production`, no `.env`) |
| Puerto 8081 ocupado / Vite usa otro puerto | Actualiza `FRONTEND_URL` en el backend al puerto real que asigna Vite y reinícialo |


