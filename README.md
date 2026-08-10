# Frontend - Gestión de Reservas de Equipos LIS

Este proyecto corresponde al frontend de la aplicación de gestión de reservas del laboratorio LIS. Está desarrollado con React + Vite y se conecta con la API del backend para administrar equipos y reservas.

## Funcionalidades implementadas

- Dashboard principal con indicadores de estado:
  - equipos disponibles
  - equipos reservados
  - equipos en mantenimiento
- Lista de equipos con búsqueda y filtros por categoría
- Gestión de equipos:
  - creación
  - edición
  - cambio de estado
- Gestión de reservas:
  - creación de reserva
  - visualización del historial de reservas por equipo
  - filtro por rango de fechas
  - cancelación de reservas
- Manejo de errores y mensajes de feedback al usuario
- Navegación principal con menú de inicio, equipos y reservas

## Estructura principal

- src/pages/Home.jsx: dashboard principal
- src/pages/Equipos.jsx: gestión de equipos
- src/pages/Reservas.jsx: gestión de reservas
- src/services/equipoService.js: servicios para equipos
- src/services/reservaService.js: servicios para reservas
- src/components/Navbar.jsx: navegación de la aplicación

## Comandos

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

Esto levantará el frontend localmente con Vite.

## Requisitos

- Node.js instalado
- Dependencias del proyecto instaladas con:

```bash
npm install
```

