<p align="center">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&height=230&section=header&color=0:0D6D6E,50:178A8C,100:6BBAB7&text=LISource%20Frontend&fontColor=F1F2EC&fontSize=40&fontAlignY=38&desc=Reto%203%20%C2%B7%20Dashboard%20%C2%B7%20Responsive%20%C2%B7%20REST%20%C2%B7%20i18n&descSize=15&descAlignY=58&animation=fadeIn"
    width="100%"
    alt="LISource Frontend"
  />
</p>

<p align="center">
  <img src="lisource-frontend/docs/assets/logo-lis.png" alt="Logo LIS" width="160">
</p>

<h3 align="center">LABORATORIO INTEGRADO DE SISTEMAS</h3>
<h3 align="center">UNIVERSIDAD DE ANTIOQUIA</h3>
<h1 align="center">RETO 3: FRONTEND</h1>
<h2 align="center">Dashboard de Monitoreo de Recursos</h2>

<p align="center"><strong>React</strong> · <strong>Responsive</strong> · <strong>Integración REST</strong> · <strong>i18n</strong> · <strong>Experiencia de usuario</strong></p>

<p align="center">
  María Camila Castañeda Piedrahita · CC 1021805193 · maria.castanedap@udea.edu.co · Medellín · Agosto de 2026
</p>

<p align="center">
  <a href="#qué-pedía-el-reto">📖 Requisitos</a> ·
  <a href="#arquitectura">🏗️ Arquitectura</a> ·
  <a href="#clonar-y-ejecutar">🚀 Ejecutar</a> ·
  <a href="#integración-rest">🔌 API</a> ·
  <a href="#responsive">📱 Responsive</a> ·
  <a href="#internacionalización">🌍 i18n</a> ·
  <a href="#seguridad">🔐 Seguridad</a> ·
  <a href="#deployment">☁️ Deployment</a>
</p>

<div align="center">

