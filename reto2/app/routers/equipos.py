from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipo import Equipo
from app.schemas.equipo import EquipoCreate, EquipoResponse


router = APIRouter(
    prefix="/equipos",
    tags=["Equipos"]
)


@router.post("/", response_model=EquipoResponse, status_code=201)
def crear_equipo(equipo: EquipoCreate, db: Session = Depends(get_db)):
    equipo_existente = (
        db.query(Equipo)
        .filter(Equipo.numero_serie == equipo.numero_serie)
        .first()
    )

    if equipo_existente:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un equipo con ese número de serie"
        )

    nuevo_equipo = Equipo(
        nombre=equipo.nombre,
        numero_serie=equipo.numero_serie,
        categoria=equipo.categoria,
        estado=equipo.estado
    )

    db.add(nuevo_equipo)
    db.commit()
    db.refresh(nuevo_equipo)

    return nuevo_equipo


@router.get("/", response_model=list[EquipoResponse])
def listar_equipos(
    categoria: str | None = None,
    estado: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    consulta = db.query(Equipo)

    if categoria:
        consulta = consulta.filter(Equipo.categoria == categoria)

    if estado:
        consulta = consulta.filter(Equipo.estado == estado)

    equipos = (
        consulta
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return equipos


@router.get("/{equipo_id}", response_model=EquipoResponse)
def obtener_equipo(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id == equipo_id).first()

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )

    return equipo


@router.put("/{equipo_id}", response_model=EquipoResponse)
def actualizar_equipo(
    equipo_id: int,
    datos: EquipoCreate,
    db: Session = Depends(get_db)
):
    equipo = db.query(Equipo).filter(Equipo.id == equipo_id).first()

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )

    equipo.nombre = datos.nombre
    equipo.numero_serie = datos.numero_serie
    equipo.categoria = datos.categoria
    equipo.estado = datos.estado

    db.commit()
    db.refresh(equipo)

    return equipo