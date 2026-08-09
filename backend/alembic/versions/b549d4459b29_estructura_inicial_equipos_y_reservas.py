"""estructura inicial equipos y reservas

Crea las dos tablas del sistema y, sobre todo, la restricción que hace
**físicamente imposible** que un equipo tenga dos reservas activas solapadas
(regla RN-03 de la especificación).

La mayor parte de este archivo la generó Alembic automáticamente comparando
``app/models.py`` contra la base de datos vacía. Se editó a mano para añadir
dos cosas que Alembic no puede deducir de los modelos:

1. La extensión ``btree_gist`` de PostgreSQL.
2. La restricción ``EXCLUDE`` que impide el solapamiento de reservas.

Ver ``docs/plan.md`` §7 para la explicación completa del mecanismo.

Revision ID: b549d4459b29
Revises:
Create Date: 2026-08-09 23:12:45.665302

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Identificadores que Alembic usa para saber en qué orden aplicar las
# migraciones y cuál es la anterior a cada una.
revision: str = 'b549d4459b29'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea la estructura completa de la base de datos."""

    # -----------------------------------------------------------------
    # Extensión btree_gist
    # -----------------------------------------------------------------
    # Una "extensión" es un módulo opcional que añade capacidades a
    # PostgreSQL. btree_gist permite combinar, dentro de un mismo índice, una
    # comparación de IGUALDAD (mismo equipo) con una de SOLAPAMIENTO (rangos
    # de tiempo que se cruzan), que es justo lo que necesita la restricción
    # del final de esta función.
    #
    # Viene incluida en la imagen oficial de PostgreSQL; "IF NOT EXISTS" hace
    # que la instrucción sea segura de ejecutar aunque ya estuviera activada.
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    # -----------------------------------------------------------------
    # Tabla de equipos
    # -----------------------------------------------------------------
    op.create_table(
        'equipos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=150), nullable=False),
        sa.Column('numero_serie', sa.String(length=100), nullable=False),
        sa.Column('categoria', sa.String(length=80), nullable=False),
        sa.Column(
            'estado',
            sa.Enum('DISPONIBLE', 'MANTENIMIENTO', 'DAÑADO', name='estado_equipo'),
            nullable=False,
        ),
        sa.Column(
            'creado_en',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'actualizado_en',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        # Regla RN-01: no puede haber dos equipos con el mismo código.
        sa.UniqueConstraint('numero_serie'),
    )
    op.create_index(op.f('ix_equipos_categoria'), 'equipos', ['categoria'], unique=False)
    op.create_index(op.f('ix_equipos_estado'), 'equipos', ['estado'], unique=False)

    # -----------------------------------------------------------------
    # Tabla de reservas
    # -----------------------------------------------------------------
    op.create_table(
        'reservas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('equipo_id', sa.Integer(), nullable=False),
        sa.Column('solicitante_nombre', sa.String(length=150), nullable=False),
        sa.Column('solicitante_correo', sa.String(length=150), nullable=False),
        sa.Column('fecha_hora_inicio', sa.DateTime(timezone=True), nullable=False),
        sa.Column('fecha_hora_fin', sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            'estado',
            sa.Enum('ACTIVA', 'CANCELADA', name='estado_reserva'),
            nullable=False,
        ),
        sa.Column(
            'creado_en',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        # Regla RN-02: el rango de tiempo no puede estar invertido.
        sa.CheckConstraint('fecha_hora_fin > fecha_hora_inicio', name='rango_valido'),
        # Regla RN-05: no se puede reservar un equipo que no existe.
        sa.ForeignKeyConstraint(['equipo_id'], ['equipos.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_reservas_equipo_estado_franja',
        'reservas',
        ['equipo_id', 'estado', 'fecha_hora_inicio', 'fecha_hora_fin'],
        unique=False,
    )
    op.create_index(op.f('ix_reservas_equipo_id'), 'reservas', ['equipo_id'], unique=False)
    op.create_index(op.f('ix_reservas_estado'), 'reservas', ['estado'], unique=False)
    op.create_index(
        op.f('ix_reservas_solicitante_correo'), 'reservas', ['solicitante_correo'], unique=False
    )

    # -----------------------------------------------------------------
    # LA RESTRICCIÓN CRÍTICA (regla RN-03)
    # -----------------------------------------------------------------
    # Se lee así:
    #
    #   "No pueden existir dos filas ACTIVAS que tengan el MISMO equipo_id
    #    Y cuyos rangos de tiempo se solapen entre sí."
    #
    # Detalle por detalle:
    #
    #   equipo_id WITH =
    #       Las filas solo entran en conflicto si son del mismo equipo. Dos
    #       equipos distintos pueden reservarse a la misma hora sin problema.
    #
    #   tstzrange(fecha_hora_inicio, fecha_hora_fin) WITH &&
    #       "&&" es el operador de solapamiento entre rangos de PostgreSQL.
    #       tstzrange construye un rango de tiempo CON ZONA HORARIA a partir
    #       de las dos columnas.
    #
    #       Clave: tstzrange es SEMIABIERTO por defecto -> [inicio, fin)
    #       Incluye el instante inicial pero NO el final. Eso implementa
    #       exactamente la decisión D-2 de la especificación sin escribir ni
    #       una línea extra: una reserva de 09:00 a 11:00 y otra de 11:00 a
    #       13:00 NO se consideran solapadas, porque una persona devuelve el
    #       equipo a las 11:00 y la siguiente lo recoge en ese mismo momento.
    #
    #   WHERE (estado = 'ACTIVA')
    #       Implementa la regla RN-04: las reservas canceladas quedan fuera de
    #       la restricción, de modo que liberan su franja de inmediato.
    #
    # ¿Por qué a nivel de base de datos y no solo en Python? Porque la
    # comprobación en Python tiene una ventana de carrera: si dos peticiones
    # consultan a la vez, ambas ven la franja libre y ambas insertan. Esta
    # restricción la aplica el motor a TODA inserción, venga de donde venga,
    # así que ese escenario es imposible. Ver docs/plan.md §7.
    op.execute(
        """
        ALTER TABLE reservas ADD CONSTRAINT reservas_sin_solape
        EXCLUDE USING gist (
            equipo_id WITH =,
            tstzrange(fecha_hora_inicio, fecha_hora_fin) WITH &&
        ) WHERE (estado = 'ACTIVA')
        """
    )


def downgrade() -> None:
    """Deshace el cambio, dejando la base de datos como estaba antes."""

    # Al borrar las tablas se borran también sus índices y restricciones
    # (incluida reservas_sin_solape), así que no hace falta eliminarlos uno a
    # uno.
    op.drop_table('reservas')
    op.drop_table('equipos')

    # Los tipos ENUM, en cambio, NO se borran solos al borrar la tabla que los
    # usaba: quedan sueltos en la base de datos. Si no se eliminan aquí, un
    # "upgrade" posterior fallaría con el error "type ... already exists".
    # Es un detalle fácil de pasar por alto y que rompe el ciclo
    # downgrade -> upgrade.
    op.execute("DROP TYPE IF EXISTS estado_reserva")
    op.execute("DROP TYPE IF EXISTS estado_equipo")

    # La extensión btree_gist se deja instalada a propósito: es inofensiva y
    # otras tablas futuras podrían necesitarla.
