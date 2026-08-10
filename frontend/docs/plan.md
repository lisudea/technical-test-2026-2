# Cómo se construye el tablero (plan técnico)

> **Qué es este documento.** [`spec.md`](spec.md) define **qué** tiene que
> hacer la aplicación. Este define **cómo** se construye.
>
> Aquí se habla de herramientas, pero **cada término se explica la primera vez
> que aparece**, para que el documento se pueda seguir sin conocimientos
> previos de frontend.

**Rama:** `1067961907-reto3`

---

## 0. Principios de diseño

La aplicación tiene **una sola pantalla** y maneja **dos tipos de dato**
(equipos y reservas). El diseño se ajusta a ese tamaño:

1. **Pocos componentes, con nombres descriptivos.** Sin capas intermedias
   cuya única función sea trasladar datos de un sitio a otro.
2. **Estado con las herramientas propias de React** (`useState` y
   `useContext`), sin librerías externas de gestión de estado.
3. **Estructura plana**, para que el recorrido de una acción se pueda seguir
   sin saltar entre muchos archivos.

---

## 1. Las herramientas

### 1.1 React

**Qué es:** una librería para construir interfaces web partiéndolas en piezas
reutilizables llamadas **componentes**.

> **¿Qué es un componente?** Una pieza de la pantalla con su aspecto y su
> comportamiento juntos. Como una pieza de LEGO: `TarjetaEquipo` sabe dibujar
> *un* equipo, y se reutiliza 23 veces para dibujar los 23 equipos.
>
> Se escriben como funciones que devuelven algo parecido a HTML.

### 1.2 Vite (en vez de Create React App)

**Qué es Vite:** la herramienta que prepara el proyecto para trabajar. Hace
dos cosas:

- **En desarrollo:** levanta un servidor local (`npm run dev`) que muestra la
  página y **actualiza el navegador al instante** cuando guardas un archivo.
- **Al terminar:** empaqueta todo (`npm run build`) en archivos optimizados
  listos para publicar.

**Por qué Vite y no Create React App (CRA):** CRA fue durante años la forma
estándar de empezar un proyecto de React, pero **está oficialmente
descontinuada** (el propio equipo de React ya no la recomienda). Además era
lenta: reconstruía el proyecto entero en cada cambio, y en proyectos medianos
se tardaba varios segundos en ver una modificación. Vite solo reconstruye el
archivo que tocaste, así que el cambio aparece casi instantáneo.

### 1.3 Tailwind CSS

**Qué es:** una forma de dar estilo escribiendo clases pequeñas directamente
en el HTML, en vez de mantener un archivo de estilos aparte.

```html
<!-- CSS tradicional: hay que ir a otro archivo a ver qué es "tarjeta" -->
<div class="tarjeta">…</div>

<!-- Tailwind: se lee lo que hace sin salir de aquí -->
<div class="rounded-lg border p-4 shadow-sm">…</div>
```

`rounded-lg` = esquinas redondeadas, `border` = borde, `p-4` = espacio
interior, `shadow-sm` = sombra suave.

**Por qué encaja aquí:** el diseño adaptable (móvil/computador) se escribe en
la misma línea, con prefijos (`md:` = "a partir de pantalla mediana"). Eso
evita tener que saltar entre el componente y una hoja de estilos para entender
cómo se ve algo.

### 1.4 El cliente HTTP: `fetch` nativo

Para pedirle datos a la API hay dos opciones habituales:

| | `fetch` (viene con el navegador) | `axios` (librería externa) |
|---|---|---|
| Instalación | Ninguna, ya está | Una dependencia más |
| Convertir la respuesta a datos | Hay que pedirlo: `await res.json()` | Automático |
| Errores del servidor (404, 409) | **No los considera errores**: hay que comprobarlo a mano | Los lanza como error automáticamente |

**Se usa `fetch`**, envuelto en una función propia de unas 20 líneas.

El proyecto hace **cuatro** tipos de llamada, un volumen que no justifica
añadir una dependencia externa. Además, esa función propia deja **a la vista**
el detalle más delicado del manejo de errores (ver §5): que un `409` del
servidor **no** hace fallar a `fetch` por sí solo, sino que hay que
comprobarlo explícitamente.

### 1.5 Lo que NO se usa

