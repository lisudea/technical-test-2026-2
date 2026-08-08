from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator
from .models import EstadoEquipo, CategoriaEquipo, EstadoReserva


# ---------- Equipo ----------
class EquipoCreate(BaseModel):
    nombre: str
    numero_serie_o_mac: str
    categoria: CategoriaEquipo
    estado: EstadoEquipo = EstadoEquipo.disponible


class EquipoUpdate(BaseModel):
    nombre: Optional[str] = None
    numero_serie_o_mac: Optional[str] = None
    categoria: Optional[CategoriaEquipo] = None
    estado: Optional[EstadoEquipo] = None


class EquipoOut(BaseModel):
    id: str
    nombre: str
    numero_serie_o_mac: str
    categoria: CategoriaEquipo
    estado: EstadoEquipo

    class Config:
        from_attributes = True


class EquipoPaginado(BaseModel):
    total: int
    pagina: int
    tamano_pagina: int
    resultados: List[EquipoOut]


# ---------- Reserva ----------
class ReservaCreate(BaseModel):
    equipo_id: str
    usuario_nombre: str
    usuario_correo: EmailStr
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime

    @field_validator("fecha_hora_fin")
    @classmethod
    def fin_despues_de_inicio(cls, v, info):
        inicio = info.data.get("fecha_hora_inicio")
        if inicio and v <= inicio:
            raise ValueError("fecha_hora_fin debe ser posterior a fecha_hora_inicio")
        return v


class ReservaOut(BaseModel):
    id: str
    equipo_id: str
    usuario_nombre: str
    usuario_correo: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado: EstadoReserva

    class Config:
        from_attributes = True


class TopEquipoOut(BaseModel):
    equipo_id: str
    nombre: str
    total_reservas: int
