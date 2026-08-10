# Reto 2 · Backend — Sistema de Gestión y Reservas de Equipos

**Prueba técnica · Laboratorio Integrado de Sistemas (LIS)**

| | |
|---|---|
| **Autor** | Daniel Salas |
| **Correo** | d.salas@udea.edu.co |
| **Programa** | Ingeniería de Sistemas · Universidad de Antioquia |
| **Reto** | 2 — Backend (REST API) |
| **Rama** | `1067961907-Reto2` |

---

## Índice

1. [¿Qué es esto?](#qué-es-esto)
2. [Herramientas utilizadas](#herramientas-utilizadas)
3. [Guía de ejecución desde GitHub](#guía-de-ejecución-desde-github) ← **empieza aquí**
4. [Cómo probarlo sin saber programar](#cómo-probarlo-sin-saber-programar)
5. [Qué sabe hacer el programa](#qué-sabe-hacer-el-programa)
6. [La regla más importante](#la-regla-más-importante)
7. [Comprobar que todo funciona](#comprobar-que-todo-funciona)
8. [Los archivos del proyecto](#los-archivos-del-proyecto)
9. [Resumen de la documentación](#resumen-de-la-documentación)
10. [Configuración](#configuración)
11. [Qué incluye y qué no](#qué-incluye-y-qué-no)

---

## ¿Qué es esto?

El Laboratorio Integrado de Sistemas presta cosas a los estudiantes: Arduinos,
ESP32, Raspberry Pi, protoboards, bolsas de jumpers, cables HDMI y de red,
crimpadoras, destornilladores, testers…

Hoy esa cuenta se lleva a mano. Este programa la lleva de forma digital y se
encarga de que **nunca dos personas se lleven el mismo equipo a la misma
hora**.

Es la entrega del **Reto 2** de la prueba técnica.

> **¿Nunca has visto un proyecto de backend?** No hace falta. Este README te
> lleva de la mano para ponerlo en marcha, y si además quieres entender **cómo
> funciona por dentro**, el documento [`docs/como-funciona.md`](docs/como-funciona.md)
> lo explica todo desde cero, sin dar nada por sabido.

---

## Herramientas utilizadas

| Herramienta | Qué es | Para qué se usa aquí |
|---|---|---|
| **Python 3.12** | Lenguaje de programación. | Todo el código del proyecto. |
| **FastAPI** | Framework web: convierte funciones de Python en operaciones que se piden por red. | Define los nueve endpoints y genera sola la documentación interactiva. |
| **Uvicorn** | Servidor que mantiene la aplicación encendida escuchando peticiones. | Es el proceso que atiende en el puerto 8000. |
| **Pydantic** | Librería que comprueba que los datos tengan la forma correcta. | Valida lo que llega antes de tocar la base de datos. |
| **SQLAlchemy 2.0** | ORM: permite trabajar con las tablas como si fueran clases de Python. | Define `Equipo` y `Reserva` y genera el SQL por debajo. |
| **PostgreSQL 16** | Motor de base de datos. | Guarda los datos. Su restricción `EXCLUDE` es la que hace imposible el solapamiento de reservas. |
| **Alembic** | Herramienta de migraciones. | Construye y versiona la estructura de las tablas. |
| **pytest** | Framework de pruebas automáticas. | Ejecuta las 36 pruebas del proyecto. |
| **Docker + Docker Compose** | Empaquetado y orquestación. | Levantan la API y la base de datos con un solo comando. |

---

## Guía de ejecución desde GitHub

Esta guía va **desde cero**: partiendo solo de la dirección del repositorio,
hasta ver la API funcionando.

### Antes de empezar: lo único que hay que instalar

**Docker.** Nada más. Ni Python, ni PostgreSQL, ni configurar nada.

> **¿Qué es Docker?** Es un programa que ejecuta otros programas dentro de una
> "caja" que ya trae todo lo necesario adentro. Como una **lonchera**: en vez
> de esperar que en el destino haya cocina y cubiertos, lo llevas todo dentro.
> Por eso este proyecto funciona igual en cualquier computador.

Se descarga aquí: <https://www.docker.com/products/docker-desktop/>
(en Windows y Mac hay que abrir la aplicación *Docker Desktop* y dejarla
funcionando de fondo).

Para comprobar que está instalado:

```bash
docker --version
```

### Paso 0 — Descargar el proyecto y situarse en la rama correcta

⚠️ **Detalle importante:** cada reto de la prueba vive en **su propia rama**,
como exige el enunciado. Al clonar el repositorio caes en la rama principal,
que está vacía. Hay que cambiarse a la rama de este reto:

```bash
# Descargar el repositorio
git clone https://github.com/lisudea/technical-test-2026-2
cd technical-test-2026-2

# Cambiarse a la rama del Reto 2 (aquí aparece la carpeta backend/)
git checkout 1067961907-Reto2

# Entrar en el proyecto
cd backend
```

Si al hacer `ls` no ves una carpeta `app/` y un archivo `docker-compose.yml`,
es que el cambio de rama no se aplicó: repite el `git checkout`.

> **¿Y si también quieres el frontend (Reto 3)?** Está en la rama
> `1067961907-reto3`. Como son ramas distintas, **no pueden convivir en la
> misma carpeta**. Lo más sencillo es clonar el repositorio dos veces, en dos
> carpetas separadas:
>
> ```bash
> git clone https://github.com/lisudea/technical-test-2026-2 lis-backend
> cd lis-backend && git checkout 1067961907-Reto2
>
> git clone https://github.com/lisudea/technical-test-2026-2 lis-frontend
> cd lis-frontend && git checkout 1067961907-reto3
> ```

### Paso 1 — Encender el proyecto

Abre una terminal, entra en la carpeta `backend` y escribe:

```bash
docker compose up --build
```

La primera vez tarda un par de minutos: está descargando la base de datos y
las librerías. Verás **mucho texto pasando**; es normal.

Sabrás que está listo cuando aparezca esta línea:

```
lis_api  | INFO:     Application startup complete.
```

**Deja esa terminal abierta.** Ahí es donde el programa está corriendo.

### Paso 2 — Meterle datos de ejemplo

Abre **otra** terminal (la primera sigue ocupada) y escribe:

```bash
docker compose exec api python -m app.datos_ejemplo
```

Esto carga 23 equipos reales del laboratorio y 13 reservas, para que puedas
probar cosas sin tener que registrar nada a mano.

### Paso 3 — Abrirlo en el navegador

Entra a: **<http://localhost:8000/docs>**

Esa página se llama **Swagger** y se genera sola. Es una lista de todo lo que
el programa sabe hacer, y **cada cosa se puede probar con clics**, sin
instalar Postman ni escribir comandos.

### Para apagarlo

`Ctrl + C` en la primera terminal. O desde otra terminal:

```bash
docker compose down       # apaga
docker compose down -v    # apaga y además borra los datos
```

---

## Cómo probarlo sin saber programar

En <http://localhost:8000/docs> verás las operaciones agrupadas: **Equipos**,
**Reservas**, **Estadísticas**.

El truco es siempre el mismo:

```
   1. Haz clic en la operación para desplegarla
   2. Botón  "Try it out"       (arriba a la derecha)
   3. Edita el ejemplo que aparece
   4. Botón  "Execute"          (el azul grande)
   5. Mira la respuesta abajo, en "Server response"
```

### Recorrido guiado de 2 minutos

Sigue estos cinco pasos y habrás probado todo lo importante.

**1️⃣ Ver el inventario filtrando** → despliega `GET /equipos`

Pon `Herramientas` en el campo `categoria` y ejecuta. Deberían salir 5
equipos: crimpadora, cortafríos, destornilladores y dos testers.

**2️⃣ Registrar un equipo nuevo** → `POST /equipos`

Pega esto en la caja de texto y ejecuta:

```json
{
  "nombre": "Arduino Mega 2560",
  "numero_serie": "ARD-MEGA-001",
  "categoria": "Microcontroladores"
}
```

En la respuesta verás `"id": 24` (o el número que toque). **Apúntatelo.**

**3️⃣ Reservarlo** → `POST /reservas`

Usa el `id` del paso anterior:

```json
{
  "equipo_id": 24,
  "solicitante_nombre": "Daniel",
  "solicitante_correo": "d.salas@udea.edu.co",
  "fecha_hora_inicio": "2026-09-01T09:00:00Z",
  "fecha_hora_fin": "2026-09-01T11:00:00Z"
}
```

Debe responder **`201`** = creado. ✅

**4️⃣ Intentar pisarle la reserva a alguien** ← *la prueba interesante*

Repite el paso 3 **cambiando solo las horas** a `10:00` y `12:00`. Como se
cruza con la reserva anterior (de 9 a 11), debe responder:

```
409 Conflict
"El equipo ya tiene una reserva activa que se cruza con esa franja horaria."
```

Ahora prueba con `11:00` y `13:00`. Esta **sí** funciona (`201`), porque
empieza justo cuando termina la otra: una persona devuelve el equipo a las
11:00 y la siguiente lo recoge en ese mismo momento.

**5️⃣ Ver el ranking** → `GET /estadisticas/top-equipos`

Ejecuta sin tocar nada. Sale la lista de los equipos más pedidos.

### Si prefieres la terminal

Los mismos pasos, con comandos:

```bash
# Ver herramientas
curl "http://localhost:8000/equipos?categoria=Herramientas&page=1&size=10"

# Registrar un equipo
curl -X POST http://localhost:8000/equipos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Arduino Mega 2560","numero_serie":"ARD-MEGA-001","categoria":"Microcontroladores"}'

# Reservarlo (cambia el 24 por el id que te devolvió)
curl -X POST http://localhost:8000/reservas \
  -H "Content-Type: application/json" \
  -d '{"equipo_id":24,"solicitante_nombre":"Daniel Salas","solicitante_correo":"d.salas@udea.edu.co",
       "fecha_hora_inicio":"2026-09-01T09:00:00Z","fecha_hora_fin":"2026-09-01T11:00:00Z"}'

# Ver el ranking
curl http://localhost:8000/estadisticas/top-equipos
```

---

## Qué sabe hacer el programa

Cada fila de esta tabla es una **operación** que puedes pedirle. La palabra en
mayúsculas es el tipo de acción: `GET` = "dame", `POST` = "crea",
`PATCH` = "cambia esto".

| Operación | Qué hace |
|---|---|
| `POST /equipos` | Registrar un equipo en el inventario |
| `GET /equipos` | Ver el inventario, por páginas y con filtros |
| `GET /equipos/{id}` | Ver un equipo concreto |
| `PATCH /equipos/{id}` | Cambiar datos de un equipo (solo los que envíes) |
| `POST /reservas` | Reservar un equipo en un horario |
| `GET /reservas` | Ver las reservas, por páginas y con filtros |
| `POST /reservas/{id}/cancelar` | Cancelar una reserva |
| `GET /estadisticas/top-equipos` | Ranking de los equipos más pedidos |
| `GET /salud` | Comprobar que el programa responde |

### Qué significan los números de la respuesta

Toda respuesta viene con un número que resume cómo fue:

| Número | Traducción al español de andar por casa |
|---|---|
| **200** | "Listo, aquí tienes lo que pediste." |
| **201** | "Listo, lo creé." |
| **404** | "Eso que buscas no existe." |
| **409** | "Lo pediste bien, **pero no se puede**." (el equipo ya está reservado, o el código de serie ya existe, o el equipo está en mantenimiento) |
| **422** | "Lo que enviaste está **mal escrito**." (falta un campo, el correo no es un correo, la hora de fin es anterior a la de inicio) |

> **La diferencia entre 409 y 422** es la que más se confunde:
> - `422` = *escribiste mal*. Como pedir "un kilo de arrozzz".
> - `409` = *escribiste bien, pero no hay*. Como pedir un kilo de arroz cuando
>   se agotó.

---

## La regla más importante

**Dos personas no pueden llevarse el mismo equipo a la misma hora.**

Suena obvio, pero hay que definir muy bien qué significa "a la misma hora".
Si alguien ya reservó de **9:00 a 11:00**, esto es lo que pasa con cada
horario que pidas:

```
  Reserva que ya existe:      09:00 ████████████ 11:00


  10:00 ─ 12:00                     ████████████        ✗  409  se cruza
  08:00 ─ 10:00               ████████████              ✗  409  se cruza
  09:30 ─ 10:30                    ██████               ✗  409  está dentro
  08:00 ─ 12:00             ████████████████████        ✗  409  la contiene
  09:00 ─ 11:00               ████████████              ✗  409  es la misma

  11:00 ─ 13:00                           ████████████  ✓  201  justo después
  07:00 ─ 09:00         ████████                        ✓  201  justo antes
```

Los dos últimos **sí se permiten**: a las 11:00 una persona devuelve el equipo
y la siguiente lo recoge. Es el mismo instante y no hay ningún conflicto real.

### Cómo se protege esta regla (lo interesante)

Se protege **dos veces**, y las dos son necesarias:

1. **Una comprobación en el código**, que da un mensaje de error claro y útil.

2. **Una regla dentro de la propia base de datos**, que hace el solapamiento
   *físicamente imposible*.

¿Por qué hace falta la segunda si ya está la primera? Porque si dos personas
pulsan "Reservar" **en el mismo segundo**, las dos preguntan "¿está libre?"
antes de que la otra haya guardado, las dos reciben "sí", y las dos guardan.
Ese hueco no se puede cerrar desde el código: solo lo puede cerrar quien
guarda, es decir, la base de datos.

**Está comprobado:** se lanzaron 20 peticiones simultáneas pidiendo
exactamente el mismo horario y **solo una** quedó guardada.

La explicación completa, paso a paso y sin dar nada por sabido, está en
[`docs/como-funciona.md`](docs/como-funciona.md) §8 y §9.

---

## Comprobar que todo funciona

```bash
docker compose exec api pytest -v
```

Esto ejecuta **36 pruebas automáticas**: pequeños programas que usan la API
como lo haría una persona y comprueban que responde lo que debe. Si todas
salen en verde, el sistema se comporta como está especificado.

Entre ellas están los siete casos de horarios del dibujo de arriba, escritos
de forma que se leen igual que la especificación.

---

## Los archivos del proyecto

```
backend/
├── app/                       ← todo el código (solo 8 archivos)
│   ├── main.py                  Recibe las peticiones y las reparte
│   ├── database.py              La conexión con la base de datos
│   ├── models.py                Cómo son las tablas: Equipo y Reserva
│   ├── schemas.py               Qué datos se aceptan y cuáles se devuelven
│   ├── datos_ejemplo.py         Carga el inventario de prueba
│   └── routers/
│       ├── equipos.py             Operaciones del inventario
│       ├── reservas.py            Operaciones de reservas ⭐ el más importante
│       └── estadisticas.py        El ranking
├── alembic/                   ← instrucciones para construir la base de datos
├── tests/                     ← las 36 pruebas automáticas
├── docs/                      ← toda la documentación
├── docker-compose.yml         ← receta para encender todo junto
├── Dockerfile                 ← receta de la "caja" del programa
└── requirements.txt           ← lista de librerías que hacen falta
```

**¿Por qué tan pocos archivos?** Porque el sistema solo maneja dos tipos de
cosa: equipos y reservas. Muchos proyectos reparten el código en cuatro o
cinco capas; aquí eso significaría abrir cinco archivos para seguir una
operación de diez líneas. Menos archivos, más fácil de leer.

---

## Resumen de la documentación

El proyecto se desarrolló con la metodología **SDD** (*Spec-Driven
Development*, desarrollo guiado por especificación): primero se define **qué**
se va a construir, luego **cómo**, después se desglosa en tareas y solo al
final se escribe código. Cada documento corresponde a una de esas etapas, y el
historial de commits sigue las tareas una por una.

```
   ¿QUÉ?              ¿CÓMO?              ¿EN QUÉ ORDEN?        ¿CÓMO FUNCIONA?
   spec.md      →     plan.md      →      tasks.md        +     como-funciona.md
   (etapa 1)          (etapa 2)           (etapa 3)             (explicación)
```

| Documento | Qué contiene | Cuándo consultarlo |
|---|---|---|
| **[`docs/como-funciona.md`](docs/como-funciona.md)** | **El funcionamiento interno explicado desde cero**: las tres piezas del sistema, el viaje completo de una petición paso a paso, qué hace cada archivo, y siete secciones que desarrollan a fondo lo difícil (modelos frente a schemas, sesiones y transacciones, la matemática de los horarios cruzados, la condición de carrera, la restricción de la base de datos, las migraciones y la paginación). Termina con preguntas frecuentes. | **Para entender el programa.** Es el documento más completo. |
| [`docs/spec.md`](docs/spec.md) | **Qué hace el sistema**, sin hablar de código: quién lo usa, qué información guarda, sus 8 operaciones, sus 7 reglas de negocio y 29 criterios de aceptación. Incluye las decisiones de diseño con su justificación. | Para saber qué debe hacer, y comprobar que lo hace. |
| [`docs/plan.md`](docs/plan.md) | **Cómo está construido**: estructura de archivos, herramienta por herramienta, diseño de las tablas, estrategia de migraciones, mapa de códigos HTTP, plan de pruebas y el mecanismo anti-solapamiento en detalle. | Para revisar las decisiones técnicas. |
| [`docs/tasks.md`](docs/tasks.md) | **Cómo se construyó**: las 12 tareas en orden, cada una indicando qué archivos toca y con qué comando se comprobó. | Para seguir la construcción paso a paso. |

### Si solo vas a leer una cosa

- ¿Quieres **ejecutarlo**? → la [guía de arriba](#guía-de-ejecución-desde-github).
- ¿Quieres **entender cómo funciona**? → [`docs/como-funciona.md`](docs/como-funciona.md).
- ¿Quieres **evaluar si cumple el enunciado**? → los criterios de aceptación de [`docs/spec.md`](docs/spec.md) §6.

---

## Configuración

**Con Docker no tienes que configurar nada.** Todo viene listo.

Solo existe un ajuste, y solo hace falta si quieres ejecutar el programa
fuera de Docker o apuntarlo a otra base de datos:

| Ajuste | Para qué sirve | Valor por defecto |
|---|---|---|
| `DATABASE_URL` | La dirección de la base de datos | Ya la define `docker-compose.yml` |

El archivo [`.env.example`](.env.example) es una plantilla con ese valor.

### ¿Y las tablas de la base de datos, quién las crea?

**Se crean solas** la primera vez que enciendes el proyecto. El programa
ejecuta automáticamente unas "instrucciones de montaje" (se llaman
*migraciones*) antes de arrancar.

Si algún día quisieras lanzarlas a mano:

```bash
docker compose exec api alembic upgrade head     # construir las tablas
docker compose exec api alembic downgrade base   # deshacerlas
```

---

## Qué incluye y qué no

**Incluido:**
- Registrar, consultar y actualizar equipos.
- Ver el inventario por páginas, filtrando por categoría y estado.
- Crear, cancelar y consultar reservas.
- La validación estricta de horarios que se cruzan.
- **Extra:** ranking de los equipos más solicitados.

**No incluido, y por qué:**
- **Inicio de sesión con Google** (era un punto opcional): quedó fuera por
  tiempo. Su ausencia y sus consecuencias están documentadas honestamente en
  [`docs/spec.md`](docs/spec.md) §2.
- **Borrar equipos**: a propósito. Un equipo tiene reservas colgando de él, y
  borrarlo destruiría ese historial. Si un equipo sale de circulación, se
  marca como `DAÑADO`.
