"""Pruebas de la gestión del inventario de equipos.

Cubre los criterios de aceptación CA-01 a CA-10 de ``docs/spec.md``.
"""

import pytest

EQUIPO_VALIDO = {
    "nombre": "Arduino Uno R3",
    "numero_serie": "ARD-UNO-001",
    "categoria": "Microcontroladores",
    "estado": "DISPONIBLE",
}


def test_registrar_equipo(cliente):
    """Registrar un equipo válido lo crea y le asigna un id (CA-01)."""
    respuesta = cliente.post("/equipos", json=EQUIPO_VALIDO)

    assert respuesta.status_code == 201

    creado = respuesta.json()
    assert creado["id"] > 0
    assert creado["nombre"] == "Arduino Uno R3"
    assert creado["estado"] == "DISPONIBLE"

    # Y aparece en el listado.
    assert cliente.get("/equipos").json()["total"] == 1


def test_numero_de_serie_duplicado(cliente):
    """Dos equipos no pueden compartir número de serie (CA-02, regla RN-01)."""
    cliente.post("/equipos", json=EQUIPO_VALIDO)

    repetido = cliente.post(
        "/equipos", json={**EQUIPO_VALIDO, "nombre": "Otro Arduino"}
    )

    assert repetido.status_code == 409
    # Y no se creó nada de más.
    assert cliente.get("/equipos").json()["total"] == 1


@pytest.mark.parametrize("campo", ["nombre", "numero_serie", "categoria"])
def test_campos_obligatorios(cliente, campo):
    """Falta un campo obligatorio y se rechaza indicándolo (CA-03)."""
    incompleto = {k: v for k, v in EQUIPO_VALIDO.items() if k != campo}
    assert cliente.post("/equipos", json=incompleto).status_code == 422


def test_estado_invalido(cliente):
    """Un estado que no existe se rechaza (CA-04)."""
    respuesta = cliente.post("/equipos", json={**EQUIPO_VALIDO, "estado": "ROTO"})
    assert respuesta.status_code == 422


def test_nombre_con_solo_espacios(cliente):
    """Un nombre formado solo por espacios se rechaza, no se guarda en blanco."""
    respuesta = cliente.post("/equipos", json={**EQUIPO_VALIDO, "nombre": "     "})
    assert respuesta.status_code == 422


def test_actualizacion_parcial_no_borra_otros_campos(cliente):
    """Enviar solo el estado deja el resto de campos intactos (CA-05).

    Es el motivo de usar PATCH y no PUT: PUT significaría reemplazar el
    equipo completo, vaciando lo que no se envíe.
    """
    id_equipo = cliente.post("/equipos", json=EQUIPO_VALIDO).json()["id"]

    respuesta = cliente.patch(
        f"/equipos/{id_equipo}", json={"estado": "MANTENIMIENTO"}
    )

    assert respuesta.status_code == 200

    actualizado = respuesta.json()
    assert actualizado["estado"] == "MANTENIMIENTO"
    assert actualizado["nombre"] == "Arduino Uno R3"
    assert actualizado["categoria"] == "Microcontroladores"
    assert actualizado["numero_serie"] == "ARD-UNO-001"


def test_equipo_inexistente(cliente):
    """Consultar o actualizar un equipo que no existe devuelve 404 (CA-06)."""
    assert cliente.get("/equipos/9999").status_code == 404
    assert cliente.patch("/equipos/9999", json={"estado": "DISPONIBLE"}).status_code == 404


def test_actualizar_con_serie_de_otro_equipo(cliente):
    """No se puede robar el número de serie de otro equipo (regla RN-01)."""
    cliente.post("/equipos", json=EQUIPO_VALIDO)
    segundo = cliente.post(
        "/equipos", json={**EQUIPO_VALIDO, "numero_serie": "ESP32-001"}
    ).json()["id"]

    respuesta = cliente.patch(
        f"/equipos/{segundo}", json={"numero_serie": "ARD-UNO-001"}
    )

    assert respuesta.status_code == 409


