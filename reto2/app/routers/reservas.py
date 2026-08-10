from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipo import Equipo
from app.models.reserva import Reserva
from app.schemas.reserva import ReservaCreate, ReservaResponse


router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"]
)


@router.post("/", response_model=ReservaResponse, status_code=201)
def crear_reserva(
    reserva: ReservaCreate,
    db: Session = Depends(get_db)
):
    # Verificar que el equipo exista
    equipo = (
        db.query(Equipo)
        .filter(Equipo.id == reserva.equipo_id)
        .first()
    )

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="El equipo no existe"
        )

    # Buscar reservas que se crucen con la nueva reserva
    reserva_en_conflicto = (
        db.query(Reserva)
        .filter(
            Reserva.equipo_id == reserva.equipo_id,
            Reserva.fecha_inicio < reserva.fecha_fin,
            Reserva.fecha_fin > reserva.fecha_inicio
        )
        .first()
    )

    if reserva_en_conflicto:
        raise HTTPException(
            status_code=409,
            detail="El equipo ya está reservado en ese horario"
        )

    nueva_reserva = Reserva(
        usuario_nombre=reserva.usuario_nombre,
        usuario_correo=reserva.usuario_correo,
        equipo_id=reserva.equipo_id,
        fecha_inicio=reserva.fecha_inicio,
        fecha_fin=reserva.fecha_fin
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    return nueva_reserva


@router.get("/", response_model=list[ReservaResponse])
def listar_reservas(
    equipo_id: int | None = None,
    db: Session = Depends(get_db)
):
    consulta = db.query(Reserva)

    if equipo_id:
        consulta = consulta.filter(
            Reserva.equipo_id == equipo_id
        )

    return consulta.all()


@router.delete("/{reserva_id}", status_code=204)
def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db)
):
    reserva = (
        db.query(Reserva)
        .filter(Reserva.id == reserva_id)
        .first()
    )

    if not reserva:
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada"
        )

    db.delete(reserva)
    db.commit()