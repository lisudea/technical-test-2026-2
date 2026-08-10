# API REST

[Inicio](../../README.md) · [Seguridad](05-autenticacion-y-seguridad.md) · [Postman](09-postman.md)

## Convenciones

- Base local: `http://localhost:8080`; producción: `https://technical-test-2026-2-v96h.onrender.com`.
- Prefijo funcional: `/api/v1`. Autenticación: `Authorization: Bearer {{accessToken}}` salvo los endpoints públicos.
- Fechas: ISO 8601. Errores: `application/problem+json` con `status`, `title`, `detail`, `instance` y correlación.
- `401`: sin autenticación válida; `403`: rol insuficiente; `404`: recurso ausente; `409`: conflicto de dominio; `422/400`: entrada inválida.
- La respuesta exacta y los schemas vigentes son la fuente ejecutable en [OpenAPI](https://technical-test-2026-2-v96h.onrender.com/v3/api-docs).

## Catálogo verificado

`Público` significa que no requiere access token. `Usuario` acepta cualquier sesión autenticada. `Admin` exige `ADMINISTRADOR`.

| Grupo | Método y ruta | Acceso | Entrada principal | Resultado / códigos relevantes |
|---|---|---|---|---|
| Auth | `POST /api/v1/auth/login` | Público | email, password | tokens/selección de rol; `200`, `401` |
| Auth | `POST /api/v1/auth/google` | Público | Google ID token | login institucional; `200`, `401/403` |
| Auth | `POST /api/v1/auth/refresh` | Cookie refresh | cookie HttpOnly | rota refresh y entrega access; `200`, `401` |
| Auth | `POST /api/v1/auth/select-role` | token de selección | role | sesión para el rol; `200`, `401/403` |
| Auth | `POST /api/v1/auth/switch-role` | Usuario | role | nuevo access token; `200`, `403` |
| Auth | `POST /api/v1/auth/logout` | Usuario | — | revoca sesión actual; `204` |
| Auth | `POST /api/v1/auth/logout-all` | Usuario | — | revoca todas las sesiones y retorna el total; `200` |
| Auth | `POST /api/v1/auth/forgot-password` | Público | email | respuesta no enumerativa; `200` |
| Auth | `POST /api/v1/auth/reset-password` | Público | token, password | cambia contraseña; `204`, `400` |
| Auth | `POST /api/v1/auth/set-password` | Usuario | password | establece credencial local; `204` |
| Auth | `POST /api/v1/auth/change-password` | Usuario | currentPassword, newPassword | cambia credencial; `204`, `401` |
| Profile | `GET /api/v1/profile` | Usuario | — | perfil; `200` |
| Profile | `PATCH /api/v1/profile` | Usuario | campos editables | perfil actualizado; `200`, `400` |
| Sessions | `GET /api/v1/sessions` | Usuario | — | sesiones activas; `200` |
| Sessions | `DELETE /api/v1/sessions/{sessionId}` | Usuario | path UUID | revoca sesión propia; `204`, `404` |
| Sessions | `POST /api/v1/sessions/logout-others` | Usuario | — | conserva la actual y retorna el total revocado; `200` |
| Equipment | `GET /api/v1/equipment` | Usuario | `page`, `pageSize`, `search`, `category`, `status`, `sort` | página filtrada; `200` |
| Equipment | `GET /api/v1/equipment/{id}` | Usuario | path id | detalle; `200`, `404` |
| Equipment | `POST /api/v1/equipment` | Admin | equipo | crea; `201`, `400/409` |
| Equipment | `PUT /api/v1/equipment/{id}` | Admin | equipo completo | actualiza; `200`, `404/409` |
| Equipment | `PATCH /api/v1/equipment/{id}/status` | Admin | status | cambia estado; `200`, `404` |
| Equipment | `POST /api/v1/equipment/{id}/image` | Admin | multipart image | almacena imagen; `200`, `400/404` |
| Equipment | `DELETE /api/v1/equipment/{id}/image` | Admin | — | elimina referencia/objeto; `204`, `404` |
| Reservations | `POST /api/v1/reservations` | Usuario | equipmentIds, start, end | reserva atómica; `201`, `409` |
| Reservations | `GET /api/v1/reservations/me` | Usuario | — | lista simple de reservas propias; `200` |
| Reservations | `GET /api/v1/reservations/{id}` | Usuario | path UUID | detalle autorizado; `200`, `403/404` |
| Reservations | `POST /api/v1/reservations/{id}/cancel` | Usuario | — | cancela sin borrar historia; `200`, `403/409` |
| Reservations | `GET /api/v1/equipment/{id}/busy-slots` | Usuario | rango | intervalos ocupados; `200` |
| Reservations | `GET /api/v1/equipment/{id}/availability` | Usuario | start, end | disponibilidad; `200` |
| Dashboard | `GET /api/v1/dashboard/summary` | Usuario | — | resumen personal/global según rol; `200` |
| Statistics | `GET /api/v1/statistics/top-equipment` | Usuario | `limit` (5 por defecto) | ranking histórico confirmado; `200` |
| Catalogs | `GET /api/v1/catalogs/categories` | Usuario | — | categorías activas; `200` |
| Catalogs | `GET /api/v1/catalogs/locations` | Usuario | — | ubicaciones activas; `200` |
| Catalogs | `GET /api/v1/catalogs/equipment-statuses` | Usuario | — | estados; `200` |
| Catalogs | `GET /api/v1/catalogs/languages` | Usuario | — | idiomas; `200` |
| Admin users | `GET /api/v1/admin/users` | Admin | paginación/filtros | usuarios; `200` |
| Admin users | `GET /api/v1/admin/users/{id}` | Admin | path id | detalle; `200`, `404` |
| Admin users | `PATCH /api/v1/admin/users/{id}/status` | Admin | status | estado; `200`, `404` |
| Admin users | `PUT /api/v1/admin/users/{id}/roles/{role}` | Admin | path | asigna rol; `200`, `404/409` |
| Admin roles | `GET /api/v1/admin/roles` | Admin | — | roles; `200` |
| Admin roles | `PATCH /api/v1/admin/roles/{role}/status` | Admin | status | estado del rol; `200` |
| Admin categories | `GET/POST /api/v1/admin/categories` | Admin | catálogo | lista/crea; `200/201` |
| Admin categories | `PUT /api/v1/admin/categories/{id}` | Admin | catálogo | actualiza; `200`, `404/409` |
| Admin categories | `PATCH /api/v1/admin/categories/{id}/status` | Admin | status | activa/inactiva; `200` |
| Admin locations | `GET/POST /api/v1/admin/locations` | Admin | catálogo | lista/crea; `200/201` |
| Admin locations | `PUT /api/v1/admin/locations/{id}` | Admin | catálogo | actualiza; `200`, `404/409` |
| Admin locations | `PATCH /api/v1/admin/locations/{id}/status` | Admin | status | activa/inactiva; `200` |
| Configuration | `GET /api/v1/admin/configuration` | Admin | — | configuración; `200` |
| Configuration | `PATCH /api/v1/admin/configuration/{key}` | Admin | value | actualiza; `200`, `404/400` |
| Audit | `GET /api/v1/admin/audit` | Admin | paginación/filtros | eventos auditables; `200` |

Fuera de `/api/v1`, `GET /actuator/health`, `GET /v3/api-docs` y Swagger UI permiten operación/descubrimiento según la política de seguridad desplegada.

## Ejemplos críticos

```json
POST /api/v1/reservations
{
  "equipmentIds": [1, 2],
  "startsAt": "2026-08-20T10:00:00-05:00",
  "endsAt": "2026-08-20T11:00:00-05:00",
  "notes": "Prueba de reserva"
}
```

Si cualquiera de los equipos se solapa, la operación completa termina en `409 Conflict`; ninguno queda reservado. Para explorar respuestas y encadenar tokens, use la [colección Postman](09-postman.md).
