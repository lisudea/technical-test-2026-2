# Tareas de implementación

> **Fase 3 de SDD.** Desglose del [`plan.md`](plan.md) en tareas pequeñas,
> ordenadas y verificables. Cada tarea indica **qué archivos toca**, **qué
> hace** y **cómo se comprueba** que quedó bien antes de pasar a la siguiente.

**Estado:** pendiente de aprobación · **Rama:** `1067961907-Reto2`

---

## Reglas que aplican a todas las tareas

1. **Una tarea = un commit.** Así el historial cuenta la construcción paso a
   paso y se puede volver atrás sin arrastrar cambios ajenos.
2. **Los docstrings se escriben junto al código, no al final.** El criterio
   CA-27 (cada clase, función y endpoint documentado) es parte de "terminar"
   una tarea, no una tarea aparte. Documentar al final siempre sale peor y se
   queda a medias.
3. **Nada se da por bueno sin ejecutarlo.** Cada tarea trae su comando de
   verificación concreto; si no pasa, la tarea no está terminada.
4. **`main` no se toca.** Todo ocurre en `1067961907-Reto2`. No se hace
   `push` sin autorización explícita.

## Orden y criterio de recorte

Las tareas están ordenadas para que **lo obligatorio quede funcionando
primero**. Si el tiempo se agota, se puede cortar a partir de T-09 sin que
nada quede roto ni a medio hacer:

```
OBLIGATORIO (no recortable)        BONUS / PULIDO (recortable en este orden inverso)
T-01 ─ T-02 ─ T-03 ─ T-04 ─ T-05 ─ T-06 ─ T-07 ─ T-08 │ T-09 ─ T-10 ─ T-11 ─ T-12
                                                       │
                            aquí ya cumple el enunciado ┘
```

---

## T-01 — Esqueleto del proyecto y arranque con Docker

**Archivos:** `requirements.txt`, `Dockerfile`, `docker-compose.yml`,
`.env.example`, `.gitignore`, `app/__init__.py`, `app/main.py`,
`app/database.py`

**Qué hace:** deja el proyecto arrancando de punta a punta antes de que
exista una sola regla de negocio: contenedor de PostgreSQL, contenedor de la
API, conexión entre ambos y un endpoint `/salud` que solo responde que está
vivo.

**Por qué va primero:** si la fontanería falla, falla con 20 líneas de código
en pantalla y no con 400. Es mucho más fácil de diagnosticar.

**Cómo se verifica:**
```bash
docker compose up --build          # debe llegar a "Application startup complete"
curl http://localhost:8000/salud   # → {"estado":"ok"}
```
Y que `http://localhost:8000/docs` cargue en el navegador.

---

## T-02 — Modelos: las dos tablas

**Archivos:** `app/models.py`

**Qué hace:** define las clases `Equipo` y `Reserva` con todas sus columnas,
los dos enumerados (`EstadoEquipo`, `EstadoReserva`), la clave foránea, el
`UNIQUE` del número de serie, el `CHECK` de rango válido y los índices de
`plan.md` §3.2.

**Cómo se verifica:**
```bash
docker compose exec api python -c "from app.models import Equipo, Reserva; print(Equipo.__table__.columns.keys()); print(Reserva.__table__.columns.keys())"
```
Debe imprimir las columnas sin lanzar ningún error de importación.

---

## T-03 — Migración inicial, con la restricción anti-solapamiento ⚠️

**Archivos:** `alembic.ini`, `alembic/env.py`, `alembic/versions/<hash>_inicial.py`,
`docker-compose.yml` (añadir `alembic upgrade head` al arranque)