| Herramienta | Por qué no |
|---|---|
| **Redux / Zustand** (gestores de estado) | Resuelven el problema de compartir muchos datos entre docenas de pantallas. Aquí hay **una** pantalla y un puñado de datos: `useContext` sobra. |
| **React Router** (navegación) | Solo hay una página. No hay nada entre lo que navegar. |
| **react-i18next** (idiomas) | El bonus quedó fuera de alcance (ver `spec.md` §7). |
| **Librerías de componentes** (MUI, Chakra…) | Traen cientos de piezas de las que usaríamos cuatro, y pesan más que todo el proyecto. |

---

## 2. La estructura de archivos

```
frontend/
├── src/                          ← todo el código
│   ├── main.jsx                    Enciende la aplicación (3 líneas)
│   ├── App.jsx                      Arma la página completa
│   ├── index.css                     Estilos base de Tailwind
│   ├── api.js                         TODAS las llamadas a la API
│   ├── estado.jsx                      Los datos compartidos (Context)
│   └── componentes/
│       ├── Tablero.jsx                  La pantalla principal
│       ├── PanelFiltros.jsx              Los desplegables de filtro
│       ├── ListaEquipos.jsx               La lista + los botones de página
│       ├── TarjetaEquipo.jsx               UN equipo con su color
│       ├── ModalReserva.jsx                 El panel emergente
│       └── Aviso.jsx                         Mensajes de error/éxito/carga
├── docs/                         ← esta documentación
├── index.html                    ← la página vacía donde React se dibuja
├── vite.config.js                ← configuración, incluye el puente al backend
├── package.json                  ← lista de dependencias y comandos
├── .env.example                  ← plantilla de configuración
└── README.md
```

**Seis componentes y dos archivos de apoyo.** Cada nombre dice lo que hace.

### Por qué `api.js` está separado y no dentro de los componentes

Si cada componente llamara a la API por su cuenta, la dirección del servidor y
el manejo de errores quedarían repetidos en cinco sitios distintos, y
cualquier cambio obligaría a modificarlos todos. Concentrarlos en un archivo
hace que se cambien en un único lugar.

---

## 3. Los componentes y cómo se hablan entre sí

```
   App
    └── ProveedorDatos          ← guarda los datos y los reparte (Context)
         └── Tablero            ← la pantalla
              ├── PanelFiltros      (desplegables de categoría y estado)
              ├── ListaEquipos      (la lista y los botones de página)
              │    └── TarjetaEquipo  ×N   (un equipo cada una)
              └── ModalReserva      (solo si hay un equipo seleccionado)
```

| Componente | Qué dibuja | Qué necesita para funcionar |
|---|---|---|
| `App` | Arma todo | Nada |
| `Tablero` | Cabecera, leyenda y organiza el resto | Nada: coge los datos del Context |
| `PanelFiltros` | Dos desplegables y el botón de limpiar | Los filtros actuales y una función para cambiarlos |
| `ListaEquipos` | La lista completa y la paginación | La lista de equipos |
| `TarjetaEquipo` | **Un** equipo: color, nombre, código, botón | Un equipo y qué hacer al pulsar su botón |
| `ModalReserva` | El panel emergente con reservas y formulario | El equipo elegido y cómo cerrarse |
| `Aviso` | Un recuadro de color con un mensaje | El texto y el tipo (error, éxito, cargando) |

> **¿Qué son las "props"?** Es la información que un componente le pasa a otro,
> como los argumentos de una función. Si `TarjetaEquipo` es un molde para
> dibujar un equipo, las props son **el equipo concreto** que le toca dibujar.
>
> Van siempre **de arriba abajo**: un padre le pasa datos a su hijo, nunca al
> revés.

---

## 4. El estado compartido (Context)

### El problema que resuelve

Las props solo bajan. Pero mira lo que necesitamos:

```
   Tablero              ← aquí vive la LISTA de equipos
     └── ListaEquipos
          └── TarjetaEquipo
               └── (al pulsar) → ModalReserva
                    └── al crear una reserva, hay que RECARGAR la lista
                        …que vive tres niveles más arriba
```

