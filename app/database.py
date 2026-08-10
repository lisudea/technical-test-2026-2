#configuracion y conexion a la base de datos en supabase

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Con esto cargo las variables de entorno desde el archivo .env porque python por si solo no lo lee
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Tomo las consultas que se haran desde python y las envio a la base de datos en supabase
# Es como un "motor" encargado de gestionar las conexiones reales a la base de datos
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Aqui configuro como se van a comportar las transacciones a la base de datos
# lo configuro con un autocommit y autoflush en False para que no se haga guardado automatico de las transacciones
# para no guardar una reserva a medias (por ejemplo) si hay un error durante la transaccion
# Cada vez que se use SessionLocal(), se crea una sesión independiente de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Todos los modelos (las tablas de equipos y reservas) se van a heredar de esta clase, para indicar que representa una tabla de la base de datos
Base = declarative_base()

#para que cada vez que se haga una peticion a la API, se cree una nueva sesion de base de datos y se cierre al terminar la peticion
def get_db():
    db = SessionLocal()
    try:
        yield db #entrega los datos
    finally:
        db.close() #cierrra la sesion de base de datos al terminar la peticion