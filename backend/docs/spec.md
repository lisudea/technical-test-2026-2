# Especificación funcional — Sistema de Gestión y Reservas de Equipos del LIS

> **Fase 1 de SDD (Spec-Driven Development).** Este documento define **QUÉ**
> hace el sistema. El **CÓMO** se construye vive en [`plan.md`](plan.md) y el
> desglose de trabajo en [`tasks.md`](tasks.md).
>
> A propósito, aquí **no** se habla de tecnologías, librerías ni estructura de
> archivos: solo del comportamiento observable, para poder validarlo antes de
> escribir una sola línea de código.

**Estado:** aprobada · **Reto:** 2 (Backend) · **Rama:** `1067961907-Reto2`

Alcance acordado: requerimientos obligatorios + bonus de estadísticas
"Top 5". Sin autenticación con Google SSO.

---

## 1. Propósito

El Laboratorio Integrado de Sistemas presta recursos de hardware a
estudiantes y docentes: placas de desarrollo (Arduino, ESP32, Raspberry Pi),
material de prototipado (protoboards, jumpers, kits de componentes), cables
(USB-C, HDMI, red) y herramientas (crimpadoras, cortafríos, destornilladores,
testers). Hoy ese control se lleva de forma manual, lo que hace difícil saber
qué hay, en qué estado está y quién lo tiene reservado.

El sistema a construir es una **API REST** (un programa sin pantalla, que
recibe peticiones por red y responde con datos, para que otra aplicación las
consuma) que permita:

1. Llevar el inventario de los equipos del laboratorio.
2. Gestionar las reservas de esos equipos en franjas de tiempo.
3. Impedir que un mismo equipo quede reservado por dos personas a la vez.

## 2. Actores

| Actor | Descripción | Qué hace en el sistema |
|---|---|---|
| **Auxiliar/administrador del laboratorio** | Persona encargada del inventario. | Registra equipos, actualiza sus datos y estado, consulta todas las reservas, consulta estadísticas. |
| **Persona solicitante** | Estudiante o docente que necesita un equipo prestado. | Consulta el catálogo de equipos, crea una reserva, cancela su reserva, consulta sus reservas. |

> **Limitación conocida y aceptada:** en este alcance **no hay autenticación**
> (no hay inicio de sesión). El sistema no puede *verificar* técnicamente
> quién hace cada petición: los roles de arriba describen la intención de uso,
> no una restricción que el sistema imponga. En consecuencia, cualquiera que
> llegue a la API podría cancelar la reserva de otra persona. Se documenta
> explícitamente como deuda conocida; resolverlo era justamente el bonus de
> autenticación, que quedó fuera de alcance por tiempo.

## 3. Entidades de negocio

Una **entidad** es un "tipo de cosa" que el sistema necesita recordar. Aquí
hay dos.

### 3.1 Equipo

Un recurso físico del laboratorio susceptible de ser prestado.

| Atributo | Descripción | Obligatorio | Reglas |
|---|---|---|---|
| `id` | Identificador único del equipo. | Sí | Lo genera el sistema, no lo escribe el usuario. |
| `nombre` | Nombre descriptivo. Ej. *"Arduino Uno R3"*, *"Crimpadora RJ45"*. | Sí | Texto no vacío. |
| `numero_serie` | Número de serie, dirección MAC **o código interno** asignado por el laboratorio. | Sí | **Único en todo el sistema**: no pueden existir dos equipos con el mismo (ver D-6). |
| `categoria` | Agrupación del equipo. Ej. *Microcontroladores*, *Herramientas*, *Cables*. | Sí | Texto libre (ver D-4 e inventario de referencia en §3.5). |
| `estado` | Estado actual del equipo. | Sí | Uno de: `DISPONIBLE`, `MANTENIMIENTO`, `DAÑADO`. Por defecto `DISPONIBLE`. |
| `creado_en` / `actualizado_en` | Marcas de tiempo de auditoría. | Sí | Las gestiona el sistema automáticamente. |

### 3.2 Reserva

El apartado de un equipo por parte de una persona, durante una franja de
tiempo concreta.

