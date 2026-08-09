"""Endpoints de gestión de reservas.

Cubre los casos de uso CU-05 (crear), CU-06 (cancelar) y CU-07 (listar).

**Este es el archivo más importante del proyecto**, porque aquí vive la regla
crítica del enunciado: un equipo no puede estar reservado por dos personas a
la vez (regla RN-03). Ver :func:`hay_solapamiento` y
:func:`crear_reserva`.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db, paginar
from app.models import Equipo, EstadoEquipo, EstadoReserva, Reserva
from app.schemas import ReservaCrear, ReservaRespuesta, RespuestaPaginada

router = APIRouter(prefix="/reservas", tags=["Reservas"])

# Mensaje único para el conflicto de solapamiento. Se usa desde los dos
# lugares donde puede detectarse (la comprobación previa y la restricción de
# la base de datos), para que la API responda siempre lo mismo ante el mismo
# problema, sin que quien la consume note por cuál de los dos caminos pasó.
MENSAJE_SOLAPAMIENTO = (
    "El equipo ya tiene una reserva activa que se cruza con esa franja "
    "horaria. Consulta las reservas del equipo para elegir un horario libre."
)


def hay_solapamiento(
    db: Session, equipo_id: int, inicio: datetime, fin: datetime
) -> bool:
    """Comprueba si un equipo ya tiene una reserva activa en esa franja.

    Implementa la regla RN-03 de la especificación. Dos franjas se solapan
    cuando **una empieza antes de que la otra termine y termina después de que
    la otra empieza**::

        solapan  ⟺  (inicio_nuevo < fin_existente)  Y  (fin_nuevo > inicio_existente)

    Las comparaciones son **estrictas** (``<`` y ``>``, no ``<=`` ni ``>=``),
    y eso es intencional: implementa la decisión D-2 de la especificación,
    según la cual los extremos no cuentan como conflicto. Una reserva de 09:00
    a 11:00 y otra de 11:00 a 13:00 conviven sin problema, porque una persona
    devuelve el equipo a las 11:00 y la siguiente lo recoge en ese mismo
    instante. Si las comparaciones fueran ``<=``, sería imposible encadenar
    préstamos consecutivos.

    Solo se tienen en cuenta las reservas ``ACTIVA``: una reserva cancelada
    libera su franja de inmediato (regla RN-04).

    Args:
        db: sesión de base de datos activa.
        equipo_id: equipo que se quiere reservar.
        inicio: fecha y hora de inicio de la franja solicitada.
        fin: fecha y hora de fin de la franja solicitada.

    Returns:
        bool: ``True`` si ya existe al menos una reserva activa que se cruza
        con la franja pedida; ``False`` si la franja está libre.
    """
    consulta = select(Reserva.id).where(
        Reserva.equipo_id == equipo_id,
        Reserva.estado == EstadoReserva.ACTIVA,
        Reserva.fecha_hora_inicio < fin,
        Reserva.fecha_hora_fin > inicio,
    )

    # .first() se detiene en cuanto encuentra una coincidencia: no hace falta
    # contarlas todas para saber que hay conflicto.
    return db.execute(consulta).first() is not None


@router.post(
    "",
    response_model=ReservaRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una reserva",
    description=(
        "Reserva un equipo durante una franja horaria.\n\n"
        "### Reglas que se comprueban\n\n"
        "1. El equipo debe **existir** → si no, `404`.\n"
        "2. El equipo debe estar **DISPONIBLE**: uno en mantenimiento o "
        "dañado no se presta → si no, `409`.\n"
        "3. La franja **no puede cruzarse** con otra reserva activa del mismo "
        "equipo → si se cruza, `409`.\n"
        "4. La fecha de fin debe ser posterior a la de inicio → si no, `422`.\n\n"
        "### Sobre las reservas consecutivas\n\n"
        "Dos reservas que se tocan por el extremo **no** son conflicto: si "
        "una va de 09:00 a 11:00, otra puede empezar exactamente a las 11:00. "
        "El equipo se devuelve y se vuelve a prestar en ese mismo momento."
    ),
    responses={
        404: {"description": "El equipo indicado no existe."},
        409: {
            "description": (
                "El equipo no está disponible, o ya está reservado en esa franja."
            )
        },
    },
)
def crear_reserva(
    datos: ReservaCrear, db: Session = Depends(get_db)
) -> Reserva:
    """Registra una reserva tras comprobar todas las reglas de negocio (CU-05).

    La protección contra solapamientos tiene **dos capas**, y las dos son
    necesarias:

    1. **Comprobación previa** (:func:`hay_solapamiento`): detecta el conflicto
       en el caso normal y permite responder con un mensaje claro y útil.
    2. **Restricción de la base de datos** (``reservas_sin_solape``): es la
       garantía real. La comprobación previa tiene una ventana de carrera —
       si dos peticiones llegan a la vez, ambas consultan, ambas ven la franja
       libre y ambas intentan insertar. La restricción hace que la segunda
       inserción falle a nivel de motor, pase lo que pase.

    Quien consume la API recibe exactamente la misma respuesta ``409`` en
    ambos casos: la segunda capa es una red de seguridad, no un camino
    alternativo.

    Args:
        datos: información de la reserva, ya validada por Pydantic (que aplicó
            la regla RN-02 sobre el rango de fechas).
        db: sesión de base de datos, inyectada por FastAPI.

    Returns:
        Reserva: la reserva recién creada, en estado ``ACTIVA``.

    Raises:
        HTTPException: 404 si el equipo no existe (RN-05); 409 si el equipo no
            está disponible (RN-06) o si la franja se solapa (RN-03).
    """
    # --- Regla RN-05: el equipo debe existir --------------------------------
    equipo = db.get(Equipo, datos.equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe ningún equipo con el identificador {datos.equipo_id}.",
        )

    # --- Regla RN-06: solo se prestan equipos disponibles -------------------
    # Se responde 409 y no 422 porque la petición está bien formada: el
    # problema es que choca con el estado actual del sistema, que es
    # exactamente lo que significa "Conflict".
    if equipo.estado != EstadoEquipo.DISPONIBLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"El equipo «{equipo.nombre}» no está disponible para "
                f"préstamo (estado actual: {equipo.estado.value})."
            ),
        )

    # --- Regla RN-03, capa 1: comprobación previa ---------------------------
    if hay_solapamiento(
        db, datos.equipo_id, datos.fecha_hora_inicio, datos.fecha_hora_fin
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=MENSAJE_SOLAPAMIENTO
        )

    reserva = Reserva(**datos.model_dump())
    db.add(reserva)

    # --- Regla RN-03, capa 2: la garantía de la base de datos ---------------
    try:
        db.commit()
    except IntegrityError:
        # Se llega aquí si otra petición insertó una reserva solapada entre
        # nuestra comprobación y nuestro INSERT (la ventana de carrera). La
        # restricción reservas_sin_solape de PostgreSQL rechaza la fila y
        # nosotros lo traducimos al mismo 409 de siempre.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=MENSAJE_SOLAPAMIENTO
        )

    db.refresh(reserva)
    return reserva
