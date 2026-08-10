# Qué hace el tablero (especificación)

> **Qué es este documento.** Antes de escribir una línea de código hay que
> ponerse de acuerdo en **qué** debe hacer la aplicación. Este documento es ese
> acuerdo.
>
> A propósito **no habla de programación**: no menciona React, componentes ni
> archivos. Solo describe lo que una persona ve y puede hacer en la pantalla,
> para que cualquiera pueda leerlo y decir "sí, así lo quiero" o "no, eso está
> mal".
>
> El **cómo** se construye está en [`plan.md`](plan.md).

**Estado:** aprobada · **Reto:** 3 (Frontend) · **Rama:** `1067961907-reto3`

**Alcance acordado:** solo los requisitos obligatorios. **Sin el bonus de
internacionalización** (descartado por tiempo; ver §7).

---

## 1. Qué es esta aplicación

Una página web que le muestra al personal del laboratorio, de un vistazo:

- **Qué equipos hay** y en qué estado está cada uno, con colores.
- **Cuáles están ocupados ahora mismo** y cuáles se pueden llevar.

Y le permite **reservar** un equipo o **cancelar** una reserva.

Es la cara visible de la API construida en el Reto 2: todo lo que muestra
viene de ahí, y todo lo que el usuario hace se le envía.

```
   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
   │   PERSONA    │ ──────► │  ESTA APP    │ ──────► │  API DEL     │
   │  (navegador) │ ◄────── │  (el tablero)│ ◄────── │   RETO 2     │
   └──────────────┘         └──────────────┘         └──────────────┘
                              muestra y                guarda los
                              recoge datos             datos de verdad
```

## 2. Las pantallas

La aplicación tiene **una sola página** y **un panel emergente**. No hay menús
de navegación ni varias secciones, porque no hacen falta.

### P-1 · Tablero (la página principal)

Es lo primero y único que se ve al abrir la aplicación. De arriba abajo:

```
┌──────────────────────────────────────────────────────────┐
│  LIS · Monitoreo de Equipos            [23 equipos]      │  ← cabecera
├──────────────────────────────────────────────────────────┤
│  Categoría [ Todas ▾ ]   Estado [ Todos ▾ ]   [Limpiar]  │  ← filtros
├──────────────────────────────────────────────────────────┤
│  🟢 Disponible  🔴 Reservado  ⚪ Mantenimiento  🟠 Dañado │  ← leyenda
├──────────────────────────────────────────────────────────┤
│                                                          │
│   🟢 Arduino Uno R3            Microcontroladores        │
│      ARD-UNO-001                            [Reservar]   │  ← un equipo
│                                                          │
│   🔴 ESP32 DevKit V1           Microcontroladores        │
│      ESP32-001        Ocupado hasta las 11:00     [Ver]  │
│                                                          │
│   ⚪ Tester digital            Herramientas              │
│      HERR-TEST-001            En mantenimiento           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│              ‹ Anterior    Página 1 de 3   Siguiente ›   │  ← paginación
└──────────────────────────────────────────────────────────┘
```

Sus cinco partes:

1. **Cabecera** con el título y cuántos equipos se están mostrando.
2. **Panel de filtros**: categoría y estado. Al cambiarlos, la lista se
   actualiza **sin recargar la página**.
3. **Leyenda de colores**, para que nadie tenga que adivinar qué significa
   cada color.
4. **Lista de equipos**, cada uno con su indicador de color, nombre, código,
   categoría y un botón de acción.
5. **Controles de página**, porque la API entrega los equipos por bloques.

### P-2 · Panel de reserva (emergente)

Se abre al pulsar el botón de un equipo y aparece **encima** del tablero, sin
salir de la página:

