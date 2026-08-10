"""Schemas: la forma de los datos que entran y salen por la API.

**¿Cuál es la diferencia con ``models.py``?** Es la distinción más importante
del proyecto:

* ``models.py`` describe **lo que se guarda en el disco** (las tablas).
* ``schemas.py`` describe **lo que viaja por la red** (el JSON de las
  peticiones y las respuestas).

No siempre coinciden. Por ejemplo, el ``id`` y las fechas de auditoría se
guardan pero **no** se reciben (los pone el sistema); y al actualizar un
equipo se pueden enviar solo algunos campos, cosa que la tabla no contempla.

Estos schemas los usa Pydantic para dos cosas:

1. **Validar** lo que llega: si falta un campo obligatorio o un correo está
   mal escrito, FastAPI responde ``422`` automáticamente, sin que haya que
   escribir ni una comprobación.
2. **Documentar**: de estas clases sale sola la documentación de Swagger, con
   sus ejemplos incluidos.
"""

from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from app.models import EstadoEquipo, EstadoReserva

# ---------------------------------------------------------------------------
# Equipos
# ---------------------------------------------------------------------------


class EquipoCrear(BaseModel):
    """Datos necesarios para registrar un equipo nuevo (caso de uso CU-01).

    El ``id`` no aparece aquí a propósito: lo asigna la base de datos.

    Attributes:
        nombre: nombre descriptivo del equipo.
        numero_serie: número de serie, MAC o código interno del laboratorio.
            Debe ser único en todo el sistema (regla RN-01).
        categoria: agrupación libre del equipo.
        estado: estado inicial. Si no se indica, se asume ``DISPONIBLE``.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nombre": "Arduino Uno R3",
                "numero_serie": "ARD-UNO-001",
                "categoria": "Microcontroladores",
                "estado": "DISPONIBLE",
            }
        }
    )

    nombre: str = Field(
        ...,
        min_length=1,
        max_length=150,
        description="Nombre descriptivo del equipo.",
    )
    numero_serie: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description=(
            "Número de serie, dirección MAC o código interno asignado por el "
            "laboratorio. Debe ser único."
        ),
    )
    categoria: str = Field(
        ...,
        min_length=1,
        max_length=80,
        description=(
            "Agrupación del equipo. Texto libre: Microcontroladores, "
            "Computadores, Prototipado, Cables, Herramientas…"
        ),
    )
    estado: EstadoEquipo = Field(
        default=EstadoEquipo.DISPONIBLE,
        description="Estado actual del equipo.",
    )

    @field_validator("nombre", "numero_serie", "categoria")
    @classmethod
    def sin_espacios_sobrantes(cls, valor: str) -> str:
        """Quita los espacios de los extremos y rechaza los textos vacíos.

        Sin esto, un nombre como ``"   "`` pasaría la validación de
        ``min_length=1`` (tiene tres caracteres) y se guardaría un equipo con
        nombre en blanco. Además evita que ``"ARD-001"`` y ``"ARD-001 "`` se
        consideren códigos distintos y burlen la restricción de unicidad.

        Args:
            valor: el texto recibido.

        Returns:
            str: el texto sin espacios sobrantes al principio ni al final.

        Raises:
            ValueError: si tras quitar los espacios no queda nada.
        """
        limpio = valor.strip()
        if not limpio:
            raise ValueError("no puede estar vacío ni contener solo espacios")
        return limpio


class EquipoActualizar(BaseModel):
    """Datos para modificar un equipo existente (caso de uso CU-02).

    **Todos los campos son opcionales** a propósito: se envían únicamente los
    que se quieren cambiar y el resto queda intacto (criterio CA-05). Por eso
    el endpoint usa ``PATCH`` ("modifica estos campos") y no ``PUT``
    ("reemplaza el recurso completo").

    Attributes:
        nombre: nuevo nombre, si se quiere cambiar.
        numero_serie: nuevo código, si se quiere cambiar.
        categoria: nueva categoría, si se quiere cambiar.
        estado: nuevo estado, si se quiere cambiar.
    """

    model_config = ConfigDict(
        json_schema_extra={"example": {"estado": "MANTENIMIENTO"}}
    )

    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    numero_serie: str | None = Field(default=None, min_length=1, max_length=100)
    categoria: str | None = Field(default=None, min_length=1, max_length=80)
    estado: EstadoEquipo | None = None

    @field_validator("nombre", "numero_serie", "categoria")
    @classmethod
    def sin_espacios_sobrantes(cls, valor: str | None) -> str | None:
        """Igual que en :class:`EquipoCrear`, pero tolerando el valor ausente.

        Args:
            valor: el texto recibido, o ``None`` si el campo no se envió.

        Returns:
            str | None: el texto limpio, o ``None`` si no se envió.

        Raises:
            ValueError: si se envió un texto que solo contenía espacios.
        """
        if valor is None:
            return None
        limpio = valor.strip()
        if not limpio:
            raise ValueError("no puede estar vacío ni contener solo espacios")
        return limpio


class EquipoRespuesta(BaseModel):
    """Un equipo tal y como lo devuelve la API.

    Incluye los campos que el sistema genera solo (``id`` y las marcas de
    tiempo), que no aparecen en los schemas de entrada.

    Attributes:
        id: identificador único asignado por la base de datos.
        nombre: nombre descriptivo.
        numero_serie: código único del equipo.
        categoria: agrupación del equipo.
        estado: estado actual.
        creado_en: cuándo se registró.
        actualizado_en: cuándo se modificó por última vez.
    """

    # from_attributes=True permite construir este schema directamente desde un
    # objeto de SQLAlchemy (el modelo Equipo), leyendo sus atributos. Sin esto
    # habría que copiar campo por campo a mano en cada endpoint.
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    numero_serie: str
    categoria: str
    estado: EstadoEquipo
    creado_en: datetime
    actualizado_en: datetime


# ---------------------------------------------------------------------------
# Reservas
# ---------------------------------------------------------------------------


class ReservaCrear(BaseModel):
    """Datos necesarios para crear una reserva (caso de uso CU-05).

    Aquí se aplica la regla RN-02 (la fecha de fin debe ser posterior a la de
    inicio) **antes** de tocar la base de datos, para poder devolver un
    mensaje de error claro en vez de un fallo del motor.

    Attributes:
        equipo_id: identificador del equipo que se quiere reservar.
        solicitante_nombre: nombre de quien reserva.
        solicitante_correo: correo de quien reserva. Se valida el formato.
        fecha_hora_inicio: momento en que empieza el préstamo.
        fecha_hora_fin: momento en que termina. Debe ser posterior al inicio.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "equipo_id": 1,
                "solicitante_nombre": "Daniel Salas",
                "solicitante_correo": "d.salas@udea.edu.co",
                "fecha_hora_inicio": "2026-08-15T09:00:00",
                "fecha_hora_fin": "2026-08-15T11:00:00",
            }
        }
    )

    equipo_id: int = Field(
        ..., gt=0, description="Identificador del equipo a reservar."
    )
    solicitante_nombre: str = Field(
        ..., min_length=1, max_length=150, description="Nombre de quien reserva."
    )
    # EmailStr no es solo un texto: verifica que tenga forma de correo real.
    # Requiere la librería email-validator, incluida en requirements.txt.
    solicitante_correo: EmailStr = Field(
        ..., description="Correo electrónico de quien reserva."
    )
    fecha_hora_inicio: datetime = Field(
        ..., description="Fecha y hora de inicio del préstamo."
    )
    fecha_hora_fin: datetime = Field(
        ..., description="Fecha y hora de fin del préstamo."
    )

    @field_validator("solicitante_nombre")
    @classmethod
    def nombre_sin_espacios_sobrantes(cls, valor: str) -> str:
        """Quita espacios de los extremos y rechaza nombres en blanco.

        Args:
            valor: el nombre recibido.

        Returns:
            str: el nombre sin espacios sobrantes.

        Raises:
            ValueError: si tras limpiarlo no queda nada.
        """
        limpio = valor.strip()
        if not limpio:
            raise ValueError("no puede estar vacío ni contener solo espacios")
        return limpio

    @model_validator(mode="after")
    def validar_rango_de_fechas(self) -> "ReservaCrear":
        """Comprueba la regla RN-02: el fin debe ser posterior al inicio.

        Se usa ``model_validator`` en vez de ``field_validator`` porque la
        comprobación necesita **dos** campos a la vez, y un validador de campo
        solo ve uno.

        La comparación es estricta (``<=``), de modo que una reserva de
        duración cero (mismo instante de inicio y fin) también se rechaza: no
        representa ningún préstamo real.

        Returns:
            ReservaCrear: el propio objeto, si el rango es válido.

        Raises:
            ValueError: si la fecha de fin no es posterior a la de inicio.
                FastAPI lo convierte en una respuesta ``422``.
        """
        if self.fecha_hora_fin <= self.fecha_hora_inicio:
            raise ValueError(
                "la fecha y hora de fin debe ser posterior a la de inicio"
            )
        return self


