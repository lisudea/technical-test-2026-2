# Postman

[Inicio](../../README.md) · [API](04-api-rest.md)

## Archivos importables

- `postman/LISource-Reto2.postman_collection.json`: colección canónica.
- `postman/LISource-Local.postman_environment.json`: `http://localhost:8080`.
- `postman/LISource-Production.postman_environment.json`: Render.

No contienen contraseñas, cookies ni tokens permanentes. Importe primero la colección y luego el entorno; complete `userEmail`/`userPassword` solo en su sesión local de Postman.

## Uso recomendado

1. Inicie backend o seleccione Production.
2. Ejecute `Authentication / Login`. El script guarda `accessToken` y, cuando aplica, `roleSelectionToken`.
3. Use `Select role` si la cuenta tiene más de un rol; las demás carpetas heredan Bearer `{{accessToken}}`.
4. Defina IDs (`equipmentId`, `reservationId`, `sessionId`, etc.) con datos reales.
5. Ejecute carpetas de lectura antes de las mutaciones Admin.

La colección está organizada en Authentication, Profile, Sessions, Equipment, Reservations, Dashboard, Statistics, Catalogs y seis grupos Admin. Incluye health/OpenAPI, caso de `409`, pruebas comunes de ausencia de `5xx` inesperado y `Content-Type` JSON cuando existe body. Las pruebas dependen del estado de la base; Postman no reemplaza `mvnw clean verify`.

## Variables y seguridad

`baseUrl`, `accessToken`, `roleSelectionToken`, IDs, credenciales de prueba y rangos de reserva son variables, no literales repetidos. El refresh viaja en la cookie HttpOnly administrada por el cookie jar. Limpie el entorno y cookie jar después de una evaluación compartida. Nunca exporte valores reales para versionarlos.

## Diagnóstico

- `401`: vuelva a Login/Refresh; compruebe issuer/secret y expiración.
- `403`: seleccione `ADMINISTRADOR` para Admin o confirme ownership.
- `409` de reserva: cambie el intervalo/equipo; es una regla esperada.
- Production puede tardar en responder tras inactividad de Render; repita health antes de concluir fallo.

