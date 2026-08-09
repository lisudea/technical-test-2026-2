"""Endpoints de gestión del inventario de equipos.

Cubre los casos de uso CU-01 (registrar), CU-02 (actualizar) y CU-03
(consultar) de la especificación.

**Nota sobre dónde vive la lógica:** no hay una capa de "servicios" o
"repositorios" separada. Con dos entidades, esa capa serían funciones de tres
líneas que solo reenvían llamadas: más archivos que abrir, ningún beneficio.
La lógica vive aquí, junto al endpoint que la usa.
"""

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db, paginar
from app.models import Equipo, EstadoEquipo
from app.schemas import (
    EquipoActualizar,
    EquipoCrear,
    EquipoRespuesta,
    RespuestaPaginada,
)

# Un "router" agrupa endpoints relacionados. El prefijo hace que todas las
# rutas de este archivo empiecen por /equipos, y las etiquetas los agrupan
# bajo un mismo título en la documentación de Swagger.
router = APIRouter(prefix="/equipos", tags=["Equipos"])

# Mensaje reutilizado en los dos sitios donde puede saltar la violación de
# unicidad (al crear y al actualizar), para que la API responda siempre lo
# mismo ante el mismo problema.
MENSAJE_SERIE_DUPLICADA = (
    "Ya existe un equipo registrado con ese número de serie o código. "
    "Cada equipo debe tener un identificador único."
)


def buscar_equipo_o_404(db: Session, equipo_id: int) -> Equipo:
    """Devuelve un equipo por su identificador, o corta con un error 404.

    Se usa desde varios endpoints para no repetir la misma comprobación. Al
    lanzar la excepción aquí dentro, FastAPI interrumpe la petición y responde
    directamente, así que quien llama a esta función puede dar por hecho que
    el equipo existe.

    Args:
        db: sesión de base de datos activa.
        equipo_id: identificador del equipo buscado.

    Returns:
        Equipo: el equipo encontrado.

    Raises:
        HTTPException: con código 404 si no existe ningún equipo con ese id.
    """
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe ningún equipo con el identificador {equipo_id}.",
        )
    return equipo


@router.post(
    "",
    response_model=EquipoRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un equipo nuevo",
    description=(
        "Añade un equipo al inventario del laboratorio.\n\n"
        "El **número de serie** debe ser único: si el equipo no trae uno de "
        "fábrica (un destornillador, una bolsa de jumpers…), se le asigna un "
        "código interno del laboratorio, por ejemplo `HERR-CRIMP-001`.\n\n"
        "La **categoría** es texto libre: se usa la que tenga sentido para el "
        "inventario (`Microcontroladores`, `Herramientas`, `Cables`…).\n\n"
        "Devuelve `409` si el número de serie ya está registrado."
    ),
    responses={
        409: {"description": "Ya existe un equipo con ese número de serie."},
    },
)
def registrar_equipo(
    datos: EquipoCrear, db: Session = Depends(get_db)
) -> Equipo:
    """Registra un equipo nuevo en el inventario (CU-01).

    Args:
        datos: información del equipo a registrar, ya validada por Pydantic.
        db: sesión de base de datos, inyectada por FastAPI.

    Returns:
        Equipo: el equipo recién creado, ya con su ``id`` asignado.

    Raises:
        HTTPException: con código 409 si el número de serie ya existe
            (regla RN-01).
    """
    equipo = Equipo(**datos.model_dump())
    db.add(equipo)

    try:
        db.commit()
    except IntegrityError:
        # Aquí se captura la violación de la restricción UNIQUE del número de
        # serie. Se comprueba en la base de datos y no antes con un SELECT
        # porque un SELECT previo tendría una ventana de carrera: dos
        # peticiones simultáneas podrían verlo libre a la vez. La base de
        # datos, en cambio, garantiza la unicidad siempre.
        #
        # El rollback deshace la operación fallida; sin él, la sesión quedaría
        # inutilizable para cualquier consulta posterior.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=MENSAJE_SERIE_DUPLICADA,
        )

    # refresh recarga el objeto desde la base de datos para traer los valores
    # que generó ella (el id y las marcas de tiempo).
    db.refresh(equipo)
    return equipo


