"""Pruebas de las reservas, incluida la regla crítica del sistema.

El bloque más importante es :func:`test_solapamiento_de_franjas`, que recorre
los siete casos del diagrama de ``docs/spec.md`` §5.1. Está escrito como una
prueba **parametrizada**: una sola función que recibe las siete franjas y el
resultado esperado. Así la prueba se lee igual que la especificación y, si
algún día cambiara el criterio de los extremos (decisión D-2), solo habría
que tocar una línea.
"""

import pytest

# Franja de referencia que se crea antes de cada caso de solapamiento.
INICIO_BASE = "2026-08-15T09:00:00Z"
FIN_BASE = "2026-08-15T11:00:00Z"


def crear_reserva(cliente, equipo_id, inicio, fin, correo="daniel@udea.edu.co"):
    """Atajo para pedir una reserva a la API.

    Args:
        cliente: cliente HTTP de pruebas.
        equipo_id: equipo a reservar.
        inicio: fecha y hora de inicio, en formato ISO.
        fin: fecha y hora de fin, en formato ISO.
        correo: correo de quien reserva.

    Returns:
        Response: la respuesta HTTP tal cual, para poder comprobar el código.
    """
    return cliente.post(
        "/reservas",
        json={
            "equipo_id": equipo_id,
            "solicitante_nombre": "Persona de Prueba",
            "solicitante_correo": correo,
            "fecha_hora_inicio": inicio,
            "fecha_hora_fin": fin,
        },
    )


# ---------------------------------------------------------------------------
# LA REGLA CRÍTICA (RN-03) — los siete casos de la especificación
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "caso, inicio, fin, esperado",
    [
        # Casos A-E: se solapan de las cinco formas posibles -> deben rechazarse
        ("A: empieza dentro", "2026-08-15T10:00:00Z", "2026-08-15T12:00:00Z", 409),
        ("B: termina dentro", "2026-08-15T08:00:00Z", "2026-08-15T10:00:00Z", 409),
        ("C: contenida", "2026-08-15T09:30:00Z", "2026-08-15T10:30:00Z", 409),
        ("D: la contiene", "2026-08-15T08:00:00Z", "2026-08-15T12:00:00Z", 409),
        ("E: idéntica", "2026-08-15T09:00:00Z", "2026-08-15T11:00:00Z", 409),
        # Casos F-G: se tocan por el extremo -> deben aceptarse (decisión D-2)
        ("F: justo después", "2026-08-15T11:00:00Z", "2026-08-15T13:00:00Z", 201),
        ("G: justo antes", "2026-08-15T07:00:00Z", "2026-08-15T09:00:00Z", 201),
    ],
)
def test_solapamiento_de_franjas(cliente, equipo_disponible, caso, inicio, fin, esperado):
    """Comprueba la regla RN-03 en los siete casos posibles (CA-12 y CA-13).

    Sobre una reserva existente de 09:00 a 11:00, se intenta reservar otra
    franja y se comprueba que la API responde lo que debe: ``409`` si las
    franjas se cruzan, ``201`` si solo se tocan por el extremo.
    """
    primera = crear_reserva(cliente, equipo_disponible, INICIO_BASE, FIN_BASE)
    assert primera.status_code == 201, "no se pudo crear la reserva de referencia"

    respuesta = crear_reserva(
        cliente, equipo_disponible, inicio, fin, correo="otra@udea.edu.co"
    )

    assert respuesta.status_code == esperado, (
        f"caso «{caso}»: se esperaba {esperado} y se obtuvo "
        f"{respuesta.status_code} → {respuesta.text}"
    )


def test_equipos_distintos_pueden_compartir_franja(cliente, equipo_disponible):
    """Dos equipos distintos pueden reservarse a la misma hora.

    La restricción solo debe actuar dentro del mismo equipo: si bloqueara
    franjas horarias globalmente, el laboratorio solo podría prestar un
    objeto a la vez.
    """
    otro = cliente.post(
        "/equipos",
        json={
            "nombre": "Arduino Uno R3",
            "numero_serie": "ARD-TEST-002",
            "categoria": "Microcontroladores",
        },
    ).json()["id"]

    assert crear_reserva(cliente, equipo_disponible, INICIO_BASE, FIN_BASE).status_code == 201
    assert crear_reserva(cliente, otro, INICIO_BASE, FIN_BASE).status_code == 201


def test_reserva_cancelada_libera_la_franja(cliente, equipo_disponible):
    """Una reserva cancelada deja libre su horario (CA-14, regla RN-04)."""
    primera = crear_reserva(cliente, equipo_disponible, INICIO_BASE, FIN_BASE)
    id_reserva = primera.json()["id"]

    # Mientras está activa, la franja está bloqueada.
    assert crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE
    ).status_code == 409

    cliente.post(f"/reservas/{id_reserva}/cancelar")

    # Tras cancelarla, la misma franja vuelve a estar disponible.
    assert crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE
    ).status_code == 201


# ---------------------------------------------------------------------------
# Resto de reglas de negocio
# ---------------------------------------------------------------------------


