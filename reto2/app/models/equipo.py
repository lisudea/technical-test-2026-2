from sqlalchemy import Column, Integer, String

from app.database import Base


class Equipo(Base):
    __tablename__ = "equipos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    numero_serie = Column(String, unique=True, nullable=False)
    categoria = Column(String, nullable=False)
    estado = Column(String, nullable=False)