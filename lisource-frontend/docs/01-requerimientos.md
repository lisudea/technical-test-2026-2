# Problema y requerimientos frontend

[Inicio](../../README.md) · [Arquitectura](02-arquitectura-frontend.md) · [Evidencias](14-evidencias.md)

LIS necesita una interfaz institucional para descubrir equipos, entender disponibilidad y reservarlos sin que la complejidad transaccional se filtre al usuario. La UI traduce la API de Reto 2 a flujos accesibles y responsive, manteniendo seguridad y estado remoto coherente.

| Pedido | Interpretación/diseño | Dónde | Cómo se demuestra |
|---|---|---|---|
| Login institucional | local + Google, recuperación y rol activo | `routes/ingreso`, `features/auth`, `services/auth.service` | tests de seguridad y flujo real |
| Lista paginada y filtros | URL/estado de filtros, loading/empty/error y cards/tabla | `features/equipment` | 11 anchos y query hooks |
| Detalle | ruta parametrizada, status/metadata/reserva | `routes/equipos.$equipmentId` | barrido visual de la ruta |
| Reservar y cancelar | formulario, fecha válida, equipos, feedback | `features/reservations`, `routes/reservas` | test API error + diálogo visual |
| Conflicto `409` | feedback accionable sin borrar selección | `lib/api-error`, diálogo | Problem Details + flujo documentado |
| Admin | proteger por rol y gestionar equipos | `routes/administracion.equipos` | tabla desktop/cards móvil; CRUD/imagen |
| Responsive | 320–1440 sin overflow/acciones cortadas | layout/UI/features/routes | [evidencia](03-responsive-y-accesibilidad.md) |
| Bonus | seis idiomas, estadísticas, invalidación STOMP | `i18n`, `estadisticas`, `realtime.service` | tests de claves + código real |

Alcance honesto: esta rama implementa administración de equipos, no pantallas Admin de usuarios, roles, categorías, ubicaciones, configuración o auditoría. El backend sí expone esas APIs. La página Top 5 activa usa barras CSS; Recharts está instalado y hay componente base, pero no se afirma que esa vista lo use.
