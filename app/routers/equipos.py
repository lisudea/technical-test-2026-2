#endpoints de equipos, como crud, paginacion y filtros
#es como el controlador

from fastapi import APIRouter, Depends, HTTPException
#APIRouter permite agrupar rutas relacionadas, en este caso todas las rutas relacionadas con equipos
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud
from app.database import get_db


# prefix="/equipos" hace que todas las rutas aquí empiecen con ese texto como pir ejemplo http://localhost:8000/equipos
router = APIRouter(prefix="/equipos", tags=["Equipos"])

#se usa response_model para formatear la respuesta usando pydantic para asegurar que se cree bien el json que recibe el frontend
@router.post("/", response_model=schemas.EquipoResponse)

# metodo para crear un equipo
def crear_equipo(equipo: schemas.EquipoCreate, db: Session = Depends(get_db)): #lo que hace Depends() es inyectar la dependencia de la base de datos, 
#es decir, que cada vez que se haga una peticion a este endpoint, se cree una nueva sesion de base de datos y se cierre al terminar la peticion

    return crud.create_equipo(db=db, equipo=equipo)


@router.get("/", response_model=List[schemas.EquipoResponse])
def listar_equipos(
    skip: int = 0, 
    limit: int = 10, 
    categoria: str = None, 
    estado: str = None, 
    db: Session = Depends(get_db)):
    #para listar los equipos con paginación y filtros opcionales
    return crud.get_equipos(db=db, skip=skip, limit=limit, categoria=categoria, estado=estado)

#este es el endppoint para las estadisticas, para obtener el top de equipos mas reservados
@router.get("/estadisticas/top", response_model=List[schemas.EquipoTop])
def obtener_top_equipos(db: Session = Depends(get_db)):

    return crud.get_top_equipos(db=db, limite=5)

@router.put("/{equipo_id}", response_model=schemas.EquipoResponse)
#metodo para actualizar un equipo
def actualizar_equipo(equipo_id: int, equipo: schemas.EquipoUpdate, db: Session = Depends(get_db)):
    """Actualiza los datos de un equipo existente."""
    equipo_actualizado = crud.update_equipo(db=db, equipo_id=equipo_id, equipo_update=equipo)
    
    # Si el equipo no existe, devuelvo un error 404
    if not equipo_actualizado:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
        
    return equipo_actualizado