# Frontend de gestión y reservas — Laboratorio Integrado de Sistemas

Aplicación web para el Laboratorio Integrado de Sistemas (LIS). Permite consultar equipos, administrar su información, consultar y crear reservas, verificar disponibilidad y revisar estadísticas de uso.

## Tecnologías

- Next.js 16 con App Router
- React 19 y TypeScript
- Tailwind CSS 4
- Base UI y componentes reutilizables de la carpeta `components/ui`
- SWR para consulta, caché y revalidación de datos remotos
- Sonner para notificaciones
- date-fns para formatos de fecha

## Requisitos

- Node.js 20 o superior recomendado.
- npm o pnpm.
- La API Spring Boot ejecutándose, normalmente en `http://localhost:8080`.

## Configuración

Crear o ajustar el archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

`NEXT_PUBLIC_API_URL` es la URL base de la API. Todos los errores HTTP se normalizan en `ApiError`, por lo que la interfaz puede mostrar el mensaje devuelto por el backend.

## Instalación y ejecución

Desde esta carpeta:

```bash
npm install
npm run dev
```

O con pnpm:

```bash
pnpm install
pnpm dev
```

La aplicación se abre en `http://localhost:3000`.

Otros comandos:

```bash
npm run build  # compilación de producción
npm run start  # ejecuta la compilación de producción
npm run lint   # ejecuta ESLint
```

## Rutas y funcionalidades

| Ruta | Funcionalidad |
| --- | --- |
| `/` | Lista de equipos con búsqueda, filtros de categoría y estado operacional, y paginación. Los catálogos se cargan desde la API, por lo que muestran opciones aun sin equipos asociados. |
| `/reservations` | Lista de reservas, filtro por estado, paginación y cancelación de reservas activas. Cuando no hay datos, muestra el estado vacío. |
| `/statistics` | Visualiza el top de equipos más reservados. |
| `/management` | Crea y actualiza equipos, crea reservas y consulta el historial de reservas por equipo. |

La aplicación no tiene una página de detalle de equipo; las acciones operativas se concentran en **Administración**.

## Flujo de una reserva

1. En `/management`, seleccionar **Nueva reserva**.
2. Elegir el equipo, solicitante, correo y rango de fecha/hora.
3. Pulsar **Consultar disponibilidad**. La UI consume `GET /api/equipment/{id}/availability` y muestra si el equipo está disponible, reservado o en mantenimiento, junto con el siguiente horario disponible cuando la API lo informa.
4. El botón de crear reserva solo se habilita si la respuesta es `AVAILABLE`.
5. Al confirmar, se consume `POST /api/reservations`.

La validación final siempre permanece en el backend, con el fin de proteger contra conflictos creados por solicitudes concurrentes.

## Integración con la API

Las llamadas HTTP están centralizadas en `lib/api`:

- `equipment.ts`: listado, creación, actualización y disponibilidad.
- `reservations.ts`: listado global, creación, cancelación e historial por equipo.
- `catalogs.ts`: categorías y estados operacionales.
- `statistics.ts`: equipos más reservados.
- `client.ts`: URL base, serialización JSON y manejo uniforme de errores.

Las respuestas del backend se adaptan en esta capa antes de usarlas en los componentes. Por ejemplo, los IDs numéricos se convierten a texto para los selectores y las reservas anidadas se convierten al modelo usado por las tablas.

## Estructura del proyecto

```text
app/                 Rutas y layouts de Next.js
components/          Componentes de dominio, diseño y UI reutilizable
hooks/               Hooks de SWR y operaciones de la interfaz
lib/api/             Cliente HTTP y adaptadores de contratos
locales/             Diccionarios de interfaz
types/               Tipos TypeScript compartidos
public/              Recursos estáticos
```

## Consideraciones de desarrollo

- El backend debe permitir CORS para `http://localhost:3000`.
- Las fechas se envían como ISO 8601; el backend evalúa el horario de atención en `America/Bogota`.
- Las reservas del historial por equipo usan paginación y admiten cancelación si su estado es activo.
- Si se modifican rutas del App Router con el servidor de desarrollo activo y no se reflejan, detenerlo y volver a ejecutar `npm run dev` desde esta carpeta.

## Mejoras adicionales al alcance base

La interfaz también incorpora capacidades no requeridas expresamente en el enunciado:

- Administración centralizada para crear y actualizar equipos, crear reservas y consultar el historial paginado de cada equipo.
- Consulta explícita de disponibilidad antes de confirmar una reserva, con bloqueo de la acción hasta obtener una respuesta `AVAILABLE`.
- Paginación de equipos, reservas e historial por equipo; estados vacíos y alertas amigables para errores de la API.
- Estadísticas visuales de los equipos más solicitados.
- Internacionalización ES/EN: los diccionarios viven en `locales/`, la preferencia se conserva en `localStorage` y el botón de idioma del menú lateral permite alternar el idioma sin recargar la página. La estructura está preparada para añadir más locales.
