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
| Autenticación institucional | `@react-oauth/google` (Google Sign-In), restringido a `hosted_domain: udea.edu.co` |

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
│   ├── reservas.ts # envía googleIdToken al crear, header X-Google-Id-Token al cancelar
│   └── estadisticas.ts
├── components/     # Layout, StatusBadge, GoogleSignInButton, etc.
├── context/        # GoogleAuthContext (idToken/email en memoria durante la sesión)
├── hooks/          # useReservas, useEquipos, etc.
├── i18n/           # Textos centralizados (es.ts) — base para soporte multi-idioma
├── pages/          # Dashboard, Detalle equipo, Reservas, Login admin,
│                   # Panel admin, Estadísticas
└── App.tsx         # Envuelto con GoogleOAuthProvider
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

> Si el proyecto vive dentro de una carpeta sincronizada por OneDrive/Google Drive, considera moverlo fuera antes de instalar.

### 3. Variables de entorno

Crea `.env.local` en la raíz:

```
VITE_GOOGLE_CLIENT_ID=<el-mismo-client-id-usado-en-el-backend>
```

Debe ser **el mismo Client ID de Google Cloud Console que usa el backend** (`application.google.client-id`) — ambos validan contra la misma `audience`; si difieren, la verificación falla.

Si el backend corre en un puerto distinto al esperado por defecto, agrega también:

```
VITE_API_URL=http://localhost:<tu-puerto>
```

### 4. Levantar el backend primero

Este frontend necesita el [backend del Reto 2](https://github.com/lisudea/technical-test-2026-2/tree/1032179304-reto2) corriendo en `http://localhost:8080` (ver su README para configurarlo, incluyendo el mismo Client ID de Google).

### 5. Ejecutar el proyecto

```powershell
pnpm dev
```

La app queda disponible en `http://localhost:8443` (puerto fijado en `vite.config.ts`).

> El proxy de Vite reenvía las llamadas a `/api` hacia el backend, por lo que en desarrollo local no dependes de la configuración de CORS del backend. Si despliegas el frontend por separado sin este proxy, asegúrate de que `allowedOrigins` en el `SecurityConfig` del backend incluya el dominio real del frontend desplegado.

---

## Vistas

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Dashboard: equipos con estado calculado, filtro por categoría, búsqueda | Público |
| `/equipos/:id` | Detalle de equipo + formulario de reserva (requiere Google Sign-In institucional) | Público para ver, requiere sesión de Google para reservar |
| `/reservas` | Listado de reservas (nombre visible, correo nunca expuesto), cancelación con Google Sign-In | Público para ver, requiere sesión de Google para cancelar |
| `/login` | Login de administrador (correo/contraseña) | Público |
| `/admin` | Panel admin: CRUD de equipos, categorías, y gestión/eliminación de reservas | 🔒 requiere sesión ADMIN |
| `/estadisticas` | Top 5 equipos más reservados, filtro opcional de rango de fechas | Público |

---

## Decisiones de integración

- **Estado "Reservado" calculado en cliente:** el backend no expone un cuarto estado — se cruzan los equipos (`GET /api/equipos`) con las reservas activas (`GET /api/reservas?estadoReserva=ACTIVA`) y se compara `fechaHoraInicio ≤ ahora ≤ fechaHoraFin` por equipo.
- **Google Sign-In reemplaza el campo de correo libre:** tanto al reservar como al cancelar, el usuario se autentica con `GoogleSignInButton` (restringido a `hosted_domain: udea.edu.co`); el `id_token` obtenido se envía al backend, que hace la verificación real — el frontend nunca decide por sí solo si el correo es válido, solo restringe la UI de Google para guiar al usuario correcto.
- **`GoogleAuthContext`** guarda el `idToken` y el correo (decodificado solo para mostrarlo en la interfaz) en memoria durante la sesión del navegador — no hay persistencia en `localStorage`, cada sesión de pestaña requiere un nuevo Sign-In.
- **Creación de reserva:** el body envía `googleIdToken` en vez de `usuarioCorreo`.
- **Cancelación de reserva:** el `idToken` viaja en el header `X-Google-Id-Token`, no como query param — evita exponerlo en la URL.
- **Manejo diferenciado de errores al cancelar:** un `401` (token inválido o expirado) limpia la sesión de `GoogleAuthContext` y solicita re-login; un `403` (la reserva pertenece a otra persona) muestra el mensaje sin ofrecer reintentar login, ya que el problema no es la sesión sino la propiedad de la reserva.
- **JWT de administrador:** se guarda en `sessionStorage` tras login, se envía en `Authorization: Bearer <token>` en rutas protegidas del panel admin; un 401/403 ahí redirige a `/login`. Es un mecanismo completamente separado del Google Sign-In usado para reservar/cancelar.
- **Correo del usuario:** nunca se muestra en ningún listado de reservas.
- **Fechas:** se normalizan al formato `LocalDateTime` que espera el backend antes de cada request.
- **Refresco de reservas:** refetch automático tras crear/cancelar/eliminar, más polling periódico en la vista de Reservas.

---

## Bonus

| Requerimiento | Estado |
|---|---|
| Autenticación institucional protegiendo la creación de reservas (Google SSO) | ✅ Implementado |
| Internacionalización (i18n) | 🔲 Pendiente — estructura ya preparada en `src/i18n/es.ts`, falta `en.ts` y el selector de idioma |
