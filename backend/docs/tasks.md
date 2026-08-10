# Cómo se construyó (las 12 tareas)

> **Qué es este documento.** [`spec.md`](spec.md) dice **qué** hacer y
> [`plan.md`](plan.md) dice **cómo**. Este parte ese plan en **tareas
> pequeñas**, en orden, y dice cómo se comprobó cada una.
>
> Sirve para dos cosas: para no perderse mientras se programa, y para que
> cualquiera pueda **seguir la construcción paso a paso** mirando el historial
> de commits, que va tarea por tarea.

**Estado:** completado · **Rama:** `1067961907-Reto2`

---

## Las cuatro normas que se siguieron

1. **Una tarea = un guardado (*commit*).**
   Un *commit* es una "foto" del proyecto en un momento concreto, con un
   mensaje explicando qué cambió. Haciendo uno por tarea, el historial acaba
   contando la construcción como un relato, y se puede volver atrás a
   cualquier punto sin arrastrar cambios de otras tareas.

2. **La documentación se escribe junto al código, no al final.**
   El criterio CA-27 (que todo esté explicado) es parte de *terminar* una
   tarea, no una tarea aparte. Documentar al final siempre sale peor y se
   queda a medias.

3. **Nada se da por bueno sin ejecutarlo.**
   Cada tarea trae el comando exacto con el que se comprobó. Si no pasa, la
   tarea no está terminada.

4. **Nunca se toca la rama principal.**
   Todo el trabajo vive en `1067961907-Reto2`.

## El orden, y por qué es ese

Las tareas están ordenadas para que **lo obligatorio quede funcionando
primero**. Si el tiempo se hubiera agotado, se podía cortar a partir de la
T-09 sin que nada quedara roto ni a medio hacer:

```
   OBLIGATORIO (no se puede recortar)          EXTRAS Y PULIDO
   ┌──────────────────────────────────┐        ┌──────────────────────┐
   T-01  T-02  T-03  T-04  T-05  T-06  T-07  T-08 │ T-09  T-10  T-11  T-12
                                              │
                     aquí ya cumple el enunciado ┘
```

---

## T-01 · Que el proyecto encienda

**Archivos:** `requirements.txt`, `Dockerfile`, `docker-compose.yml`,
`.env.example`, `.gitignore`, `app/__init__.py`, `app/main.py`,
`app/database.py`

**Qué hace:** deja el proyecto funcionando de punta a punta **antes de que
exista ninguna regla de negocio**: la caja de la base de datos, la caja del
programa, la conexión entre ambas y una operación `/salud` que solo responde
"estoy vivo".

**Por qué va primero:** si las conexiones fallan, es mucho mejor que fallen
con 20 líneas de código en pantalla que con 400. Es infinitamente más fácil
encontrar el problema.

**Cómo se comprobó:**
```bash
docker compose up --build          # debe llegar a "Application startup complete"
curl http://localhost:8000/salud   # → {"estado":"ok"}
```
Y que `http://localhost:8000/docs` cargara en el navegador.

---

## T-02 · Las dos tablas

**Archivos:** `app/models.py`

**Qué hace:** describe las fichas `Equipo` y `Reserva` con todas sus columnas,
sus listas de estados permitidos, la conexión entre ambas, la regla de que el
número de serie no se repite, la de que el fin va después del inicio, y los
índices que hacen rápidos los filtros.

**Cómo se comprobó:** pidiéndole al programa que listara las columnas de
ambas tablas y confirmando que salían todas, sin errores.

---

## T-03 · Construir la base de datos, con la regla estrella ⚠️

**Archivos:** `alembic.ini`, `alembic/env.py`,
`alembic/versions/<código>_inicial.py`, `docker-compose.yml`

**Qué hace:** genera las "instrucciones de montaje" de la base de datos y las
**edita a mano** para añadir lo que la generación automática no puede adivinar:
la restricción que impide horarios cruzados (ver [`plan.md`](plan.md) §7).

**La tarea más delicada del proyecto**, porque es la que sostiene la regla más
importante del enunciado.

