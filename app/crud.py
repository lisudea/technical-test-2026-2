# consultas a las base de datos y reglas de negocio de la aplicacion

from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas
from typing import Optional
from sqlalchemy import func # func permite usar funciones de bases de datos
# creo el get_equipos para obtener los equipos de la base de datos con paginacion y filtros

def get_equipos(db: Session, skip: int = 0, limit: int = 10, categoria: str = None, estado: str = None):
    # inicio la consulta base
    query = db.query(models.Equipo)
    
    # aplico filtros opcionales si el usuario los envía
    if categoria:
        query = query.filter(models.Equipo.categoria == categoria)
    if estado:
        query = query.filter(models.Equipo.estado == estado)
    
    # se aplica la paginación (offset y limit) y se ejecuta la búsqueda
    return query.offset(skip).limit(limit).all()

#para crear un equipo
def create_equipo(db: Session, equipo: schemas.EquipoCreate):
    # Convierto el esquema de Pydantic a un modelo de SQLAlchemy usando model_dump()
    # Esto permite crear un objeto de la clase Equipo con los datos validados por Pydantic
    db_equipo = models.Equipo(**equipo.model_dump())
    db.add(db_equipo)
    db.commit()
    db.refresh(db_equipo) # Actualiza el objeto con el ID generado por la BD
    return db_equipo

#para actualizar un equipo, solo los campos que el usuario envie
#por eso uso exclude_unset=True, para que solo tome los campos que el usuario envio y no actualice los demas
def update_equipo(db: Session, equipo_id: int, equipo_update: schemas.EquipoUpdate):
    # busco el equipo en la base de datos
    db_equipo = db.query(models.Equipo).filter(models.Equipo.id == equipo_id).first()
    
    if db_equipo:
        # traemos solo los datos que el usuario envió (evita borrar datos sin querer)
        update_data = equipo_update.model_dump(exclude_unset=True)
        
        # se aplican los cambios al objeto de la base de datos
        for key, value in update_data.items():
            setattr(db_equipo, key, value)
            
        # se guarda y recarga 
        db.commit()
        db.refresh(db_equipo)
        
    return db_equipo

#para verificar la disponibilidad de un equipo
def verificar_disponibilidad(db: Session, equipo_id: int, fecha_inicio: datetime, fecha_fin: datetime):
    #este metodo lo creo para verificar el solapamiento de fechas y cumplir con la regla de negocio
    #Retorna True si el equipo está disponible, False si ya está ocupado en ese horario

    reserva_existente = db.query(models.Reserva).filter(
        models.Reserva.equipo_id == equipo_id,
        models.Reserva.estado == "ACTIVA", # Solo importan las reservas activas del equipo
        models.Reserva.fecha_inicio < fecha_fin,
        models.Reserva.fecha_fin > fecha_inicio).first() # el .frist() devuelve el primer resultado o None si no hay resultados, ya que con el primer resultado que encuente, es suficiente para saber que el equipo no está disponible
    
    # Si encuentra una reserva (no es None), significa que no está disponible
    return reserva_existente is None


#metodo para calcular el top de los equipos mas reservados
#es para las estadisticas (bonus)
def get_top_equipos(db: Session, limite: int = 5):
    
    # selecciono el ID y el Nombre para contar cuantas reservas tiene ese ID.
    resultados = db.query(
        models.Equipo.id.label("equipo_id"),
        models.Equipo.nombre.label("nombre"),
        func.count(models.Reserva.id).label("total_reservas")
    ).join(
        # Junto la tabla de equipos con la de reservas
        # para poder contar cuantas reservas tiene cada equipo, 
        # traigo el dato de la tabla de reservas y lo vinculo con el ID del equipo solo donde el id del equipo coincide con el id del equipo en la tabla de reservas
        models.Reserva, models.Equipo.id == models.Reserva.equipo_id
    ).group_by(
        # Agrupo por equipo
        models.Equipo.id
    ).order_by(
        # Ordeno de mayor a menor
        func.count(models.Reserva.id).desc()
    ).limit(limite).all()

    return resultados

# actualiza el estado del equipo según si tiene reservas activas o no

def actualizar_estado_equipo_por_reservas(db: Session, equipo_id: int):
    equipo = db.query(models.Equipo).filter(models.Equipo.id == equipo_id).first()

    if not equipo or equipo.estado == "MANTENIMIENTO":
        return equipo

    tiene_reserva_activa = db.query(models.Reserva).filter(
        models.Reserva.equipo_id == equipo_id,
        models.Reserva.estado == "ACTIVA"
    ).first() is not None

    equipo.estado = "RESERVADO" if tiene_reserva_activa else "DISPONIBLE"
    db.commit()
    return equipo

#metodo para crear una reserva
def create_reserva(db: Session, reserva: schemas.ReservaCreate):
    db_reserva = models.Reserva(**reserva.model_dump())
    db.add(db_reserva)
    db.commit() #para guardar la reserva en la base de datos
    db.refresh(db_reserva)

    actualizar_estado_equipo_por_reservas(db, reserva.equipo_id)
    return db_reserva

#metodo para obtener todas las reservas de un equipo
# de acuerdo a las fechas de inicio y fin que el usuario envie, si no envia fechas, devuelve todas las reservas del equipo
def get_reservas_por_equipo(
    db: Session, 
    equipo_id: int, 
    fecha_inicio: Optional[datetime] = None, 
    fecha_fin: Optional[datetime] = None):

    #consulta base para buscar por el ID del equipo
    query = db.query(models.Reserva).filter(models.Reserva.equipo_id == equipo_id)
    
    #Si el usuario envió una fecha de inicio, filtro las que empiecen DESPUÉS o IGUAL a esa fecha
    if fecha_inicio:
        query = query.filter(models.Reserva.fecha_inicio >= fecha_inicio)
        
    #Si el usuario envió una fecha de fin, filtro las que terminen ANTES o IGUAL a esa fecha
    if fecha_fin:
        query = query.filter(models.Reserva.fecha_fin <= fecha_fin)

    return query.all()

#para cancelar una reserva cambiando su estado en lugar de borrarla
#ya que nos sirve tener la informacion de las reservas canceladas para estadisticas
def cancelar_reserva(db: Session, reserva_id: int):

    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    
    if reserva:
        reserva.estado = "CANCELADA"
        db.commit() # para guardar el cambio en la base de datos
        db.refresh(reserva)
        actualizar_estado_equipo_por_reservas(db, reserva.equipo_id)
        
    return reserva