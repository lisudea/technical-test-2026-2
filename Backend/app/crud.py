from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from . import models


def crear_equipo(db: Session, data) -> models.Equipo:
    equipo = models.Equipo(**data.model_dump())
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return equipo


def actualizar_equipo(db: Session, equipo: models.Equipo, data) -> models.Equipo:
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(equipo, campo, valor)
    db.commit()
    db.refresh(equipo)
    return equipo


def listar_equipos(db: Session, categoria=None, estado=None, pagina=1, tamano_pagina=10):
    query = db.query(models.Equipo)
    if categoria:
        query = query.filter(models.Equipo.categoria == categoria)
    if estado:
        query = query.filter(models.Equipo.estado == estado)
    total = query.count()
    resultados = query.offset((pagina - 1) * tamano_pagina).limit(tamano_pagina).all()
    return total, resultados


def existe_solapamiento(db: Session, equipo_id: str, inicio, fin, excluir_reserva_id=None) -> bool:
    """
    Dos rangos [a_inicio, a_fin) y [b_inicio, b_fin) se solapan si:
        a_inicio < b_fin  AND  b_inicio < a_fin
    Solo se consideran reservas activas (una cancelada libera el cupo).
    """
    query = db.query(models.Reserva).filter(
        models.Reserva.equipo_id == equipo_id,
        models.Reserva.estado == models.EstadoReserva.activa,
        models.Reserva.fecha_hora_inicio < fin,
        models.Reserva.fecha_hora_fin > inicio,
    )
    if excluir_reserva_id:
        query = query.filter(models.Reserva.id != excluir_reserva_id)
    return db.query(query.exists()).scalar()


def crear_reserva(db: Session, data) -> models.Reserva:
    reserva = models.Reserva(**data.model_dump())
    db.add(reserva)
    db.commit()
    db.refresh(reserva)
    return reserva


def cancelar_reserva(db: Session, reserva: models.Reserva) -> models.Reserva:
    reserva.estado = models.EstadoReserva.cancelada
    db.commit()
    db.refresh(reserva)
    return reserva


def top_equipos(db: Session, limite=5):
    return (
        db.query(
            models.Equipo.id.label("equipo_id"),
            models.Equipo.nombre.label("nombre"),
            func.count(models.Reserva.id).label("total_reservas"),
        )
        .join(models.Reserva, models.Reserva.equipo_id == models.Equipo.id)
        .group_by(models.Equipo.id)
        .order_by(func.count(models.Reserva.id).desc())
        .limit(limite)
        .all()
    )
