"""Configuración de entorno de Alembic.

Este archivo es el puente entre Alembic y el proyecto: le dice **a qué base
de datos** conectarse y **cuál es la estructura esperada** (los modelos), para
que pueda comparar ambas cosas y generar migraciones automáticamente.

No hace falta tocarlo en el día a día.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Se importan la Base y los modelos para que Alembic conozca la estructura
# esperada. El import de los modelos parece no usarse, pero es imprescindible:
# es lo que hace que las tablas se registren dentro de Base.metadata.
from app.database import DATABASE_URL, Base
from app.models import Equipo, Reserva  # noqa: F401

config = context.config

# La dirección de la base de datos se toma de la variable de entorno
# (a través de app/database.py) en vez de escribirla en alembic.ini, para no
# duplicar configuración ni subir contraseñas al repositorio.
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# "Estructura esperada": el catálogo de tablas declarado en models.py.
# Es lo que Alembic compara contra la base de datos real al usar
# --autogenerate.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Genera el SQL de las migraciones sin conectarse a la base de datos.

    Modo poco habitual: sirve para obtener el script SQL y que otra persona
    (por ejemplo un administrador de base de datos) lo revise y lo ejecute a
    mano. En este proyecto se usa siempre el modo *online*.
    """
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Aplica las migraciones conectándose realmente a la base de datos.

    Es el modo que se usa al ejecutar ``alembic upgrade head``, tanto a mano
    como automáticamente al arrancar el contenedor de la API.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
