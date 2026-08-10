# Alcance de la evidencia disponible

[Inicio](../../README.md) · [Evidencias reales](14-evidencias.md)

El repositorio conserva únicamente las evidencias reales disponibles: modelo relacional, pipeline backend, artefactos del workflow y ejecución Terraform/OIDC. No se solicitan ni se prometen imágenes adicionales.

| Evidencia existente | Qué permite comprobar | Qué no sustituye |
|---|---|---|
| Modelo relacional | estructura y relaciones de 20 tablas | SQL ejecutable y constraints |
| Pipeline DevSecOps | jobs verdes para el commit capturado | estado de otra ejecución |
| Artefactos | nombres de imagen/reportes publicados | inspección de su contenido |
| Terraform | validación y creación controlada de provider/roles | hosting AWS inexistente |

Las pruebas automatizadas y los pasos reproducibles de Swagger/Postman demuestran concurrencia, `201/409`, seguridad y contratos. Todo registro compartido debe omitir correos privados, tokens, cookies, connection strings y secretos.