| Atributo | Descripción | Obligatorio | Reglas |
|---|---|---|---|
| `id` | Identificador único de la reserva. | Sí | Lo genera el sistema. |
| `equipo_id` | Qué equipo se está reservando. | Sí | Debe corresponder a un equipo existente. |
| `solicitante_nombre` | Nombre de quien reserva. | Sí | Texto no vacío. |
| `solicitante_correo` | Correo de quien reserva. | Sí | Debe tener formato válido de correo. |
| `fecha_hora_inicio` | Momento en que empieza el préstamo. | Sí | — |
| `fecha_hora_fin` | Momento en que termina el préstamo. | Sí | Debe ser **estrictamente posterior** a `fecha_hora_inicio`. |
| `estado` | Estado de la reserva. | Sí | Uno de: `ACTIVA`, `CANCELADA`. Por defecto `ACTIVA`. |
| `creado_en` | Cuándo se registró la reserva. | Sí | La gestiona el sistema. |

### 3.3 Sobre la entidad "Usuario"

**Decisión D-1: no existe una entidad `Usuario` propia.** La persona
solicitante se identifica únicamente por su nombre y correo, guardados
directamente dentro de cada reserva.

- *Alternativa descartada:* crear una tabla `Usuario` con registro previo, y
  que la reserva apunte a ella.
- *Por qué se descarta:* el enunciado dice explícitamente que el usuario se
  identifica "por nombre y correo", sin exigir registro. Crear la entidad
  añadiría un flujo de alta de usuarios, endpoints extra y una relación más,
  sin aportar nada al requerimiento. Si en el futuro se añadiera el login con
  Google, ese sería el momento natural de introducirla.
- *Consecuencia aceptada:* si una misma persona reserva dos veces escribiendo
  su nombre distinto ("Daniel" vs "Daniel H."), el sistema las ve como dos
  textos distintos. Para el alcance de esta prueba es irrelevante.

### 3.4 Relación entre entidades

```
┌───────────────┐                      ┌────────────────┐
│    Equipo     │ 1                  N │    Reserva     │
│               │──────────────────────│                │
│ id            │  "un equipo puede    │ id             │
│ nombre        │   tener muchas       │ equipo_id  ────┼──▶ apunta al Equipo
│ numero_serie  │   reservas a lo      │ solicitante_*  │
│ categoria     │   largo del tiempo"  │ fecha_hora_*   │
│ estado        │                      │ estado         │
└───────────────┘                      └────────────────┘
```

Un **Equipo** puede tener muchas **Reservas** a lo largo del tiempo. Cada
**Reserva** pertenece a exactamente un Equipo.

### 3.5 Inventario real de referencia

El sistema no fija ninguna lista de equipos ni de categorías (ver D-4), pero
la especificación se valida contra lo que el laboratorio presta realmente.
Esta tabla sirve de referencia para los datos de ejemplo, la documentación y
las pruebas:

| Categoría sugerida | Artículos reales que agrupa |
|---|---|
| `Microcontroladores` | Arduino (Uno, Nano…), ESP32 |
| `Computadores` | Raspberry Pi 4 |
| `Prototipado` | Protoboards, jumpers, kits de componentes (resistencias, LEDs, capacitores) |
| `Cables` | USB-C, HDMI, cables de red |
| `Herramientas` | Crimpadoras, cortafríos, destornilladores, testers/multímetros |

**Decisión D-6 — el `numero_serie` admite códigos internos del laboratorio.**

Buena parte del inventario real **no tiene número de serie de fábrica**: un
destornillador, un cortafríos o una bolsa de jumpers no vienen serializados.
Por eso el campo se especifica como "número de serie, MAC **o código
interno**": el laboratorio asigna un código propio (por ejemplo
`HERR-CRIMP-001`, `JUMP-MM-01`) y lo rotula físicamente en el artículo.

- *Alternativa descartada:* hacer el campo opcional para los artículos sin
  serie de fábrica.
- *Por qué se descarta:* si el campo puede quedar vacío, se pierde la única
  forma de distinguir dos protoboards idénticas al momento de prestarlas y de
  saber cuál volvió. Exigirlo siempre —aunque sea un código pegado con
  cinta— es justamente lo que hace utilizable el inventario. Además mantiene
  intacta la regla RN-01 de unicidad, sin casos especiales.

**Decisión D-7 — el material a granel se registra como kit, no por unidad.**

Los jumpers, LEDs y componentes sueltos no se prestan de a uno. Cada *kit*
que sale del laboratorio se registra como **un equipo** con su propio código
interno (ej. `"Kit jumpers macho-macho (40 unidades)"`, código `JUMP-MM-01`).

- *Alternativa descartada:* añadir un campo de cantidad/stock y descontar
  unidades en cada préstamo.
