# Qué hace el sistema (especificación)

> **Qué es este documento.** Antes de escribir una sola línea de código, hay
> que ponerse de acuerdo en **qué** debe hacer el programa. Este documento es
> ese acuerdo.
>
> A propósito **no habla de programación**: no menciona lenguajes, librerías
> ni archivos. Solo describe el comportamiento, para que cualquiera —incluso
> alguien del laboratorio que no programe— pueda leerlo y decir "sí, así
> funciona el préstamo" o "no, eso está mal".
>
> El **cómo** se construye está en [`plan.md`](plan.md), y el
> funcionamiento interno explicado desde cero en
> [`como-funciona.md`](como-funciona.md).

**Estado:** aprobada · **Reto:** 2 (Backend) · **Rama:** `1067961907-Reto2`

Alcance acordado: todo lo obligatorio más el punto extra de estadísticas
("Top 5"). Sin inicio de sesión con Google.

---

## 1. Para qué sirve el sistema

El Laboratorio Integrado de Sistemas presta equipos a estudiantes y docentes:

- Placas de desarrollo (Arduino, ESP32, Raspberry Pi)
- Material para armar circuitos (protoboards, jumpers, kits de componentes)
- Cables (USB-C, HDMI, red)
- Herramientas (crimpadoras, cortafríos, destornilladores, testers)

Hoy ese control se lleva a mano, y por eso es difícil saber qué hay, en qué
estado está y quién lo tiene apartado.

El sistema debe permitir tres cosas:

1. Llevar la lista de los equipos del laboratorio.
2. Apuntar quién reserva cada equipo y en qué horario.
3. **Impedir que dos personas reserven el mismo equipo a la misma hora.**

## 2. Quién lo usa

| Quién | Qué hace |
|---|---|
| **El auxiliar del laboratorio** | Registra equipos nuevos, corrige sus datos, los marca como dañados o en mantenimiento, consulta todas las reservas y las estadísticas. |
| **Quien pide prestado** (estudiante o docente) | Consulta qué hay disponible, reserva un equipo, cancela su reserva y consulta las suyas. |

> ### ⚠️ Una limitación que conviene decir en voz alta
>
> En esta versión **no hay inicio de sesión**. Nadie tiene que identificarse
> para usar el sistema.
>
> Eso significa que el programa **no puede saber quién le está hablando**. Los
> dos papeles de la tabla describen para qué está pensado cada uso, pero el
> sistema no los impone: en la práctica, cualquiera que llegue a la API podría
> cancelar la reserva de otra persona.
>
> Se deja escrito aquí para que no parezca un descuido. Justamente ese era el
> punto opcional de autenticación, que quedó fuera por falta de tiempo.

## 3. Qué cosas guarda el sistema

El sistema necesita recordar **dos tipos de cosa**. En jerga se llaman
*entidades*; puedes pensarlas como **dos tipos de ficha** en un archivador.

### 3.1 Ficha de EQUIPO

Un objeto físico del laboratorio que se puede prestar. Desde una Raspberry Pi
hasta un destornillador.

| Dato | Qué es | ¿Obligatorio? | Reglas |
|---|---|---|---|
| **Identificador** | Un número que distingue a este equipo de los demás (1, 2, 3…). | Sí | Lo pone el sistema solo. Tú nunca lo eliges. |
| **Nombre** | Cómo se llama. Ej. *"Arduino Uno R3"*, *"Crimpadora RJ45"*. | Sí | No puede estar vacío. |
| **Número de serie** | El código que identifica **físicamente** a ese objeto concreto. Puede ser el número de fábrica, una dirección MAC o un código que invente el laboratorio. | Sí | **No puede repetirse** en todo el sistema (ver decisión D-6). |
| **Categoría** | El grupo al que pertenece. Ej. *Microcontroladores*, *Herramientas*, *Cables*. | Sí | Texto libre (ver decisión D-4). |
| **Estado** | En qué situación está el equipo. | Sí | Solo tres valores posibles (ver abajo). Por defecto, `DISPONIBLE`. |
| **Fechas de registro y cambio** | Cuándo se dio de alta y cuándo se modificó por última vez. | Sí | Las pone el sistema solo. |

**Los tres estados posibles de un equipo:**

| Estado | Significa |
|---|---|
| `DISPONIBLE` | Está en el laboratorio y se puede prestar. |
| `MANTENIMIENTO` | Lo están revisando o reparando. No se presta. |
| `DAÑADO` | Está averiado. No se presta. |

### 3.2 Ficha de RESERVA

Alguien aparta un equipo durante un rato.

