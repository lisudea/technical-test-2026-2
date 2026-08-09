"""Punto de entrada de la API.

Este archivo crea la aplicación FastAPI y engancha los *routers* (los grupos
de endpoints que viven en la carpeta ``routers/``).

Es deliberadamente corto: aquí no hay lógica de negocio, solo el armado de la
aplicación. Para saber qué hace cada endpoint hay que ir al router
correspondiente.
"""

from fastapi import FastAPI

from app.routers import equipos, reservas

# Descripción larga que aparece en la cabecera de la documentación
# interactiva (http://localhost:8000/docs). Se escribe en Markdown.
DESCRIPCION = """
API REST para gestionar el **inventario de equipos** del Laboratorio
Integrado de Sistemas y las **reservas** de esos equipos.

### Qué permite hacer

* Registrar, consultar y actualizar los equipos del laboratorio.
* Listar el inventario de forma paginada, filtrando por categoría y estado.
* Reservar un equipo en una franja horaria, cancelar reservas y consultarlas.
* Consultar el ranking de los equipos más solicitados.

### Regla más importante

Un equipo **no puede estar reservado por dos personas a la vez**. Si se
intenta reservar una franja que se cruza con otra reserva activa, la API
responde `409 Conflict`.

Dos reservas consecutivas (una termina a las 11:00 y la siguiente empieza a
las 11:00) **no** se consideran un conflicto: el equipo se devuelve y se
vuelve a prestar en ese mismo instante.
"""

app = FastAPI(
    title="LIS · Gestión y Reservas de Equipos",
    description=DESCRIPCION,
    version="1.0.0",
)


# Se enganchan los grupos de endpoints. Cada router ya trae su propio prefijo
# de ruta (/equipos, /reservas…), definido en su archivo.
app.include_router(equipos.router)
app.include_router(reservas.router)


@app.get(
    "/salud",
    tags=["Salud"],
    summary="Comprobar que la API está viva",
    description=(
        "Devuelve un `200 OK` si la aplicación está en funcionamiento. "
        "Sirve para comprobar rápidamente que el contenedor arrancó bien, "
        "sin necesidad de consultar datos."
    ),
)
def comprobar_salud() -> dict[str, str]:
    """Indica que la API está respondiendo.

    No consulta la base de datos a propósito: responde afirmativamente aunque
    la base de datos estuviera caída, porque su única función es confirmar que
    el servidor web está en pie.

    Returns:
        dict[str, str]: siempre ``{"estado": "ok"}``.
    """
    return {"estado": "ok"}
