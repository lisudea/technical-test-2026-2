# LIS · API de Gestión y Reservas de Equipos

API REST para gestionar el **inventario de hardware** del Laboratorio
Integrado de Sistemas y las **reservas** de esos equipos: Arduino, ESP32,
Raspberry Pi, protoboards, kits de jumpers y componentes, cables HDMI, de red
y USB-C, crimpadoras, cortafríos, destornilladores y testers.

Entrega del **Reto 2** de la prueba técnica.

---

## Puesta en marcha en 3 pasos

**Único requisito:** tener [Docker](https://www.docker.com/products/docker-desktop/)
instalado. No hace falta instalar Python ni PostgreSQL.

```bash
# 1. Levantar la API y la base de datos
cd backend
docker compose up --build

# 2. (En otra terminal) Cargar el inventario de ejemplo
docker compose exec api python -m app.datos_ejemplo

# 3. Abrir la documentación interactiva en el navegador
#    http://localhost:8000/docs
```

Sabes que está listo cuando en la terminal aparece:

```
lis_api  | INFO:     Application startup complete.
```

Para apagarlo: `Ctrl + C`, o `docker compose down` desde otra terminal
(añade `-v` si además quieres borrar los datos).

### ¿Y las migraciones?

**No hay que ejecutar nada.** El contenedor de la API corre
`alembic upgrade head` automáticamente antes de arrancar, así que las tablas
se crean solas la primera vez. Si algún día se quisieran lanzar a mano:

```bash
docker compose exec api alembic upgrade head     # aplicar
docker compose exec api alembic downgrade base   # deshacer
```

---

## Cómo probar la API

La forma recomendada es **Swagger**, la documentación interactiva que se
genera sola en <http://localhost:8000/docs>. Cada endpoint tiene su
explicación, un formulario editable y un botón para ejecutarlo: no hace falta
Postman ni escribir comandos.

El patrón es siempre el mismo: **expandir el endpoint → "Try it out" →
editar el JSON → "Execute" → mirar la respuesta**.

### Recorrido de 2 minutos

**1. Ver el inventario filtrando por categoría** → `GET /equipos`

```bash
curl "http://localhost:8000/equipos?categoria=Herramientas&page=1&size=10"
```

**2. Registrar un equipo** → `POST /equipos`

```bash
curl -X POST http://localhost:8000/equipos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Arduino Mega 2560","numero_serie":"ARD-MEGA-001","categoria":"Microcontroladores"}'
```

**3. Reservarlo** → `POST /reservas` (usa el `id` que devolvió el paso 2)

```bash
curl -X POST http://localhost:8000/reservas \
  -H "Content-Type: application/json" \
  -d '{"equipo_id":1,"solicitante_nombre":"Daniel","solicitante_correo":"daniel@udea.edu.co",
       "fecha_hora_inicio":"2026-09-01T09:00:00Z","fecha_hora_fin":"2026-09-01T11:00:00Z"}'
```

**4. Comprobar la regla crítica**: repite el paso 3 con una franja que se
cruce (por ejemplo de 10:00 a 12:00). Debe responder **`409 Conflict`**.
Prueba después con 11:00 a 13:00: esa **sí** se acepta, porque las reservas
consecutivas no son conflicto.

**5. Ver el ranking** → `GET /estadisticas/top-equipos`

---

## Endpoints

| Método | Ruta | Qué hace | Errores posibles |
|---|---|---|---|
| `POST` | `/equipos` | Registrar un equipo | `409` serie duplicada · `422` datos inválidos |
| `GET` | `/equipos` | Listar paginado, filtrando por `categoria` y `estado` | — |
| `GET` | `/equipos/{id}` | Consultar un equipo | `404` |
| `PATCH` | `/equipos/{id}` | Actualizar (solo los campos enviados) | `404` · `409` · `422` |
| `POST` | `/reservas` | Crear una reserva | `404` equipo · `409` conflicto · `422` |
| `GET` | `/reservas` | Listar paginado, filtrando por `equipo_id`, `solicitante_correo` y `estado` | — |
| `POST` | `/reservas/{id}/cancelar` | Cancelar una reserva | `404` · `409` ya cancelada |
| `GET` | `/estadisticas/top-equipos` | Ranking de los más reservados | — |
| `GET` | `/salud` | Comprobar que la API responde | — |

### Qué significa cada código de respuesta

| Código | Significado |
|---|---|
| `200` / `201` | Todo bien (`201` = se creó algo nuevo). |
| `404` | Lo que pediste no existe. |
| `409` | La petición es válida, pero **choca con el estado actual**: serie duplicada, equipo no disponible, franja ya reservada, reserva ya cancelada. |
| `422` | Los datos enviados están mal formados: falta un campo, el correo no es válido, la fecha de fin es anterior a la de inicio. |

---

## La regla más importante

Un equipo **no puede estar reservado por dos personas a la vez**. Dos franjas
se solapan si una empieza antes de que la otra termine y termina después de
que la otra empieza:

```
Reserva existente:      |███████████|          09:00 ── 11:00
                        09:00      11:00

 10:00 → 12:00              |███████████|      ✗ 409  se cruza
 08:00 → 10:00        |███████|                ✗ 409  se cruza
 09:30 → 10:30              |████|             ✗ 409  contenida
 11:00 → 13:00                     |███████|   ✓ 201  consecutiva
 07:00 → 09:00  |████|                         ✓ 201  consecutiva
```

Las reservas **consecutivas no son conflicto**: una persona devuelve el equipo
a las 11:00 y la siguiente lo recoge en ese mismo instante.

Esta regla se protege en **dos capas**:

1. Una comprobación en el código, que devuelve un mensaje de error claro.
2. Una restricción `EXCLUDE` de PostgreSQL, que hace el solapamiento
   **físicamente imposible** incluso si dos personas reservan en el mismo
   milisegundo. Está verificado: de 20 peticiones simultáneas por la misma
   franja, solo una se guarda.

La explicación completa está en [`docs/plan.md`](docs/plan.md) §7.

---

## Pruebas automáticas

```bash
docker compose exec api pytest -v
```

**36 pruebas**, que corren contra un PostgreSQL real (en una base aparte,
`lis_test`) y no contra SQLite, porque la restricción que sostiene la regla
crítica solo existe en PostgreSQL: probar contra SQLite daría una suite en
verde sin verificar lo que de verdad importa.

Los siete casos del diagrama de arriba son una única prueba parametrizada,
escrita para que se lea igual que la especificación.

---

## Estructura del proyecto

```
backend/
├── app/
│   ├── main.py               Crea la aplicación y engancha los routers
│   ├── database.py           Conexión a PostgreSQL, sesiones y paginación
│   ├── models.py             Las 2 tablas: Equipo y Reserva
│   ├── schemas.py            Qué entra y qué sale por la API (validación)
│   ├── datos_ejemplo.py      Carga el inventario de ejemplo
│   └── routers/
│       ├── equipos.py        Endpoints de inventario
│       ├── reservas.py       Endpoints de reservas + la regla crítica
│       └── estadisticas.py   Ranking de equipos más reservados
├── alembic/                  Migraciones (historial de la estructura de la BD)
├── tests/                    36 pruebas automáticas
├── docs/                     Especificación, plan técnico y tareas
├── docker-compose.yml        Levanta API + PostgreSQL juntos
├── Dockerfile                Receta de la imagen de la API
└── requirements.txt          Dependencias
```

**Por qué es tan plana:** con dos entidades, separar en capas de servicios y
repositorios produciría funciones de tres líneas que solo reenvían llamadas —
más archivos que abrir, ningún beneficio. La lógica vive junto al endpoint que
la usa. La única excepción es la regla crítica, que sí está aislada en una
función con nombre propio (`hay_solapamiento`) porque es lo que cualquiera
querrá leer primero.

---

## Documentación del proceso

El proyecto se construyó siguiendo **SDD (Spec-Driven Development)**: primero
se definió qué se iba a construir, luego cómo, y solo entonces se escribió
código.

| Documento | Contenido |
|---|---|
| [`docs/spec.md`](docs/spec.md) | **Qué** hace el sistema: actores, entidades, 8 casos de uso, 7 reglas de negocio, 29 criterios de aceptación y las decisiones de diseño con su justificación. |
| [`docs/plan.md`](docs/plan.md) | **Cómo** se construye: estructura, modelo de datos, librerías, migraciones, códigos HTTP, pruebas y el mecanismo anti-solapamiento explicado a fondo. |
| [`docs/tasks.md`](docs/tasks.md) | Las 12 tareas de implementación, cada una con su comando de verificación. |

El historial de commits sigue esas tareas una a una, de modo que se puede
seguir la construcción paso a paso.

---

## Configuración

| Variable | Para qué sirve | Valor por defecto |
|---|---|---|
| `DATABASE_URL` | Dirección de la base de datos | La define `docker-compose.yml` apuntando al contenedor `db` |

**Con Docker no hace falta configurar nada**: `docker-compose.yml` ya define
la variable. El archivo [`.env.example`](.env.example) solo se necesita para
ejecutar la API fuera de Docker o apuntarla a otra base de datos.

---

## Alcance

**Implementado:** gestión de equipos, listado paginado con filtros, gestión
de reservas, validación estricta de solapamientos y el bonus de estadísticas
(Top 5).

**Fuera de alcance:** el bonus de autenticación con Google SSO, y la
eliminación de equipos (para no destruir el historial de reservas; un equipo
que sale de circulación se marca como `DAÑADO`). Las razones están razonadas
en [`docs/spec.md`](docs/spec.md) §7.