| Dato | Qué es | ¿Obligatorio? | Reglas |
|---|---|---|---|
| **Identificador** | Un número que distingue esta reserva de las demás. | Sí | Lo pone el sistema. |
| **Equipo** | Qué equipo se está apartando. | Sí | Tiene que ser un equipo que exista. |
| **Nombre de quien reserva** | Cómo se llama la persona. | Sí | No puede estar vacío. |
| **Correo de quien reserva** | Su correo electrónico. | Sí | Tiene que tener forma de correo de verdad. |
| **Fecha y hora de inicio** | Cuándo empieza el préstamo. | Sí | — |
| **Fecha y hora de fin** | Cuándo termina. | Sí | Tiene que ser **posterior** al inicio. |
| **Estado** | Si la reserva sigue en pie o se anuló. | Sí | `ACTIVA` o `CANCELADA`. Por defecto, `ACTIVA`. |
| **Fecha de registro** | Cuándo se apuntó la reserva. | Sí | La pone el sistema. |

### 3.3 ¿Y una ficha de USUARIO?

**No existe.** Decisión **D-1**: quien reserva se identifica solo con su
nombre y su correo, escritos dentro de la propia reserva.

- **Lo que se descartó:** crear un tercer tipo de ficha para las personas, con
  su registro previo, y que la reserva apuntara a ella.
- **Por qué se descartó:** el enunciado dice que basta con "nombre y correo",
  sin exigir registro. Crear esa ficha obligaría a añadir un proceso de alta
  de usuarios y más operaciones, sin aportar nada a lo que se pide. Si algún
  día se añadiera el inicio de sesión con Google, ese sería el momento natural
  de crearla.
- **Lo que aceptamos a cambio:** si la misma persona reserva dos veces
  escribiendo su nombre distinto ("Daniel" y "Daniel H."), el sistema lo ve
  como dos textos diferentes. Para el alcance de esta prueba, da igual.

### 3.4 Cómo se relacionan las dos fichas

```
   ┌───────────────┐                          ┌────────────────┐
   │    EQUIPO     │ 1                      N │    RESERVA     │
   │               │──────────────────────────│                │
   │ identificador │   "un equipo puede       │ identificador  │
   │ nombre        │    tener muchas          │ equipo ────────┼──▶ apunta
   │ nº de serie   │    reservas a lo         │ quien reserva  │    al equipo
   │ categoría     │    largo del tiempo,     │ desde / hasta  │
   │ estado        │    pero cada reserva     │ estado         │
   │               │    es de UN solo         │                │
   │               │    equipo"               │                │
   └───────────────┘                          └────────────────┘
```

El "1" y la "N" se leen así: **un** equipo puede tener **muchas** (N) reservas
a lo largo del tiempo, pero cada reserva pertenece a **un solo** equipo.

### 3.5 El inventario real, como referencia

El sistema no trae ninguna lista fija de equipos ni de categorías (ver D-4),
pero conviene comprobar la especificación contra lo que el laboratorio presta
de verdad:

| Categoría sugerida | Qué agrupa |
|---|---|
| `Microcontroladores` | Arduino (Uno, Nano…), ESP32 |
| `Computadores` | Raspberry Pi 4 |
| `Prototipado` | Protoboards, jumpers, kits de componentes (resistencias, LEDs, capacitores) |
| `Cables` | USB-C, HDMI, cables de red |
| `Herramientas` | Crimpadoras, cortafríos, destornilladores, testers/multímetros |

#### Decisión D-6 — el número de serie puede ser un código inventado

Buena parte de lo que se presta **no trae número de serie de fábrica**: un
destornillador, un cortafríos o una bolsa de jumpers no vienen numerados.

Por eso el campo admite tres cosas: el número de fábrica, una dirección MAC, o
**un código que asigne el propio laboratorio** (por ejemplo `HERR-CRIMP-001`)
y se pegue físicamente en el objeto.

- **Lo que se descartó:** dejar el campo vacío para esos artículos.
- **Por qué se descartó:** si puede quedar vacío, se pierde la única forma de
  distinguir **dos protoboards idénticas** al prestarlas y de saber cuál
  volvió. Exigirlo siempre —aunque sea una etiqueta pegada con cinta— es justo
  lo que hace que el inventario sirva de algo.

#### Decisión D-7 — lo que va suelto se registra como kit

Los jumpers, LEDs y componentes no se prestan de uno en uno. Cada **kit** que
sale del laboratorio se registra como **un solo equipo**, con su código
propio: por ejemplo *"Kit jumpers macho-macho (40 unidades)"*, código
`JUMP-MM-01`.

