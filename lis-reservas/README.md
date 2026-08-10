# Sistema de Gestión y Reservas de Equipos del LIS

API REST para gestionar el inventario de equipos de un laboratorio (LIS) y sus reservas, evitando que un mismo equipo se reserve dos veces en el mismo horario.

## Tecnologías utilizadas

- Node.js + Express (servidor y rutas)
- PostgreSQL (base de datos, alojada en [Neon](https://neon.tech))
- Prisma ORM (conexión y consultas a la base de datos)
- dotenv (manejo de variables de entorno)

## Requisitos para ejecutarlo

- Node.js instalado (v18 o superior)
- Una cuenta gratuita en [Neon](https://neon.tech)
- Postman (para probar los endpoints)

## Instalación

1. Clona o descarga este proyecto.
2. Instala las dependencias:
```bash
   npm install
```

## Configuración del `.env`

Este proyecto ya incluye un archivo `prisma.config.ts` que lee automáticamente
la variable `DATABASE_URL` desde tu `.env` (no necesitas tocar ese archivo).

1. Crea una base de datos en [Neon](https://neon.tech) (o usa una existente).
2. Copia la cadena de conexión que te da Neon.
3. Crea un archivo `.env` en la raíz del proyecto con este contenido:
DATABASE_URL="postgresql://usuario:contraseña@host/neondb?sslmode=require"
PORT=3000

## Conectar la base de datos y crear las tablas

Ejecuta:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Esto crea las tablas `Equipo` y `Reserva` en tu base de datos de Neon automáticamente.

## Ejecutar el servidor

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

## Cómo probarlo con Postman

Importa las peticiones manualmente usando los endpoints listados abajo, o crea una colección nueva en Postman con la URL base `http://localhost:3000`.

## Endpoints

### Equipos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/equipos` | Registrar un nuevo equipo |
| GET | `/equipos` | Listar equipos (soporta `?page=&limit=&categoria=&estado=`) |
| GET | `/equipos/:id` | Consultar un equipo específico |
| PUT | `/equipos/:id` | Actualizar un equipo |

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/reservas` | Crear una reserva (valida que no se crucen horarios) |
| GET | `/reservas/equipo/:id` | Listar reservas de un equipo |
| PUT | `/reservas/:id/cancelar` | Cancelar una reserva (no la elimina, cambia su estado) |

### Estadísticas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/reservas/estadisticas/top-equipos` | Top 5 de los equipos con más reservas históricamente |

## Regla de negocio principal

Antes de crear una reserva, el sistema verifica que no exista otra reserva **activa** del mismo equipo que se cruce con el horario solicitado. Si hay cruce, responde `409 Conflict`.