# Spec 00 — Visión general del proyecto

## Proyecto
**Sistema de Gestión y Reservas de Equipos del LIS** (Laboratorio Integrado de
Sistemas). Aplicación web que expone una API REST para registrar y consultar los
equipos de hardware del laboratorio (microcontroladores, kits de VR, equipos de
redes, etc.) y permite a los usuarios institucionales reservarlos en franjas
horarias específicas, garantizando que un mismo equipo no pueda ser reservado por
dos personas en horarios que se solapen.

## Contexto: prueba técnica LIS 2026-2
Este repositorio responde a los retos 2, 3 y (opcionalmente) 4 de la prueba
técnica. Por convención del evaluador, cada reto vive en su propia rama
(`1007239188-reto2`, `-reto3`, `-reto4`) que nace de `main` y **nunca** se hace
push a `main`. Cada rama debe ser autocontenida — por eso los specs se replican
íntegros en cada rama de reto, no solo los que aplican a esa capa.

| Rama | Reto | Entrega |
|---|---|---|
| `1007239188-reto2` | Backend | API REST con persistencia real, paginación, filtros y validación de conflicto de reservas |
| `1007239188-reto3` | Frontend | Dashboard responsivo que consume la API del reto 2 |
| `1007239188-reto4` | (según enunciado del reto 4) | — |

## Objetivo de este documento
Servir de índice y contrato de alto nivel. Cada área tiene su propio spec
independiente, versionado junto con el código, para que los cambios de una capa
no obliguen a tocar las demás y cada PR pueda revisarse de forma aislada.

| Spec | Contenido |
|---|---|
| [01-arquitectura-aws.md](./01-arquitectura-aws.md) | Arquitectura de despliegue en AWS, costos, decisiones de red |
| [02-backend-spec.md](./02-backend-spec.md) | Spring Boot, API REST, seguridad, testing |
| [03-frontend-spec.md](./03-frontend-spec.md) | React, sistema de diseño, estado, i18n |
| [04-database-spec.md](./04-database-spec.md) | Migraciones, entornos, backups (esquema en [`schema_reservas_lis.sql`](../../schema_reservas_lis.sql)) |
| [05-infra-devops.md](./05-infra-devops.md) | Podman, Terraform, CI/CD |
| [06-branching-strategy.md](./06-branching-strategy.md) | Flujo de Git para esta prueba técnica, commits, releases |
| [07-documentation-standards.md](./07-documentation-standards.md) | READMEs, ADRs, OpenAPI |

## Actores del sistema
| Actor | Descripción |
|---|---|
| Usuario institucional | Persona con correo `@udea.edu.co` que consulta equipos y reserva franjas horarias. Se identifica por nombre y correo (o vía Google SSO en el bonus). |
| Administrador del laboratorio | Gestiona el catálogo de equipos (alta, baja, actualización de estado). No es un rol implementado como usuario aparte en esta fase — se protege por token/JWT y en la demo actúa como cualquier consumidor autenticado de los endpoints de gestión. |

Diseño intencionalmente simple en cuanto a roles: el enunciado no exige separación
de permisos por rol, y sobre-modelarlo (Administrador/Auxiliar/Usuario con RBAC
completo) añade complejidad sin puntos evaluables.

## Alcance funcional (obligatorio del reto)
- **Gestión de equipos**: registrar, actualizar y visualizar equipos
  (ID, nombre, número de serie o MAC, categoría, estado actual).
- **Listado avanzado**: paginación y filtros por categoría y estado.
- **Gestión de reservas**: crear, cancelar y listar reservas por usuario
  (nombre + correo) sobre un equipo específico con `fecha_hora_inicio` y
  `fecha_hora_fin`.
- **Validación de conflicto**: rechazar (HTTP 409) toda reserva cuya franja se
  solape con otra reserva activa del mismo equipo.

## Alcance bonus (implementado)
- **Estadísticas**: endpoint `GET /api/v1/estadisticas/equipos-top` que retorna
  el Top 5 de equipos más reservados históricamente.
- **Autenticación Google SSO**: login con Google validando dominio
  `@udea.edu.co`, emisión de JWT propio que protege los endpoints de creación
  de reservas y gestión de equipos.
- **Internacionalización** (reto 3): interfaz alternable ES/EN sin recarga.

## Fuera de alcance
Reservas recurrentes, notificaciones por correo, aprobación manual de reservas,
préstamo físico de unidades individuales (el enunciado habla de reservas de
franjas horarias, no de préstamos con entrega/devolución).

## Restricciones del proyecto
- **Presupuesto**: 200 USD en créditos AWS. Demo (≤15 usuarios) pensada para
  escalar sin rediseño mayor — ver [01-arquitectura-aws.md](./01-arquitectura-aws.md).
- **Entorno local**: Fedora 44, contenedores con **Podman** (compatible con
  Docker/OCI).
- **Propósito**: prueba técnica para proceso de selección — se prioriza
  demostrar buenas prácticas (documentación, arquitectura, branching, CI/CD,
  testing) sobre cantidad de funcionalidades.

## Stack tecnológico resumido
| Capa | Tecnología |
|---|---|
| Backend | Spring Boot 3.x (Java 21 LTS), API REST, Spring Security + JWT, OAuth2 Client (Google) |
| Frontend | React 18 + Vite + TypeScript, TanStack Query, Tailwind CSS, react-i18next |
| Base de datos | MySQL 8 (Amazon RDS), migraciones con Flyway |
| Contenedores | Podman (local) / imágenes OCI estándar (CI y AWS) |
| Infraestructura | Terraform (IaC), ECS Fargate, ALB, S3 + CloudFront, ECR |
| CI/CD | GitHub Actions |
| Documentación | Markdown + ADRs + OpenAPI (springdoc) |

## Sobre los archivos de contexto de agentes de IA
Este proyecto se desarrolla con apoyo de asistentes de codificación. Los
**specs** de esta carpeta son documentación de diseño real y **sí se versionan**.
Los archivos de trabajo interno de los agentes (caché de contexto, logs de
sesión, configuración local de la herramienta) **no se versionan** — ver
`.gitignore` en la raíz del repositorio y el detalle en
[07-documentation-standards.md](./07-documentation-standards.md#archivos-de-agentes-de-ia).