Para lograrlo con props habría que pasar la función `recargar` desde `Tablero`
hasta `ModalReserva` atravesando dos componentes que **no la usan para nada**,
solo la transportan. Eso se llama *prop drilling* (literalmente, "perforar con
props") y ensucia los componentes intermedios.

> **¿Qué es el Context?** Un almacén compartido. En vez de pasar el dato de
> mano en mano, se deja en una repisa común y **cualquier componente lo coge
> directamente**, sin importar a qué profundidad esté.
>
> **La analogía:** en vez de pasar el control remoto de persona en persona por
> toda la fila del sofá, se deja en la mesa del centro y cada uno lo alcanza.

### Qué se guarda ahí

Un solo Context, en `estado.jsx`:

| Dato | Para qué |
|---|---|
| `equipos` | Los equipos de la página actual |
| `total`, `pagina`, `totalPaginas` | Para los controles de página |
| `filtros` | La categoría y el estado seleccionados |
| `idsReservadosAhora` | Qué equipos pintar de rojo (ver §6) |
| `cargando` | Para mostrar "cargando…" |
| `error` | Para mostrar el aviso si la API falla |
| `cambiarFiltro()`, `cambiarPagina()`, `recargar()` | Acciones que cualquier componente puede disparar |

**Todo lo demás va por props.** El Context guarda solo lo que necesitan
componentes lejanos entre sí; el resto se pasa normalmente, que es más fácil
de seguir.

---

## 5. Cómo se habla con la API (lo más importante)

### 5.1 El puente que evita el bloqueo del navegador

**El problema:** el navegador tiene una regla de seguridad llamada **CORS**
que impide que una página servida desde una dirección llame a un servidor de
otra dirección distinta, salvo que ese servidor dé permiso explícito.

Nuestra página vive en `localhost:5173` y la API en `localhost:8000`:
**direcciones distintas**. El navegador bloquearía todas las llamadas, y la
API del Reto 2 no tiene ese permiso configurado.

**La solución:** el **proxy** del servidor de desarrollo. Se configura Vite
para que todo lo que empiece por `/api` lo reenvíe él mismo al backend:

```
   SIN proxy (bloqueado)              CON proxy (funciona)
   ─────────────────────              ────────────────────
   navegador ──✗──► :8000             navegador ──► :5173 ──► :8000
             CORS                              (misma dirección)   (lo reenvía
                                                                    Vite, que no
                                                                    es un navegador
                                                                    y no aplica CORS)
```

Desde el punto de vista del navegador **todo viene de la misma dirección**, así
que no hay nada que bloquear.

Son 4 líneas de configuración, viven íntegramente en el frontend y **no
requieren modificar la rama del Reto 2**, de modo que los retos quedan sin
mezclarse, como exige el enunciado.

Para un despliegue real —con el frontend y la API en servidores distintos— lo
adecuado sería configurar el permiso CORS en el backend. Queda anotado en el
README.

### 5.2 Dónde vive la dirección de la API

En una **variable de entorno**: un ajuste que vive fuera del código, para
poder cambiarlo sin tocar los archivos.

```
.env.example  →  VITE_API_URL=/api
```

En el código se lee con `import.meta.env.VITE_API_URL`. El prefijo `VITE_` es
obligatorio: Vite solo expone al navegador las variables que empiezan así (las
demás podrían contener contraseñas y quedarían a la vista de cualquiera).

### 5.3 Qué es una promesa y qué es `async/await`

Pedirle datos a un servidor **tarda**. Puede ser un décima de segundo o varios
segundos. El programa no puede quedarse congelado esperando, porque entonces
la página dejaría de responder a los clics.

> **Una promesa** es un pagaré: *"todavía no tengo la respuesta, pero te
> prometo que llegará — o que te avisaré si algo falla"*.
>
> **La analogía:** pides una pizza y te dan un número de pedido. No te quedas
> plantado en la puerta: sigues con tu vida y, cuando suena el timbre, atiendes.

`async/await` es la forma cómoda de trabajar con eso:

```js
async function cargarEquipos() {
  const equipos = await pedirEquipos();   // ← "espera aquí a que llegue"
  mostrar(equipos);                        // ← esto solo corre cuando ya llegó
}
```

`await` significa *"espera a que la promesa se cumpla"*. Se lee de arriba
abajo como código normal, pero por debajo **no bloquea** la página: mientras
espera, el resto sigue funcionando.

**Qué pasa mientras se espera:** ponemos `cargando = true`, y la interfaz
muestra el aviso de "cargando…". Cuando llega la respuesta, `cargando = false`.
Por eso el criterio CA-02 se cumple solo.

**Qué pasa si falla:** el `await` **lanza un error**, que se atrapa con
`try/catch` — ver §5.5.

### 5.4 La trampa de `fetch` que hay que conocer

Este es el detalle que más gente confunde:

> **`fetch` NO considera un error que el servidor responda 404 o 409.**

Para `fetch`, "el servidor me contestó" ya es un éxito, aunque la respuesta
sea un rechazo. Solo falla si **no pudo hablar** con el servidor (está
apagado, no hay red).

```js
const respuesta = await fetch("/api/reservas", { method: "POST", ... });
// Si el backend respondió 409, AQUÍ NO PASA NADA. El programa sigue.
// Hay que comprobarlo a mano:
if (!respuesta.ok) {           // .ok es false para 400, 404, 409, 422, 500…
    // ...aquí sí tratamos el rechazo
}
```

Si esto se olvida, el programa cree que la reserva se creó, muestra
confirmación y actualiza la lista — **cuando en realidad el backend la
rechazó**. Es un fallo silencioso y desconcertante.

Por eso todas las llamadas pasan por **una sola función** en `api.js` que
nunca olvida comprobarlo.

### 5.5 El viaje completo de un error 409

Esto responde al requisito 6 del enunciado. Se sigue el camino entero, desde
el backend hasta el ojo del usuario:

```
  ① EL BACKEND rechaza la reserva
     HTTP 409  { "detail": "El equipo ya tiene una reserva activa que se
                            cruza con esa franja horaria..." }
                        │
                        ▼
  ② api.js  ─ la función comprueba respuesta.ok → es false
              ─ lee el "detail" del cuerpo
              ─ LANZA un error propio que lleva dentro el número (409)
                        │
                        ▼
  ③ ModalReserva  ─ tenía la llamada dentro de un try/catch
                   ─ el catch atrapa ese error
                        │
                        ▼
  ④ mensajeAmigable(error)  ─ mira el número:
                                409 → "Ese horario ya está ocupado…"
                                422 → "Revisa los datos…"
                                404 → "No encontramos ese elemento…"
                                sin respuesta → "No pudimos conectar…"
                        │
                        ▼
  ⑤ Aviso  ─ dibuja un recuadro rojo con ese texto, dentro del panel
```

> **`try/catch`:** *"intenta esto; si algo sale mal, no revientes — haz esto
> otro en su lugar"*. Sin él, un error dejaría la página congelada o en blanco,
> que es exactamente lo que el enunciado prohíbe.

**Detalle real que hay que manejar:** el backend responde el `detail` de **dos
formas distintas** según el error.

| Error | Forma de `detail` |
|---|---|
| 404 y 409 | Un **texto**: `"El equipo ya tiene una reserva…"` |
| 422 (validación) | Una **lista** de objetos, uno por cada campo mal |

Si se asumiera que siempre es un texto, al llegar un 422 se mostraría algo
como `[object Object]` en pantalla. La función de traducción contempla los dos
casos.

**Además, los mensajes se traducen, no se muestran tal cual.** El backend dice
*"El equipo ya tiene una reserva activa que se cruza con esa franja
horaria"* — correcto pero técnico. La interfaz muestra *"Ese horario ya está
ocupado. Elige otro o revisa las reservas activas del equipo"*, que además
dice **qué hacer a continuación**.

### 5.6 Las cuatro llamadas que existen

| Función en `api.js` | A qué llama | Para qué |
|---|---|---|
| `obtenerEquipos(filtros, pagina)` | `GET /equipos` | Llenar el tablero |
| `obtenerReservasActivas()` | `GET /reservas?estado=ACTIVA` | Saber qué pintar de rojo |
| `crearReserva(datos)` | `POST /reservas` | Reservar |
| `cancelarReserva(id)` | `POST /reservas/{id}/cancelar` | Cancelar |

---

## 6. Cómo se calcula el rojo de "Reservado"

La API no guarda ese estado (ver `spec.md` §3). Se deduce así:

**Paso 1 — pedir las reservas activas**, en una sola llamada:
`GET /reservas?estado=ACTIVA&size=100`

**Paso 2 — quedarse con las que cubren este instante.** Una reserva ocupa el
equipo *ahora* si empezó antes de ahora y termina después de ahora:

```
              inicio          AHORA           fin
                 │              ▼              │
                 ├──────────────────────────────┤   ← ocupa: inicio < ahora < fin
                 
                 ├──────┤          ▼               ← NO ocupa: ya terminó
                 
                        ▼      ├──────────┤        ← NO ocupa: aún no empieza
```

**Paso 3 — guardar solo los identificadores** de esos equipos en un conjunto.

> **¿Por qué un conjunto (`Set`) y no una lista?** Porque la pregunta que se
> hace 23 veces (una por equipo) es *"¿está este equipo en el grupo?"*. En una
> lista habría que recorrerla entera cada vez; en un conjunto la respuesta es
> inmediata. Con 23 equipos da igual, pero es la herramienta correcta y no
> cuesta más escribirla.

**Paso 4 — pintar**, aplicando el orden de prioridad de `spec.md` §3:
mantenimiento → dañado → reservado → verde.

### Filtrar por un estado que la API no conoce

El desplegable ofrece los cuatro colores, pero la API solo guarda tres
estados. Eso obliga a **dos caminos** distintos:

| Filtro elegido | Cómo se resuelve |
|---|---|
| Ninguno, `MANTENIMIENTO` o `DAÑADO` | La API hace todo, **incluida la paginación**. Es el camino normal. |
| `DISPONIBLE` o `RESERVADO_AHORA` | La API no los distingue, así que se le piden **todos** los que ella considera disponibles y aquí se separan en dos grupos. Como ya no puede paginar por nosotros, la paginación se hace en el frontend. |

**Limitación aceptada:** el segundo camino pide hasta 100 equipos de una vez
(el máximo de la API). Si el laboratorio superara los 100 equipos disponibles,
esos dos filtros solo considerarían los primeros 100. Con 24 equipos va muy
holgado.

> **Limitación honesta que irá en el README:** se piden hasta 100 reservas
> activas (el máximo que permite la API por página). Si el laboratorio llegara
> a tener más de 100 reservas activas a la vez, algunas no se tendrían en
> cuenta al calcular el rojo. Para el tamaño real de este laboratorio es
> holgado, y resolverlo del todo obligaría a recorrer varias páginas en cada
> carga.

---

## 7. Cómo se adapta a móvil y computador

Tailwind es **"móvil primero"**: las clases sin prefijo valen para todas las
pantallas, y los prefijos añaden cambios **a partir de** cierto ancho.

```html
<!-- 1 columna siempre; a partir de pantalla mediana, 4 columnas -->
<div class="grid grid-cols-1 md:grid-cols-4">
```

**Se usa un único punto de corte, `md` (768 píxeles):**

| Ancho | Qué se ve |
|---|---|
| Menos de 768 px (celular) | Tarjetas apiladas, una por equipo. Filtros apilados a todo lo ancho. Panel casi a pantalla completa. |
| 768 px o más | Filas alineadas en columnas, con encabezado. Filtros en una fila. Panel centrado. |

Con dos formas —tarjeta y fila— se cubre desde un celular hasta un monitor.
Más puntos de corte multiplicarían las variantes a comprobar sin aportar
mejoras visibles.

El contenido se dibuja **una sola vez**: es la misma lista, cuyas piezas
cambian de disposición según el ancho. Duplicar la lista y ocultar una de las
dos según el tamaño haría que el navegador construyera ambas, perjudicando el
rendimiento y a los lectores de pantalla.

---

## 8. Cada requisito, y dónde se resuelve

| Requisito del enunciado | Dónde se cumple |
|---|---|
| 1 · React + Tailwind | Todo el proyecto |
| 2 · Diseño adaptable | §7 · `TarjetaEquipo` y `PanelFiltros` |
| 3 · Tablero que lista los equipos | `Tablero` + `ListaEquipos` |
| 4 · Indicadores de color | §6 · `TarjetaEquipo` |
| 5 · Filtros sin recargar | `PanelFiltros` + el Context de §4 |
| 6 · Errores amigables en pantalla | §5.5 · `api.js` + `Aviso` |
| 7 · Idiomas (bonus) | **Fuera de alcance** (`spec.md` §7) |

---

## 9. Riesgos previstos

| Riesgo | Cómo se maneja |
|---|---|
| La configuración de Tailwind cambió entre versiones y podría fallar al instalar. | Se verifica en la primera tarea, **antes** de construir nada encima: se pinta un texto de color y se comprueba en el navegador. |
| El proxy no reenvía bien y las llamadas fallan. | Se comprueba en cuanto exista la primera llamada, mostrando datos reales del backend en pantalla. |
| Que se acabe el tiempo (entrega a las 12:00). | El orden de [`tasks.md`](tasks.md) deja el tablero funcionando primero; el panel de reservas, el pulido visual y la documentación van después y se pueden recortar sin dejar nada roto. |
| Que el backend no esté encendido al probar. | La aplicación lo detecta y muestra un mensaje claro con un botón de reintentar (criterio CA-03), en vez de quedarse en blanco. |
