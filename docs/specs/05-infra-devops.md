# Spec 05 — Infraestructura y DevOps

## Desarrollo local: Podman
Fedora 44 trae Podman como motor de contenedores por defecto (sin daemon,
rootless). Las imágenes que produce son estándar **OCI**, 100% compatibles con lo
que luego consume Amazon ECR/ECS — no hay conflicto entre "desarrollar con
Podman" y "desplegar en AWS", que internamente también corre OCI.

```
infra/
├── containers/
│   ├── backend.containerfile
│   └── frontend.containerfile     # solo para desarrollo local (Vite dev server)
├── compose.yaml                    # podman-compose: backend + mysql + frontend
└── terraform/
    ├── modules/
    │   ├── network/                # VPC, subredes, security groups
    │   ├── ecs/                    # cluster, servicio, tarea, ALB
    │   ├── rds/
    │   ├── frontend/               # S3 + CloudFront
    │   └── ecr/
    ├── main.tf
    ├── variables.tf
    └── terraform.tfvars.example    # nunca el .tfvars real con valores reales
```

Levantar el entorno local: `podman-compose -f infra/compose.yaml up`. Servicios:
backend (Spring Boot, puerto 8080), mysql (con las migraciones de Flyway
aplicándose al arrancar), y opcionalmente el frontend en modo dev (`vite dev`,
fuera de contenedor suele ser más rápido para iterar, pero el `containerfile`
existe para paridad si se necesita).

## Infraestructura como código: Terraform
Todo recurso de AWS descrito en [01-arquitectura-aws.md](./01-arquitectura-aws.md)
se provisiona con Terraform, nunca a mano por consola — es reproducible,
revisable en PR (`terraform plan` como comentario automático) y documenta la
infraestructura por sí misma.

- **State remoto**: bucket S3 + tabla DynamoDB para locking (bajo costo, evita
  condiciones de carrera si se aplica desde CI y localmente).
- **Módulos** separados por responsabilidad (network, ecs, rds, frontend, ecr)
  para poder reutilizarlos si el proyecto crece a más de un entorno.
- Variables sensibles (contraseña inicial de RDS, `google_client_secret`, clave
  de firma JWT) nunca en `.tf` ni en `terraform.tfvars` versionado — se inyectan
  como variables de entorno `TF_VAR_...` en el pipeline de CI, o se generan
  aleatoriamente con `random_password` de Terraform.

## CI/CD: GitHub Actions

Contexto particular de esta prueba: el repositorio tiene una rama por reto
(`1007239188-reto2`, `-reto3`, `-reto4`) y no se hace merge a `main` — por lo
tanto los workflows disparan sobre push a cada rama de reto, no sobre merge a
`main`.

| Workflow | Disparador | Qué hace |
|---|---|---|
| `ci-backend.yml` | Push/PR sobre `1007239188-reto2` | Lint + tests unitarios/integración del backend, build de imagen, `terraform plan` (solo lectura) |
| `ci-frontend.yml` | Push/PR sobre `1007239188-reto3` | Lint + tests del frontend, `vite build` |
| `cd.yml` | Manual (`workflow_dispatch`) | Build de imagen del backend → push a ECR → `terraform apply` → actualización del servicio ECS → build del frontend → sync a S3 → invalidación de CloudFront |

Se opta por despliegue manual (`workflow_dispatch`) en vez de automático,
consciente del presupuesto AWS limitado: cada apply cuesta y se prefiere
desplegar solo cuando se va a demostrar.

Las imágenes se construyen con Docker en el runner de GitHub Actions (los
runners hospedados ya lo traen preinstalado) usando los mismos `containerfile`
que se usan localmente con Podman — el formato Containerfile/Dockerfile es
intercambiable.

## Gestión de secretos
- **GitHub Actions**: credenciales de AWS (rol de IAM vía OIDC, no access keys
  de larga duración) como secreto de repo/entorno.
- **Runtime (ECS)**: variables sensibles (credenciales de RDS, `google_client_secret`,
  clave de firma JWT) inyectadas desde **AWS Secrets Manager** al definir la
  task definition, nunca hardcoded ni en variables de entorno planas del
  repositorio.

## Observabilidad (mínima, acorde al presupuesto)
- Logs de la aplicación → CloudWatch Logs (retención 7 días)
- 1–2 alarmas básicas en CloudWatch: uso de CPU/memoria de ECS y espacio de
  RDS, con notificación a un tópico SNS (email)
