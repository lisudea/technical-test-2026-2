# Checklist de evidencia pendiente

Las capturas existentes están catalogadas en [14-evidencias.md](14-evidencias.md). Para una entrega aún más fuerte, el evaluador puede aportar sin secretos:

| Captura | Debe mostrar | Insertar en | Nombre recomendado |
|---|---|---|---|
| Reserva concurrente | dos requests simultáneos, un `201` y un `409` | `06-reservas-y-concurrencia.md` | `reservation-concurrency-201-409.png` |
| Suite local | resumen final de `clean verify` | `10-testing.md` | `backend-clean-verify.png` |
| Swagger | grupos/endpoints del deployment | `04-api-rest.md` | `swagger-production.png` |
| Health | URL y estado UP, sin headers sensibles | `12-cloud-y-deployment.md` | `render-health.png` |
| Google institucional | login exitoso con correo oculto | `05-autenticacion-y-seguridad.md` | `google-login-redacted.png` |

Antes de capturar, oculte email, tokens, cookies, IDs sensibles, connection strings y secretos.
