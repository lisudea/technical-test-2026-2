# Prueba Técnica LIS 2026-2 — Reto 3: Frontend
## Dashboard de Monitoreo de Recursos

**Miguel Mejía**

Estudiante de Ingeniería de Sistemas

Universidad de Antioquia

---

Dashboard que consume la REST API del [Reto 2](https://github.com/lisudea/technical-test-2026-2/tree/1032179304-reto2) (backend Spring Boot) para gestionar el inventario y las reservas de equipos del laboratorio.

> **Importante:** el código de este reto vive en la rama `1032179304-reto3` del repositorio [`technical-test-2026-2`](https://github.com/lisudea/technical-test-2026-2/tree/1032179304-reto3). El backend que esta app consume vive en la rama `1032179304-reto2` y debe estar corriendo para que la aplicación funcione.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | React + TypeScript |
| Bundler | Vite |
| Estilos | Tailwind CSS |
| Gestor de paquetes | pnpm |

---

## Identidad visual

Paleta alineada con la identidad del LIS:

- Teal principal `#6FBFBA`, teal oscuro `#1B7A80`, navy `#0E2A36`, naranja `#F5A623`
- Tipografía Poppins (títulos) / Inter (cuerpo)
- Estados de equipo con colores semánticos, independientes de la paleta de marca:
  - 🟢 Verde — Disponible
  - 🟠 Naranja — Reservado (tiene una reserva activa en curso ahora mismo)
  - ⚪ Gris — Mantenimiento
  - ⚫ Oscuro — De baja

---

## Estructura del proyecto

```
src/
├── api/            # Cliente HTTP centralizado + un módulo por recurso
│   ├── client.ts   # request() con manejo de JWT y errores
│   ├── auth.ts
│   ├── equipos.ts
│   ├── categorias.ts
│   ├── reservas.ts
│   └── estadisticas.ts
├── components/     # Componentes reutilizables (Layout, StatusBadge, etc.)
├── hooks/          # Hooks de datos (useReservas, useEquipos, etc.)
├── i18n/           # Textos centralizados (es.ts) — base para soporte multi-idioma
├── pages/          # Vistas: Dashboard, Detalle equipo, Reservas, Login,
│                   # Panel admin, Estadísticas
└── App.tsx
```

---

## Configuración y arranque

### 1. Clonar el repositorio

```powershell
git clone https://github.com/lisudea/technical-test-2026-2.git
cd technical-test-2026-2
git checkout 1032179304-reto3
```

### 2. Instalar dependencias

```powershell
npm install -g pnpm   # si no lo tienes
pnpm install
```

> Si el proyecto vive dentro de una carpeta sincronizada por OneDrive/Google Drive, considera moverlo fuera antes de instalar — la sincronización en tiempo real puede interferir con la escritura de `node_modules`.

### 3. Levantar el backend primero

Este frontend necesita el [backend del Reto 2](https://github.com/lisudea/technical-test-2026-2/tree/1032179304-reto2) corriendo en `http://localhost:8080` (ver su README para configurarlo). Si corre en otro puerto, define:

```
# .env.local
VITE_API_URL=http://localhost:<tu-puerto>
```

### 4. Ejecutar el proyecto

```powershell
pnpm dev
```

La app queda disponible en `http://localhost:8443` (puerto fijado en `vite.config.ts`).

> El proxy de Vite reenvía las llamadas a `/api` hacia el backend, por lo que en desarrollo local no dependes de la configuración de CORS del backend para que funcione. Si despliegas el frontend por separado sin este proxy, asegúrate de que `allowedOrigins` en el `SecurityConfig` del backend incluya el dominio real del frontend desplegado.

---

## Vistas

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Dashboard: equipos con estado calculado, filtro por categoría, búsqueda | Público |
| `/equipos/:id` | Detalle de equipo + formulario de reserva | Público |
| `/reservas` | Listado de reservas (nombre visible, correo nunca expuesto), cancelación con confirmación de correo | Público |
| `/login` | Login de administrador | Público |
| `/admin` | Panel admin: CRUD de equipos, categorías, y gestión/eliminación de reservas | 🔒 requiere sesión ADMIN |
| `/estadisticas` | Top 5 equipos más reservados, filtro opcional de rango de fechas | Público |

> ℹ️ El usuario admin de prueba tiene correo `admin@udea.edu.co` y contraseña `admin123`.

---

## Decisiones de integración

- **Estado "Reservado" calculado en cliente:** el backend no expone un cuarto estado — se cruzan los equipos (`GET /api/equipos`) con las reservas activas (`GET /api/reservas?estadoReserva=ACTIVA`) y se compara `fechaHoraInicio ≤ ahora ≤ fechaHoraFin` por equipo. Solo se marca "Reservado" durante la franja horaria activa, no de forma permanente.
- **JWT:** se guarda en `sessionStorage` tras login, se envía en `Authorization: Bearer <token>` en cada request protegida. Un 401/403 en una ruta protegida redirige a `/login`; un 403 en una ruta pública (ej. cancelar con correo incorrecto) se muestra como mensaje de error inline, sin redirigir.
- **Correo del usuario:** nunca se muestra en ningún listado de reservas — solo se solicita de vuelta al momento de cancelar, como confirmación.
- **Fechas:** se normalizan al formato `LocalDateTime` (sin milisegundos ni offset) que espera el backend antes de cada request.
- **Refresco de reservas:** refetch automático tras crear/cancelar/eliminar, más polling periódico en la vista de Reservas, para reflejar cambios hechos por otros usuarios en paralelo.

---

## Pendiente / Bonus

- **Internacionalización (i18n):** la estructura ya está preparada (`src/i18n/es.ts` centraliza todos los textos), falta agregar `en.ts` y el selector de idioma.
