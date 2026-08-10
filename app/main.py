from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import equipos, reservas


#Inicializo la aplicación FastAPI
app = FastAPI(
    title="API - Gestion de Reservas de Equipos LIS",
    description="Sistema de gestión y reserva de equipos del LIS.",
    version="1.0.0"
)

#Configuro el CORS para que el frontend pueda hacer peticiones a la API sin problemas de seguridad
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # aqui debo poner la url del frontend
    allow_credentials=True,
    allow_methods=["*"],  # para permitir todos los métodos (GET, POST, PUT, DELETE, PATCH)
    allow_headers=["*"],  # para permitir todos los headers
)

# hago el registro de los routers con los endpoints de equipos y reservas
app.include_router(equipos.router)
app.include_router(reservas.router)

# esto es para comprobar que el servidor se levanta bien y la API esta corriendo
@app.get("/", tags=["Inicio"])
def read_root():
    return {
        "mensaje": "API CORRIENDO",
        "estado": "Online"
    }