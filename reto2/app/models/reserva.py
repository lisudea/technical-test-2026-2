from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)

    usuario_nombre = Column(String, nullable=False)
    usuario_correo = Column(String, nullable=False)

    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)

    equipo_id = Column(
        Integer,
        ForeignKey("equipos.id"),
        nullable=False
    )

    equipo = relationship("Equipo")