- **Lo que se descartó:** añadir un campo de cantidad e ir descontando
  unidades en cada préstamo.
- **Por qué se descartó:** eso convertiría el sistema en un control de
  existencias, con reservas parciales, devoluciones incompletas y "cuántas
  quedan libres en tal horario". Multiplicaría la dificultad de la regla más
  importante del sistema, y el enunciado no lo pide en ningún momento. Tratar
  el kit como una unidad prestable mantiene **una sola regla** para todo el
  inventario.

## 4. Qué se puede hacer con el sistema

Estas son las ocho operaciones. En jerga se llaman *casos de uso*: cada una
describe algo que alguien quiere conseguir.

### CU-01 · Registrar un equipo
El auxiliar añade un equipo al inventario, indicando nombre, número de serie,
categoría y estado. El sistema le asigna un identificador y se lo devuelve.

### CU-02 · Actualizar un equipo
El auxiliar corrige los datos de un equipo (por ejemplo lo pasa a
`MANTENIMIENTO`). Puede enviar **solo los campos que quiere cambiar**; el
resto se queda como estaba.

### CU-03 · Consultar un equipo
Cualquiera pide los datos de un equipo concreto usando su identificador.

### CU-04 · Ver el inventario con páginas y filtros
Cualquiera consulta la lista de equipos. Como puede haber muchos, llega **por
páginas** en vez de todo de golpe, y se puede filtrar por **categoría**, por
**estado**, o por las dos cosas a la vez. Junto a los equipos, la respuesta
dice cuántos hay en total y cuántas páginas existen.

### CU-05 · Reservar un equipo
Una persona aparta un equipo indicando su nombre, su correo y el horario
(desde cuándo hasta cuándo). El sistema comprueba **todas** las reglas de la
sección 5 y, si todo está bien, guarda la reserva como `ACTIVA`.

### CU-06 · Cancelar una reserva
Una persona anula una reserva. **La reserva no se borra**: pasa a estado
`CANCELADA` y sigue apareciendo en los listados, para que quede constancia de
lo que se pidió.

### CU-07 · Ver las reservas
Se consultan las reservas, por páginas, pudiendo filtrar por equipo, por
correo de quien reservó y/o por estado. Con eso se cubren tanto "ver las
reservas de este Arduino" como "ver mis reservas".

### CU-08 · Ver el ranking de equipos más pedidos *(extra)*
Se consultan los 5 equipos con más reservas de la historia, para saber qué
recursos son los más demandados.

> **Algo que el sistema NO hace, a propósito: borrar equipos.**
>
> El enunciado pide registrar, actualizar y consultar. Borrar un equipo del
> que cuelgan reservas destruiría ese historial. Si un equipo sale de
> circulación, se marca como `DAÑADO`.

## 5. Las reglas que nunca se pueden romper

Estas son las condiciones que el sistema debe hacer cumplir **siempre**, sin
importar quién lo use ni cómo.

| Nº | Regla | Qué pasa si se incumple |
|---|---|---|
| **RN-01** | Dos equipos no pueden tener el mismo número de serie. | Se rechaza y se avisa del conflicto. |
| **RN-02** | La hora de fin de una reserva tiene que ser **posterior** a la de inicio. | Se rechaza indicando que el horario es imposible. |
| **RN-03** | ⭐ **Un equipo no puede tener dos reservas activas cuyos horarios se crucen.** | Se rechaza avisando de que ya está reservado en esa franja. |
| **RN-04** | Solo las reservas `ACTIVA` ocupan horario. Una reserva cancelada **libera su franja al instante**. | — |
| **RN-05** | Solo se puede reservar un equipo que exista. | Se avisa de que no se encontró. |
| **RN-06** | Solo se puede reservar un equipo `DISPONIBLE`. Uno en mantenimiento o dañado no se presta. | Se rechaza indicando que no está disponible. |
| **RN-07** | Una reserva ya cancelada no se puede volver a cancelar. | Se rechaza avisando de que ya estaba cancelada. |

### 5.1 La regla estrella, explicada del todo

La RN-03 es la más importante del enunciado, así que hay que dejarla sin
ninguna ambigüedad. La pregunta a resolver es: **¿cuándo se cruzan dos
horarios?**

Parece obvio hasta que intentas escribirlo. Sobre una reserva que ya existe
de **9:00 a 11:00**, hay **cinco formas distintas de chocar** y dos de no
hacerlo:

```
  Reserva que ya existe:        09:00 ████████████ 11:00


  A) 10:00 ─ 12:00                    ████████████        ✗ CHOCA
     empieza en medio de la otra

  B) 08:00 ─ 10:00              ████████████              ✗ CHOCA
     termina en medio de la otra

  C) 09:30 ─ 10:30                   ██████               ✗ CHOCA
     cabe enterita dentro

  D) 08:00 ─ 12:00            ████████████████████        ✗ CHOCA
     se la traga entera

  E) 09:00 ─ 11:00              ████████████              ✗ CHOCA
     es exactamente la misma


  F) 11:00 ─ 13:00                          ████████████  ✓ LIBRE
     empieza justo cuando la otra acaba

  G) 07:00 ─ 09:00        ████████                        ✓ LIBRE
     acaba justo cuando la otra empieza
```

En vez de escribir cinco comprobaciones, hay una forma de resumirlo:

> **Dos horarios se cruzan si uno empieza antes de que el otro termine
> Y termina después de que el otro empiece.**

Compruébalo con el caso **C**: empieza a las 9:30, ¿antes de que la otra
termine (11:00)? Sí. Termina a las 10:30, ¿después de que la otra empiece
(9:00)? Sí. Las dos se cumplen → chocan. ✓

Y con el caso **F**: empieza a las 11:00, ¿antes de que la otra termine
(11:00)? **No**, es justo en ese momento, no antes. Con que una falle, ya no
chocan → libre. ✓

#### Decisión D-2 — tocarse por el extremo NO es chocar

Los casos **F** y **G** se permiten. Una reserva de 9:00 a 11:00 y otra de
11:00 a 13:00 conviven sin problema.

- **Por qué:** es lo que pasa en la vida real. A las 11:00 una persona
  devuelve el Arduino y la siguiente lo recoge. Es el mismo instante y no hay
  ningún conflicto.
- **Si se hiciera al revés**, sería **imposible prestar el mismo equipo dos
  veces seguidas** en un día, y el laboratorio perdería la mitad de su
  capacidad de préstamo por una tecnicidad.

### 5.2 Otras tres decisiones que conviene dejar por escrito

#### Decisión D-3 — se permiten reservas con fechas pasadas

El sistema **no** comprueba que la reserva empiece en el futuro.

- **Lo que se descartó:** rechazar cualquier reserva que empiece antes de
  ahora mismo.
- **Por qué se descartó:** el laboratorio puede necesitar **apuntar después**
  un préstamo que ya ocurrió (alguien se llevó algo y se registra al día
  siguiente). Además, esa validación obligaría a que las pruebas automáticas
  usaran siempre fechas que se mueven solas, complicándolas sin ganar nada.
  Las reglas RN-02 y RN-03 se siguen aplicando igual sobre fechas pasadas.

#### Decisión D-4 — la categoría es texto libre, no una lista cerrada

- **Lo que se descartó:** una lista fija de categorías permitidas.
- **Por qué se descartó:** el propio enunciado pone las categorías como
  *ejemplos* ("ej. Microcontroladores, VR, Redes"), y el inventario real
  (§3.5) ya no coincide con esa lista: se prestan herramientas de crimpado,
  cables y material de prototipado que ahí no aparecen. Esa es justamente la
  prueba de que dejar la lista fija en el código obligaría a modificarlo cada
  vez que el laboratorio compre algo de un tipo nuevo.

#### Decisión D-5 — el ranking cuenta también las reservas canceladas

El "Top 5" mide **cuántas veces se ha pedido** un equipo, no cuántos préstamos
se completaron.

- **Por qué:** si un equipo se solicita veinte veces y quince se cancelan,
  sigue siendo un equipo **muy demandado**, y eso es exactamente lo que
  interesa saber para decidir si conviene comprar otro. Queda escrito en la
  documentación de la operación para que nadie interprete mal el número.

## 6. Cómo sabremos que está bien hecho

Estos son los **criterios de aceptación**: la lista de comprobaciones que
deciden si cada funcionalidad quedó bien. Están escritos de forma que se
pueden comprobar objetivamente — y muchos se convirtieron en pruebas
automáticas.

