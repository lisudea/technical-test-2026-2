# Cómo funciona el programa por dentro

> **Para quién es este documento:** para cualquiera que quiera entender el
> proyecto sin saber nada de backend. No se da por sabido ningún término:
> todos se explican la primera vez que aparecen.
>
> Empieza por lo general y va bajando al detalle. Las partes difíciles
> (§5 en adelante) se explican despacio, con dibujos.

## Índice

1. [La idea en una frase](#1-la-idea-en-una-frase)
2. [Las tres piezas del proyecto](#2-las-tres-piezas-del-proyecto)
3. [El viaje de una petición, paso a paso](#3-el-viaje-de-una-petición-paso-a-paso)
4. [Qué hace cada archivo](#4-qué-hace-cada-archivo)
5. [Difícil #1: por qué hay dos clases para lo mismo](#5-difícil-1-por-qué-hay-dos-clases-para-la-misma-cosa)
6. [Difícil #2: sesiones, transacciones y el rollback](#6-difícil-2-sesiones-transacciones-y-por-qué-existe-el-rollback)
7. [Difícil #3: cuándo se cruzan dos horarios](#7-difícil-3-cuándo-se-cruzan-dos-horarios)
8. [Difícil #4: el problema de las dos personas a la vez](#8-difícil-4-el-problema-de-las-dos-personas-a-la-vez)
9. [Difícil #5: la restricción que salva el día](#9-difícil-5-la-restricción-que-salva-el-día)
10. [Difícil #6: las migraciones](#10-difícil-6-las-migraciones)
11. [Difícil #7: por qué la paginación hace dos consultas](#11-difícil-7-por-qué-la-paginación-hace-dos-consultas)
12. [Preguntas que te puedes estar haciendo](#12-preguntas-que-te-puedes-estar-haciendo)

---

## 1. La idea en una frase

El laboratorio presta cosas (Arduinos, protoboards, destornilladores…) y
necesita llevar la cuenta de **qué tiene** y **quién lo va a usar y cuándo**.

Este programa es el **cuaderno digital** donde se apunta todo eso, con una
regla que nunca se puede romper: *dos personas no pueden llevarse el mismo
Arduino a la misma hora*.

## 2. Las tres piezas del proyecto

Imagina el mostrador de préstamos del laboratorio. Hay tres elementos:

```
   ┌──────────────┐        ┌──────────────────┐        ┌────────────────┐
   │  Quien pide  │  ───►  │  El encargado    │  ───►  │  El archivador │
   │   algo       │        │  del mostrador   │        │   de fichas    │
   │              │  ◄───  │                  │  ◄───  │                │
   └──────────────┘        └──────────────────┘        └────────────────┘
     tú, desde el              LA API                    LA BASE DE DATOS
     navegador                (FastAPI)                   (PostgreSQL)
```

### La API

**API** significa *interfaz de programación de aplicaciones*. Suena
complicado, pero es simplemente **un programa sin pantalla**: no tiene
botones ni ventanas. Solo recibe peticiones y devuelve respuestas.

Es el encargado del mostrador: tú le pides algo, él va al archivador, lo
consulta o lo apunta, y te contesta.

Que sea **REST** significa que sigue unas convenciones muy extendidas para
organizar esas peticiones (las verás en §3).

### La base de datos

Es el **archivador**: donde quedan guardadas las fichas de verdad. Si apagas
el programa y lo vuelves a encender, las fichas siguen ahí.

Usamos **PostgreSQL**, que es un archivador muy bueno: además de guardar, es
capaz de **hacer cumplir reglas por sí mismo** (esto será importantísimo en
§9).

### Docker

**Docker** es una caja que lleva dentro el programa y todo lo que necesita
para funcionar: el lenguaje, las librerías, la configuración.

Piensa en una **lonchera**: en vez de esperar que en el destino haya cocina,
plato y cubiertos, lo llevas todo dentro. Da igual en qué computador la
abras: dentro siempre hay lo mismo.

Por eso no necesitas instalar Python ni PostgreSQL: están dentro de la caja.

## 3. El viaje de una petición, paso a paso

Vamos a seguir una petición real desde que sale de tu navegador hasta que
vuelve. La petición es: **"quiero reservar el Arduino nº 1 mañana de 9 a 11"**.

### El formato de la petición

```
POST /reservas          ← el "verbo" y la "dirección"
{
  "equipo_id": 1,                                  ┐
  "solicitante_nombre": "Daniel",                  │  el "cuerpo":
  "solicitante_correo": "daniel@udea.edu.co",      │  los datos que envías,
  "fecha_hora_inicio": "2026-09-01T09:00:00Z",     │  en formato JSON
  "fecha_hora_fin": "2026-09-01T11:00:00Z"         ┘
}
```

- **El verbo** dice *qué tipo de acción* quieres. Son solo cuatro:

  | Verbo | Significa | Ejemplo aquí |
  |---|---|---|
  | `GET` | "dame información" | ver la lista de equipos |
  | `POST` | "crea algo nuevo" | registrar un equipo, hacer una reserva |
  | `PATCH` | "cambia estos campos" | poner un equipo en mantenimiento |
  | `DELETE` | "borra esto" | *(no lo usamos, ver §12)* |

- **La dirección** (`/reservas`) dice *sobre qué* actúas.
- **JSON** es solo una forma de escribir datos con llaves y comillas, para
  que un programa los entienda. Se parece mucho a una lista de "campo: valor".

### El recorrido completo

```
  NAVEGADOR
      │  POST /reservas  { equipo_id: 1, ... }
      ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. main.py                                                   │
  │    Mira la dirección "/reservas" y decide quién la atiende.  │
  │    → se la pasa a routers/reservas.py                        │
  └─────────────────────────────────────────────────────────────┘
      ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. schemas.py  ← EL PORTERO                                  │
  │    Revisa que los datos estén bien ANTES de tocar nada:      │
  │      · ¿están todos los campos?                              │
  │      · ¿el correo tiene forma de correo?                     │
  │      · ¿la hora de fin es posterior a la de inicio?          │
  │    Si algo falla → responde 422 y AQUÍ SE ACABA el viaje.    │
  └─────────────────────────────────────────────────────────────┘
      ▼  (los datos son válidos)
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. routers/reservas.py  ← LAS REGLAS DEL LABORATORIO         │
  │    a) ¿Existe el equipo nº 1?          si no → 404           │
  │    b) ¿Está DISPONIBLE?                si no → 409           │
  │    c) ¿Está libre esa franja horaria?  si no → 409           │
  └─────────────────────────────────────────────────────────────┘
      ▼  (todo en orden)
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. models.py + database.py  ← EL ARCHIVADOR                  │
  │    Convierte la reserva en una fila y la guarda.             │
  │    PostgreSQL hace una última comprobación por su cuenta.    │
  └─────────────────────────────────────────────────────────────┘
      ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 5. schemas.py otra vez                                       │
  │    Da forma a la respuesta: decide QUÉ campos se devuelven.  │
  └─────────────────────────────────────────────────────────────┘
      ▼  201 Created  { "id": 7, "estado": "ACTIVA", ... }
  NAVEGADOR
```

### Los números de la respuesta

Toda respuesta trae un número que resume cómo fue. Solo usamos cinco:

| Número | Nombre | Qué significa, en cristiano |
|---|---|---|
| `200` | OK | "Listo, aquí tienes." |
| `201` | Created | "Listo, lo creé." |
| `404` | Not Found | "Eso que pides no existe." |
| `409` | Conflict | "Lo que pides está bien escrito, **pero choca con la realidad**." |
| `422` | Unprocessable | "Lo que enviaste está mal escrito." |

**La diferencia entre `409` y `422` es la más importante del proyecto:**

- `422` → *"escribiste mal la petición"*. Ejemplo: pusiste el correo
  `pepito-arroba-gmail`. Eso no es un correo, está mal escrito.
- `409` → *"escribiste bien, pero no se puede"*. Ejemplo: pediste el Arduino
  de 9 a 11. La petición es perfecta; el problema es que **otra persona ya lo
  tiene** en ese horario.

Es como en una tienda: pedir "un kilo de arroz" está bien dicho (no es `422`);
que se haya agotado es otra cosa (`409`).

## 4. Qué hace cada archivo

Solo hay **8 archivos de código**. Cada uno tiene un trabajo:

```
app/
├── main.py          → El recepcionista: recibe y reparte las peticiones
├── database.py      → El cable hacia el archivador (y la paginación)
├── models.py        → Cómo son las fichas del archivador (las tablas)
├── schemas.py       → El portero: qué se puede enviar y qué se devuelve
├── datos_ejemplo.py → Rellena el archivador con datos de prueba
└── routers/
    ├── equipos.py      → Todo lo relativo al inventario
    ├── reservas.py     → Todo lo relativo a las reservas ⭐ el más importante
    └── estadisticas.py → El ranking de equipos más pedidos
```

**¿Por qué tan pocos archivos?** Porque solo hay dos tipos de cosa que
guardar (equipos y reservas). Muchos proyectos separan el código en cuatro o
cinco capas; aquí eso significaría abrir cinco archivos para seguir una
operación de diez líneas. Menos archivos = más fácil de seguir.

---

## 5. Difícil #1: por qué hay dos clases para la misma cosa

Al mirar el código verás que "Equipo" aparece **dos veces**: en `models.py` y
en `schemas.py`. No es un error ni una duplicación por descuido.

### La diferencia

```
   models.py                         schemas.py
   ─────────                         ──────────
   Cómo se GUARDA                    Cómo se ENVÍA y se RECIBE
   en el archivador                  por la red

   ┌────────────────────┐            ┌────────────────────┐
   │ id            ✓    │            │ id            ✗ ←──┼── ¡tú no lo eliges!
   │ nombre        ✓    │            │ nombre        ✓    │    lo pone el sistema
   │ numero_serie  ✓    │            │ numero_serie  ✓    │
   │ categoria     ✓    │            │ categoria     ✓    │
   │ estado        ✓    │            │ estado        ✓    │
   │ creado_en     ✓    │            │ creado_en     ✗ ←──┼── tampoco
   │ actualizado_en✓    │            │ actualizado_en✗    │
   └────────────────────┘            └────────────────────┘
      la TABLA                          el FORMULARIO
```

**La analogía:** en una biblioteca, la ficha interna de un libro tiene el
código de estantería, la fecha de compra y el precio. El formulario que tú
rellenas para pedirlo solo tiene tu nombre y el título. **Son dos cosas
distintas aunque hablen del mismo libro.**

### Por qué importa

Si fueran lo mismo, alguien podría enviar `{"id": 999}` al crear un equipo e
intentar elegir su propio identificador, o mandar una fecha de creación
falsa. Al separarlos, **lo que el sistema controla nunca puede llegar desde
fuera**.

Además, al actualizar hace falta un formulario distinto (`EquipoActualizar`),
donde *todos* los campos son opcionales, porque puedes querer cambiar solo uno.

## 6. Difícil #2: sesiones, transacciones y por qué existe el rollback

### Qué es una sesión

Una **sesión** es una conversación con la base de datos. Se abre cuando llega
una petición y se cierra cuando termina.

¿Por qué no dejarla abierta siempre? Porque cada conversación consume un
"teléfono" de la base de datos, y hay un número limitado. Si no se cuelga al
terminar, se acaban los teléfonos y el programa deja de responder. Por eso en
`database.py` el cierre está en un bloque `finally`: **se cuelga siempre**,
haya ido bien o mal.

### Qué es una transacción

Una **transacción** es un grupo de cambios que se aplican **todos o
ninguno**.

La analogía clásica: una transferencia bancaria son dos pasos —quitar $100 de
una cuenta y ponerlos en otra—. Si el sistema se cae entre medias, no puede
quedar el primero hecho y el segundo no: el dinero desaparecería. O los dos, o
ninguno.

- `commit()` = *"confirma todo lo que hice"*.
- `rollback()` = *"deshaz todo, como si nunca hubiera pasado"*.

### Por qué el rollback es obligatorio, no opcional

En el código verás esto varias veces:

```python
try:
    db.commit()
except IntegrityError:
    db.rollback()          # ← esta línea NO es opcional
    raise HTTPException(status_code=409, detail=...)
```

Si se quita esa línea, la sesión queda **envenenada**: PostgreSQL marca la
conversación como fallida y **rechaza todo lo que le pidas después**, aunque
sea correcto. No solo falla esa petición: fallan las siguientes que reutilicen
la conexión.

Es como una calculadora que muestra `ERROR`: hasta que no pulsas `C` para
limpiar, cualquier número que teclees sigue dando error. `rollback()` es esa
tecla `C`.

## 7. Difícil #3: cuándo se cruzan dos horarios

Esta es **la regla central del sistema**. Merece la pena entenderla del todo.

### El problema

Alguien ya reservó el Arduino de **9:00 a 11:00**. Llega otra persona y pide
un horario. ¿Choca o no choca?

La respuesta parece obvia hasta que intentas escribirla. Hay **cinco formas
distintas** de chocar:

```
  Reserva que ya existe:        09:00 ████████████ 11:00


  A) 10:00 ─ 12:00                    ████████████        ✗ CHOCA
     empieza en medio de la otra

  B) 08:00 ─ 10:00              ████████████              ✗ CHOCA
     termina en medio de la otra

  C) 09:30 ─ 10:30                   ██████               ✗ CHOCA
     está enterita dentro

  D) 08:00 ─ 12:00            ████████████████████        ✗ CHOCA
     se la traga entera

  E) 09:00 ─ 11:00              ████████████              ✗ CHOCA
     exactamente la misma


  F) 11:00 ─ 13:00                          ████████████  ✓ LIBRE
     empieza justo cuando la otra acaba

  G) 07:00 ─ 09:00        ████████                        ✓ LIBRE
     acaba justo cuando la otra empieza
```

### La fórmula (y por qué funciona)

Escribir cinco comprobaciones distintas sería largo y fácil de equivocar. Hay
un truco: **en vez de preguntar cuándo chocan, pregunta cuándo NO chocan.**

Dos horarios **no** chocan solo en dos situaciones: uno termina antes de que
empiece el otro, o empieza después de que el otro termine. Dándole la vuelta:

```
   CHOCAN  ⟺  (empiezo antes de que tú acabes)  Y  (acabo después de que tú empieces)

              inicio_nuevo < fin_viejo          Y      fin_nuevo > inicio_viejo
```

Comprueba tú mismo el caso **C** (09:30–10:30 contra 09:00–11:00):
- ¿`09:30 < 11:00`? Sí.
- ¿`10:30 > 09:00`? Sí.
- Las dos son ciertas → **chocan**. ✓ Correcto.

Y el caso **F** (11:00–13:00):
- ¿`11:00 < 11:00`? **No** (son iguales, no es "menor").
- Con que una falle, ya no chocan → **libre**. ✓ Correcto.

**Dos líneas cubren los siete casos.** Eso es lo que hace la función
`hay_solapamiento()` en `routers/reservas.py`.

### El detalle de los signos `<` y `>`

Fíjate en que son `<` y `>` **estrictos**, no `<=` ni `>=`. Ese detalle
minúsculo es el que decide los casos F y G.

- Con `<` y `>` → 9:00–11:00 y 11:00–13:00 **conviven**.
- Con `<=` y `>=` → chocarían, y sería **imposible prestar el mismo equipo
  dos veces seguidas en el mismo día**.

En la vida real, a las 11:00 una persona devuelve el Arduino y la siguiente
lo recoge. Es el mismo instante y no hay conflicto. Por eso los signos son
estrictos.

> Esto está probado: en `tests/test_reservas.py` los siete casos son una
> prueba automática. Y se comprobó que si alguien cambiara `<` por `<=`,
> **fallan exactamente los casos F y G** y ningún otro.

## 8. Difícil #4: el problema de las dos personas a la vez

Ya tenemos una función que detecta choques. Parecería que hemos terminado.
**No hemos terminado.**

### El agujero

Imagina que Ana y Beto pulsan "Reservar" **en el mismo segundo**, los dos para
el mismo Arduino de 9 a 11. El programa atiende las dos peticiones a la vez
(eso es normal: un servidor atiende a muchas personas simultáneamente).

```
   tiempo →

   ANA                                  BETO
   ────                                 ────
   1. ¿Está libre de 9 a 11?
      → la base dice: SÍ, está libre
                                        2. ¿Está libre de 9 a 11?
                                           → la base dice: SÍ, está libre
                                              ↑
                                              ¡Ana todavía no ha guardado!

   3. Guardo la reserva de Ana ✓
                                        4. Guardo la reserva de Beto ✓

   RESULTADO: DOS reservas del mismo Arduino a la misma hora 💥
```

Los dos preguntaron **antes** de que el otro guardara. Los dos recibieron
"está libre". Los dos guardaron. Y la regla más importante del sistema se
rompió.

### Por qué no se arregla con más código Python

Este hueco entre *"pregunto"* y *"guardo"* existe **siempre**, por muy rápido
que sea el programa. Puedes hacerlo más pequeño, pero no puedes eliminarlo
desde el código de la aplicación: entre las dos instrucciones siempre cabe
otra petición.

Es como comprobar que un asiento del cine está vacío y luego sentarte: entre
que miras y te sientas, otro puede haberse sentado.

**La única forma de cerrarlo es que la comprobación y el guardado sean la
misma cosa, indivisible.** Y eso solo lo puede hacer quien guarda: la base de
datos.

## 9. Difícil #5: la restricción que salva el día

### Qué es una restricción

Una **restricción** (*constraint*) es una regla que la base de datos hace
cumplir **ella misma**, sin depender del programa.

Ya conoces una aunque no lo sepas: cuando un formulario web te dice *"ese
correo ya está registrado"*, por debajo suele haber una restricción `UNIQUE`
que impide dos filas con el mismo valor.

Nosotros necesitamos algo parecido, pero en vez de *"que no se repita un
valor"* queremos *"que no se crucen dos horarios"*.

### La restricción que usamos

PostgreSQL tiene exactamente eso. Se llama `EXCLUDE` y así es como se declara
(está en la migración, `alembic/versions/b549d4459b29_*.py`):

```sql
ALTER TABLE reservas ADD CONSTRAINT reservas_sin_solape
EXCLUDE USING gist (
    equipo_id WITH =,
    tstzrange(fecha_hora_inicio, fecha_hora_fin) WITH &&
) WHERE (estado = 'ACTIVA');
```

Da respeto, pero se lee de corrido. Vamos línea por línea:

| Trozo | Qué dice |
|---|---|
| `EXCLUDE` | "No permitas que coexistan dos filas que cumplan **todo** lo siguiente…" |
| `equipo_id WITH =` | "…que sean del **mismo equipo** (`=` es 'igual')…" |
| `tstzrange(inicio, fin)` | "…y cuyo **rango de tiempo**…" |
| `WITH &&` | "…**se cruce** (`&&` es el símbolo de 'se solapan')." |
| `WHERE (estado = 'ACTIVA')` | "Y todo esto solo cuenta entre reservas activas." |

Traducido del todo:

> **"No pueden existir dos reservas activas del mismo equipo cuyos horarios se
> crucen."**

Que es, palabra por palabra, nuestra regla.

### Las tres piezas raras, explicadas

**1. `tstzrange`** — es un tipo de dato de PostgreSQL que representa *un
tramo de tiempo* como una sola cosa, en vez de dos fechas sueltas. Igual que
`5` es un número y `"hola"` es un texto, `[9:00, 11:00)` es un **rango**.

**2. `&&`** — es el operador "se solapan" para rangos. PostgreSQL sabe
comparar tramos entre sí, igual que sabe comparar números con `<`.

**Y aquí viene lo bonito:** ese corchete y ese paréntesis de `[9:00, 11:00)`
no son un error de escritura. Significan:

```
   [9:00        →  incluye las 9:00
          11:00)  →  NO incluye las 11:00
```

Es decir, **el rango incluye su inicio pero no su final**. Que es exactamente
la decisión que tomamos en §7 sobre los signos estrictos: 9:00–11:00 y
11:00–13:00 no chocan. **PostgreSQL ya funciona así por defecto**, así que la
regla del laboratorio y la regla del motor coinciden sin escribir ni una línea
extra.

**3. `USING gist`** — es el tipo de índice.

Un **índice** es como el índice alfabético al final de un libro: en vez de
leer las 500 páginas para encontrar "Arduino", vas al índice y saltas directo.
Las bases de datos usan índices para no revisar fila por fila.

El índice normal (`btree`) sabe ordenar cosas que se pueden poner en fila:
números, fechas, palabras. Pero **los tramos de tiempo no se pueden poner en
fila**: ¿va antes 9:00–11:00 o 10:00–12:00? Se pisan, no hay orden claro.

`gist` es un tipo de índice preparado para eso: cosas que se solapan. Por eso
hace falta activar la extensión `btree_gist`, que permite mezclar en el mismo
índice una comparación normal (`equipo_id =`) con una de solapamiento (`&&`).

### Cómo queda ahora la carrera de Ana y Beto

```
   ANA                                  BETO
   ────                                 ────
   1. ¿Está libre?  → SÍ
                                        2. ¿Está libre?  → SÍ
   3. Guardo ✓
                                        4. Guardo → ✗ POSTGRESQL LO RECHAZA
                                              │
                                              └─► la API lo traduce a 409
```

La base de datos **no puede** contener datos inválidos. Da igual cuántas
peticiones lleguen a la vez, ni si alguien inserta filas saltándose la API.

### Entonces, ¿para qué sirve la comprobación en Python?

Buena pregunta. Si la base de datos ya lo garantiza, ¿por qué comprobarlo
antes?

**Por el mensaje.** Si dejáramos que fallara siempre la base de datos, el
error sería un tecnicismo ilegible sobre restricciones violadas. La
comprobación previa permite responder algo útil:

> *"El equipo ya tiene una reserva activa que se cruza con esa franja horaria.
> Consulta las reservas del equipo para elegir un horario libre."*

**Las dos capas hacen cosas distintas:**

| Capa | Para qué | Cuándo actúa |
|---|---|---|
| Comprobación en Python | Dar un mensaje claro | Siempre, en el uso normal |
| Restricción `EXCLUDE` | Garantizar que es imposible | Solo en la carrera (muy raro) |

Quien usa la API recibe **el mismo `409`** en ambos casos: no nota por cuál de
los dos caminos pasó.

> Esto está comprobado en la práctica: se lanzaron **20 peticiones
> simultáneas** pidiendo exactamente la misma franja y solo **una** se guardó.

## 10. Difícil #6: las migraciones

### El problema que resuelven

La base de datos, recién creada, está **vacía**: no tiene tablas. Alguien
tiene que crearlas. ¿Quién y cuándo?

Podrías crearlas a mano la primera vez. Pero entonces:
- Quien clone el proyecto tendría que repetir esos pasos a mano y sin
  equivocarse.
- Si mañana añades una columna, cada persona debe acordarse de añadirla
  también, en su base y en la del servidor.

### La solución

Una **migración** es un archivo que describe un cambio en la estructura de la
base de datos. Se guardan en orden, numeradas.

**La analogía:** son las **instrucciones de montaje de un mueble**, paso a
paso. Cualquiera que las siga en orden acaba con el mueble idéntico. Y si
mañana el mueble lleva un cajón más, no rehaces el mueble: añades la hoja de
instrucciones nº 2.

Cada migración tiene dos partes:

- `upgrade()` → cómo aplicar el cambio (montar el cajón).
- `downgrade()` → cómo deshacerlo (desmontarlo).

En este proyecto hay **una sola** migración, la que crea las dos tablas y la
restricción de §9. Y se ejecuta **sola** al arrancar: el `docker-compose.yml`
lanza `alembic upgrade head` antes de encender el servidor. Por eso puedes
clonar el proyecto y no ejecutar ningún paso manual.

### El detalle que casi rompe todo

Hay un párrafo curioso en el `downgrade()`:

```python
op.drop_table('reservas')
op.drop_table('equipos')

op.execute("DROP TYPE IF EXISTS estado_reserva")   # ← ¿por qué esto?
op.execute("DROP TYPE IF EXISTS estado_equipo")
```

Las columnas `estado` no admiten cualquier texto: solo `DISPONIBLE`,
`MANTENIMIENTO` o `DAÑADO`. Para lograrlo, PostgreSQL crea un **tipo de dato
propio** (una "lista de valores permitidos") aparte de la tabla.

El detalle: **al borrar la tabla, ese tipo NO se borra.** Se queda flotando.

Si no lo eliminas a mano, la siguiente vez que montes la base desde cero,
PostgreSQL dirá *"ese tipo ya existe"* y **la migración fallará**.

Esto no es teoría: se probó el ciclo completo (`downgrade` → `upgrade`) y sin
esas dos líneas se rompía. Es la clase de fallo que no aparece hoy sino
dentro de tres semanas, cuando alguien intenta reconstruir la base.

## 11. Difícil #7: por qué la paginación hace dos consultas

### Qué es paginar

Si el laboratorio tuviera 5.000 equipos, devolverlos todos en una respuesta
sería lentísimo y nadie los lee de golpe. Se devuelven **por páginas**, como
los resultados de Google.

Tú pides `page=1&size=10` y recibes:

```json
{
  "items": [ ...10 equipos... ],
  "total": 23,          ← cuántos hay en TOTAL (con los filtros aplicados)
  "page": 1,
  "size": 10,
  "total_pages": 3
}
```

Sin `total` y `total_pages`, quien usa la API no sabría si debe pedir más
páginas o ya llegó al final.

### Las dos consultas

La función `paginar()` en `database.py` pregunta dos veces:

1. **"¿Cuántos hay en total?"** → `SELECT COUNT(*)`, que devuelve solo un
   número.
2. **"Dame los 10 de la página 1"** → `LIMIT 10 OFFSET 0`.

¿No sería más simple traerlos todos y contarlos en Python? Sería más simple
de escribir, sí — y **destruiría el propósito de paginar**: cargarías los
5.000 equipos en memoria para enseñar 10. Contar es baratísimo para una base
de datos; traer datos es lo caro.

### El detalle del orden

Verás que la consulta siempre termina con `.order_by(...)`. Parece cosmético.
No lo es.

Sin un orden explícito, PostgreSQL **no garantiza** devolver las filas siempre
igual. Podrías pedir la página 1, luego la 2, y encontrarte un equipo repetido
en ambas y otro que no aparece en ninguna. Con un orden fijo, las páginas
encajan.

Además se ordena por un segundo campo (`Equipo.nombre, Equipo.id`) para
**deshacer empates**: si dos equipos se llaman igual, el `id` decide cuál va
antes, y ese orden nunca cambia.

## 12. Preguntas que te puedes estar haciendo

### ¿Por qué `PATCH` y no `PUT` para actualizar?

- `PUT` significa *"reemplaza el equipo entero por esto"*. Si enviaras solo el
  estado, el nombre y la categoría se **borrarían**.
- `PATCH` significa *"cambia solo estos campos"*.

Como queremos poder mandar `{"estado": "MANTENIMIENTO"}` sin perder lo demás,
el verbo correcto es `PATCH`.

Esto se logra con `model_dump(exclude_unset=True)`: devuelve **solo los campos
que venían en la petición**, ignorando los que Pydantic rellenó por defecto.
Sin ese `exclude_unset`, actualizar el estado vaciaría el resto.

### ¿Por qué cancelar es `POST /reservas/1/cancelar` y no `DELETE`?

Porque **la reserva no se borra**. Cambia a estado `CANCELADA` y sigue
apareciendo en los listados.

¿Por qué no borrarla? Por dos razones:
1. **Historial**: saber qué se pidió, aunque luego se cancelara, es
   información útil (es lo que alimenta el ranking de equipos más pedidos).
2. **Honestidad**: usar `DELETE` para algo que no elimina nada confunde a
   quien lea la API.

### ¿Por qué los identificadores tienen huecos? (1, 3, 4…)

Porque los contadores de PostgreSQL **no se deshacen** con el `rollback`.

Si intentas registrar un equipo con un número de serie repetido, el intento
falla, pero el contador ya avanzó. El siguiente equipo se lleva el número
siguiente y queda un hueco.

**No es un fallo.** Es deliberado: si el contador se deshiciera, tendría que
bloquear a todos los demás mientras tanto, y las inserciones simultáneas se
harían lentísimas. Es un intercambio consciente: números bonitos a cambio de
velocidad, y ganan la velocidad y la simplicidad.

### ¿Por qué no se puede reservar un equipo en mantenimiento?

Porque no está físicamente disponible para prestar. La API responde `409` (no
`422`) porque la petición está bien escrita: lo que pasa es que choca con la
realidad del inventario.

### ¿Por qué el ranking cuenta también las reservas canceladas?

Porque mide **demanda**, no préstamos cumplidos. Si un equipo se pide veinte
veces y se cancela quince, sigue siendo un equipo muy solicitado — y esa es
justo la información útil para decidir si conviene comprar otro.

Está escrito en la documentación del endpoint para que nadie interprete mal el
número.

### ¿Por qué las pruebas usan PostgreSQL y no algo más ligero?

Existe SQLite, una base de datos diminuta que no necesita instalación y que
mucha gente usa para pruebas. Sería más cómodo.

Pero SQLite **no tiene** la restricción `EXCLUDE` de §9. Las pruebas pasarían
en verde sin comprobar la garantía más importante del sistema: tendrías la
tranquilidad sin tener la seguridad, que es peor que no tener pruebas.

### ¿Por qué las fechas guardan la zona horaria?

Porque comparar horarios sin saber de qué huso son es la forma clásica de
tener reservas que "no chocan en el papel" pero sí en la realidad. Si una
reserva dice "9:00" en Colombia y otra "9:00" en España, no son la misma hora.

Guardando la zona horaria (`TIMESTAMPTZ`), PostgreSQL normaliza todo por
dentro y las comparaciones de §7 son siempre correctas.

---

## Resumen en cinco frases

1. La API es un mostrador: recibe peticiones y consulta o apunta en la base de
   datos.
2. Antes de tocar nada, un portero (`schemas.py`) revisa que los datos estén
   bien escritos.
3. Luego se comprueban las reglas del laboratorio: que el equipo exista, esté
   disponible y su horario esté libre.
4. La regla del horario está protegida **dos veces**: en el código, para dar
   un mensaje claro; y en la base de datos, para que sea imposible saltársela
   aunque dos personas reserven en el mismo instante.
5. Todo está probado con 36 pruebas automáticas que se ejecutan con un
   comando.