@router.get(
    "",
    response_model=RespuestaPaginada[EquipoRespuesta],
    summary="Listar equipos con paginación y filtros",
    description=(
        "Devuelve el inventario **por páginas**, no todo de golpe.\n\n"
        "Se puede filtrar por `categoria`, por `estado`, o por ambos a la "
        "vez. Los filtros son opcionales: sin ninguno, devuelve el inventario "
        "completo paginado.\n\n"
        "El filtro por categoría **no distingue mayúsculas de minúsculas**, "
        "así que `herramientas` y `Herramientas` dan el mismo resultado.\n\n"
        "Además de los equipos, la respuesta indica cuántos hay en total y "
        "cuántas páginas existen, para saber si hay que seguir pidiendo."
    ),
)
def listar_equipos(
    categoria: str | None = Query(
        default=None,
        description="Filtrar por categoría exacta (sin distinguir mayúsculas).",
        examples=["Herramientas"],
    ),
    estado: EstadoEquipo | None = Query(
        default=None, description="Filtrar por estado del equipo."
    ),
    page: int = Query(default=1, ge=1, description="Página a devolver (la primera es la 1)."),
    size: int = Query(
        default=10, ge=1, le=100, description="Equipos por página (máximo 100)."
    ),
    db: Session = Depends(get_db),
) -> dict:
    """Devuelve el inventario paginado, aplicando los filtros indicados (CU-04).

    Los filtros se van encadenando sobre la consulta: si llegan los dos, se
    aplican ambos; si no llega ninguno, la consulta sale sin restricciones.
    Este encadenamiento es lo que permite combinarlos sin escribir una función
    distinta para cada combinación posible.

    Args:
        categoria: categoría por la que filtrar, o ``None`` para no filtrar.
        estado: estado por el que filtrar, o ``None`` para no filtrar.
        page: número de página solicitada.
        size: cuántos equipos trae cada página.
        db: sesión de base de datos, inyectada por FastAPI.

    Returns:
        dict: página de resultados con los metadatos de paginación.
    """
    consulta = select(Equipo)

    if categoria is not None:
        # ilike compara ignorando mayúsculas/minúsculas. Se usa porque la
        # categoría es texto libre que escribe una persona: obligar a acertar
        # exactamente "Herramientas" frente a "herramientas" sería una fuente
        # constante de listados vacíos sin motivo aparente.
        consulta = consulta.where(Equipo.categoria.ilike(categoria))

    if estado is not None:
        consulta = consulta.where(Equipo.estado == estado)

    # Se ordena por nombre para que el listado sea estable: sin un ORDEN
    # explícito, PostgreSQL no garantiza que las páginas 1 y 2 sean coherentes
    # entre sí, y un mismo equipo podría aparecer repetido o desaparecer al
    # cambiar de página.
    consulta = consulta.order_by(Equipo.nombre, Equipo.id)

    return paginar(db, consulta, page, size)


@router.get(
    "/{equipo_id}",
    response_model=EquipoRespuesta,
    summary="Consultar un equipo",
    description=(
        "Devuelve todos los datos de un equipo concreto a partir de su "
        "identificador numérico."
    ),
    responses={404: {"description": "No existe un equipo con ese identificador."}},
)
def consultar_equipo(
    equipo_id: int = Path(..., gt=0, description="Identificador del equipo."),
    db: Session = Depends(get_db),
) -> Equipo:
    """Devuelve los datos de un equipo concreto (CU-03).

    Args:
        equipo_id: identificador del equipo a consultar.
        db: sesión de base de datos, inyectada por FastAPI.

    Returns:
        Equipo: el equipo solicitado.

    Raises:
        HTTPException: con código 404 si el equipo no existe.
    """
    return buscar_equipo_o_404(db, equipo_id)


@router.patch(
    "/{equipo_id}",
    response_model=EquipoRespuesta,
    summary="Actualizar un equipo",
    description=(
        "Modifica los datos de un equipo existente.\n\n"
        "Se envían **solo los campos que se quieren cambiar**; los demás "
        "quedan intactos. Por ejemplo, para pasar un equipo a mantenimiento "
        "basta con enviar `{\"estado\": \"MANTENIMIENTO\"}`.\n\n"
        "Ese es el motivo de usar `PATCH` y no `PUT`: `PUT` significaría "
        "reemplazar el equipo completo, borrando lo que no se envíe."
    ),
    responses={
        404: {"description": "No existe un equipo con ese identificador."},
        409: {"description": "Otro equipo ya usa ese número de serie."},
    },
)
def actualizar_equipo(
    datos: EquipoActualizar,
    equipo_id: int = Path(..., gt=0, description="Identificador del equipo."),
    db: Session = Depends(get_db),
) -> Equipo:
    """Modifica los campos indicados de un equipo existente (CU-02).

    Args:
        datos: campos a modificar. Los que lleguen vacíos no se tocan.
        equipo_id: identificador del equipo a modificar.
        db: sesión de base de datos, inyectada por FastAPI.

    Returns:
        Equipo: el equipo con los cambios ya aplicados.

    Raises:
        HTTPException: con código 404 si el equipo no existe, o 409 si el
            nuevo número de serie ya lo está usando otro equipo (RN-01).
    """
    equipo = buscar_equipo_o_404(db, equipo_id)

    # exclude_unset=True es la clave de la actualización parcial (CA-05):
    # devuelve únicamente los campos que venían en la petición, ignorando los
    # que Pydantic rellenó con None por defecto. Sin esto, enviar solo el
    # estado borraría el nombre y la categoría.
    cambios = datos.model_dump(exclude_unset=True)

    for campo, valor in cambios.items():
        setattr(equipo, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=MENSAJE_SERIE_DUPLICADA,
        )

    db.refresh(equipo)
    return equipo
