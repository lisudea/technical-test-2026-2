# Decisiones arquitectónicas (ADR)

[Inicio](../../../README.md) · [Arquitectura](../02-arquitectura.md)

| Decisión | Alternativa | Por qué encaja en LISource | Trade-off | Cuándo elegiría la alternativa |
|---|---|---|---|---|
| PostgreSQL | MongoDB / Firebase | relaciones, constraints, auditoría, agregados y locks para reservas | esquema y migraciones explícitas | documentos muy variables sin transacciones relacionales centrales |
| `JdbcClient` + SQL visible | JPA/Hibernate | hace verificables filtros, ranking y `FOR UPDATE` | más mapeo manual y SQL específico | CRUD extenso con dominio estable donde ORM reduzca código sin ocultar queries críticas |
| Spring Boot | Node/NestJS u otro stack | Security, validation, JDBC, transacciones, OpenAPI y testing integrados | mayor consumo/base inicial | equipo centrado en TypeScript o servicio muy pequeño |
| Monolito modular | microservicios | una transacción protege reserva y puente; un despliegue para la prueba | límites dependen de disciplina interna | equipos independientes, escalado desigual o dominios con ciclos separados |
| Separación inspirada en ports-and-adapters | hexagonal estricta | conserva `api/application/infrastructure` sin interfaces ceremoniales en todo módulo | algunos servicios dependen de repositorios concretos | producto de larga vida con múltiples adaptadores intercambiables y testing por puertos |
| JWT access corto + refresh opaco HttpOnly rotado | token largo en `localStorage` | limita exposición del access y permite sesiones/revocación de refresh | persistencia y rotación adicionales; access emitido vive hasta expirar | clientes máquina-a-máquina sin navegador/cookie |
| Google SSO + login local | solamente local | cumple federación institucional y deja cuentas demo/evaluación | dos flujos y configuración OAuth | sistema sin proveedor institucional o con política de identidad única |
| Argon2id | bcrypt/PBKDF2/hash rápido | función memory-hard adecuada para contraseñas | costo CPU/memoria configurable | plataforma con módulo FIPS/política que exija otro KDF aprobado |
| Supabase Storage | `BYTEA` en PostgreSQL | separa objetos del OLTP y evita inflar backups/consultas | servicio y permisos adicionales | pocos archivos pequeños que deban compartir transacción estricta con datos |
| Supabase PostgreSQL | PostgreSQL autogestionado | base administrada y TLS para una prueba con tiempo limitado | dependencia del proveedor/planes | control operativo, extensiones o aislamiento no ofrecidos por el servicio |
| Render backend | servidor administrado | despliegue simple mediante hook y health | cold start y límites del plan | requisitos de latencia/SLA o red privada que exijan infraestructura dedicada |
| Vercel frontend | hosting tradicional | CDN/build/deploy adecuado para React/TanStack | acoplamiento al build del proveedor | runtime especializado, red privada o control total del servidor |
| GitHub Actions | deploy manual | quality/security/deploy/smoke repetibles por rama | tiempo de CI y mantenimiento YAML | prototipo descartable sin entregas repetidas |
| AWS OIDC | access keys estáticas | STS temporal y trust por repositorio/rama | configuración IAM inicial | runner fuera de OIDC con mecanismo de identidad equivalente |
| Terraform | IAM manual | provider/roles/trust policies revisables y reproducibles | state y ciclo plan/apply | experimento único sin infraestructura persistente |
| CodeQL + Trivy | solo build/test | SAST y vulnerabilidades de imagen complementan pruebas | falsos positivos/tiempo y necesidad de revisar SARIF | ejercicio local sin contenedor ni superficie desplegada |
| Testcontainers | mocks/DB embebida | prueba SQL, locks y concurrencia contra PostgreSQL 16 real | requiere Docker y más tiempo | unidad pura o entorno sin contenedores, manteniendo integración en otra capa |

Estas son decisiones del estado actual, no afirmaciones de arquitectura hexagonal pura. Los módulos separan responsabilidades, pero algunos servicios dependen directamente de adaptadores concretos.
