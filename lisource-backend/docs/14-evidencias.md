# Evidencias

[Inicio](../../README.md) · [Checklist faltante](EVIDENCE_CHECKLIST.md)

## Modelo relacional

![Modelo relacional de las 20 tablas](assets/database/modelo-relacional.png)

La captura muestra los catálogos, usuarios/roles/sesiones, equipos, reservas, configuración y auditoría conectados por claves foráneas. Complementa —no sustituye— los scripts versionados y la explicación en [Base de datos](03-base-de-datos.md).

## CI backend

![Pipeline DevSecOps backend exitoso](assets/evidence/backend/ci-cd/01-backend-devsecops-pipeline-success.png)

Evidencia que los jobs independientes finalizaron en el run capturado; el estado actual siempre debe confirmarse en GitHub Actions.

![Artefactos del pipeline backend](assets/evidence/backend/ci-cd/02-backend-artifacts.png)

Muestra `lisource-backend-image` y `lisource-backend-test-reports`, útiles para inspeccionar la salida exacta de ese run.

## AWS OIDC/Terraform

![Terraform init y validate](assets/evidence/shared/cloud/01-aws-terraform-init-validate.png)

Confirma inicialización/validación del código declarativo sin aplicar automáticamente.

![Apply controlado y roles OIDC](assets/evidence/shared/cloud/02-aws-terraform-apply-oidc-roles.png)

Confirma el provisionamiento controlado del provider/roles; no contiene ni implica access keys estáticas.

