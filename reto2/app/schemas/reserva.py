from datetime import datetime

from pydantic import BaseModel, model_validator


class ReservaCreate(BaseModel):
    usuario_nombre: str
    usuario_correo: str
    equipo_id: int
    fecha_inicio: datetime
    fecha_fin: datetime

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin <= self.fecha_inicio:
            raise ValueError(
                "La fecha de fin debe ser posterior a la fecha de inicio"
            )

        return self


class ReservaResponse(BaseModel):
    id: int
    usuario_nombre: str
    usuario_correo: str
    equipo_id: int
    fecha_inicio: datetime
    fecha_fin: datetime

    class Config:
        from_attributes = True