```
        ┌──────────────────────────────────────────────┐
        │  Arduino Uno R3                         [✕]  │
        │  ARD-UNO-001 · Microcontroladores            │
        ├──────────────────────────────────────────────┤
        │  RESERVAS ACTIVAS                            │
        │   • 10 ago 09:00 → 11:00  Daniel  [Cancelar] │
        │   • 10 ago 14:00 → 16:00  Ana     [Cancelar] │
        ├──────────────────────────────────────────────┤
        │  NUEVA RESERVA                               │
        │   Tu nombre    [________________]            │
        │   Tu correo    [________________]            │
        │   Desde        [__/__/____ __:__]            │
        │   Hasta        [__/__/____ __:__]            │
        │                                              │
        │   ⚠ Ese horario ya está ocupado.             │  ← zona de mensajes
        │                                              │
        │                [Cerrar]  [Reservar]          │
        └──────────────────────────────────────────────┘
```

Sirve para tres cosas a la vez: **ver** qué reservas tiene ese equipo (y por
tanto por qué está en rojo), **cancelar** una existente y **crear** una nueva.

## 3. Los cuatro colores y cuándo se usa cada uno

Esta es la regla visual central del Reto 3.

| Color | Significa | Cuándo se pinta |
|---|---|---|
| 🟢 **Verde** | Disponible | El equipo está operativo y **no** tiene ninguna reserva vigente ahora mismo. |
| 🔴 **Rojo** | Reservado | El equipo está operativo pero **alguien lo tiene reservado en este momento**. |
| ⚪ **Gris** | Mantenimiento | Lo están revisando o reparando. |
| 🟠 **Ámbar** | Dañado | Está averiado y fuera de servicio. |

### El detalle importante: de dónde sale el rojo

La API guarda **tres** estados para cada equipo: `DISPONIBLE`,
`MANTENIMIENTO` y `DAÑADO`. **No existe un estado "RESERVADO"**, y es a
propósito.

¿Por qué no existe? Porque si estuviera guardado como un dato más, alguien
tendría que acordarse de cambiarlo **cuando empieza cada reserva y cuando
termina**. En cuanto una vez se olvidara, el sistema estaría mintiendo: un
equipo marcado "reservado" cuya reserva terminó hace tres días.

Lo correcto es **deducirlo**: un equipo está reservado *ahora* si tiene alguna
reserva activa cuyo horario incluye este preciso instante. Así el dato nunca
puede quedar desactualizado, porque se calcula cada vez que se mira.

**Orden de prioridad al elegir el color** (gana el primero que se cumpla):

```
   1. ¿el estado guardado es MANTENIMIENTO?   → ⚪ Gris
   2. ¿el estado guardado es DAÑADO?           → 🟠 Ámbar
   3. ¿tiene una reserva activa AHORA MISMO?    → 🔴 Rojo
   4. en cualquier otro caso                     → 🟢 Verde
```

El estado físico **manda sobre** las reservas: si un equipo está roto, da
igual que alguien lo hubiera reservado antes de que se rompiera — se muestra
como dañado, no como reservado. Mostrarlo en rojo daría a entender que se lo
llevó alguien, cuando la realidad es que está averiado en un cajón.

> **Nota honesta:** el color **no se refresca solo** con el paso del tiempo.
> Si un equipo está reservado hasta las 11:00 y son las 10:59, no se pondrá
> verde solo por esperar un minuto con la página abierta.
>
> Se recalcula cada vez que se piden datos: al abrir la página, al filtrar, al
> cambiar de página y después de crear o cancelar una reserva. Es lo que pide
> el enunciado, y evita complicar el proyecto con actualizaciones automáticas
> que aquí no aportan nada.

## 4. Los flujos de usuario

Un **flujo** es el camino que recorre una persona para conseguir algo.

### F-1 · Ver el inventario
La persona abre la página. Mientras llegan los datos ve un aviso de
"cargando" — **nunca** una pantalla en blanco. Cuando llegan, aparece la lista
con sus colores y el total de equipos.

### F-2 · Filtrar
Elige una categoría y/o un estado. La lista se actualiza **al instante y sin
recargar la página**. El contador refleja cuántos equipos cumplen el filtro.
Un botón permite limpiar los filtros y volver a verlo todo.

El desplegable de estado ofrece **los cuatro colores de la leyenda**, incluido
"Reservado ahora", para que filtrar sea tan intuitivo como mirar la pantalla:
si ves puntos rojos, puedes pedir "solo los rojos".