### Equipos

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-01 | Registro un equipo con todos sus datos correctos | Se crea, recibo su identificador y luego aparece en el listado. |
| CA-02 | Registro un equipo con un número de serie que ya existe | Se rechaza por conflicto y **no se crea nada**. |
| CA-03 | Registro un equipo sin nombre, sin categoría o sin número de serie | Se rechaza diciéndome qué campo falta. |
| CA-04 | Registro un equipo con un estado inventado | Se rechaza mostrándome los valores permitidos. |
| CA-05 | Cambio **solo** el estado de un equipo | Cambia el estado y **el nombre y la categoría siguen intactos**. |
| CA-06 | Consulto o modifico un equipo que no existe | Se me avisa de que no se encontró. |
| CA-07 | Pido la página 1 de tamaño 10, habiendo 12 equipos | Recibo 10 equipos y se me indica que hay 12 en total y 2 páginas. |
| CA-08 | Filtro por categoría | Recibo **solo** los de esa categoría, y el total refleja ese grupo, no el inventario entero. |
| CA-09 | Filtro por categoría **y** estado a la vez | Recibo solo los que cumplen las dos condiciones. |
| CA-10 | Filtro por algo que no existe | Recibo una lista vacía y total 0 — **no un error**. |

### Reservas

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-11 | Reservo un equipo disponible en un horario libre | Se crea la reserva como `ACTIVA`. |
| CA-12 | Reservo en un horario que se cruza con otra reserva activa (casos A–E) | Se rechaza por conflicto, con un mensaje que explica por qué, y no se crea nada. |
| CA-13 | Reservo justo cuando termina otra reserva (casos F y G) | Se crea correctamente. |
| CA-14 | Reservo un horario que se cruza con una reserva **cancelada** | Se crea correctamente: las canceladas no ocupan. |
| CA-15 | Reservo poniendo la hora de fin antes o igual que la de inicio | Se rechaza indicando que el horario es imposible. |
| CA-16 | Reservo un equipo que no existe | Se me avisa de que no se encontró. |
| CA-17 | Reservo un equipo en mantenimiento o dañado | Se rechaza indicando que no está disponible. |
| CA-18 | Reservo poniendo un correo que no es un correo | Se rechaza señalando el problema del correo. |
| CA-19 | Cancelo una reserva activa | Pasa a `CANCELADA`, **sigue apareciendo** en los listados y su horario queda libre. |
| CA-20 | Cancelo una reserva que ya estaba cancelada | Se rechaza avisándome. |
| CA-21 | Listo reservas filtrando por equipo, por correo o por estado | Recibo solo las que cumplen el filtro, por páginas. |
| CA-22 | ⭐ Dos personas reservan el mismo equipo y horario **exactamente a la vez** | **Solo una lo consigue**; la otra recibe el conflicto. |

### Estadísticas (extra)

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-23 | Consulto el ranking habiendo reservas | Recibo como máximo 5 equipos, del más al menos pedido, con su número de reservas. |
| CA-24 | Consulto el ranking sin ninguna reserva | Recibo una lista vacía — **no un error**. |

### Del proyecto en general

| Nº | Criterio |
|---|---|
| CA-25 | Todo se enciende con **un solo comando**, base de datos incluida, sin instalar nada a mano. |
| CA-26 | Existe una página donde se puede ver y probar cada operación, sin leer el código. |
| CA-27 | Cada parte del código está documentada explicando qué hace, qué recibe, qué devuelve y por qué existe. |
| CA-28 | Existen pruebas automáticas que cubren, como mínimo, la regla estrella (RN-03) en **todos** los casos del dibujo de §5.1. |
| CA-29 | Los datos **sobreviven** al apagar y encender el sistema (se guardan de verdad, no en memoria). |

## 7. Lo que este sistema NO hace

Se deja por escrito para que no parezca un olvido:

- **Inicio de sesión** con Google (era opcional; fuera por tiempo).
- **Borrar equipos** físicamente (ver el aviso al final de §4).
- **Fichas de usuario** como cosa aparte (ver D-1).
- **Avisos por correo**, recordatorios o registro de devoluciones.
- **Control de cantidades** del material a granel: cada kit prestable es un
  equipo con su propio código (ver D-7).
- **Interfaz gráfica**: eso corresponde al Reto 3.

## Anexo · Todas las decisiones de un vistazo

| Nº | Decisión | Dónde se explica |
|---|---|---|
| D-1 | No hay ficha de usuario; quien reserva son dos campos de la reserva. | §3.3 |
| D-2 | Tocarse por el extremo no cuenta como cruce de horarios. | §5.1 |
| D-3 | Se permiten reservas con fechas pasadas. | §5.2 |
| D-4 | La categoría es texto libre, no una lista cerrada. | §5.2 |
| D-5 | El ranking cuenta también las reservas canceladas. | §5.2 |
| D-6 | El número de serie admite códigos inventados por el laboratorio. | §3.5 |
| D-7 | El material a granel se registra como kit, no por unidad. | §3.5 |
