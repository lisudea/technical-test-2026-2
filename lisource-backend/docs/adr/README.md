# Decisiones arquitectónicas (ADR)

[Inicio](../../../README.md) · [Arquitectura](../02-arquitectura.md)

| Decisión | Alternativa considerada | Motivo y trade-off |
|---|---|---|
| PostgreSQL | MongoDB/Firebase | integridad, joins, constraints y locks; exige esquema/migración |
| `JdbcClient` + SQL | JPA/Hibernate | queries y locking visibles; más mapeo manual |
| Spring Boot modular | microservicios | despliegue y transacción simples; requiere límites internos disciplinados |
| JWT corto + refresh HttpOnly rotado | access largo/localStorage | reduce exposición y robo persistente; agrega sesión/rotación |
| Google + login local institucional | solo local | mejor UX/federación y fallback; integra proveedor externo |
| Argon2 | cifrado reversible/hash débil | resistencia memory-hard; mayor costo CPU controlado |
| Supabase Storage | binarios en PostgreSQL | CDN/objetos fuera del OLTP; operación de otro servicio |
| Vercel + Render + Supabase | servidor único | servicios administrados y bajo costo; cold starts/vendor split |
| GitHub OIDC AWS | access keys | credenciales temporales y policy por branch; configuración IAM inicial |
| Terraform versionado | IAM manual | revisión y reproducibilidad; state requiere custodia |
| Testcontainers + ArchUnit + CodeQL/Trivy | solo compilar | detecta integración, deriva y riesgos; CI más lenta |

Estas son decisiones del estado actual, no afirmaciones de arquitectura hexagonal pura. Los módulos separan responsabilidades, pero algunos servicios dependen directamente de adaptadores concretos.