Eso tiene una consecuencia técnica: la API no distingue entre "disponible" y
"reservado ahora" (para ella ambos son `DISPONIBLE`), así que esos dos filtros
los resuelve la propia aplicación. Se explica en `plan.md` §6.

### F-3 · Cambiar de página
Pulsa "Siguiente" o "Anterior". Los botones se desactivan solos cuando ya no
hay más páginas hacia ese lado. Al cambiar un filtro se vuelve a la página 1
(si no, podría quedarse mirando una página 5 que con el nuevo filtro ya no
existe, y vería una lista vacía sin entender por qué).

### F-4 · Ver por qué un equipo está ocupado
Pulsa el botón de un equipo en rojo. Se abre el panel con **sus reservas
activas**: quién lo tiene y hasta cuándo.

### F-5 · Reservar un equipo
En el panel escribe su nombre, su correo y el horario, y pulsa *Reservar*.

- **Si sale bien:** ve una confirmación, la lista se actualiza sola y el
  equipo cambia de color si corresponde.
- **Si falla:** ver F-7.

### F-6 · Cancelar una reserva
Pulsa *Cancelar* junto a una reserva. Se le pide confirmación (para no
cancelar sin querer) y, al aceptar, la reserva desaparece de las activas y el
equipo puede volver a verde.

### F-7 · Encontrarse con un error
Es el flujo que más cuida el enunciado. La persona **nunca** debe ver un
mensaje técnico ni una pantalla rota:

| Qué pasó | Qué se le muestra |
|---|---|
| El horario ya está ocupado | *"Ese horario ya está ocupado. Elige otro o revisa las reservas activas del equipo."* |
| El equipo está en mantenimiento o dañado | *"Este equipo no está disponible para préstamo ahora mismo."* |
| Falta un dato o está mal escrito | *"Revisa los datos: el correo debe ser válido y la hora de fin posterior a la de inicio."* |
| El equipo o la reserva ya no existe | *"No encontramos ese elemento. Puede que haya cambiado; recarga la página."* |
| **La API está apagada** o no hay red | *"No pudimos conectar con el servidor. Comprueba que el backend esté encendido."* |

Los mensajes aparecen **dentro del panel**, junto al formulario — no en una
ventana emergente del navegador — y desaparecen al corregir y reintentar.

## 5. Cómo se adapta a móvil y a computador

El enunciado pide que la interfaz **se adapte**, no que simplemente se
encoja. Por eso el tablero **cambia de forma** según el ancho de la pantalla:

```
   COMPUTADOR (pantalla ancha)          MÓVIL (pantalla estrecha)
   ───────────────────────────          ─────────────────────────
   Tabla de filas:                      Tarjetas apiladas:
   ┌────┬──────────┬───────┬─────┐      ┌────────────────────┐
   │ 🟢 │ Arduino  │ Micro │ [·] │      │ 🟢 Arduino Uno R3  │
   ├────┼──────────┼───────┼─────┤      │ ARD-UNO-001        │
   │ 🔴 │ ESP32    │ Micro │ [·] │      │ Microcontroladores │
   └────┴──────────┴───────┴─────┘      │       [Reservar]   │
                                        └────────────────────┘
   Filtros en una fila horizontal       ┌────────────────────┐
                                        │ 🔴 ESP32 DevKit    │
                                        │ ...                │
                                        └────────────────────┘

                                        Filtros apilados,
                                        a todo lo ancho
```

**Por qué dos formas y no una que se encoja:** una tabla de cuatro columnas es
cómoda en un portátil e ilegible en un celular (las columnas quedarían
diminutas o habría que desplazarse en horizontal). Unas tarjetas apiladas son
perfectas en el celular pero desperdician el espacio de un monitor. Por eso se
usan **las dos**, según quepa.

El panel de reserva también cambia: ventana centrada en computador, y casi a
pantalla completa en móvil, para que los campos se puedan tocar con el dedo.

## 6. Cómo sabremos que está bien hecho

Estos son los **criterios de aceptación**: comprobaciones concretas que
deciden si cada cosa quedó bien.

