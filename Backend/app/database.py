import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# En producción/entrega: PostgreSQL vía docker-compose (ver DATABASE_URL en .env)
# Por defecto, si no hay .env, cae a SQLite local para poder correr sin Docker.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lis_equipos.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