- *Por qué se descarta:* introduciría un modelo de inventario por cantidades
  —con reservas parciales, devoluciones incompletas y stock disponible por
  franja horaria— que multiplica la complejidad de la regla crítica RN-03 y
  que el enunciado no pide en ningún momento. Tratar el kit como una unidad
  prestable mantiene una sola regla de reserva para todo el inventario.

## 4. Casos de uso

### CU-01 — Registrar un equipo
El auxiliar registra un equipo nuevo en el inventario, indicando nombre,
número de serie, categoría y estado. El sistema le asigna un identificador
único y lo devuelve.

### CU-02 — Actualizar un equipo
El auxiliar modifica los datos de un equipo existente (por ejemplo, lo pasa a
`MANTENIMIENTO`, o corrige su nombre). Puede enviar solo los campos que
quiere cambiar.

### CU-03 — Consultar un equipo
Cualquiera consulta los datos de un equipo concreto a partir de su
identificador.

### CU-04 — Listar equipos (paginado y con filtros)
Cualquiera consulta el catálogo de equipos. El resultado llega **paginado**
(por bloques, no todos de golpe) y admite filtrar por **categoría**, por
**estado**, o por ambos a la vez. La respuesta incluye, además de los
equipos, información de cuántos hay en total y cuántas páginas existen.

### CU-05 — Crear una reserva
Una persona reserva un equipo indicando su nombre, su correo, y la franja de
tiempo (inicio y fin). El sistema comprueba todas las reglas de negocio de la
sección 5 y, si todo está en orden, registra la reserva como `ACTIVA`.

### CU-06 — Cancelar una reserva
Una persona cancela una reserva existente. La reserva **no se borra**: pasa a
estado `CANCELADA`, de modo que quede historial de lo que ocurrió.

### CU-07 — Listar reservas
Se consultan las reservas registradas, de forma paginada, pudiendo filtrar
por equipo, por correo del solicitante y/o por estado de la reserva. Esto
cubre tanto "ver las reservas de un equipo" como "ver mis reservas".

### CU-08 — Consultar el Top 5 de equipos más reservados *(bonus)*
Se consulta el ranking de los 5 equipos con más reservas registradas
históricamente, para saber qué recursos son los más demandados.

> **Fuera de alcance explícito:** no existe un caso de uso para *eliminar*
> equipos. El enunciado pide registro, actualización y visualización; borrar
> un equipo del que cuelgan reservas históricas destruiría información. Si se
> necesita retirar un equipo de circulación, se marca como `DAÑADO`.

## 5. Reglas de negocio

Las **reglas de negocio** son las condiciones que el sistema debe hacer
cumplir siempre, sin importar quién ni cómo lo use.

| ID | Regla | Si se incumple |
|---|---|---|
| **RN-01** | El `numero_serie` de un equipo es único en todo el sistema. | Se rechaza el registro/actualización, informando el conflicto. |
| **RN-02** | En una reserva, `fecha_hora_fin` debe ser **estrictamente posterior** a `fecha_hora_inicio`. | Se rechaza la reserva, indicando que el rango es inválido. |
| **RN-03** | **(Crítica)** Un equipo no puede tener dos reservas `ACTIVA` cuyas franjas de tiempo se solapen. | Se rechaza la reserva con un conflicto explícito, indicando que el equipo ya está reservado en esa franja. |
| **RN-04** | Solo las reservas en estado `ACTIVA` bloquean. Una reserva `CANCELADA` libera su franja de inmediato. | — |
| **RN-05** | Solo se puede reservar un equipo que exista. | Se rechaza indicando que el equipo no fue encontrado. |
| **RN-06** | Solo se puede reservar un equipo cuyo estado sea `DISPONIBLE`. Un equipo en `MANTENIMIENTO` o `DAÑADO` no se presta. | Se rechaza indicando que el equipo no está disponible para préstamo. |
| **RN-07** | Una reserva ya `CANCELADA` no se puede volver a cancelar. | Se rechaza indicando que ya estaba cancelada. |

### 5.1 Detalle de RN-03: qué significa exactamente "solaparse"

Esta es la regla más importante del sistema y la que el enunciado marca como
crítica, así que se define sin ambigüedad.

Dos franjas de tiempo se solapan si **una empieza antes de que la otra
termine, y termina después de que la otra empieza**:

