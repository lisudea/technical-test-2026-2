import enum
import uuid
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class EstadoEquipo(str, enum.Enum):
    disponible = "disponible"
    reservado = "reservado"
    mantenimiento = "mantenimiento"


class CategoriaEquipo(str, enum.Enum):
    microcontroladores = "microcontroladores"
    vr = "vr"
    redes = "redes"
    otros = "otros"


class EstadoReserva(str, enum.Enum):
    activa = "activa"
    cancelada = "cancelada"


class Equipo(Base):
    __tablename__ = "equipos"

    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False)
    numero_serie_o_mac = Column(String, nullable=False, unique=True)
    categoria = Column(Enum(CategoriaEquipo), nullable=False)
    estado = Column(Enum(EstadoEquipo), nullable=False, default=EstadoEquipo.disponible)

    reservas = relationship("Reserva", back_populates="equipo", cascade="all, delete-orphan")


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(String, primary_key=True, default=gen_uuid)
    equipo_id = Column(String, ForeignKey("equipos.id"), nullable=False)
    usuario_nombre = Column(String, nullable=False)
    usuario_correo = Column(String, nullable=False)
    fecha_hora_inicio = Column(DateTime, nullable=False)
    fecha_hora_fin = Column(DateTime, nullable=False)
    estado = Column(Enum(EstadoReserva), nullable=False, default=EstadoReserva.activa)

    equipo = relationship("Equipo", back_populates="reservas")
