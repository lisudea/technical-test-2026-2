# Postman · 59 solicitudes

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

La colección canónica contiene **59 solicitudes** organizadas en Health/OpenAPI, Authentication, Profile, Sessions, Equipment, Images, Reservations, Dashboard/Statistics, Catalogs, seis grupos Admin y casos negativos de seguridad. Cubre todas las operaciones publicadas por los controladores y agrega una segunda creación deliberada para reproducir `409`. Las pruebas dependen del estado de la base; Postman no reemplaza `mvnw clean verify`.

## Reproducir el `409 Conflict`

1. Seleccione el entorno Local o Production.
2. Ejecute `01 Authentication / Login user` y confirme que `accessToken` quedó definido.
3. Configure `equipmentId` con un equipo operativo y `conflictStart`/`conflictEnd` con una franja futura.
4. Ejecute `05 Reservations / Create reservation`; debe responder `201 Created`.
5. Sin cambiar equipo ni franja, ejecute `05 Reservations / Conflict 409 — same interval`.
6. Compruebe `409 Conflict`, `Content-Type: application/problem+json` y `code: RESERVATION_CONFLICT`.

La primera solicitud crea el dato necesario; la segunda demuestra la regla. Si el primer request ya devuelve `409`, cambie a una franja futura libre y repita.

## Variables y seguridad

`baseUrl`, `accessToken`, `roleSelectionToken`, IDs, credenciales de prueba y rangos de reserva son variables, no literales repetidos. El refresh viaja en la cookie HttpOnly administrada por el cookie jar. Limpie el entorno y cookie jar después de una evaluación compartida. Nunca exporte valores reales para versionarlos.

## Diagnóstico

- `401`: vuelva a Login/Refresh; compruebe issuer/secret y expiración.
- `403`: seleccione `ADMINISTRADOR` para Admin o confirme ownership.
- `409` de reserva: cambie el intervalo/equipo; es una regla esperada.
- Production puede tardar en responder tras inactividad de Render; repita health antes de concluir fallo.
