"""Preparación compartida por todas las pruebas.

``conftest.py`` es un archivo especial de pytest: todo lo que se define aquí
está disponible automáticamente en los demás archivos de prueba, sin
importarlo.

**Por qué se prueba contra PostgreSQL de verdad y no contra SQLite:** la
garantía más importante del sistema —la restricción ``reservas_sin_solape``
que impide reservas solapadas— es una característica exclusiva de PostgreSQL.
Probar contra SQLite daría pruebas en verde mientras el comportamiento real
del sistema queda sin verificar, que es la peor situación posible: falsa
confianza.

Para no ensuciar los datos de trabajo, las pruebas usan una base de datos
**aparte** (``lis_test``) dentro del mismo contenedor de PostgreSQL.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Dirección de la base de datos de PRUEBAS. Se construye a partir de la de
# producción cambiando el nombre de la base, para que funcione igual dentro y
# fuera de Docker sin duplicar usuario y contraseña.
URL_PRUEBAS = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://lis_user:lis_password@db:5432/lis_equipos",
).replace("/lis_equipos", "/lis_test")


def _crear_base_de_pruebas() -> None:
    """Crea la base de datos ``lis_test`` si todavía no existe.

    Conectarse a una base que no existe da error, así que primero hay que
    conectarse a otra (``postgres``, que siempre está) para poder crearla.

    ``AUTOCOMMIT`` es necesario porque PostgreSQL no permite ejecutar
    ``CREATE DATABASE`` dentro de una transacción.
    """
    url_admin = URL_PRUEBAS.replace("/lis_test", "/postgres")
    motor_admin = create_engine(url_admin, isolation_level="AUTOCOMMIT")

    with motor_admin.connect() as conexion:
        existe = conexion.execute(
            text("SELECT 1 FROM pg_database WHERE datname = 'lis_test'")
        ).first()
        if not existe:
            conexion.execute(text("CREATE DATABASE lis_test"))

    motor_admin.dispose()


@pytest.fixture(scope="session")
def motor():
    """Prepara la base de datos de pruebas una sola vez para toda la sesión.

    Crea la base, activa la extensión ``btree_gist``, crea las tablas y añade
    a mano la restricción ``reservas_sin_solape``.

    **¿Por qué se añade la restricción aquí y no viene sola?** Porque
    ``Base.metadata.create_all()`` solo sabe crear lo que está declarado en
    ``models.py``, y esa restricción vive en la migración de Alembic (usa SQL
    que SQLAlchemy no sabe expresar). Si no se replicara aquí, las pruebas
    correrían contra una base **sin** la garantía principal del sistema.

    Yields:
        Engine: el motor conectado a la base de datos de pruebas.
    """
    _crear_base_de_pruebas()

    motor = create_engine(URL_PRUEBAS, pool_pre_ping=True)

    with motor.connect() as conexion:
        conexion.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        conexion.commit()

    Base.metadata.create_all(bind=motor)

    with motor.connect() as conexion:
        conexion.execute(
            text(
                """
                ALTER TABLE reservas
                DROP CONSTRAINT IF EXISTS reservas_sin_solape
                """
            )
        )
        conexion.execute(
            text(
                """
                ALTER TABLE reservas ADD CONSTRAINT reservas_sin_solape
                EXCLUDE USING gist (
                    equipo_id WITH =,
                    tstzrange(fecha_hora_inicio, fecha_hora_fin) WITH &&
                ) WHERE (estado = 'ACTIVA')
                """
            )
        )
        conexion.commit()

    yield motor

    # Al terminar toda la sesión de pruebas se borran las tablas, para que la
    # siguiente ejecución empiece igual de limpia.
    Base.metadata.drop_all(bind=motor)
    motor.dispose()


@pytest.fixture
def cliente(motor):
    """Entrega un cliente HTTP que llama a la API contra la base de pruebas.

    Antes de cada prueba vacía las tablas, de modo que **cada prueba empieza
    con la base limpia** y no depende de lo que hicieran las anteriores. Sin
    esto, el orden de ejecución cambiaría los resultados y una prueba podría
    fallar solo por culpa de otra.

    La pieza clave es ``dependency_overrides``: le dice a FastAPI que, durante
    las pruebas, use la sesión de la base de pruebas en vez de la real. Es el
    mecanismo que la propia FastAPI ofrece para esto, sin necesidad de trucos.

    Args:
        motor: el motor de base de datos de pruebas (fixture anterior).

    Yields:
        TestClient: cliente con el que hacer peticiones a la API.
    """
    # TRUNCATE vacía las tablas; CASCADE se encarga de las que dependen entre
    # sí, y RESTART IDENTITY reinicia los contadores de id, para que en cada
    # prueba los identificadores empiecen en 1 y sean predecibles.
    with motor.connect() as conexion:
        conexion.execute(
            text("TRUNCATE TABLE reservas, equipos RESTART IDENTITY CASCADE")
        )
        conexion.commit()

    SesionPruebas = sessionmaker(autocommit=False, autoflush=False, bind=motor)

    def get_db_de_pruebas():
        """Sustituto de ``get_db`` que apunta a la base de pruebas."""
        db = SesionPruebas()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = get_db_de_pruebas

    with TestClient(app) as cliente:
        yield cliente

    # Se deshace la sustitución para no afectar a nada posterior.
    app.dependency_overrides.clear()


@pytest.fixture
def equipo_disponible(cliente):
    """Crea un equipo DISPONIBLE y devuelve su identificador.

    Muchas pruebas de reservas necesitan un equipo sobre el que reservar;
    tenerlo aquí evita repetir la misma llamada en cada una.

    Args:
        cliente: cliente HTTP de pruebas.

    Returns:
        int: identificador del equipo recién creado.
    """
    respuesta = cliente.post(
        "/equipos",
        json={
            "nombre": "ESP32 DevKit V1",
            "numero_serie": "ESP32-TEST-001",
            "categoria": "Microcontroladores",
            "estado": "DISPONIBLE",
        },
    )
    assert respuesta.status_code == 201
    return respuesta.json()["id"]
