#mapeo de las tablas de la base de datos en supabase usando SQLAlchemy

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# creo la definicion de la tabla "equipos", que son los equipos para crear y despues reservar
class Equipo(Base):
    __tablename__ = "equipos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    numero_serie_mac = Column(String, unique=True, nullable=False)
    categoria = Column(String, nullable=False)
    estado = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # creo una relacion uno a muchos ya que un equipo puede tener muchas reservas
    reservas = relationship("Reserva", back_populates="equipo")

# creo la definicion de la tabla "reservas", que son las reservas de los equipos
class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    equipo_id = Column(Integer, ForeignKey("equipos.id"), nullable=False)
    nombre_usuario = Column(String, nullable=False)
    correo_usuario = Column(String, nullable=False)
    fecha_inicio = Column(DateTime(timezone=True), nullable=False)
    fecha_fin = Column(DateTime(timezone=True), nullable=False)
    estado = Column(String, nullable=False, default="ACTIVA")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # aqui tengo una relacion inversa porque cada reserva pertenece a un equipo
    #esto no cambia nada en la base de datos, solo es para tener los datos de una forma orientada a objetos
    #asi puedo acceder a los datos vinculados como si fueran atributos normales y no tener que hacer constulas manuales SQL
    equipo = relationship("Equipo", back_populates="reservas")