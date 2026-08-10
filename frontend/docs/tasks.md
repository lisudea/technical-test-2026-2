# Cómo se construyó (las 10 tareas)

> **Qué es este documento.** [`spec.md`](spec.md) dice **qué** hacer y
> [`plan.md`](plan.md) dice **cómo**. Este parte el plan en **tareas
> pequeñas**, en orden, y dice **qué deberías ver en el navegador** al
> terminar cada una.

**Estado:** en curso · **Rama:** `1067961907-reto3`

---

## Las cuatro normas

1. **Una tarea = un guardado (*commit*).** Así el historial cuenta la
   construcción paso a paso.
2. **Los comentarios se escriben junto al código, no al final.** Documentar
   después siempre sale peor y se queda a medias.
3. **Nada se da por bueno sin verlo funcionando en el navegador.**
4. **Nunca se toca `main`** ni la rama del Reto 2.

## El orden, y por qué

Primero que la pantalla muestre datos reales; después las acciones; al final
el pulido. Si el tiempo se agotara, se puede cortar tras la **T-08** y quedaría
una entrega coherente:

```
   CIMIENTOS          LO QUE SE VE          LO QUE SE HACE       PULIDO
   T-01 T-02 T-03  │  T-04 T-05 T-06  │  T-07 T-08        │  T-09 T-10
                                                          │
                              aquí ya cumple el enunciado ┘
```

---

## T-01 · Crear el proyecto y que arranque

**Archivos:** `package.json`, `index.html`, `src/main.jsx`, `src/App.jsx`,
`vite.config.js`

**Qué hace:** crea el esqueleto de un proyecto React con Vite y comprueba que
el servidor de desarrollo levanta.

**Qué deberías ver:** al ejecutar `npm run dev` y abrir
`http://localhost:5173`, una página con un texto de bienvenida.

---

## T-02 · Instalar Tailwind y comprobar que pinta

**Archivos:** `src/index.css`, `vite.config.js`, `package.json`

**Qué hace:** instala Tailwind y lo conecta con Vite.

**Por qué es tarea propia:** la forma de configurar Tailwind **cambió** entre
sus versiones 3 y 4. Si algo falla, es mejor que falle ahora, con una página
de prueba, que dentro de tres tareas con seis componentes encima.

**Qué deberías ver:** un texto grande y azul en la página. Si sale en negro y
pequeño, Tailwind no está funcionando y no se sigue adelante.

---

## T-03 · Conectar con el backend (el puente)

**Archivos:** `vite.config.js`, `.env.example`

**Qué hace:** configura el proxy que evita el bloqueo del navegador
(`plan.md` §5.1) y deja la dirección de la API en una variable de entorno.

**Qué deberías ver:** la página muestra **el número real de equipos** que hay
en el backend. Si dice "no pudimos conectar", el puente no está bien.

---

## T-04 · Todas las llamadas a la API

**Archivos:** `src/api.js`

**Qué hace:** las cuatro llamadas (listar equipos, listar reservas activas,
crear reserva, cancelar reserva) y —lo más importante— el manejo de errores:
comprobar `respuesta.ok`, leer el `detail` en sus dos formas posibles, y
traducirlo a un mensaje que entienda una persona.

**Qué deberías ver:** todavía nada nuevo en pantalla; se comprueba desde la
consola del navegador que las funciones devuelven datos reales y que un error
devuelve el mensaje amigable, no el técnico.

---

## T-05 · Los datos compartidos y el cálculo del rojo

**Archivos:** `src/estado.jsx`

**Qué hace:** el Context con los equipos, filtros, página y estado de carga; y
el cálculo de qué equipos están **reservados ahora mismo** (`plan.md` §6).

**Qué deberías ver:** aún nada visual; se comprueba que la lista de
identificadores reservados coincide con las reservas que haya en el backend.

---

## T-06 · El tablero con sus colores

**Archivos:** `src/componentes/Tablero.jsx`, `ListaEquipos.jsx`,
`TarjetaEquipo.jsx`, `Aviso.jsx`, `src/App.jsx`

**Qué hace:** la pantalla principal: cabecera, leyenda, lista de equipos con
su indicador de color, aviso de "cargando" y aviso de error.

**Qué deberías ver:** el inventario real del laboratorio, con cada equipo en
su color. Apagando el backend, un mensaje claro con botón de reintentar.

---

## T-07 · Filtros y páginas

**Archivos:** `src/componentes/PanelFiltros.jsx`, `ListaEquipos.jsx`

**Qué hace:** los desplegables de categoría y estado, el botón de limpiar y
los controles de página.

**Qué deberías ver:** al elegir "Herramientas" la lista se reduce **sin que la
página parpadee ni se recargue**. Los botones de página se desactivan en los
extremos.

---

## T-08 · Reservar y cancelar

**Archivos:** `src/componentes/ModalReserva.jsx`

**Qué hace:** el panel emergente con las reservas activas del equipo, el
formulario de nueva reserva y la cancelación. Aquí se cierra el circuito de
errores del enunciado.

**Qué deberías ver:** reservar un horario libre funciona y la lista se
actualiza sola. **Reservar un horario ocupado muestra un mensaje amigable en
rojo dentro del panel**, nunca un error técnico.

> **A partir de aquí el enunciado obligatorio está cumplido.**

---

## T-09 · Comprobar que se adapta al móvil

**Archivos:** los componentes ya creados

**Qué hace:** revisa y ajusta el comportamiento en pantallas estrechas.

**Qué deberías ver:** al estrechar la ventana del navegador, las filas se
convierten en tarjetas apiladas y los filtros se apilan. Nada obliga a
desplazarse en horizontal.

---

## T-10 · README y documentación final

**Archivos:** `README.md`, repaso de comentarios

**Qué hace:** la guía de uso completa y la revisión de que todos los
componentes y funciones estén explicados.

**Qué deberías ver:** siguiendo el README desde cero, con el proyecto recién
clonado, llegas a reservar un equipo sin consultar ninguna otra fuente.

---

## Qué cubre cada tarea

| Tarea | Criterios de `spec.md` |
|---|---|
| T-01, T-02 | (cimientos) |
| T-03, T-04 | CA-03 (backend apagado) |
| T-05, T-06 | CA-01, CA-02, CA-04 a CA-07 |
| T-07 | CA-08 a CA-13 |
| T-08 | CA-14 a CA-20 |
| T-09 | CA-21 a CA-23 |
| T-10 | (documentación) |
