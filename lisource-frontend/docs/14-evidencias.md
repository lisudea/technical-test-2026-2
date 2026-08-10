# Evidencias frontend

[Inicio](../../README.md) · [Responsive](03-responsive-y-accesibilidad.md)

## Responsive real

| Evidencia | Qué demuestra |
|---|---|
| ![Login a 320](assets/evidence/responsive/login-320.png) | formulario y Google ajustados al ancho mínimo |
| ![Dashboard a 320](assets/evidence/responsive/dashboard-320.png) | header, cards y navegación móvil sin clipping |
| ![Dashboard a 1024](assets/evidence/responsive/dashboard-1024.png) | estrategia tablet con cards completas |
| ![Dashboard a 1440](assets/evidence/responsive/dashboard-1440.png) | tabla/espaciado desktop |
| ![Reservas a 375](assets/evidence/responsive/reservations-375.png) | estado de carga y tabs sin clipping; **no demuestra datos ni cancelación** |
| ![Admin equipos a 320](assets/evidence/responsive/admin-equipment-320.png) | administración convertida en cards móviles |
| ![Diálogo admin a 320](assets/evidence/responsive/admin-equipment-dialog-320.png) | formulario largo con viewport/scroll seguro |
| ![Menú móvil a 320](assets/evidence/responsive/mobile-navigation-320.png) | sheet y navegación accesibles |
| ![Selector de idioma a 320](assets/evidence/responsive/language-dropdown-320.png) | opciones ES, EN, FR, PT, DE e IT visibles sin recorte |

También se conservan `dashboard-390/768/1280`, `reservation-dialog-320`, `language-dropdown-320` y `user-dropdown-320`. Son salidas de la auditoría actual, no mockups decorativos.

## CI/CD

![Pipeline frontend exitoso](assets/evidence/frontend/ci-cd/01-frontend-devsecops-pipeline-success.png)

- **Qué se ve:** quality, CodeQL, contenedor, Trivy, deploy, smoke y AWS OIDC en verde.
- **Qué demuestra:** esos jobs finalizaron en el run capturado.
- **Requisito relacionado:** testing, DevSecOps y deployment.
- **Límite:** es evidencia histórica; el commit actual se confirma en Actions.

## Cloud compartido

![Terraform validate](assets/evidence/shared/cloud/01-aws-terraform-init-validate.png)

![Roles AWS OIDC aplicados](assets/evidence/shared/cloud/02-aws-terraform-apply-oidc-roles.png)

Terraform vive en Reto 2 y gestiona identidad de ambos pipelines. Estas capturas demuestran validación/provisionamiento controlado, no hosting del frontend en AWS ni uso de keys permanentes.
