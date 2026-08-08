# Spec 07 — Estándares de documentación

## Estructura general
```
docs/
├── specs/            # este conjunto de documentos (vivos, se actualizan con el diseño)
├── adr/              # Architecture Decision Records
└── diagrams/         # exports de diagramas si se necesitan fuera de los .md
README.md              # raíz del repo: qué es, cómo levantarlo en 5 minutos
CONTRIBUTING.md        # cómo contribuir: branching, commits, cómo correr tests
CHANGELOG.md
schema_reservas_lis.sql
```

## README raíz
Debe permitir a alguien nuevo (el evaluador) levantar el proyecto en local sin
preguntar nada: descripción breve, stack, requisitos (Podman, Java 21, Node),
comandos (`podman-compose up`, cómo correr tests, cómo probar la API con
`curl`/Postman), enlace a esta carpeta de specs, un diagrama o captura, y
sección explícita de **"Cómo probar los endpoints"** con ejemplos de reserva
válida, reserva en conflicto (esperando 409), listado paginado y filtrado.

Además debe indicar:
- URL del Swagger UI local (`http://localhost:8080/swagger-ui.html`)
- Colección de Postman/Bruno versionada en `docs/postman/` para importar
- Credenciales de prueba y correos semilla `@udea.edu.co`

## ADRs (Architecture Decision Records)
Para decisiones con trade-offs no triviales, se registra un ADR corto en
`docs/adr/`, formato MADR:

```
docs/adr/0001-usar-ecs-fargate-sobre-ec2.md
docs/adr/0002-validar-solape-en-app-no-en-mysql.md
docs/adr/0003-google-sso-en-vez-de-auth-propio.md
docs/adr/0004-una-rama-por-reto-sin-merge-a-main.md
  ## Contexto
  ## Decisión
  ## Consecuencias (positivas y negativas)
```

Esto documenta el *razonamiento*, no solo el resultado — es lo que un revisor
técnico busca para evaluar criterio, más allá de si el código funciona.

## Documentación de API: OpenAPI
El backend expone `/swagger-ui.html` (springdoc-openapi) generado directamente
desde el código — la documentación de endpoints nunca se escribe a mano ni se
duplica en los specs, para que no pueda desincronizarse del código real.

Se anotan explícitamente con `@Operation`, `@ApiResponse` y `@Schema` los
endpoints críticos (crear reserva, listar con paginación) para que el Swagger
generado sea útil como material de evaluación por sí mismo.

Adicionalmente se versiona en el repo una **colección de Postman/Bruno**
(`docs/postman/reservas-lis.postman_collection.json`) con requests de ejemplo
para cada endpoint, incluyendo los casos de conflicto (para verificar el 409) y
los del bonus (Google SSO, Top 5).

## Diagramas
Los diagramas de arquitectura y de entidad-relación se escriben en **Mermaid**
dentro de los propios `.md` — GitHub los renderiza de forma nativa, no
requieren herramientas externas ni archivos binarios versionados.

## Archivos de agentes de IA
Si el desarrollo se apoya en asistentes de codificación (Claude Code u otros),
se distingue entre dos tipos de artefactos:

| Tipo | Ejemplos | ¿Se versiona? |
|---|---|---|
| Documentación de diseño | Los specs de `docs/specs/`, ADRs | **Sí** — es el resultado del trabajo, no el proceso |
| Contexto/estado interno del agente | Caché de sesión, logs de conversación, configuración local de la herramienta, archivos temporales de planificación | **No** — es efímero y específico de cada máquina/sesión |

El `.gitignore` en la raíz cubre explícitamente los directorios y patrones
conocidos de estas herramientas. Si se usa `CLAUDE.md` como archivo de
instrucciones de proyecto para el agente, ese archivo específico sí puede
versionarse si se decide compartirlo como parte del proceso — pero cualquier
subcarpeta de estado local (`.claude/`, cachés, historiales) permanece
ignorada.
