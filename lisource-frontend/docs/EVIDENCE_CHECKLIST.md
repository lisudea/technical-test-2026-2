# Alcance de la evidencia disponible

[Inicio](../../README.md) · [Evidencias](14-evidencias.md) · [Testing](10-testing.md)

La documentación conserva solamente imágenes reales ya existentes. No se requieren nuevas capturas para seguir la guía: los flujos se pueden reproducir con los comandos, tests, Swagger y Postman documentados.

| Evidencia existente | Qué permite comprobar | Límite |
|---|---|---|
| Dashboard entre 320 y 1440 px | reflow y composición responsive en los anchos capturados | no reemplaza probar cada navegador/dispositivo |
| Login, navegación, reservas, menús y diálogos móviles | comportamiento visual de las interacciones capturadas | no demuestra por sí sola teclado o lector de pantalla |
| Administración de equipos y diálogo en 320 px | acciones administrativas disponibles en móvil | no representa otros dominios admin, que no tienen UI |
| Pipeline frontend exitoso | jobs y resultado de esa ejecución | no garantiza runs futuros ni cobertura funcional total |
| Terraform init/validate y roles OIDC aplicados | infraestructura de identidad en el momento capturado | AWS no aloja la aplicación |

Las pruebas automatizadas, el contrato API y los pasos reproducibles complementan las imágenes para demostrar auth, `201/409`, estados, i18n y calidad. Cualquier evidencia que se comparta fuera del entorno debe omitir correos privados, tokens, cookies, IDs sensibles, variables y secretos.
