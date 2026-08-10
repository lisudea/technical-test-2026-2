from pydantic import BaseModel


class EquipoBase(BaseModel):
    nombre: str
    numero_serie: str
    categoria: str
    estado: str


class EquipoCreate(EquipoBase):
    pass


class EquipoResponse(EquipoBase):
    id: int

    class Config:
        from_attributes = True