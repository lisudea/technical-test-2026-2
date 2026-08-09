"""Modelos: las tablas de la base de datos.

Cada clase de este archivo representa **una tabla** de PostgreSQL, y cada
atributo de la clase representa **una columna**. SQLAlchemy se encarga de
traducir entre ambos mundos, de modo que en el resto del proyecto se trabaja
con objetos de Python en vez de escribir SQL a mano.

Aquí solo hay dos entidades (``Equipo`` y ``Reserva``), así que caben
holgadamente en un único archivo. Partirlas en ``models/equipo.py`` y
``models/reserva.py`` obligaría a saltar entre ventanas para leer ~60 líneas,
sin ninguna ventaja.

**Importante:** la restricción que impide que dos reservas activas del mismo
equipo se solapen (regla RN-03) **no** se declara aquí, sino directamente en
la migración de Alembic, porque usa una característica de PostgreSQL
(``EXCLUDE ... USING gist``) que SQLAlchemy no sabe expresar. Ver
``docs/plan.md`` §7 y el archivo de migración correspondiente.
"""

import enum
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstadoEquipo(str, enum.Enum):
    """Estados posibles de un equipo del laboratorio.

    Describe la situación **física/administrativa** del equipo, no si está
    prestado en este momento: eso último se deduce de sus reservas.

    Hereda de ``str`` además de ``Enum`` para que FastAPI pueda convertirlo
    directamente a texto en las respuestas JSON y mostrarlo como un
    desplegable en la documentación de Swagger.

    Attributes:
        DISPONIBLE: el equipo está en el laboratorio y se puede prestar.
        MANTENIMIENTO: está siendo reparado o revisado; no se presta.
        DAÑADO: está averiado y fuera de servicio; no se presta.
    """

    DISPONIBLE = "DISPONIBLE"
    MANTENIMIENTO = "MANTENIMIENTO"
    DAÑADO = "DAÑADO"


class EstadoReserva(str, enum.Enum):
    """Estados posibles de una reserva.

    Una reserva nunca se borra de la base de datos: al cancelarla solo cambia
    de estado, de modo que quede historial de lo que se solicitó (esto es lo
    que permite calcular después las estadísticas de demanda).

    Attributes:
        ACTIVA: la reserva está vigente y **bloquea** su franja horaria.
        CANCELADA: se anuló; libera la franja de inmediato (regla RN-04).
    """

    ACTIVA = "ACTIVA"
    CANCELADA = "CANCELADA"