# ---------------------------------------------------------------------------
# Listado: paginación y filtros
# ---------------------------------------------------------------------------


def crear_inventario(cliente):
    """Carga 12 equipos de categorías y estados variados.

    Args:
        cliente: cliente HTTP de pruebas.
    """
    equipos = [
        ("Arduino Uno R3", "ARD-001", "Microcontroladores", "DISPONIBLE"),
        ("Arduino Nano", "ARD-002", "Microcontroladores", "DISPONIBLE"),
        ("ESP32 DevKit", "ESP-001", "Microcontroladores", "MANTENIMIENTO"),
        ("Raspberry Pi 4", "RPI-001", "Computadores", "DISPONIBLE"),
        ("Protoboard 830", "PRO-001", "Prototipado", "DISPONIBLE"),
        ("Kit jumpers", "JUM-001", "Prototipado", "DISPONIBLE"),
        ("Kit LEDs", "LED-001", "Prototipado", "DAÑADO"),
        ("Cable HDMI", "CAB-001", "Cables", "DISPONIBLE"),
        ("Cable de red", "CAB-002", "Cables", "DISPONIBLE"),
        ("Crimpadora RJ45", "HER-001", "Herramientas", "DISPONIBLE"),
        ("Cortafríos", "HER-002", "Herramientas", "DISPONIBLE"),
        ("Tester digital", "HER-003", "Herramientas", "MANTENIMIENTO"),
    ]
    for nombre, serie, categoria, estado in equipos:
        cliente.post(
            "/equipos",
            json={
                "nombre": nombre,
                "numero_serie": serie,
                "categoria": categoria,
                "estado": estado,
            },
        )


def test_paginacion(cliente):
    """Con 12 equipos y páginas de 10, hay 2 páginas (CA-07)."""
    crear_inventario(cliente)

    primera = cliente.get("/equipos?page=1&size=10").json()
    assert len(primera["items"]) == 10
    assert primera["total"] == 12
    assert primera["total_pages"] == 2
    assert primera["page"] == 1

    segunda = cliente.get("/equipos?page=2&size=10").json()
    assert len(segunda["items"]) == 2

    # Ninguna página repite equipos de la otra: el orden es estable.
    ids_primera = {e["id"] for e in primera["items"]}
    ids_segunda = {e["id"] for e in segunda["items"]}
    assert ids_primera.isdisjoint(ids_segunda)


def test_filtro_por_categoria(cliente):
    """El filtro por categoría acota el total al subconjunto (CA-08)."""
    crear_inventario(cliente)

    resultado = cliente.get("/equipos?categoria=Herramientas&size=100").json()

    assert resultado["total"] == 3
    assert all(e["categoria"] == "Herramientas" for e in resultado["items"])


def test_filtro_por_categoria_ignora_mayusculas(cliente):
    """Buscar 'herramientas' encuentra 'Herramientas'."""
    crear_inventario(cliente)

    minusculas = cliente.get("/equipos?categoria=herramientas&size=100").json()
    assert minusculas["total"] == 3


def test_filtros_combinados(cliente):
    """Categoría y estado se pueden combinar (CA-09)."""
    crear_inventario(cliente)

    resultado = cliente.get(
        "/equipos?categoria=Herramientas&estado=DISPONIBLE&size=100"
    ).json()

    assert resultado["total"] == 2
    assert all(
        e["categoria"] == "Herramientas" and e["estado"] == "DISPONIBLE"
        for e in resultado["items"]
    )


def test_filtro_sin_resultados(cliente):
    """Un filtro sin coincidencias devuelve lista vacía, no un error (CA-10)."""
    crear_inventario(cliente)

    respuesta = cliente.get("/equipos?categoria=NoExisteEstaCategoria")

    assert respuesta.status_code == 200

    resultado = respuesta.json()
    assert resultado["items"] == []
    assert resultado["total"] == 0
    assert resultado["total_pages"] == 0
