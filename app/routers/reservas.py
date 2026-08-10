#endpoints de reservas, como creacion, cancelacion y listado

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app import schemas, crud
from app.database import get_db

router = APIRouter(prefix="/reservas", tags=["Reservas"])

@router.post("/", response_model=schemas.ReservaResponse)
def crear_reserva(reserva: schemas.ReservaCreate, db: Session = Depends(get_db)):
    """Crea una reserva verificando primero que no haya solapamiento de fechas."""
    # se verifica la disponibilidad del equipo antes de crear la reserva
    esta_disponible = crud.verificar_disponibilidad(
        db=db, 
        equipo_id=reserva.equipo_id, 
        fecha_inicio=reserva.fecha_inicio, 
        fecha_fin=reserva.fecha_fin)
    
    # si esta disponible el equipo lanzo un error 400 (Bad Request)
    if not esta_disponible:
        raise HTTPException(
            status_code=400, 
            detail="El equipo no está disponible en el horario seleccionado.")
        
    # 3. Si todo está bien, guardamos la reserva
    return crud.create_reserva(db=db, reserva=reserva)

@router.get("/equipo/{equipo_id}", response_model=List[schemas.ReservaResponse])
def listar_reservas_equipo(
    equipo_id: int, 
    fecha_inicio: Optional[datetime] = None, 
    fecha_fin: Optional[datetime] = None, 
    db: Session = Depends(get_db)):
    # para listar las reservas de un equipo, permitiendo filtrar por un rango de fechas
    return crud.get_reservas_por_equipo(db=db, equipo_id=equipo_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

@router.patch("/{reserva_id}/cancelar", response_model=schemas.ReservaResponse)
# aca uso PATCH porque no estoy borrando la reserva, sino que estoy cambiando su estado a "CANCELADA"

def cancelar_reserva(reserva_id: int, db: Session = Depends(get_db)):

    reserva_cancelada = crud.cancelar_reserva(db=db, reserva_id=reserva_id)
    
    if not reserva_cancelada:
        raise HTTPException(
            status_code=404, 
            detail="Reserva no encontrada.")
        
    return reserva_cancelada