```
solapan  ⟺  (inicio_nueva < fin_existente)  Y  (fin_nueva > inicio_existente)
```

Casos, tomando como reserva existente **09:00 → 11:00**:

```
Existente:        |███████████|            09:00 ──────── 11:00
                  09:00      11:00

A) 10:00 → 12:00      |███████████|        ❌ SOLAPA (empieza dentro)
B) 08:00 → 10:00  |███████|                ❌ SOLAPA (termina dentro)
C) 09:30 → 10:30      |████|               ❌ SOLAPA (contenida dentro)
D) 08:00 → 12:00 |█████████████████|       ❌ SOLAPA (la contiene)
E) 09:00 → 11:00  |███████████|            ❌ SOLAPA (idéntica)
F) 11:00 → 13:00              |████████|   ✅ NO SOLAPA (empieza justo al terminar)
G) 07:00 → 09:00 |████|                    ✅ NO SOLAPA (termina justo al empezar)
```

**Decisión D-2 — los extremos no cuentan como solape** (casos F y G). Se usa
el criterio de intervalo *semiabierto*: la franja incluye su instante de
inicio pero **no** el de fin. Es decir, una reserva de 09:00 a 11:00 y otra
de 11:00 a 13:00 conviven sin problema.

- *Por qué:* es el comportamiento correcto para un préstamo real — una
  persona devuelve el equipo a las 11:00 y la siguiente lo recoge a las
  11:00. Tratar eso como conflicto haría imposible encadenar préstamos.

### 5.2 Decisiones adicionales que conviene dejar por escrito

**Decisión D-3 — se permite registrar reservas con fechas en el pasado.**
El sistema **no** valida que `fecha_hora_inicio` sea futura.

- *Alternativa descartada:* rechazar cualquier reserva que empiece antes del
  momento actual.
- *Por qué se descarta:* el laboratorio puede necesitar registrar a
  posteriori un préstamo que ya ocurrió, y la validación obligaría a que las
  pruebas automáticas usaran siempre fechas móviles, complicándolas sin
  aportar valor al requerimiento. Las reglas RN-02 y RN-03 siguen aplicando
  igual sobre fechas pasadas.

**Decisión D-4 — la categoría es texto libre, no una lista cerrada.**

- *Alternativa descartada:* una lista fija de categorías permitidas.
- *Por qué se descarta:* el propio enunciado da las categorías como
  *ejemplos* ("ej. Microcontroladores, VR, Redes"), y el inventario real del
  laboratorio (§3.5) ya no coincide con esa lista: se prestan herramientas de
  crimpado, cables y material de prototipado que ahí no aparecen. Eso es
  precisamente la prueba de que fijar el catálogo en el código obligaría a
  modificarlo cada vez que cambie el inventario.

**Decisión D-5 — el Top 5 cuenta también las reservas canceladas.** La
estadística mide *demanda histórica* (cuántas veces se ha solicitado un
equipo), no préstamos efectivamente cumplidos. Se documentará así en la API
para que no haya ambigüedad al interpretarla.

## 6. Criterios de aceptación

Cómo sabremos que cada funcionalidad quedó bien hecha. Cada criterio está
escrito de forma que se pueda comprobar objetivamente (y varios se convierten
en pruebas automáticas).

### Equipos

| # | Dado / Cuando | Entonces |
|---|---|---|
| CA-01 | Registro un equipo con todos sus datos válidos | Se crea, recibo un identificador único y el equipo aparece luego en el listado. |
| CA-02 | Registro un equipo con un `numero_serie` que ya existe | Se rechaza con un conflicto y **no** se crea nada. |
| CA-03 | Registro un equipo sin nombre, sin categoría o sin número de serie | Se rechaza indicando qué campo falta. |
| CA-04 | Registro un equipo con un `estado` que no es uno de los tres válidos | Se rechaza indicando los valores permitidos. |
| CA-05 | Actualizo solo el estado de un equipo existente | Cambia el estado y **los demás campos quedan intactos**. |
| CA-06 | Consulto/actualizo un equipo con un identificador inexistente | Se informa que no se encontró. |
| CA-07 | Listo equipos habiendo 12 registrados, pidiendo página 1 de tamaño 10 | Recibo 10 equipos y la información de que hay 12 en total y 2 páginas. |
| CA-08 | Listo equipos filtrando por categoría | Recibo **solo** los de esa categoría, y el total refleja ese subconjunto, no el inventario completo. |
| CA-09 | Listo equipos filtrando por categoría **y** estado a la vez | Recibo solo los que cumplen ambas condiciones. |
| CA-10 | Listo equipos con un filtro que no coincide con ninguno | Recibo una lista vacía y total 0 (no un error). |