class Equipo(Base):
    """Un recurso físico del laboratorio susceptible de ser prestado.

    Cubre desde una Raspberry Pi hasta un destornillador o un kit de jumpers.
    Cada fila es **una unidad prestable**: si el laboratorio tiene tres
    protoboards idénticas, son tres filas con códigos distintos.

    Attributes:
        id: identificador único, numérico y autoincremental (1, 2, 3…). Lo
            asigna la base de datos; nunca lo envía quien usa la API.
        nombre: nombre descriptivo. Ej. ``"Arduino Uno R3"``.
        numero_serie: número de serie de fábrica, dirección MAC **o código
            interno** asignado por el laboratorio (ej. ``"HERR-CRIMP-001"``).
            Es único en todo el sistema: es lo que permite distinguir dos
            equipos idénticos y saber cuál se prestó y cuál volvió.
        categoria: agrupación libre del equipo. Ej. ``"Microcontroladores"``,
            ``"Herramientas"``, ``"Cables"``.
        estado: uno de los valores de :class:`EstadoEquipo`.
        creado_en: cuándo se registró el equipo. Lo rellena la base de datos.
        actualizado_en: cuándo se modificó por última vez. Se actualiza solo.
        reservas: lista de todas las reservas de este equipo. No es una
            columna: es la relación que permite escribir ``equipo.reservas``.
    """

    __tablename__ = "equipos"

    id: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(String(150), nullable=False)

    # unique=True crea una restricción UNIQUE en la base de datos: es el propio
    # PostgreSQL quien impide el duplicado (regla RN-01), no solo el código
    # Python. Así la regla se cumple aunque alguien inserte filas por fuera de
    # la API.
    numero_serie: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True
    )

    # index=True acelera los filtros del listado (CU-04): sin índice,
    # PostgreSQL tendría que recorrer la tabla entera en cada búsqueda.
    categoria: Mapped[str] = mapped_column(String(80), nullable=False, index=True)

    estado: Mapped[EstadoEquipo] = mapped_column(
        Enum(EstadoEquipo, name="estado_equipo"),
        nullable=False,
        default=EstadoEquipo.DISPONIBLE,
        index=True,
    )

    # server_default=func.now() significa que es PostgreSQL quien pone la fecha
    # al insertar, no Python. Es más fiable: la hora sale siempre del mismo
    # reloj, aunque haya varias instancias de la API corriendo.
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # onupdate hace que SQLAlchemy refresque esta columna en cada modificación.
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relación con las reservas. No crea ninguna columna nueva: es azúcar de
    # SQLAlchemy para poder navegar de un equipo a sus reservas.
    #
    # cascade="all, delete-orphan" indica que, si algún día se borrara un
    # equipo, sus reservas se irían con él en vez de quedar huérfanas
    # apuntando a un equipo inexistente.
    reservas: Mapped[list["Reserva"]] = relationship(
        back_populates="equipo", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Representación legible del objeto, útil al depurar en consola."""
        return f"<Equipo id={self.id} nombre={self.nombre!r} estado={self.estado}>"


class Reserva(Base):
    """El apartado de un equipo por una persona, durante una franja de tiempo.

    La persona solicitante **no** es una entidad aparte: se identifica con su
    nombre y su correo guardados aquí mismo (decisión D-1 de la
    especificación), porque el enunciado no exige registro previo de usuarios.

    Attributes:
        id: identificador único, numérico y autoincremental.
        equipo_id: identificador del equipo reservado. Es una *clave foránea*:
            PostgreSQL impide que apunte a un equipo que no existe (RN-05).
        solicitante_nombre: nombre de quien reserva.
        solicitante_correo: correo de quien reserva. Su formato se valida en
            ``schemas.py``, antes de llegar a la base de datos.
        fecha_hora_inicio: momento en que empieza el préstamo.
        fecha_hora_fin: momento en que termina. Debe ser posterior al inicio;
            lo garantiza la restricción ``rango_valido`` de aquí abajo.
        estado: uno de los valores de :class:`EstadoReserva`.
        creado_en: cuándo se registró la reserva.
        equipo: el objeto :class:`Equipo` correspondiente. Permite escribir
            ``reserva.equipo.nombre`` sin consultar la otra tabla a mano.
    """

    __tablename__ = "reservas"

    # __table_args__ agrupa restricciones e índices que afectan a la tabla
    # entera (no a una sola columna).
    __table_args__ = (
        # Regla RN-02 aplicada por la propia base de datos: ninguna fila puede
        # tener un rango invertido, ni siquiera insertándola por fuera de la
        # API. En schemas.py se valida además antes, para poder devolver un
        # mensaje de error claro en vez de un fallo de base de datos.
        CheckConstraint(
            "fecha_hora_fin > fecha_hora_inicio", name="rango_valido"
        ),
        # Índice combinado pensado para la consulta más importante del
        # sistema: "¿este equipo tiene alguna reserva activa que se cruce con
        # esta franja?" (regla RN-03). Al incluir las cuatro columnas que
        # participan en esa búsqueda, PostgreSQL la resuelve sin recorrer la
        # tabla completa.
        Index(
            "ix_reservas_equipo_estado_franja",
            "equipo_id",
            "estado",
            "fecha_hora_inicio",
            "fecha_hora_fin",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    equipo_id: Mapped[int] = mapped_column(
        ForeignKey("equipos.id"), nullable=False, index=True
    )

    solicitante_nombre: Mapped[str] = mapped_column(String(150), nullable=False)

    solicitante_correo: Mapped[str] = mapped_column(
        String(150), nullable=False, index=True
    )

    # timezone=True (tipo TIMESTAMPTZ en PostgreSQL) es imprescindible aquí:
    # comparar franjas horarias sin saber a qué huso pertenecen es la causa
    # clásica de reservas que "no se solapan en el papel" pero sí en la
    # realidad. Con zona horaria, PostgreSQL normaliza todo internamente y las
    # comparaciones de la regla RN-03 son siempre correctas.
    fecha_hora_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    fecha_hora_fin: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    estado: Mapped[EstadoReserva] = mapped_column(
        Enum(EstadoReserva, name="estado_reserva"),
        nullable=False,
        default=EstadoReserva.ACTIVA,
        index=True,
    )

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    equipo: Mapped["Equipo"] = relationship(back_populates="reservas")

    def __repr__(self) -> str:
        """Representación legible del objeto, útil al depurar en consola."""
        return (
            f"<Reserva id={self.id} equipo_id={self.equipo_id} "
            f"{self.fecha_hora_inicio}→{self.fecha_hora_fin} {self.estado}>"
        )
