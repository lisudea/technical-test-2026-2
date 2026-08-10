# Troubleshooting backend

[Inicio](../../README.md) · [Windows](07-instalacion-windows.md) · [Linux](08-instalacion-linux.md)

| Síntoma | Comprobación | Acción |
|---|---|---|
| Java incompatible | `java --version` | seleccione JDK 21 y revise `JAVA_HOME` |
| No conecta a DB | host/puerto/usuario/SSL sin imprimir password | use credenciales pooler y `DB_SSLMODE=require` |
| Testcontainers falla | `docker info` | inicie Docker y habilite acceso al daemon |
| `401` continuo | reloj, issuer, secret, tokenUse | renueve sesión; no reutilice token de selección como access |
| Cookie no llega | HTTPS, Secure, SameSite, Path | local usa `COOKIE_SECURE=false`; producción HTTPS/true |
| CORS | Origin exacto | añádalo a `CORS_ALLOWED_ORIGINS`, sin comodines con credenciales |
| `409` reserva | intervalos ocupados | consulte busy-slots; `409` es esperado |
| SQL falla/borra | script y ambiente | restaure backup; `01-estructura.sql` solo en base descartable/nueva |
| Render tarda | health | espere cold start y repita con timeout razonable |
| Imagen falla | tipo/tamaño/Storage | revise bucket y service key solo en servidor |

Use el correlation ID de Problem Details para cruzar petición y logs, y nunca adjunte `.env`, cookies ni tokens a un issue.

