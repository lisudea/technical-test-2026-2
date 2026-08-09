# ADR 0004 — Una rama por reto, sin merge a main

- **Estado**: Aceptado
- **Fecha**: 2026-08-09
- **Especulación de referencia**: [Spec 06 — Estrategia de branching](../specs/06-branching-strategy.md), [AGENTS.md](../../AGENTS.md)

## Contexto

La prueba técnica LIS 2026-2 consta de cuatro retos (backend, frontend,
infraestructura, integración final) que se entregan en **ramas separadas** del
mismo repositorio compartido. El repositorio `main` es **compartido entre
todos los aspirantes**, cada uno con su número de documento como prefijo:
`1007239188-reto2`, `1007239188-reto3`, etc.

El enunciado impone una convención de branching que **no es GitFlow
tradicional ni GitHub Flow puro**, aunque el documento lo llame "GitFlow":

- Una rama por reto, nombrada `<documento>-reto<N>`, nacida directamente de
  `main`.
- `main` está protegido y **no se toca**.
- No hay merge back a `main`; el evaluador revisa cada rama de reto por
  separado.
- Cada aspirante trabaja en aislamiento sobre sus propias ramas prefijadas.

Esto es atípico: en un proyecto normal, las features se mergean a `main` y
`main` es la fuente de verdad. Aquí, **cada rama de reto es la fuente de
verdad del entregable correspondiente**, y `main` es solo el punto de partida
común.

## Decisión

Adoptar la convención del enunciado literalmente:

- **`main` es intocable**: nunca se hace push a `main`. No hay merge back.
- Cada reto se entrega en su rama `1007239188-reto<N>`, nacida de `main`.
- Dentro de cada rama de reto se usa un **flujo GitHub Flow interno**: las
  features se desarrollan en `feature/*`, `fix/*`, `test/*`, `docs/*` abiertas
  desde la rama de reto, se mergean a ella vía PR (con autorrevisión contra
  la plantilla) y se eliminan. La rama de reto queda siempre en estado
  estable/desplegable.
- **Commits en Conventional Commits** (`feat(scope):`, `fix(scope):`, ...)
  para permitir generar el `CHANGELOG.md` de forma semiautomática.
- **Tags semver** en los puntos de entrega: `v0.2.0-reto2` cuando el backend
  queda listo para revisión.

## Consecuencias

### Positivas

- **Aislamiento entre aspirantes**: nadie pisa el trabajo de otro; cada rama
  prefijada es el entregable independiente que el evaluador inspecciona sin
  contaminación cruzada.
- **Entregables versionables por separado**: cada rama de reto puede taggear
  su propia versión (`v0.2.0-reto2`, `v0.3.0-reto3`) sin coordinación con las
  demás.
- **`main` como línea base común**: todos parten del mismo estado del repo;
  las diferencias entre aspirantes se ven limpiamente en el diff de su rama de
  reto contra `main`.
- **Flujo interno disciplinado**: usar GitHub Flow dentro de la rama de reto
  evita convertirla en un basurero de commits WIP; los PRs internos fuerzan
  autorrevisión con checklist aunque se trabaje en solitario.

### Negativas

- **No hay integración entre retos en `main`**: el reto 3 (frontend) no puede
  consumir el reto 2 (backend) "desde `main`"; tiene que referenciar la rama
  `1007239188-reto2` o desplegarla aparte. Esto se mitiga con la rama de
  reto 4 (integración final), que es donde el sistema completo se une.
- **`main` no refleja el estado real del proyecto**: un visitante que clona
  `main` ve un repo casi vacío, no el backend funcionando. El README raíz y
  este ADR documentan el flujo para evitar la confusión.
- **Duplicación potencial de código entre retos**: si el reto 3 necesita
  tipos del reto 2, hay que copiarlos o referenciar la rama. No es ideal, pero
  es la convención del enunciado.
- **Carga cognitiva inicial**: el flujo "una rama por reto, sin merge a main"
  contradice la intuición de GitFlow; hay que leer el enunciado y este ADR
  para entenderlo. Es un coste de aprendizaje de una sola vez.

## Alternativas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| GitFlow puro (merge a `main` en cada release) | Viola el enunciado, que prohíbe tocar `main` y exige revisión por rama de reto |
| GitHub Flow con merge a `main` | Igual que arriba; `main` está protegido y es compartido entre aspirantes |
| Una sola rama `develop` para todo | Pierde el aislamiento por aspirante y por reto; el evaluador no podría revisar cada reto por separado |
| Trunk-based con feature flags | Requiere merge a `main`, que está prohibido |

## Notas

- La disciplina interna (PRs con autorrevisión, Conventional Commits,
  `CHANGELOG.md`) es lo que diferencia "cumplir el enunciado" de "aplicar
  buenas prácticas dentro de la restricción". El evaluador valora ambas.
- El tag `v0.2.0-reto2` marca el punto en que el backend está listo para
  revisión; no implica que sea la versión "final", sino la entregable del reto.
