# Spec 06 — Estrategia de branching

## Contexto especial de esta prueba técnica
El enunciado impone una convención de branching específica que **no** es GitFlow
tradicional ni GitHub Flow puro, aunque el documento de la prueba lo llame
"GitFlow":

- Una rama por reto, nombrada `<documento>-reto<N>` (ej. `1007239188-reto2`,
  `1007239188-reto3`, `1007239188-reto4`).
- Cada rama nace directamente de `main`.
- **`main` no se toca**. No hay merge back a `main`; el evaluador revisa cada
  rama de reto por separado.
- El repositorio es compartido entre múltiples aspirantes, cada uno con su
  propio conjunto de ramas prefijadas con su número de documento.

Este spec documenta esa convención y sobrepone las buenas prácticas usuales
(commits convencionales, ramas de vida corta para features internas, PRs
autoevaluados) dentro de cada rama de reto.

## Flujo dentro de una rama de reto
Aunque `1007239188-reto2` es la rama "de entrega", no se desarrolla todo
directamente sobre ella. Internamente se usa un flujo tipo GitHub Flow para no
convertir esa rama en un basurero de commits WIP:

```
main ────●─────────────────────────────▶   (protegida, intocable)
          \
           1007239188-reto2 ────●────●────●────▶   (rama de entrega)
                                 \        \
                                  feature/reservas-conflicto
                                           feature/google-sso
                                                    fix/timezone-en-reserva
```

Las ramas internas (`feature/*`, `fix/*`) se abren desde la rama de reto, se
mergean de vuelta a ella vía PR (autoevaluación con checklist), y se eliminan.
La rama de reto es el estado siempre estable/desplegable de lo que se está
entregando.

## Reglas
- **Nunca push a `main`**. Está protegido y además es un requisito del
  evaluador.
- Toda rama nueva de trabajo interno nace de la rama de reto correspondiente:
  `feature/<descripción-corta>`, `fix/<descripción>`, `chore/<descripción>`,
  `docs/<descripción>`, `test/<descripción>`.
- Cada PR interno debe pasar `ci-*.yml` (lint, tests, build) antes de mergear.
- Merge a la rama de reto **no** dispara despliegue automático — el despliegue
  se ejecuta manualmente cuando se va a demostrar
  (ver [05-infra-devops.md](./05-infra-devops.md#cicd-github-actions)).
- Ramas internas: vida corta, se eliminan al mergear.

## Commits: Conventional Commits
```
feat(reservas): validar solape de franjas con SELECT FOR UPDATE
fix(auth): rechazar id_token de dominio no institucional
docs(specs): adaptar specs al enunciado de la prueba técnica
chore(deps): actualizar Spring Boot a 3.3.x
test(reservas): cubrir escenario de reservas concurrentes
ci(backend): agregar workflow de PR sobre rama de reto 2
```

Prefijos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`. Esto permite
generar el `CHANGELOG.md` de forma semiautomática y comunica intención sin
abrir el diff.

## Pull Requests internos
- Plantilla de PR (`.github/PULL_REQUEST_TEMPLATE.md`) con: qué cambia, por
  qué, cómo se probó, checklist (tests agregados, docs actualizadas si aplica,
  no rompe la API pública del reto).
- Al desarrollarse en solitario: autorrevisión explícita usando la misma
  checklist antes de mergear — la disciplina del proceso importa tanto como el
  resultado para efectos de mostrar buenas prácticas.

## Versionado y releases
Semantic Versioning (`vMAJOR.MINOR.PATCH`) con tags de Git en momentos de
entrega relevantes (ej. `v0.2.0-reto2` cuando el backend queda listo para ser
revisado). `CHANGELOG.md` siguiendo el formato
[Keep a Changelog](https://keepachangelog.com), actualizado en el mismo PR que
introduce el cambio.