[![React 19.2](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=111)](lisource-frontend/package.json)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](lisource-frontend/package.json)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](lisource-frontend/vite.config.ts)
[![TanStack](https://img.shields.io/badge/TanStack-Router_Query-FF4154?logo=tanstack&logoColor=white)](lisource-frontend/src)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)](lisource-frontend/package.json)
[![Radix UI](https://img.shields.io/badge/Radix_UI-primitives-161618?logo=radixui&logoColor=white)](lisource-frontend/src/components)
[![i18next](https://img.shields.io/badge/i18next-multilingual-26A69A?logo=i18next&logoColor=white)](lisource-frontend/src/i18n)
[![Vitest](https://img.shields.io/badge/Vitest-testing-6E9F18?logo=vitest&logoColor=white)](lisource-frontend/package.json)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?logo=githubactions&logoColor=white)](.github/workflows/frontend-ci.yml)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel&logoColor=white)](https://lisource-1021805193.vercel.app)

</div>

## Producción

| Servicio | Enlace |
|---|---|
| Aplicación web | https://lisource-1021805193.vercel.app |
| API REST | https://technical-test-2026-2-v96h.onrender.com/ |
| Swagger UI | https://technical-test-2026-2-v96h.onrender.com/swagger-ui/index.html |
| OpenAPI JSON | https://technical-test-2026-2-v96h.onrender.com/v3/api-docs |
| Health check | https://technical-test-2026-2-v96h.onrender.com/actuator/health |

> [!IMPORTANT]
> Reto 3 depende funcionalmente del backend del Reto 2. Complete primero la configuración y ejecución del backend antes de levantar el frontend.

Repositorio y README del backend:

- [Reto 2 en GitHub](https://github.com/lisudea/technical-test-2026-2/tree/1021805193-reto2)
- [README maestro del backend](https://github.com/lisudea/technical-test-2026-2/blob/1021805193-reto2/README.md)

LISource Frontend consume exclusivamente la API del backend del Reto 2. La aplicación nunca accede directamente a PostgreSQL ni a Supabase Storage; su responsabilidad es orquestar navegación, estado remoto, experiencia responsive, tratamiento amigable de errores y una capa visual clara para inventario, reservas y administración.

## Índice

- [Visión general](#visión-general)
- [Qué pedía el reto](#qué-pedía-el-reto)
- [Requerimientos obligatorios](#requerimientos-obligatorios)
- [Bonus solicitados](#bonus-solicitados)
- [Funcionalidades adicionales integradas](#funcionalidades-adicionales-integradas)
- [Interpretación de ingeniería](#interpretación-de-ingeniería)
- [Guía rápida de evaluación](#guía-rápida-de-evaluación)
- [Mapa de LISource UI](#mapa-de-lisource-ui)
- [Demo visual](#demo-visual)
- [Arquitectura](#arquitectura)
- [Decisiones de ingeniería y alternativas](#decisiones-de-ingeniería-y-alternativas)
- [Tecnologías](#tecnologías)
- [Prerrequisitos](#prerrequisitos)
- [¿Cómo quiere probar LISource?](#cómo-quiere-probar-lisource)
- [Clonar y ejecutar](#clonar-y-ejecutar)
- [Worktree opcional](#worktree-opcional)
- [Variables de entorno](#variables-de-entorno)
- [Usuarios de evaluación](#usuarios-de-evaluación)
- [Integración REST](#integración-rest)
- [Responsive](#responsive)
- [Internacionalización](#internacionalización)
- [Reservas y conflicto 409](#reservas-y-conflicto-409)
- [Testing y calidad](#testing-y-calidad)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)
- [Glosario técnico](#glosario-técnico)
- [Referencias](#referencias)

## Visión general

El problema del frontend no es solo pintar datos de la API. También debe ayudar al usuario a entender el estado del inventario, navegar entre equipos y reservas, tratar el conflicto `409` sin perder contexto, adaptarse a pantallas pequeñas y mantener textos consistentes en varios idiomas.

La solución usa React 19, TanStack Router y TanStack Query para separar navegación, estado remoto y estado local. El resultado es una interfaz que consume la API del backend, reacciona a cambios en tiempo real cuando corresponde y conserva el formulario o la vista cuando un error de negocio exige corregir la franja de reserva.

## Qué pedía el reto

Reto 3 solicita una interfaz construida con un framework/librería JavaScript que consuma la API del Reto 2 y permita consultar el inventario de forma clara en escritorio y móvil. Los obligatorios son tecnología JS, responsive, dashboard, indicadores de estado, filtros dinámicos y manejo amigable de errores. El bonus es i18n en español/inglés con diseño escalable.

```mermaid
flowchart TB
  R[Reto 3 · Frontend] --> O[Requerimientos obligatorios]
  R --> B[Bonus]
  R --> X[Funcionalidades adicionales]

  O --> F[Framework / librería JS]
  O --> RS[Diseño responsivo]
  O --> D[Dashboard que consume API]
  O --> V[Indicadores visuales]
  O --> Fi[Filtros dinámicos]
  O --> E[Manejo amigable de errores]
  B --> I[i18n ES/EN extensible]
```

> [!IMPORTANT]
> **Interpretación de ingeniería:** el frontend debe ayudar al usuario a entender y corregir lo que ocurre, pero no reemplaza las reglas del backend. La disponibilidad definitiva, los permisos y el conflicto de reservas siguen siendo responsabilidad del Reto 2.

## Requerimientos obligatorios

| Requisito | Qué hace | Dónde está | Cómo probarlo |
|---|---|---|---|
| **Framework / librería JS** | React 19 + TypeScript + Vite | `src/router.tsx`, `src/routes`, `package.json` | abrir la app y navegar sin recargar |
| **Diseño responsivo** | Adapta navegación, equipos, formularios, diálogos y administración a móvil, tablet y escritorio | `AppShell`, `EquipmentList`, componentes UI y rutas | revisar `320/375/768/1024/1440 px`; forma parte de las 110 combinaciones auditadas |
| **Dashboard** | Lista y resume equipos del laboratorio consumiendo la REST API del Reto 2 | `/` + servicios de dashboard/equipos | entrar a `/` y comprobar datos reales del backend |
| **Indicadores de estado** | Representa visualmente disponibilidad y estados operativos mediante badges/textos | `StatusBadge`, `src/components` | abrir listado/detalle y comparar diferentes estados |
| **Filtros dinámicos** | Busca y filtra equipos sin recargar la aplicación completa | `/equipos` | aplicar categoría/estado/búsqueda y observar actualización |
| **Manejo amigable de errores** | Convierte Problem Details y el `409` de reserva en mensajes útiles sin perder contexto | `src/lib/api-error.ts`, flujo de reservas | provocar `409` o fallo de red y revisar el mensaje mostrado |

## Bonus solicitados

| Bonus | Qué hace | Dónde está | Cómo probarlo |
|---|---|---|---|
| i18n | ES, EN, FR, PT, DE e IT | `src/i18n`, `src/locales` | cambiar idioma desde el selector y verificar persistencia |

## Funcionalidades adicionales integradas

| Extra | Qué hace | Dónde está | Cómo probarlo |
|---|---|---|---|
| Reservas | Crear y cancelar reservas con contexto | `src/routes/reservas.tsx`, `src/features/reservations` | reservar desde un equipo y luego cancelar |
| Autenticación | Login local, Google y recuperación | `src/routes/ingreso.tsx`, `src/features/auth` | iniciar sesión y cerrar sesión |
| Roles | Selección y cambio de rol activo | `src/components/layout/app-shell.tsx` | usar una cuenta dual y cambiar rol |
| Administración | Alta, edición, estado e imagen de equipos | `src/routes/administracion.equipos.tsx` | abrir la vista admin y editar un equipo |
| Perfil | Editar nombre, revisar sesiones y revocar | `src/routes/perfil.tsx` | guardar cambios y cerrar otras sesiones |
| Estadísticas | Top 5 histórico | `src/routes/estadisticas.tsx` | abrir estadísticas después de cargar datos |
| Realtime | Invalida queries con STOMP | `src/services/realtime.service.ts` | cambiar datos en backend y refrescar vista |
| Correlation ID | Preserva trazabilidad de errores | `src/services/http-client.ts`, `src/lib/api-error.ts` | provocar error y revisar el identificador |

## Interpretación de ingeniería

La dificultad real no fue solo mostrar datos. Hubo que convertir la API del backend en una experiencia legible: pantallas compactas, errores que no rompen el contexto, traducciones consistentes y rutas que siguen siendo útiles tanto en móvil como en escritorio.

## Guía rápida de evaluación

1. Despierte primero el backend del Reto 2 con Health o Swagger y espere a que responda.
2. Abra [Vercel](https://lisource-1021805193.vercel.app) e inicie sesión con una cuenta demo.
3. Verifique el dashboard para confirmar carga inicial, datos y estados visuales.
4. Aplique filtros y paginación en equipos para comprobar integración REST real.
5. Abra el detalle de un equipo y pruebe el diálogo de reserva.
6. Reproduzca un conflicto `409` con la misma franja o equipo.
7. Cambie el idioma para validar i18n sin recargar la página.
8. Revise el menú de administración y las vistas responsive en móvil y escritorio.

## Mapa de LISource UI

```mermaid
flowchart TB
  UI[LISource UI] --> Dashboard[Dashboard]
  UI --> Equipos[Equipos]
  UI --> Reservas[Reservas]
  UI --> Perfil[Perfil]
  UI --> Admin[Administración]
  UI --> I18n[i18n]
  UI --> Responsive[Responsive]
  UI --> API[API]
  UI --> Realtime[Realtime]
  Dashboard --> Summary[summary]
  Equipos --> Filters[filtros y paginación]
  Reservas --> Conflict[409]
  Admin --> Imagenes[imágenes y estado]
```

### Viaje principal del usuario

```mermaid
flowchart LR
  Login[Ingreso] --> Dashboard[Dashboard]
  Dashboard --> Filtros[Filtrar equipos]
  Filtros --> Detalle[Detalle del equipo]
  Detalle --> Reserva[Crear reserva]
  Reserva --> Backend{Backend Reto 2}
  Backend -->|201| Exito[Reserva creada]
  Backend -->|409| Conflicto[Mensaje amigable]
  Conflicto --> Correccion[Corregir franja]
  Correccion --> Reserva
```

Este recorrido conecta los requisitos más importantes del frontend: consumo REST, dashboard, filtros, detalle, reserva y tratamiento comprensible del conflicto de negocio.

## Demo visual

<table>
  <tr>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/dashboard-1440.png" alt="Dashboard desktop" width="100%"></td>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/dashboard-320.png" alt="Dashboard mobile" width="100%"></td>
  </tr>
  <tr>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/admin-equipment-320.png" alt="Administración móvil" width="100%"></td>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/reservation-dialog-320.png" alt="Reserva en móvil" width="100%"></td>
  </tr>
</table>

Dashboard desktop: demuestra la vista principal del reto, el estado agregado del inventario y la lectura cómoda en escritorio.

Dashboard móvil: demuestra que el mismo contenido se reordena para pantallas pequeñas sin perder jerarquía visual.

Administración móvil: demuestra que la gestión de equipos sigue siendo usable en ancho reducido y que las acciones importantes se mantienen accesibles.

Reserva móvil: demuestra que el diálogo de reserva conserva contexto, validación y legibilidad en un viewport estrecho.

Leyenda de estados usada en la UI: 🟢 disponible, 🔴 reservado, 🟡 mantenimiento, ⚪ fuera de servicio, ⚫ retirado.

## Arquitectura

```mermaid
flowchart LR
  U[Usuario] --> R[TanStack Router]
  R --> V[Rutas y features React]
  V --> Q[TanStack Query]
  V --> A[AuthContext]
  Q --> S[Servicios]
  A --> S
  S --> H[http-client]
  H -->|HTTPS REST + Bearer| B[API Spring Boot]
  B -->|Problem Details / JSON| H
  W[STOMP /ws] -->|invalidar queries| Q
```

```mermaid
flowchart TD
  Root[Router raíz] --> Public[Rutas públicas]
  Public --> Login[/ingreso/]
  Public --> Forgot[/recuperar/]
  Public --> Reset[/reset-password/]
  Root --> Auth[Rutas autenticadas]
  Auth --> Dashboard[/]
  Auth --> Equipment[/equipos]
  Auth --> Reservations[/reservas]
  Auth --> Stats[/estadisticas]
  Auth --> Profile[/perfil]
  Auth --> Admin[/administracion/equipos]
```

```mermaid
sequenceDiagram
  participant V as Vista
  participant Q as Query
  participant S as Servicio
  participant H as http-client
  participant B as Backend
  V->>Q: query/mutation
  Q->>S: llamada tipada
  S->>H: request relativo
  H->>B: HTTPS con Bearer
  B-->>H: JSON o Problem Details
  H-->>Q: dato o ApiError
  Q-->>V: loading / success / error
```

```mermaid
flowchart TB
  Root[src] --> Routes[routes]
  Root --> Features[features]
  Root --> Components[components]
  Root --> Services[services]
  Root --> Hooks[hooks]
  Root --> Lib[lib]
  Root --> I18n[i18n]
  Root --> Locales[locales]
  Root --> Types[types]
```

El frontend separa composición de páginas (`routes`), casos de interfaz (`features`), componentes reutilizables, servicios remotos/mock, contexto de autenticación, tipos e internacionalización. TanStack Query administra estado remoto; formularios, overlays y menús siguen siendo estado local.

## Decisiones de ingeniería y alternativas

| Decisión | Alternativas consideradas | Por qué LISource | Trade-off | Cuándo elegiría otra opción |
|---|---|---|---|---|
| React | Angular / Vue | La base ya estaba pensada para composición y estado explícito | Curva de aprendizaje del ecosistema | Si el equipo ya tuviera una convención fuerte en Angular o Vue |
| TypeScript | JavaScript | Contratos más seguros entre rutas, servicios y API | Más tipado inicial | Si la app fuera mínima y de vida corta |
| Vite | Bundling tradicional | Inicio rápido y configuración simple | Menos abstracción de framework | Si se requiriera un sistema heredado basado en webpack |
| TanStack Query | fetch manual / Context | cache, invalidación y refetch autoritativo | Aprender un patrón extra | Si casi no hubiera estado remoto |
| TanStack Router | React Router | rutas tipadas y loaders más expresivos | Dependencia adicional | Si se privilegiara la simplicidad por sobre el tipado de rutas |
| Tailwind + Radix | Bootstrap / CSS Modules | Velocidad y accesibilidad con control fino | Más disciplina visual | Si se prefiriera un sistema visual ya cerrado |
| RHF + Zod | formularios manuales | Validación declarativa y menos código de formulario | Más composición | Si los formularios fueran muy pocos y triviales |
| i18next | strings hardcoded | Catálogos centralizados y escalables | Mantenimiento de traducciones | Si la app fuera monolingüe |
| STOMP | polling | Refresco por evento sin consultas repetidas | Requiere websocket activo | Si el backend no ofreciera canal realtime |
| Vercel | hosting tradicional | Despliegue simple y reproducible | Dependencia de plataforma | Si se quisiera hosting totalmente autoalojado |
| Layout card-based en móvil | Forzar tabla responsive | Mejor lectura en pantallas pequeñas | Más trabajo de composición | Si el consumo principal fuera escritorio |

## Tecnologías

| Área | Tecnología | Para qué se usa |
|---|---|---|
| UI | React 19 | composición de vistas |
| Tipado | TypeScript 5.8 | contratos y seguridad de edición |
| Routing | TanStack Router | rutas, loaders y navegación |
| Estado remoto | TanStack Query | cache, refetch e invalidación |
| Estilos | Tailwind CSS 4 | responsive y sistema visual |
| Primitivas accesibles | Radix UI | dialogs, dropdowns y sheets |
| Formularios | React Hook Form + Zod | validación y control de inputs |
| i18n | i18next / react-i18next | textos multilingües |
| Realtime | STOMP | invalidación y refresco de datos |
| Calidad | Vitest, Testing Library, ESLint | tests y lint |
| Entrega | Vite, Docker, Vercel | build y despliegue |

## Prerrequisitos

> [!NOTE]
> Primero debe estar listo el backend del Reto 2. Sin API activa, el frontend solo mostrará errores de conexión.

| Herramienta | Uso | Obligatoria | Verificación |
|---|---|---|---|
| Git | clonar ramas | Sí | `git --version` |
| Node.js 22 | ejecutar y construir | Sí | `node --version` |
| npm | instalar dependencias | Sí | `npm --version` |
| Navegador moderno | usar la app | Sí | abrir Chrome, Edge o Firefox |
| Docker | build opcional | No | `docker --version` |
| Java 21 | ejecutar backend | Dependencia del sistema completo | `java --version` |

<details>
<summary>🪟 Preparar Windows</summary>

- Git: instálelo desde [git-scm.com](https://git-scm.com/downloads) y confirme con `git --version`.
- Node.js 22: instálelo desde [nodejs.org](https://nodejs.org/) y confirme con `node --version` y `npm --version`.
- Navegador moderno: use Chrome, Edge o Firefox para revisar la UI y el responsive.
- Java 21: requerido solo si va a ejecutar el backend localmente.
- Docker: opcional, útil si desea construir la imagen del frontend.

</details>

<details>
<summary>🐧 Preparar Linux</summary>

- Git: instálelo con el gestor de paquetes de su distribución y confirme con `git --version`.
- Node.js 22: instálelo con el método oficial o nvm y confirme con `node --version` y `npm --version`.
- Navegador moderno: use Chromium, Firefox o equivalente.
- Java 21: requerido solo para levantar el backend localmente.
- Docker: opcional, solo para build local de la imagen.

</details>

Instalación oficial: [Git](https://git-scm.com/downloads), [Node.js](https://nodejs.org/), [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [Docker](https://www.docker.com/products/docker-desktop/).

## 🚀 ¿Cómo quiere probar LISource?

| Modo | Backend | Frontend | Requiere instalación | Ideal para |
|---|---|---|---|---|
| Local | `http://localhost:8080` | `http://localhost:3000` | Sí | desarrollo, depuración y edición |
| Producción | Render | Vercel | No | evaluación rápida y demo |

### Producción

1. Abra primero [Health del backend](https://technical-test-2026-2-v96h.onrender.com/actuator/health).
2. Espere la respuesta `UP`; Render puede tardar un poco en el primer acceso por cold start.
3. Abra opcionalmente [Swagger](https://technical-test-2026-2-v96h.onrender.com/swagger-ui/index.html).
4. Luego abra [Vercel](https://lisource-1021805193.vercel.app).
5. Inicie sesión con una cuenta demo.
6. Pruebe dashboard, filtros y reserva.

## Clonar y ejecutar

### Windows

1. Clone la rama correcta.

```powershell
git clone --branch 1021805193-reto3 --single-branch https://github.com/lisudea/technical-test-2026-2.git lisource-frontend-reto3
cd lisource-frontend-reto3

git switch 1021805193-reto3
cd lisource-frontend
```

2. Descargue `frontend.txt` desde el Carpeta de evaluación en Google Drive y colóquelo exactamente como `lisource-frontend/.env`.
3. Verifique que el backend del Reto 2 ya esté activo y que `VITE_API_URL` apunte a `/api/v1`.
4. Instale dependencias y arranque el frontend.

```powershell
npm ci
npm run dev
```

5. Abra `http://localhost:3000`.

### Linux / macOS

1. Clone la rama correcta.

```bash
git clone --branch 1021805193-reto3 --single-branch https://github.com/lisudea/technical-test-2026-2.git lisource-frontend-reto3
cd lisource-frontend-reto3

git switch 1021805193-reto3
cd lisource-frontend
```

2. Descargue `frontend.txt` desde el Carpeta de evaluación en Google Drive y colóquelo exactamente como `lisource-frontend/.env`.
3. Verifique que el backend del Reto 2 ya esté activo.
4. Instale dependencias y arranque el frontend.

```bash
npm ci
npm run dev
```

5. Abra `http://localhost:3000`.

## Worktree opcional

Si necesita Reto 2 y Reto 3 abiertos al mismo tiempo sin cambiar de rama constantemente, puede usar **dos clones** o **Git Worktree**. Worktree es opcional: el método de clonación normal sigue siendo válido.

```mermaid
flowchart TB
  Repo[Repositorio LISource] --> WT2[Directorio Reto 2 · Backend]
  Repo --> WT3[Directorio Reto 3 · Frontend]
```

### Opción A · Dos clones

```bash
git clone https://github.com/lisudea/technical-test-2026-2.git lisource-reto2
git clone https://github.com/lisudea/technical-test-2026-2.git lisource-reto3

cd lisource-reto2
git switch 1021805193-reto2

cd ../lisource-reto3
git switch 1021805193-reto3
```

### Opción B · Git Worktree

<details>
<summary>🪟 Windows / PowerShell</summary>

```powershell
git clone https://github.com/lisudea/technical-test-2026-2.git lisource-repo
cd lisource-repo
git switch 1021805193-reto2

git worktree add ..\lisource-reto3 1021805193-reto3
git worktree list
```

Para retirarlo después:

```powershell
git worktree remove ..\lisource-reto3
```

</details>

<details>
<summary>🐧 Linux / macOS</summary>

```bash
git clone https://github.com/lisudea/technical-test-2026-2.git lisource-repo
cd lisource-repo
git switch 1021805193-reto2

git worktree add ../lisource-reto3 1021805193-reto3
git worktree list
```

Para retirarlo después:

```bash
git worktree remove ../lisource-reto3
```

</details>

> [!TIP]
> Worktree resulta útil porque Reto 2 y Reto 3 viven en ramas distintas del mismo repositorio. Permite ejecutar ambos simultáneamente sin hacer checkout constante.

## Variables de entorno

[Carpeta de evaluación en Google Drive (`backend.txt` y `frontend.txt`)](https://drive.google.com/drive/folders/1acpvFdobQNkvmGB5Q5b15UoR8ZOfqfgI?usp=sharing)

El frontend carga variables `VITE_*` desde `lisource-frontend/.env`. Para Reto 3, descargue `frontend.txt` y cree **exactamente** `lisource-frontend/.env`.

```text
technical-test-2026-2-reto3/
└── lisource-frontend/
    ├── .env              ← CREAR AQUÍ con el contenido de frontend.txt
    ├── .env.example
    ├── package.json
    └── src/
```

Correspondencia:

- `backend.txt` → `lisource-backend/.env`
- `frontend.txt` → `lisource-frontend/.env`

`lisource-frontend/.env.example` contiene solo la plantilla pública:

```dotenv
VITE_API_URL=http://localhost:8080/api/v1
VITE_DATA_MODE=api
VITE_GOOGLE_CLIENT_ID=
```

> [!WARNING]
> Todo valor `VITE_*` puede terminar en el bundle del navegador. No coloque secretos de infraestructura en variables del frontend.

## Usuarios de evaluación

> [!IMPORTANT]
> Estas credenciales son ficticias y solo sirven para evaluación y QA.

| Perfil | Correo | Contraseña | Uso |
|---|---|---|---|
| Administrador | `admin.demo@udea.edu.co` | `DemoAdmin2026!` | administración y cambio de rol |
| Usuario | `usuario.demo@udea.edu.co` | `DemoUsuario2026!` | catálogo y reserva estándar |
| Reservas | `reservas.demo@udea.edu.co` | `DemoReservas2026!` | historial y cancelación |
| Dual | `dual.demo@udea.edu.co` | `DemoDual2026!` | selección y cambio de rol |

La tabla completa y el escenario `google.demo@udea.edu.co` viven en el README del backend.

## Integración REST

```mermaid
sequenceDiagram
  participant U as Usuario
  participant V as Vista React
  participant Q as TanStack Query
  participant S as Servicio
  participant API as Backend Reto 2
  U->>V: interactúa
  V->>Q: query/mutation
  Q->>S: operación de dominio
  S->>API: REST + Bearer
  API-->>S: JSON o Problem Details
  S-->>Q: estado nuevo
  Q-->>V: render
```

TanStack Query evita duplicar fetch en cada componente. `http-client` normaliza base URL, Bearer y errores; `ApiError` convierte Problem Details en una forma útil para la UI. Cuando el backend cambia un dato, la UI invalida y vuelve a leer el estado autoritativo.

### Mapa Vista → API

| Vista / feature | API principal consumida |
|---|---|
| Dashboard | `/api/v1/dashboard/summary`, `/api/v1/equipment` |
| Equipos | `/api/v1/equipment`, `/api/v1/catalogs/*` |
| Detalle de equipo | `/api/v1/equipment/{id}`, disponibilidad y busy-slots |
| Reservas | `/api/v1/reservations`, `/api/v1/reservations/me`, cancelación |
| Perfil | `/api/v1/profile`, `/api/v1/sessions` |
| Estadísticas | `/api/v1/statistics/top-equipment` |
| Administración de equipos | `/api/v1/equipment/*` con autorización administrativa |

Esta matriz permite seguir de forma directa cómo Reto 3 reutiliza el contrato construido en Reto 2.

## Responsive

La validación visual cubrió 10 rutas reales en 11 anchos: `320`, `360`, `375`, `390`, `414`, `480`, `640`, `768`, `1024`, `1280` y `1440` px. Eso da 110 combinaciones verificadas.

```mermaid
flowchart LR
  Viewport[Ancho disponible] --> Mobile{Pantalla estrecha}
  Mobile -->|Sí| Drawer[Sheet / navegación compacta]
  Mobile -->|Sí| Cards[Inventario en cards]
  Mobile -->|Sí| Dialog[Diálogos limitados al viewport]
  Mobile -->|No| Desktop[Header y navegación amplia]
  Desktop --> Table[Tabla administrativa cuando cabe]
```

La estrategia de diseño prioriza cards en móvil y tablet, tabla cuando hay espacio, formularios con scroll útil y overlays que no rompan el viewport. Las pruebas de accesibilidad se apoyan en labels, foco visible, primitivas Radix y texto alternativo donde aporta valor.

<table>
  <tr>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/mobile-navigation-320.png" alt="Navegación móvil" width="100%"></td>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/language-dropdown-320.png" alt="Selector de idioma móvil" width="100%"></td>
  </tr>
  <tr>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/reservations-375.png" alt="Reservas en móvil" width="100%"></td>
    <td><img src="lisource-frontend/docs/assets/evidence/responsive/admin-equipment-dialog-320.png" alt="Diálogo administrativo" width="100%"></td>
  </tr>
</table>

## Internacionalización

```mermaid
flowchart TD
  Component[Componente o ruta] --> Key[Clave semántica]
  Key --> I18next[i18next]
  I18next --> ES[es.json]
  I18next --> EN[en.json]
  I18next --> FR[fr.json]
  I18next --> PT[pt.json]
  I18next --> DE[de.json]
  I18next --> IT[it.json]
```

El bonus exigía español e inglés; el proyecto amplía el catálogo a francés, portugués, alemán e italiano. La preferencia se persiste y los tests verifican la consistencia de claves entre idiomas.

## Reservas y conflicto 409

```mermaid
sequenceDiagram
  participant U as Usuario
  participant D as Dialog
  participant API as Backend
  U->>D: equipo, inicio, fin y notas
  D->>API: POST /api/v1/reservations
  alt Reserva creada
    API-->>D: 201 Created
    D->>D: cerrar e invalidar queries
  else Solapamiento
    API-->>D: 409 RESERVATION_CONFLICT
    D->>D: conservar contexto y explicar la franja
  end
```

El cliente muestra un mensaje útil cuando el backend devuelve conflicto. La UI no oculta el formulario ni borra los datos ya escritos; así el usuario corrige solo la parte que cambió.

## Testing y calidad

La validación documentada del proyecto reportó **10 archivos de test y 29 pruebas aprobadas**, además de lint y build correctos.

```mermaid
flowchart TB
  V[Vitest] --> E[Error mapping]
  V --> A[Auth]
  V --> I[i18n]
  V --> C[Componentes]
  V --> S[Selectores]
  V --> L[Lint + build]
```

```powershell
npm ci
npm test
npm run lint
npm run build
```

Cobertura funcional:

| Área | Cobertura |
|---|---|
| Error mapping | `src/lib/api-error.test.ts` |
| Auth y sesiones | `src/features/auth/*.test.*` |
| i18n | `src/locales/i18n-keys.test.ts`, `src/i18n/languages.test.ts` |
| UI base | `src/components/common/brand.test.ts` |
| Selectores | `src/components/layout/language-selector.test.tsx` |

## CI/CD

```mermaid
flowchart LR
  P[Push o PR] --> Q[🧪 Quality Gate]
  Q --> C[🔎 CodeQL · JS/TS]
  C --> D[📦 Container · Build & Validate]
  D --> T[🛡️ Trivy · Container Security]
  T -->|push reto3| V[🚀 Vercel · Deploy]
  V --> S[🩺 Production · Smoke Test]
  T --> O[🔐 AWS · OIDC Identity]
```

![Frontend DevSecOps pipeline](lisource-frontend/docs/assets/evidence/frontend/ci-cd/01-frontend-devsecops-pipeline-success.png)

El pipeline valida instalación, tests, lint, build, análisis estático y seguridad del contenedor antes del despliegue. AWS aparece solo como identidad temporal para CI/CD; no aloja la aplicación.

| Job | Propósito | Qué valida | Riesgo que reduce | Si falla |
|---|---|---|---|---|
| 🧪 **Quality Gate** | instalar, probar, lint y build | integridad funcional del frontend | regresiones | el flujo no continúa |
| 🔎 **CodeQL · JS/TS** | análisis estático | patrones inseguros en JS/TS | vulnerabilidades de código | no se supera el gate SAST |
| 📦 **Container · Build & Validate** | construir imagen | reproducibilidad del runtime | diferencias local/CI | no existe artefacto válido |
| 🛡️ **Trivy · Container Security** | escanear imagen | CVE relevantes | dependencias vulnerables | la imagen no supera seguridad |
| 🚀 **Vercel · Deploy** | publicar frontend | entrega de producción | errores de despliegue manual | la versión no se publica |
| 🩺 **Production · Smoke Test** | comprobar rutas públicas y backend | disponibilidad tras deploy | producción rota | el workflow falla post-deploy |
| 🔐 **AWS · OIDC Identity** | obtener identidad temporal | federación GitHub→AWS | access keys permanentes | no se valida la federación |

## Deployment

```mermaid
flowchart LR
  User[Usuario] --> Vercel[Vercel]
  Vercel --> Render[Render API]
  Render --> Supabase[(Supabase)]
  Render --> Google[Google Identity]
  GitHub[GitHub Actions] --> AWSOIDC[AWS OIDC / IAM]
```

Frontend en Vercel, backend en Render y datos en Supabase. AWS se usa únicamente como federación de identidad para GitHub Actions mediante Terraform y OIDC.

![Terraform init validate](lisource-frontend/docs/assets/evidence/shared/cloud/01-aws-terraform-init-validate.png)

![Terraform apply OIDC roles](lisource-frontend/docs/assets/evidence/shared/cloud/02-aws-terraform-apply-oidc-roles.png)

## Seguridad

- Access token solo en memoria.
- Refresh token administrado por cookie HttpOnly del backend.
- Un solo reintento de refresh antes de cerrar sesión.
- Errores normalizados desde Problem Details.
- Google SSO restringido por el backend al dominio institucional.
- `VITE_*` nunca contiene secretos.
- STOMP invalida queries y el cliente vuelve a pedir el estado autoritativo.

## Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| La app no abre en `3000` | puerto ocupado o `npm run dev` falló | revise consola y libere el puerto |
| Error de red/CORS | backend apagado o `VITE_API_URL` incorrecto | confirme Reto 2 activo y URL con `/api/v1` |
| Login vuelve al ingreso | cookie/sesión caducada o variables incorrectas | repita login y revise `.env` |
| Google no inicia | `VITE_GOOGLE_CLIENT_ID` vacío o cuenta no institucional | configure el cliente y use `@udea.edu.co` |
| Catálogo vacío | filtros demasiado restrictivos | limpie filtros o consulte la API |
| Reserva devuelve `409` | el backend detectó solapamiento | cambie franja o equipo |
| `.env` no surte efecto | archivo mal ubicado o con `.env.txt` | ubique `lisource-frontend/.env` |
| Pantalla rota en móvil | caché antigua o CSS no recargado | recargue duro y reinicie Vite |

## Glosario técnico

<details>
<summary>📖 Glosario técnico</summary>

| Término | Definición |
|---|---|
| JWT | token firmado que viaja como Bearer para identificar sesión y rol |
| refresh token | credencial que rota en cookie HttpOnly y renueva el access token |
| OIDC | federación de identidad que permite credenciales temporales para CI/CD |
| STOMP | protocolo que alimenta el canal realtime de la UI |
| Problem Details | formato estandarizado de error usado por la API |
| correlation ID | identificador para unir error visual, request y log |
| cold start | espera inicial cuando Render despierta el backend |
| worktree | directorio adicional del mismo repositorio para trabajar sin checkout constante |
| RLS | control de acceso a nivel de fila en PostgreSQL |

</details>

## Referencias

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [i18next](https://www.i18next.com/)
- [Vercel](https://vercel.com/)
- [GitHub Actions](https://docs.github.com/actions)

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:6BBAB7,50:178A8C,100:0D6D6E" width="100%" alt="LISource Frontend footer" />
</p>
