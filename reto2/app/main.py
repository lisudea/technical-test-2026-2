from fastapi import FastAPI

from app.database import Base, engine
from app.models.equipo import Equipo
from app.models.reserva import Reserva
from app.routers.equipos import router as equipos_router
from app.routers.reservas import router as reservas_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Sistema de Gestión y Reservas de Equipos del LIS",
    description="API para gestionar equipos y reservas del Laboratorio Integrado de Sistemas"
)


app.include_router(equipos_router)
app.include_router(reservas_router)


@app.get("/")
def inicio():
    return {"mensaje": "API del LIS funcionando correctamente"}