### El tablero

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-01 | Abro la aplicación con la API encendida | Veo la lista de equipos reales, cada uno con su color. |
| CA-02 | Abro la aplicación y la API tarda en responder | Veo un aviso de "cargando", **nunca** una pantalla en blanco. |
| CA-03 | Abro la aplicación con la API **apagada** | Veo un mensaje claro de que no se pudo conectar, y un botón para reintentar. |
| CA-04 | Miro un equipo en mantenimiento | Aparece en **gris** y no se puede reservar. |
| CA-05 | Miro un equipo con una reserva vigente ahora | Aparece en **rojo**, aunque su estado guardado sea `DISPONIBLE`. |
| CA-06 | Miro un equipo dañado que además tenía una reserva | Aparece en **ámbar**, no en rojo (manda el estado físico). |
| CA-07 | Miro un equipo operativo y libre | Aparece en **verde**. |

### Filtros y páginas

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-08 | Elijo una categoría | La lista se actualiza **sin que la página se recargue** y solo quedan los de esa categoría. |
| CA-09 | Combino categoría y estado | Solo quedan los que cumplen ambas condiciones. |
| CA-09b | Filtro por "Reservado ahora" | Salen **solo** los equipos en rojo, y el contador refleja cuántos son. |
| CA-10 | Filtro por algo sin resultados | Veo un mensaje amable de "no hay equipos con esos filtros" — **no** una lista vacía sin explicación ni un error. |
| CA-11 | Pulso "Limpiar filtros" | Vuelvo a ver el inventario completo. |
| CA-12 | Estoy en la página 3 y cambio un filtro | Vuelvo a la página 1 automáticamente. |
| CA-13 | Estoy en la última página | El botón "Siguiente" está desactivado. |

### Reservar y cancelar

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-14 | Pulso el botón de un equipo | Se abre el panel con sus datos y sus reservas activas. |
| CA-15 | Relleno el formulario con un horario libre | La reserva se crea, veo confirmación y la lista se actualiza sola. |
| CA-16 | ⭐ Pido un horario que ya está ocupado | Veo un mensaje **amigable** explicando el choque. Nunca un texto técnico ni un error en la consola. |
| CA-17 | Pongo la hora de fin antes que la de inicio | Veo un mensaje claro pidiéndome corregirlo. |
| CA-18 | Pongo un correo inválido | Veo un mensaje claro señalando el correo. |
| CA-19 | Cancelo una reserva y confirmo | Desaparece de las activas y el equipo puede volver a verde. |
| CA-20 | Pulso "Reservar" dos veces seguidas muy rápido | El botón se deshabilita mientras se envía, para no crear la reserva por duplicado. |

### Adaptación a pantallas

| Nº | Si hago esto… | …debe pasar esto |
|---|---|---|
| CA-21 | Abro la app en un computador | Veo los equipos en forma de tabla y los filtros en una fila. |
| CA-22 | Abro la app en un celular (o estrecho la ventana) | Los equipos se convierten en **tarjetas apiladas** y los filtros se apilan. Nada se sale de la pantalla ni obliga a desplazarse en horizontal. |
| CA-23 | Abro el panel de reserva en un celular | Ocupa casi toda la pantalla y todos los campos son cómodos de tocar. |

## 7. Lo que esta aplicación NO hace

Se deja escrito para que no parezca un descuido:

- **No cambia de idioma.** El bonus de internacionalización quedó fuera por
  falta de tiempo: la entrega es a mediodía y se priorizó que todo lo
  obligatorio quedara terminado, probado y documentado. Todos los textos están
  en español.
- **No tiene inicio de sesión**, porque la API tampoco lo tiene: cualquiera
  puede reservar o cancelar indicando un nombre y un correo. Es una limitación
  heredada y consciente del Reto 2.
- **No refresca los colores solo** con el paso del tiempo (ver la nota de §3).
- **No registra ni edita equipos.** El enunciado del Reto 3 pide *visualizar*
  el inventario y gestionar reservas. Dar de alta equipos es tarea del
  auxiliar y esa operación ya existe en la API.
