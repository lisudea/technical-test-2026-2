# Evidencias

[Inicio](../../README.md)

## Modelo relacional

![Modelo relacional de las 20 tablas](assets/database/modelo-relacional.png)

La captura muestra los catálogos, usuarios/roles/sesiones, equipos, reservas, configuración y auditoría conectados por claves foráneas. Complementa —no sustituye— los scripts versionados y la explicación en [Base de datos](03-base-de-datos.md).

- **Qué se ve:** 20 tablas, claves y relaciones.
- **Qué demuestra:** el alcance del modelo relacional entregado.
- **Requisito relacionado:** gestión de equipos, usuarios y reservas.

## CI backend

![Pipeline DevSecOps backend exitoso](assets/evidence/backend/ci-cd/01-backend-devsecops-pipeline-success.png)

- **Qué se ve:** ocho jobs en verde para la rama Reto 2.
- **Qué demuestra:** quality, CodeQL, contenedor, Trivy, Terraform, Render, OIDC y smoke finalizaron en ese run.
- **Requisito relacionado:** testing, DevSecOps y deployment.
- **Límite:** es una evidencia histórica; el estado actual se consulta en Actions.

![Artefactos del pipeline backend](assets/evidence/backend/ci-cd/02-backend-artifacts.png)

- **Qué se ve:** `lisource-backend-image` y `lisource-backend-test-reports`.
- **Qué demuestra:** el pipeline conservó la imagen construida y los reportes de prueba del run.
- **Requisito relacionado:** reproducibilidad y verificación.

## AWS OIDC/Terraform

![Terraform init y validate](assets/evidence/shared/cloud/01-aws-terraform-init-validate.png)

- **Qué se ve:** Terraform 1.15.8, provider AWS 6.51.0, `init` y `validate` exitosos.
- **Qué demuestra:** configuración declarativa válida antes de plan/apply.
- **Requisito relacionado:** infraestructura como código.

![Apply controlado y roles OIDC](assets/evidence/shared/cloud/02-aws-terraform-apply-oidc-roles.png)

- **Qué se ve:** un provider OIDC y dos roles creados mediante `terraform apply` manual.
- **Qué demuestra:** el provisionamiento controlado de identidad para Reto 2 y Reto 3.
- **Requisito relacionado:** AWS OIDC.
- **Límite:** no demuestra hosting en AWS ni implica access keys estáticas.
