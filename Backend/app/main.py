from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud
from .database import engine, get_db, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LIS - Sistema de Gestión y Reservas de Equipos",
    description="API REST para inventario y reservas de hardware del Laboratorio Integrado de Sistemas (UdeA).",
    version="1.0.0",
)  

app.add_middleware( CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"], )


# ---------------------------------------------------------------------------
# Equipos
# ---------------------------------------------------------------------------
@app.post("/equipos", response_model=schemas.EquipoOut, status_code=status.HTTP_201_CREATED, tags=["Equipos"])
def registrar_equipo(payload: schemas.EquipoCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Equipo).filter(
        models.Equipo.numero_serie_o_mac == payload.numero_serie_o_mac
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe un equipo con ese número de serie/MAC")
    return crud.crear_equipo(db, payload)


@app.get("/equipos", response_model=schemas.EquipoPaginado, tags=["Equipos"])
def listar_equipos(
    categoria: Optional[models.CategoriaEquipo] = None,
    estado: Optional[models.EstadoEquipo] = None,
    pagina: int = Query(1, ge=1),
    tamano_pagina: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, resultados = crud.listar_equipos(db, categoria, estado, pagina, tamano_pagina)
    return schemas.EquipoPaginado(total=total, pagina=pagina, tamano_pagina=tamano_pagina, resultados=resultados)


@app.get("/equipos/{equipo_id}", response_model=schemas.EquipoOut, tags=["Equipos"])
def obtener_equipo(equipo_id: str, db: Session = Depends(get_db)):
    equipo = db.query(models.Equipo).filter(models.Equipo.id == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo


@app.put("/equipos/{equipo_id}", response_model=schemas.EquipoOut, tags=["Equipos"])
def actualizar_equipo(equipo_id: str, payload: schemas.EquipoUpdate, db: Session = Depends(get_db)):
    equipo = db.query(models.Equipo).filter(models.Equipo.id == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return crud.actualizar_equipo(db, equipo, payload)


# ---------------------------------------------------------------------------
# Reservas
# ---------------------------------------------------------------------------
@app.post("/reservas", response_model=schemas.ReservaOut, status_code=status.HTTP_201_CREATED, tags=["Reservas"])
def crear_reserva(payload: schemas.ReservaCreate, db: Session = Depends(get_db)):
    equipo = db.query(models.Equipo).filter(models.Equipo.id == payload.equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="El equipo indicado no existe")

    if crud.existe_solapamiento(db, payload.equipo_id, payload.fecha_hora_inicio, payload.fecha_hora_fin):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El equipo ya está reservado en esa franja de tiempo",
        )
    return crud.crear_reserva(db, payload)


@app.get("/reservas", response_model=list[schemas.ReservaOut], tags=["Reservas"])
def listar_reservas(
    equipo_id: Optional[str] = None,
    usuario_correo: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Reserva)
    if equipo_id:
        query = query.filter(models.Reserva.equipo_id == equipo_id)
    if usuario_correo:
        query = query.filter(models.Reserva.usuario_correo == usuario_correo)
    return query.order_by(models.Reserva.fecha_hora_inicio).all()


@app.delete("/reservas/{reserva_id}", response_model=schemas.ReservaOut, tags=["Reservas"])
def cancelar_reserva(reserva_id: str, db: Session = Depends(get_db)):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reserva.estado == models.EstadoReserva.cancelada:
        raise HTTPException(status_code=400, detail="La reserva ya estaba cancelada")
    return crud.cancelar_reserva(db, reserva)


# ---------------------------------------------------------------------------
# Bonus: estadísticas
# ---------------------------------------------------------------------------
@app.get("/estadisticas/top-equipos", response_model=list[schemas.TopEquipoOut], tags=["Estadísticas"])
def top_5_equipos(db: Session = Depends(get_db)):
    filas = crud.top_equipos(db, limite=5)
    return [schemas.TopEquipoOut(equipo_id=f.equipo_id, nombre=f.nombre, total_reservas=f.total_reservas) for f in filas]


@app.get("/", tags=["Root"])
def root():
    return {"mensaje": "API de Gestión y Reservas de Equipos - LIS", "docs": "/docs"}
