# Panel de Monitoreo de Recursos — LIS

Dashboard en React + Tailwind que consume la API REST del Reto 2 (gestión y reservas de equipos del LIS).

## Cómo correrlo

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Por defecto apunta al backend en `http://localhost:8000` — si tu backend corre en otra URL, copia `.env.example` como `.env` y ajusta `VITE_API_URL`.

**Importante:** el backend (Reto 2) debe estar corriendo antes de abrir el dashboard.

## Funcionalidades

- Listado de equipos consumiendo `GET /equipos`, con diseño responsivo (móvil y escritorio)
- Indicadores de estado por color/LED: verde (disponible), rojo (reservado), gris (mantenimiento)
- Filtros dinámicos por categoría y estado, sin recargar la página
- Modal de reserva que consume `POST /reservas` — si el backend responde `409` (conflicto de horario), se muestra un mensaje de error amigable dentro del mismo modal
- Manejo de errores de conexión: si el backend no responde, se muestra una pantalla de error con botón de reintentar
- **Bonus i18n:** selector de idioma español/inglés, cambia el texto de toda la interfaz sin recargar. Las traducciones están centralizadas en `src/i18n/translations.js`, no quemadas en los componentes

## Estructura

```
src/
  api.js                    cliente HTTP hacia el backend
  App.jsx                   dashboard principal
  i18n/
    translations.js         diccionarios es/en
    I18nContext.jsx         contexto + hook useI18n()
  components/
    EquipmentCard.jsx        tarjeta de equipo
    StatusLed.jsx            indicador de estado
    Filters.jsx               filtros + selector de idioma
    ReservationModal.jsx      formulario de reserva
    Toast.jsx                notificaciones
```

## Build de producción

```bash
npm run build
```