### Reservas

| # | Dado / Cuando | Entonces |
|---|---|---|
| CA-11 | Reservo un equipo `DISPONIBLE` en una franja libre | Se crea la reserva en estado `ACTIVA`. |
| CA-12 | Reservo un equipo en una franja que se solapa con una reserva `ACTIVA` (casos A–E de §5.1) | Se rechaza con **conflicto**, con un mensaje que explica el motivo, y no se crea la reserva. |
| CA-13 | Reservo justo cuando termina otra reserva (casos F y G de §5.1) | Se crea correctamente, sin conflicto. |
| CA-14 | Reservo una franja que se solapa con una reserva **`CANCELADA`** | Se crea correctamente: las canceladas no bloquean. |
| CA-15 | Reservo indicando `fecha_hora_fin` anterior o igual a `fecha_hora_inicio` | Se rechaza indicando que el rango es inválido. |
| CA-16 | Reservo un equipo que no existe | Se informa que no se encontró. |
| CA-17 | Reservo un equipo en `MANTENIMIENTO` o `DAÑADO` | Se rechaza indicando que no está disponible para préstamo. |
| CA-18 | Reservo indicando un correo con formato inválido | Se rechaza indicando el problema del correo. |
| CA-19 | Cancelo una reserva `ACTIVA` | Pasa a `CANCELADA`, **sigue apareciendo** en los listados y su franja queda libre. |
| CA-20 | Cancelo una reserva ya `CANCELADA` | Se rechaza indicando que ya estaba cancelada. |
| CA-21 | Listo reservas filtrando por equipo / por correo / por estado | Recibo solo las que cumplen el filtro, de forma paginada. |
| CA-22 | Dos peticiones intentan reservar el mismo equipo en la misma franja **exactamente al mismo tiempo** | Solo una tiene éxito; la otra recibe conflicto. |

### Estadísticas (bonus)

| # | Dado / Cuando | Entonces |
|---|---|---|
| CA-23 | Consulto el Top 5 habiendo reservas registradas | Recibo como máximo 5 equipos, ordenados de más a menos reservado, cada uno con su número de reservas. |
| CA-24 | Consulto el Top 5 sin ninguna reserva registrada | Recibo una lista vacía (no un error). |

### Transversales

| # | Criterio |
|---|---|
| CA-25 | Todo el proyecto se levanta con **un solo comando** de Docker, incluida la base de datos, sin instalación manual de PostgreSQL. |
| CA-26 | Existe documentación interactiva navegable donde cada endpoint tiene descripción y ejemplos, sin necesidad de leer el código. |
| CA-27 | Cada clase, función y endpoint del código tiene documentación explicando qué hace, qué recibe, qué devuelve y por qué existe. |
| CA-28 | Existen pruebas automáticas que cubren, como mínimo, la regla crítica RN-03 en todos los casos de §5.1. |
| CA-29 | Los datos sobreviven al reinicio del sistema (persistencia real en base de datos, no en memoria). |

## 7. Fuera de alcance

Se deja constancia explícita de lo que **no** hace este sistema, para que no
se interprete como un olvido:

- Autenticación e inicio de sesión (Google SSO + JWT) — bonus descartado por tiempo.
- Eliminación física de equipos.
- Gestión de usuarios como entidad propia (ver D-1).
- Notificaciones por correo, recordatorios o devoluciones.
- Control de cantidades/stock del material a granel: cada kit prestable es un equipo con su propio código (ver D-7).
- Frontend / interfaz gráfica (corresponde al Reto 3).

## Anexo — Índice de decisiones

| ID | Decisión |
|---|---|
| D-1 | No existe entidad `Usuario`; el solicitante son dos campos de la reserva. |
| D-2 | Los extremos de la franja no cuentan como solape (intervalo semiabierto). |
| D-3 | Se permiten reservas con fechas en el pasado. |
| D-4 | La categoría es texto libre, no una lista cerrada. |
| D-5 | El Top 5 cuenta también las reservas canceladas (mide demanda). |
| D-6 | El `numero_serie` admite códigos internos del laboratorio. |
| D-7 | El material a granel se registra como kit, no por unidad. |