**Qué hace:** genera la migración con `--autogenerate` y la **edita a mano**
para añadir lo que Alembic no puede deducir:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservas ADD CONSTRAINT reservas_sin_solape
EXCLUDE USING gist (
    equipo_id WITH =,
    tstzrange(fecha_hora_inicio, fecha_hora_fin) WITH &&
) WHERE (estado = 'ACTIVA');
```

**Tarea más delicada del proyecto:** es la que sostiene la regla crítica
RN-03. El mecanismo ya está verificado (`plan.md` §7.2.1); aquí solo hay que
integrarlo correctamente en la migración y su `downgrade`.

**Cómo se verifica:**
```bash
docker compose down -v && docker compose up --build   # base de datos desde cero
docker compose exec db psql -U lis_user -d lis_equipos -c "\d reservas"
```
La salida debe mostrar `reservas_sin_solape` como restricción de exclusión.
Además, insertar a mano dos reservas solapadas debe fallar, y dos
consecutivas (11:00 justo tras 09:00–11:00) debe funcionar.

---

## T-04 — Schemas: qué entra y qué sale por la API

**Archivos:** `app/schemas.py`

**Qué hace:** define los modelos Pydantic de entrada y salida
(`EquipoCrear`, `EquipoActualizar`, `EquipoRespuesta`, `ReservaCrear`,
`ReservaRespuesta`) y el envoltorio genérico de paginación
(`RespuestaPaginada`). Incluye el validador de RN-02 (`fecha_hora_fin` debe
ser posterior a `fecha_hora_inicio`).

**Cómo se verifica:**
```bash
docker compose exec api python -c "
from app.schemas import ReservaCrear
try:
    ReservaCrear(equipo_id=1, solicitante_nombre='X', solicitante_correo='x@y.com',
                 fecha_hora_inicio='2026-08-10T11:00', fecha_hora_fin='2026-08-10T09:00')
    print('ERROR: acepto un rango invertido')
except Exception:
    print('OK: rechaza rango invertido (RN-02)')
"
```

---

## T-05 — Endpoints de equipos: registrar, consultar, actualizar

**Archivos:** `app/routers/equipos.py`, `app/routers/__init__.py`,
`app/main.py` (registrar el router)

**Qué hace:** implementa CU-01 (`POST /equipos`), CU-03 (`GET /equipos/{id}`)
y CU-02 (`PATCH /equipos/{id}`), incluyendo la traducción de la violación de
`UNIQUE` a un `409` con mensaje claro (RN-01).

**Cómo se verifica** (desde `/docs` o por consola), cubriendo CA-01, CA-02,
CA-05, CA-06:
```bash
curl -X POST localhost:8000/equipos -H "Content-Type: application/json" \
  -d '{"nombre":"Arduino Uno R3","numero_serie":"ARD-UNO-001","categoria":"Microcontroladores"}'
# → 201 con id

curl -i -X POST localhost:8000/equipos -H "Content-Type: application/json" \
  -d '{"nombre":"Otro","numero_serie":"ARD-UNO-001","categoria":"Microcontroladores"}'
# → 409 (serie duplicada)

curl -X PATCH localhost:8000/equipos/1 -H "Content-Type: application/json" \
  -d '{"estado":"MANTENIMIENTO"}'
# → 200, y el nombre/categoria siguen intactos