**Cómo se comprobó:**
1. Borrando la base de datos entera y reconstruyéndola desde cero.
2. Mirando la estructura de la tabla para confirmar que la restricción existía.
3. Intentando insertar a mano los siete casos de horarios: los cinco que se
   cruzan fueron rechazados y los dos consecutivos aceptados.
4. **Deshaciendo y rehaciendo** las instrucciones de montaje completas.

> **Lo que se encontró en el paso 4:** al deshacer, PostgreSQL **no borra**
> las listas de estados permitidos; se quedan flotando. Sin eliminarlas
> explícitamente, volver a montar la base fallaba con *"ese tipo ya existe"*.
> Es la clase de fallo que no aparece hoy sino dentro de tres semanas, cuando
> alguien intenta reconstruir la base. Se corrigió en esta misma tarea.

---

## T-04 · Qué datos se aceptan y cuáles se devuelven

**Archivos:** `app/schemas.py`

**Qué hace:** define el "portero" que revisa los datos antes de que toquen
nada: los formularios de entrada, la forma de las respuestas y el envoltorio
de las listas por páginas. Incluye la comprobación de que la hora de fin sea
posterior a la de inicio.

**Cómo se comprobó:** enviando datos malos a propósito (rango invertido,
duración cero, correo inventado, estado que no existe, nombre con solo
espacios) y confirmando que todos se rechazaban con el mensaje adecuado.

---

## T-05 · Registrar, consultar y actualizar equipos

**Archivos:** `app/routers/equipos.py`, `app/routers/__init__.py`,
`app/main.py`

**Qué hace:** las tres primeras operaciones del inventario, incluida la
traducción del error de "número de serie repetido" a un `409` con mensaje
claro.

**Cómo se comprobó:** ejecutando los criterios CA-01 a CA-06 uno por uno:
crear, duplicar la serie, omitir campos, inventar un estado, cambiar solo el
estado (comprobando que el nombre y la categoría seguían intactos) y pedir un
equipo inexistente.

> **Lo que se aprendió aquí:** los identificadores tienen huecos (1, 3, 4…).
> El intento fallido de serie duplicada **consume un número igualmente**,
> porque los contadores de PostgreSQL no se deshacen. No es un fallo; está
> explicado en [`como-funciona.md`](como-funciona.md) §12.

---

## T-06 · Ver el inventario por páginas y con filtros

**Archivos:** `app/routers/equipos.py`, `app/database.py`

**Qué hace:** la operación de listado con `page`, `size`, `categoria` y
`estado`.

**Cómo se comprobó:** registrando 13 equipos de categorías y estados variados
y verificando que la página 1 traía 10 con el total correcto, que el filtro
por categoría devolvía el total **del grupo filtrado** y no del inventario
entero, que los dos filtros se podían combinar, y que un filtro sin
coincidencias devolvía una lista vacía **y no un error**.

---

## T-07 · Reservar: el corazón del sistema ⚠️

**Archivos:** `app/routers/reservas.py`, `app/main.py`

**Qué hace:** la operación de crear reservas, con **todas** las reglas:

- El equipo debe existir → si no, `404`.
- El equipo debe estar disponible → si no, `409`.
- El horario debe estar libre → si no, `409`, comprobado en **dos capas**.

**Cómo se comprobó:**
1. Los **siete casos** del dibujo de la especificación, a través de la API:
   los cinco que se cruzan dieron `409` y los dos consecutivos dieron `201`.
2. Equipo inexistente → `404`. Equipo en mantenimiento → `409`. Horario
   imposible → `422`. Correo inválido → `422`. Otro equipo a la misma hora →
   `201`.
3. **La prueba de las dos personas a la vez:** se lanzaron **20 peticiones
   simultáneas** pidiendo exactamente el mismo horario. Resultado: **una**
   respondió `201` y diecinueve `409`, y en la base de datos quedó **una sola
   fila**.

---

## T-08 · Ver y cancelar reservas

**Archivos:** `app/routers/reservas.py`

**Qué hace:** el listado con filtros y la cancelación (que cambia el estado en
vez de borrar).

