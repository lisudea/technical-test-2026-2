"""Endpoints de estadísticas sobre el uso del inventario.

Cubre el caso de uso CU-08 (bonus): saber qué equipos son los más demandados,
para orientar futuras compras del laboratorio.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Equipo, Reserva

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas"])


class EquipoMasReservado(BaseModel):
    """Una fila del ranking de equipos más solicitados.

    Attributes:
        equipo_id: identificador del equipo.
        nombre: nombre del equipo.
        categoria: categoría a la que pertenece.
        total_reservas: cuántas veces se ha reservado históricamente,
            **incluyendo las reservas canceladas**.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "equipo_id": 3,
                "nombre": "ESP32 DevKit V1",
                "categoria": "Microcontroladores",
                "total_reservas": 12,
            }
        }
    )

    equipo_id: int
    nombre: str
    categoria: str
    total_reservas: int = Field(
        ..., description="Número de reservas históricas, canceladas incluidas."
    )


@router.get(
    "/top-equipos",
    response_model=list[EquipoMasReservado],
    summary="Ranking de los equipos más reservados",
    description=(
        "Devuelve los equipos con más reservas históricas, de mayor a menor.\n\n"
        "### Qué se cuenta exactamente\n\n"
        "Se cuentan **todas** las reservas, incluidas las canceladas. La "
        "estadística mide **demanda** (cuántas veces se ha solicitado un "
        "equipo), no préstamos efectivamente cumplidos: si un equipo se pide "
        "constantemente aunque luego se cancele, sigue siendo un equipo muy "
        "demandado y esa información es útil para decidir compras.\n\n"
        "Los equipos que nunca se han reservado **no aparecen** en el "
        "ranking. Si todavía no hay ninguna reserva, se devuelve una lista "
        "vacía (no es un error)."
    ),
)
def top_equipos_mas_reservados(
    limite: int = Query(
        default=5,
        ge=1,
        le=50,
        description="Cuántos equipos devolver. Por defecto 5.",
    ),
    db: Session = Depends(get_db),
) -> list[EquipoMasReservado]:
    """Devuelve el ranking de equipos por número de reservas (CU-08).

    El cálculo lo hace **PostgreSQL**, no Python: se agrupan las reservas por
    equipo, se cuentan y se ordenan en una sola consulta. La alternativa
    —traerse todas las reservas y contarlas en memoria— funcionaría con
    veinte reservas y se volvería inviable con veinte mil.

    Se usa ``JOIN`` (y no ``LEFT JOIN``) a propósito: así los equipos sin
    ninguna reserva quedan fuera del ranking, que es lo esperable en un "top
    de más solicitados".

    Args:
        limite: cuántos equipos devolver como máximo.
        db: sesión de base de datos, inyectada por FastAPI.

    Returns:
        list[EquipoMasReservado]: ranking ordenado de mayor a menor número de
        reservas. Lista vacía si todavía no hay ninguna reserva registrada.
    """
    consulta = (
        select(
            Equipo.id,
            Equipo.nombre,
            Equipo.categoria,
            func.count(Reserva.id).label("total_reservas"),
        )
        .join(Reserva, Reserva.equipo_id == Equipo.id)
        .group_by(Equipo.id, Equipo.nombre, Equipo.categoria)
        # Se desempata por nombre para que dos equipos con el mismo número de
        # reservas salgan siempre en el mismo orden, y el resultado no cambie
        # de una consulta a otra.
        .order_by(func.count(Reserva.id).desc(), Equipo.nombre)
        .limit(limite)
    )

    filas = db.execute(consulta).all()

    return [
        EquipoMasReservado(
            equipo_id=fila.id,
            nombre=fila.nombre,
            categoria=fila.categoria,
            total_reservas=fila.total_reservas,
        )
        for fila in filas
    ]