curl -i localhost:8000/equipos/9999   # → 404
```

---

## T-06 — Listado avanzado: paginación y filtros

**Archivos:** `app/routers/equipos.py`

**Qué hace:** implementa CU-04 (`GET /equipos`) con `page`, `size`,
`categoria` y `estado`, devolviendo la forma paginada de `plan.md` §8.

**Cómo se verifica** (CA-07 a CA-10): registrar 12 equipos de categorías
distintas y comprobar
```bash
curl "localhost:8000/equipos?page=1&size=10"                      # 10 items, total 12, total_pages 2
curl "localhost:8000/equipos?categoria=Herramientas"               # solo herramientas, total del subconjunto
curl "localhost:8000/equipos?categoria=Cables&estado=DISPONIBLE"    # filtros combinados
curl "localhost:8000/equipos?categoria=NoExiste"                     # items vacío, total 0, sin error
```

---

## T-07 — Crear reserva: el corazón del sistema ⚠️

**Archivos:** `app/routers/reservas.py`, `app/main.py`

**Qué hace:** implementa CU-05 (`POST /reservas`) con **todas** las reglas:

- RN-05: el equipo debe existir → `404`.
- RN-06: el equipo debe estar `DISPONIBLE` → `409`.
- RN-03 capa 1: consulta de solapamiento (`inicio < fin_existente AND fin > inicio_existente`, solo entre `ACTIVA`) → `409` con mensaje explicativo.
- RN-03 capa 2: captura del `IntegrityError` que lanza la restricción `EXCLUDE` ante peticiones simultáneas → el **mismo** `409`.

La función de solapamiento va con nombre propio y docstring que explique el
criterio semiabierto (D-2), porque es lo que cualquiera va a querer leer
primero.

**Cómo se verifica** (CA-11 a CA-14, CA-16, CA-17): sobre una reserva
existente de 09:00 a 11:00 del equipo 1, recorrer los siete casos del
diagrama de `spec.md` §5.1 y comprobar que A–E dan `409` y F–G dan `201`.
Más: equipo inexistente → `404`; equipo en `MANTENIMIENTO` → `409`;
solapar con una reserva ya cancelada → `201`.

---

## T-08 — Listar y cancelar reservas

**Archivos:** `app/routers/reservas.py`

**Qué hace:** implementa CU-07 (`GET /reservas` paginado, con filtros por
equipo, correo y estado) y CU-06 (`POST /reservas/{id}/cancelar`, que cambia
el estado sin borrar, y rechaza con `409` si ya estaba cancelada).

**Cómo se verifica** (CA-19 a CA-21):
```bash
curl -X POST localhost:8000/reservas/1/cancelar      # → 200, estado CANCELADA
curl -i -X POST localhost:8000/reservas/1/cancelar   # → 409, ya estaba cancelada
curl "localhost:8000/reservas?estado=CANCELADA"       # sigue apareciendo en el listado
```
Y que tras cancelar, esa misma franja se pueda volver a reservar.

> **A partir de aquí el enunciado obligatorio ya está cumplido.**

---

## T-09 — Estadísticas: Top 5 *(bonus)*

**Archivos:** `app/routers/estadisticas.py`, `app/main.py`

**Qué hace:** implementa CU-08 (`GET /estadisticas/top-equipos`) con un
`GROUP BY` + `COUNT` ordenado descendente y limitado a 5. Documenta en
Swagger que cuenta también las canceladas (decisión D-5).

**Cómo se verifica** (CA-23, CA-24): con reservas cargadas, devuelve como
máximo 5 equipos ordenados por número de reservas; con la base vacía,
devuelve `[]` y no un error.

---

## T-10 — Pruebas automáticas

**Archivos:** `tests/conftest.py`, `tests/test_equipos.py`,
`tests/test_reservas.py`, `requirements.txt` (añadir `pytest` y `httpx`)

**Qué hace:** monta el entorno de pruebas contra la base `lis_test` del mismo
PostgreSQL (`plan.md` §6) y escribe las pruebas, con los siete casos de
solapamiento como **una única prueba parametrizada** que se lee igual que
`spec.md` §5.1.

**Cómo se verifica:**
```bash
docker compose exec api pytest -v
```
Todas en verde, y la parametrizada debe mostrar los siete casos por separado.

---

## T-11 — Datos de ejemplo del inventario real

**Archivos:** `app/datos_ejemplo.py` (script pequeño e independiente)

**Qué hace:** carga de una vez el inventario de referencia de `spec.md` §3.5
(Arduino, ESP32, Raspberry Pi, protoboard, kit de jumpers, cables HDMI/red/
USB-C, crimpadora, cortafríos, destornilladores, tester) para poder probar la
API sin registrar equipos a mano uno por uno.

**Por qué existe:** sin datos, el listado paginado y el Top 5 no se pueden
mostrar funcionando. Con un comando, la API queda demostrable.

**Cómo se verifica:**
```bash
docker compose exec api python -m app.datos_ejemplo
curl "localhost:8000/equipos?size=100"   # aparece el inventario completo
```

---

## T-12 — README y revisión final

**Archivos:** `README.md`, repaso de docstrings en todo el código

**Qué hace:** escribe el README exigido por el enunciado (propósito,
requisitos previos, cómo levantar con Docker paso a paso, cómo se ejecutan
las migraciones, cómo probar los endpoints con Swagger, estructura de
carpetas explicada, variables de entorno) y hace una pasada final
comprobando que **ningún** endpoint, clase o función quedó sin documentar
(CA-27).

**Cómo se verifica:** seguir el README **desde cero** en una máquina limpia:
```bash
docker compose down -v
docker compose up --build
```
y llegar a probar una reserva sin consultar ninguna otra fuente.

---

## Resumen de cobertura

| Tarea | Cubre |
|---|---|
| T-01 | CA-25 (un solo comando), CA-29 (persistencia) |
| T-02, T-03 | RN-01, RN-02, **RN-03 (garantía en BD)**, RN-05 |
| T-04 | RN-02, CA-18 |
| T-05 | CU-01/02/03, CA-01 a CA-06 |
| T-06 | CU-04, CA-07 a CA-10 |
| T-07 | CU-05, **RN-03**, RN-04/05/06, CA-11 a CA-18, CA-22 |
| T-08 | CU-06/07, RN-07, CA-19 a CA-21 |
| T-09 | CU-08, CA-23, CA-24 |
| T-10 | CA-28 (pruebas de la regla crítica) |
| T-11, T-12 | CA-26, CA-27 |

Con T-01 a T-08 el enunciado obligatorio está cumplido. T-09 añade el bonus
aprobado y T-10 a T-12 son las que suben la nota por documentación y
verificabilidad.
