# Sistema de Gestión y Reservas de Equipos — LIS

API REST para el inventario y las reservas de hardware del Laboratorio Integrado de Sistemas (Universidad de Antioquia). Hecha con **FastAPI** + **SQLAlchemy**, persistencia en **PostgreSQL** (con **SQLite** como fallback automático para correr sin Docker).

## Cómo correrlo

### Opción A — con Docker (recomendada, usa PostgreSQL real)

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:8000`.

### Opción B — local sin Docker (usa SQLite)

```bash
python -m venv venv
source venv/bin/activate        # en Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Probar los servicios

Con el servidor corriendo, abre la documentación interactiva (Swagger) en:

```
http://localhost:8000/docs
```

Ahí puedes probar cada endpoint directamente desde el navegador, con ejemplos de payload ya generados a partir de los esquemas.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/equipos` | Registrar un equipo |
| GET | `/equipos` | Listar equipos (paginado, filtros `categoria` y `estado`) |
| GET | `/equipos/{id}` | Ver el detalle de un equipo |
| PUT | `/equipos/{id}` | Actualizar un equipo |
| POST | `/reservas` | Crear una reserva (valida solapamiento de horario → `409` si hay conflicto) |
| GET | `/reservas` | Listar reservas (filtros `equipo_id`, `usuario_correo`) |
| DELETE | `/reservas/{id}` | Cancelar una reserva |
| GET | `/estadisticas/top-equipos` | Bonus: Top 5 equipos más reservados |

## Modelo de datos

**Equipo**: `id`, `nombre`, `numero_serie_o_mac` (único), `categoria` (`microcontroladores`, `vr`, `redes`, `otros`), `estado` (`disponible`, `reservado`, `mantenimiento`)

**Reserva**: `id`, `equipo_id`, `usuario_nombre`, `usuario_correo`, `fecha_hora_inicio`, `fecha_hora_fin`, `estado` (`activa`, `cancelada`)

## Regla de negocio: solapamiento de horarios

Al crear una reserva, se valida contra todas las reservas **activas** del mismo equipo usando la condición estándar de intersección de intervalos:

```
nueva.inicio < existente.fin  AND  existente.inicio < nueva.fin
```

Si hay conflicto, la API responde `409 Conflict`. Cancelar una reserva la marca como `cancelada` y libera esa franja para futuras reservas.

## Pendiente (bonus no implementado aún)

- Autenticación con Google SSO + JWT para proteger la creación de reservas (validando correo `@udea.edu.co`).