**Cómo se comprobó:** cancelando una reserva, comprobando que seguía
apareciendo en el listado con estado `CANCELADA`, que cancelarla otra vez daba
`409`, y —lo más importante— que **su horario quedaba libre**: otra persona
pudo reservar exactamente esa franja.

> **A partir de aquí el enunciado obligatorio está cumplido.**

---

## T-09 · El ranking de equipos más pedidos *(extra)*

**Archivos:** `app/routers/estadisticas.py`, `app/main.py`

**Qué hace:** la operación que agrupa las reservas por equipo, las cuenta y
devuelve las cinco primeras. El cálculo lo hace la base de datos en una sola
consulta, no el programa trayéndose todo a memoria.

**Cómo se comprobó:** con reservas cargadas devolvía el ranking ordenado; sin
ninguna reserva devolvía una lista vacía y no un error. Se verificó además que
**cuenta también las canceladas**, tal como especifica la decisión D-5.

---

## T-10 · Las pruebas automáticas

**Archivos:** `tests/conftest.py`, `tests/test_equipos.py`,
`tests/test_reservas.py`

**Qué hace:** monta el entorno de pruebas contra una base de datos aparte y
escribe **36 pruebas**, con los siete casos de horarios como **una sola prueba
parametrizada** que se lee igual que la especificación.

**Cómo se comprobó:**
```bash
docker compose exec api pytest -v      # las 36 en verde
```

> **Y algo más:** se comprobó que las pruebas **sirven de algo**. Se rompió el
> código a propósito (cambiando los signos `<` por `<=`) y fallaron
> **exactamente** los dos casos que dependen de esa decisión, ni uno más.
> Una lista de pruebas que pasa pase lo que pase no vale nada; esta detecta el
> fallo justo donde debe. Después se restauró el código correcto.

---

## T-11 · Datos de ejemplo con el inventario real

**Archivos:** `app/datos_ejemplo.py`

**Qué hace:** carga de una vez 23 equipos reales del laboratorio y 13
reservas.

**Por qué existe:** sin datos, el listado por páginas y el ranking **no se
pueden enseñar funcionando**; habría que registrar equipos a mano uno por uno
antes de poder probar nada.

**Cómo se comprobó:** ejecutándolo dos veces seguidas. La segunda vez no
duplicó nada (avisó de que ya estaban cargados), que es justo lo que debe
hacer.

---

## T-12 · La documentación final

**Archivos:** `README.md`, y repaso de todo el código

**Qué hace:** escribe la guía de uso completa y revisa que no quede nada sin
explicar.

**Cómo se comprobó:**
1. Con un pequeño programa que recorrió **todos** los archivos comprobando que
   cada módulo, clase y función tuviera su explicación (criterio CA-27) y que
   las nueve operaciones tuvieran descripción en la página de documentación
   (CA-26).
2. **Siguiendo el README desde cero**, con la base de datos borrada por
   completo: los tres pasos de instalación y el recorrido guiado de dos
   minutos funcionaron tal como están escritos.

---

## Qué cubre cada tarea

| Tarea | Criterios que satisface |
|---|---|
| T-01 | CA-25 (un solo comando), CA-29 (los datos sobreviven) |
| T-02, T-03 | RN-01, RN-02, **RN-03 (la garantía en la base de datos)**, RN-05 |
| T-04 | RN-02, CA-18 |
| T-05 | CU-01/02/03, CA-01 a CA-06 |
| T-06 | CU-04, CA-07 a CA-10 |
| T-07 | CU-05, **RN-03**, RN-04/05/06, CA-11 a CA-18, **CA-22** |
| T-08 | CU-06/07, RN-07, CA-19 a CA-21 |
| T-09 | CU-08, CA-23, CA-24 |
| T-10 | CA-28 (pruebas de la regla estrella) |
| T-11, T-12 | CA-26, CA-27 |

Con T-01 a T-08 el enunciado obligatorio queda cumplido. T-09 añade el punto
extra aprobado, y T-10 a T-12 son las que suben la nota por documentación y
por poder comprobar que todo funciona.
