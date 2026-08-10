# Problema, alcance y requisitos

[← Volver al README](../../README.md)

## Problema

El LIS necesita inventario consultable y reservas sin doble asignación. La dificultad central no es el CRUD: es mantener integridad cuando dos solicitudes compiten por el mismo equipo, sin perder trazabilidad ni exponer datos administrativos.

## Interpretación del Reto 2

| Pedido original | Interpretación verificable | Extensión implementada |
|---|---|---|
| Registrar, actualizar y visualizar equipos | REST validado, identificador único, serial o MAC, categoría y estado | imagen en Supabase Storage, ubicación, estados operativos y auditoría |
| Listado paginado con categoría/estado | paginación 1-based, filtros SQL y estado visual derivado | búsqueda, ubicación, estado operativo y sort permitido |
| Crear, cancelar y listar reservas | propietario autenticado, fechas UTC y cancelación histórica | varios equipos por reserva |
| Rechazar solapamiento | transacción serializada por locks de equipo y `409 Conflict` | rollback atómico y prueba concurrente |
| Bonus Top 5 | ranking histórico de confirmadas | límite parametrizable |
| Bonus autenticación | Google + dominio institucional + JWT + endpoints protegidos | login local, roles activos, refresh rotatorio y sesiones revocables |

## Fuera de alcance demostrado

No hay pagos, aprobación académica, inventario de consumibles ni notificaciones push. El notifier de recuperación tiene implementación local/SMTP configurable; no se afirma entrega de correo si SMTP no está configurado. El frontend y backend se despliegan independientemente.

## Criterio de evidencia

Una fila se considera comprobada solo cuando existe código y contrato, o prueba automática. Las capturas de CI complementan, no sustituyen, las pruebas. El login Google interactivo requiere una cuenta institucional real; la validación automatizada cubre dominio, audiencia y rechazo de identidades no permitidas.