class ReservaRespuesta(BaseModel):
    """Una reserva tal y como la devuelve la API.

    Attributes:
        id: identificador único asignado por la base de datos.
        equipo_id: equipo reservado.
        solicitante_nombre: nombre de quien reservó.
        solicitante_correo: correo de quien reservó.
        fecha_hora_inicio: inicio del préstamo.
        fecha_hora_fin: fin del préstamo.
        estado: ``ACTIVA`` o ``CANCELADA``.
        creado_en: cuándo se registró la reserva.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    equipo_id: int
    solicitante_nombre: str
    solicitante_correo: EmailStr
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado: EstadoReserva
    creado_en: datetime


# ---------------------------------------------------------------------------
# Paginación
# ---------------------------------------------------------------------------


class RespuestaPaginada[T](BaseModel):
    """Envoltorio para las respuestas que devuelven listas largas.

    Cuando hay muchos registros no se envían todos de golpe, sino por bloques
    ("páginas"). Además de los elementos, se devuelve cuántos hay en total y
    cuántas páginas existen, para que quien consuma la API sepa si debe pedir
    más.

    Es una clase **genérica**: el ``[T]`` significa que sirve tanto para
    páginas de equipos (``RespuestaPaginada[EquipoRespuesta]``) como de
    reservas, sin duplicar código.

    Attributes:
        items: los registros de esta página.
        total: cuántos registros hay en total **aplicando los filtros**
            (no en toda la tabla).
        page: número de la página devuelta. La primera es la 1.
        size: cuántos registros caben como máximo en una página.
        total_pages: cuántas páginas hay en total. Es 0 si no hay resultados.
    """

    items: list[T]
    total: int = Field(..., description="Total de registros que cumplen el filtro.")
    page: int = Field(..., description="Página devuelta (la primera es la 1).")
    size: int = Field(..., description="Tamaño máximo de página.")
    total_pages: int = Field(..., description="Número total de páginas.")
