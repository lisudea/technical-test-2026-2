"""Conexión con la base de datos PostgreSQL.

Este módulo concentra todo lo relacionado con "hablar con la base de datos",
para que el resto del proyecto no tenga que preocuparse por cómo se conecta:

* ``engine``       — la conexión física con PostgreSQL.
* ``SessionLocal`` — la fábrica de *sesiones* (conversaciones con la BD).
* ``Base``         — la clase de la que heredan las tablas de ``models.py``.
* ``get_db()``     — la función que entrega una sesión a cada endpoint.

**¿Qué es una sesión?** Es una conversación con la base de datos que agrupa
varias operaciones. Se abre al empezar a atender una petición HTTP y se
cierra al terminarla, de modo que si algo falla a mitad de camino no quedan
cambios a medias.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Dirección de la base de datos. Se lee de la variable de entorno DATABASE_URL,
# que docker-compose.yml define apuntando al contenedor "db".
#
# El valor por defecto sirve para ejecutar el proyecto fuera de Docker; dentro
# de Docker el nombre del servidor no es "localhost" sino "db", que es el
# nombre del servicio en docker-compose.yml.
#
# Formato: motor+driver://usuario:contraseña@servidor:puerto/nombre_bd
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://lis_user:lis_password@localhost:5432/lis_equipos",
)

# El "engine" es el objeto que mantiene el grupo de conexiones abiertas contra
# PostgreSQL. Se crea UNA sola vez al arrancar la aplicación, no en cada
# petición, porque abrir conexiones es caro.
#
# pool_pre_ping=True hace que SQLAlchemy compruebe que la conexión sigue viva
# antes de usarla. Sin esto, si la base de datos se reinicia, la aplicación
# seguiría intentando usar conexiones muertas y fallaría.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Fábrica de sesiones. Cada llamada a SessionLocal() crea una conversación
# nueva e independiente con la base de datos.
#
# autocommit=False y autoflush=False significan que nada se guarda hasta que
# se pide explícitamente con .commit(), lo que evita guardados accidentales a
# medio camino de una operación.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Clase base de la que heredan todas las tablas del proyecto.

    SQLAlchemy usa esta clase para llevar un registro de todas las tablas
    definidas (en ``Base.metadata``). Ese registro es el que consulta Alembic
    para detectar qué migraciones hacen falta.

    No tiene comportamiento propio: solo existe para que ``Equipo`` y
    ``Reserva`` hereden de ella en ``models.py``.
    """


def get_db():
    """Entrega una sesión de base de datos a un endpoint y la cierra al final.

    Esta función es una *dependencia* de FastAPI: los endpoints la declaran
    con ``db: Session = Depends(get_db)`` y FastAPI se encarga de llamarla
    antes de ejecutar el endpoint y de cerrarla después, incluso si el
    endpoint lanza una excepción.

    El ``yield`` (en vez de ``return``) es lo que permite ese comportamiento:
    todo lo que va después del ``yield`` se ejecuta cuando la petición ya
    terminó.

    Yields:
        Session: sesión de SQLAlchemy lista para consultar o guardar datos.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        # Se cierra SIEMPRE, haya ido bien o mal la petición. Si no se
        # cerraran, las conexiones se irían agotando hasta que la API dejara
        # de responder.
        db.close()