def test_no_se_puede_reservar_equipo_inexistente(cliente):
    """Reservar un equipo que no existe devuelve 404 (CA-16, regla RN-05)."""
    respuesta = crear_reserva(cliente, 9999, INICIO_BASE, FIN_BASE)
    assert respuesta.status_code == 404


@pytest.mark.parametrize("estado", ["MANTENIMIENTO", "DAÑADO"])
def test_no_se_puede_reservar_equipo_no_disponible(cliente, estado):
    """Un equipo en mantenimiento o dañado no se presta (CA-17, regla RN-06)."""
    equipo_id = cliente.post(
        "/equipos",
        json={
            "nombre": "Tester multímetro",
            "numero_serie": f"HERR-TEST-{estado}",
            "categoria": "Herramientas",
            "estado": estado,
        },
    ).json()["id"]

    respuesta = crear_reserva(cliente, equipo_id, INICIO_BASE, FIN_BASE)

    assert respuesta.status_code == 409
    assert "no está disponible" in respuesta.json()["detail"]


@pytest.mark.parametrize(
    "caso, inicio, fin",
    [
        ("fin anterior al inicio", "2026-08-15T11:00:00Z", "2026-08-15T09:00:00Z"),
        ("fin igual al inicio", "2026-08-15T09:00:00Z", "2026-08-15T09:00:00Z"),
    ],
)
def test_rango_de_fechas_invalido(cliente, equipo_disponible, caso, inicio, fin):
    """El fin debe ser posterior al inicio (CA-15, regla RN-02).

    Una reserva de duración cero también se rechaza: no representa ningún
    préstamo real.
    """
    respuesta = crear_reserva(cliente, equipo_disponible, inicio, fin)
    assert respuesta.status_code == 422, f"caso «{caso}»"


def test_correo_invalido(cliente, equipo_disponible):
    """Un correo mal formado se rechaza (CA-18)."""
    respuesta = crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE, correo="esto-no-es-correo"
    )
    assert respuesta.status_code == 422


# ---------------------------------------------------------------------------
# Cancelación y listado
# ---------------------------------------------------------------------------


def test_cancelar_reserva(cliente, equipo_disponible):
    """Cancelar cambia el estado sin borrar la reserva (CA-19, CU-06)."""
    id_reserva = crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE
    ).json()["id"]

    respuesta = cliente.post(f"/reservas/{id_reserva}/cancelar")

    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "CANCELADA"

    # Sigue apareciendo en el listado: no se borró, solo cambió de estado.
    listado = cliente.get("/reservas").json()
    assert listado["total"] == 1
    assert listado["items"][0]["estado"] == "CANCELADA"


def test_no_se_puede_cancelar_dos_veces(cliente, equipo_disponible):
    """Cancelar una reserva ya cancelada devuelve 409 (CA-20, regla RN-07)."""
    id_reserva = crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE
    ).json()["id"]

    cliente.post(f"/reservas/{id_reserva}/cancelar")
    segunda = cliente.post(f"/reservas/{id_reserva}/cancelar")

    assert segunda.status_code == 409


def test_cancelar_reserva_inexistente(cliente):
    """Cancelar una reserva que no existe devuelve 404."""
    assert cliente.post("/reservas/9999/cancelar").status_code == 404


def test_listado_de_reservas_con_filtros(cliente, equipo_disponible):
    """El listado filtra por equipo, correo y estado (CA-21, CU-07)."""
    crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE, correo="ana@udea.edu.co"
    )
    crear_reserva(
        cliente,
        equipo_disponible,
        "2026-08-15T12:00:00Z",
        "2026-08-15T14:00:00Z",
        correo="beto@udea.edu.co",
    )

    assert cliente.get("/reservas").json()["total"] == 2
    assert cliente.get("/reservas?solicitante_correo=ana@udea.edu.co").json()["total"] == 1
    assert cliente.get(f"/reservas?equipo_id={equipo_disponible}").json()["total"] == 2
    assert cliente.get("/reservas?estado=ACTIVA").json()["total"] == 2
    assert cliente.get("/reservas?estado=CANCELADA").json()["total"] == 0


# ---------------------------------------------------------------------------
# Estadísticas (bonus)
# ---------------------------------------------------------------------------


def test_top_equipos_sin_reservas_devuelve_lista_vacia(cliente):
    """Sin reservas, el ranking es una lista vacía, no un error (CA-24)."""
    respuesta = cliente.get("/estadisticas/top-equipos")
    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_top_equipos_cuenta_tambien_las_canceladas(cliente, equipo_disponible):
    """El ranking mide demanda histórica, canceladas incluidas (CA-23, D-5)."""
    id_reserva = crear_reserva(
        cliente, equipo_disponible, INICIO_BASE, FIN_BASE
    ).json()["id"]
    cliente.post(f"/reservas/{id_reserva}/cancelar")

    crear_reserva(cliente, equipo_disponible, "2026-08-16T09:00:00Z", "2026-08-16T11:00:00Z")

    ranking = cliente.get("/estadisticas/top-equipos").json()

    assert len(ranking) == 1
    # Dos reservas: una cancelada y una activa. El ranking cuenta las dos.
    assert ranking[0]["total_reservas"] == 2
