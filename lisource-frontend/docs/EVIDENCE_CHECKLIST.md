# Checklist de evidencia pendiente

| Captura/prueba | Debe mostrar | Insertar en | Nombre recomendado |
|---|---|---|---|
| Login Google | flujo real con correo/IDs ocultos | `05-autenticacion.md` | `google-login-redacted.png` |
| Conflicto de reserva | diálogo conservado con mensaje 409 | `06-reservas.md` | `reservation-conflict-409.png` |
| Teclado | foco visible y orden en login/dialog/drawer | `03-responsive-y-accesibilidad.md` | `keyboard-focus.png` |
| Lector de pantalla | resultado resumido NVDA/VoiceOver | `03-responsive-y-accesibilidad.md` | `screen-reader-audit.md` |
| Zoom 200/400 % | reflow sin pérdida de acciones | `03-responsive-y-accesibilidad.md` | `zoom-reflow.png` |
| Production smoke | Vercel + health/OpenAPI del mismo run | `12-deployment.md` | `production-smoke.png` |

Las capturas existentes ya cubren 320–1440 y CI. Antes de aportar otras, oculte email, tokens, cookies, IDs sensibles y variables.
