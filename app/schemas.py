#validaciones de entrada - salida y DTOs de la aplicacion usando Pydantic
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

# creo un esquema base para los equipos
# usando BaseModel de Pydantic, que permite validar de manera automatica los datos que se ingresan
# y si hay errores los detecta y devuelve un error 422 
class EquipoBase(BaseModel):
    nombre: str
    numero_serie_mac: str
    categoria: str
    estado: str

# este es para crear un equipo, lo que se envia desde el frontend
class EquipoCreate(EquipoBase):
    pass

# este es para actualizar un equipo (Todos los campos son opcionales)
class EquipoUpdate(BaseModel):
    nombre: Optional[str] = None
    numero_serie_mac: Optional[str] = None
    categoria: Optional[str] = None
    estado: Optional[str] = None

# la respuesta para un equipo, lo que va a devolver la API
class EquipoResponse(EquipoBase):
    id: int
    created_at: datetime

    # con esto permito a Pydantic leer datos directamente del objeto SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

# esto para las estadísticas, sacar el top de equipos mas reservados (BBonus)
class EquipoTop(BaseModel):
    equipo_id: int
    nombre: str
    total_reservas: int

    model_config = ConfigDict(from_attributes=True)


# creo un esquema base para los las reservas
class ReservaBase(BaseModel):
    equipo_id: int
    nombre_usuario: str
    correo_usuario: EmailStr  # para validar automáticamente que tenga formato de correo (@)
    fecha_inicio: datetime
    fecha_fin: datetime

# este es para crear una reserva, lo que se envia desde el frontend
class ReservaCreate(ReservaBase):
    pass

# la respuesta para una reserva, lo que va a devolver la API
class ReservaResponse(ReservaBase):
    id: int
    estado: str

    model_config = ConfigDict(from_attributes=True)