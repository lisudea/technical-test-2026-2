# API - Gestión de Reservas de Equipos LIS

Este proyecto expone una API REST para gestionar equipos de laboratorio y sus reservas. Permite registrar equipos, consultar disponibilidad, crear reservas, cancelarlas y obtener estadísticas simples del uso de cada equipo.

La API está construida con FastAPI, SQLAlchemy y Pydantic, y se conecta a una base de datos PostgreSQL gestionada por Supabase.

## Descripción general

La aplicación está pensada para cubrir los siguientes casos de uso:

- Registro y actualización de equipos del laboratorio.
- Consulta de inventario con filtros por categoría y estado.
- Validación de disponibilidad para evitar reservas solapadas.
- Creación y cierre de reservas por usuario.
- Consulta de reservas por equipo y rango de fechas.
- Estadísticas de equipos más solicitados.

## Tecnologías utilizadas

- FastAPI: framework principal para construir la API REST.
- SQLAlchemy: ORM para trabajar con PostgreSQL.
- Pydantic: validación de entradas y modelado de respuestas.
- PostgreSQL / Supabase: base de datos relacional.
- Python-dotenv: carga de variables de entorno.
- Uvicorn: servidor ASGI para ejecutar la aplicación.

## Estructura del proyecto

```text
gestion_reservas_lis/
├── app/
│   ├── __init__.py
│   ├── crud.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── routers/
│       ├── __init__.py
│       ├── equipos.py
│       └── reservas.py
├── .env
├── .gitignore
├── README.md
├── requirements.txt
└── venv/
```

### Descripción de archivos clave

- app/main.py: punto de entrada de la API y configuración de CORS.
- app/database.py: conexión a la base de datos y creación de la sesión SQLAlchemy.
- app/models.py: modelos de SQLAlchemy para Equipos y Reservas.
- app/schemas.py: validaciones y estructuras de respuesta con Pydantic.
- app/crud.py: lógica de negocio y consultas a la base de datos.
- app/routers/equipos.py: endpoints para equipos.
- app/routers/reservas.py: endpoints para reservas.

## Modelo de datos

### Entidad Equipo

Cada equipo tiene la siguiente información:

- id: identificador único.
- nombre: nombre del equipo.
- numero_serie_mac: número de serie o identificador único del equipo.
- categoria: categoría del equipo.
- estado: estado actual del equipo.
- created_at: fecha de creación.

Relación:

- Un equipo puede tener muchas reservas.

### Entidad Reserva

Cada reserva incluye:

- id: identificador único.
- equipo_id: referencia al equipo reservado.
- nombre_usuario: nombre del solicitante.
- correo_usuario: correo electrónico del usuario.
- fecha_inicio: fecha y hora de inicio.
- fecha_fin: fecha y hora de fin.
- estado: ACTIVA o CANCELADA.
- created_at: fecha de creación.

## Reglas de negocio

La API implementa validaciones funcionales importantes:

- No se permite reservar un equipo si ya hay una reserva activa en el mismo rango horario.
- La lógica de disponibilidad verifica solapamiento entre dos rangos de tiempo.
- Las reservas no se eliminan físicamente; se marcan como CANCELADA.
- La validación de correo se realiza con EmailStr de Pydantic.
- La actualización de equipos usa actualización parcial, por lo que solo se actualizan los campos enviados.

## Requisitos previos

Necesitas tener instalado:

- Python 3.10 o superior
- pip
- Git
- Acceso a una base de datos PostgreSQL/Supabase

## Configuración del entorno

1. Crea un entorno virtual:

```bash
python -m venv venv
```

2. Activa el entorno:

En Linux/macOS:

```bash
source venv/bin/activate
```

En Windows:

```bash
venv\Scripts\activate
```

3. Instala las dependencias:

```bash
pip install -r requirements.txt
```

4. Crea un archivo .env con la variable de conexión a la base de datos:

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/base_de_datos
```
```env
DATABASE_URL=postgresql://postgres.anczyrgmuhbntvxcxgie:gestion_reservas_lis00@aws-0-ca-central-1.pooler.supabase.com:5432/postgres
```

> El proyecto usa esta variable en app/database.py para crear la conexión con SQLAlchemy.

## Ejecución del backend

Desde la raíz del proyecto, ejecuta:

```bash
uvicorn app.main:app --reload
```

La API quedará disponible en:

- http://127.0.0.1:8000
- Documentación Swagger: http://127.0.0.1:8000/docs
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

## Cómo probar la API

La forma recomendada de probar la aplicación es a través de Swagger UI en /docs. Allí puedes ejecutar cada endpoint con payloads reales y ver directamente la respuesta del backend.

También puedes usar curl o Postman si lo prefieres.

## Endpoints disponibles

### 1. Inicio

#### GET /

Devuelve un mensaje de salud para verificar que la API está disponible.

Ejemplo de respuesta:

```json
{
  "mensaje": "API CORRIENDO",
  "estado": "Online"
}
```

### 2. Equipos

#### POST /equipos/

Crea un nuevo equipo.

Body de ejemplo:

```json
{
  "nombre": "Osciloscopio Digital",
  "numero_serie_mac": "OSC-001",
  "categoria": "Electrónica",
  "estado": "DISPONIBLE"
}
```

Respuesta esperada:

```json
{
  "id": 1,
  "nombre": "Osciloscopio Digital",
  "numero_serie_mac": "OSC-001",
  "categoria": "Electrónica",
  "estado": "DISPONIBLE",
  "created_at": "2026-08-09T12:00:00Z"
}
```

#### GET /equipos/

Lista los equipos con paginación y filtros opcionales.

Parámetros opcionales:

- skip: número de registros a omitir.
- limit: cantidad máxima de resultados.
- categoria: filtrar por categoría.
- estado: filtrar por estado.

Ejemplo:

```http
GET /equipos/?skip=0&limit=10&categoria=Electrónica&estado=DISPONIBLE
```

#### PUT /equipos/{equipo_id}

Actualiza los datos de un equipo existente.

Ejemplo de payload:

```json
{
  "estado": "EN MANTENIMIENTO"
}
```

Si el equipo no existe, la API responde con estado 404.

#### GET /equipos/estadisticas/top

Devuelve los equipos con mayor cantidad de reservas activas según el historial de la base de datos.

Respuesta de ejemplo:

```json
[
  {
    "equipo_id": 3,
    "nombre": "Microscopio",
    "total_reservas": 9
  }
]
```

### 3. Reservas

#### POST /reservas/

Crea una nueva reserva si el equipo está disponible en el rango solicitado.

Body de ejemplo:

```json
{
  "equipo_id": 1,
  "nombre_usuario": "Ana López",
  "correo_usuario": "ana@universidad.edu",
  "fecha_inicio": "2026-09-10T08:00:00Z",
  "fecha_fin": "2026-09-10T12:00:00Z"
}
```

Si existe una reserva activa que se solapa, la API devuelve un error 400 con el siguiente detalle:

```json
{
  "detail": "El equipo no está disponible en el horario seleccionado."
}
```

#### GET /reservas/equipo/{equipo_id}

Lista las reservas de un equipo. Puedes filtrar por fecha de inicio y fin.

Ejemplo:

```http
GET /reservas/equipo/1?fecha_inicio=2026-09-10T00:00:00Z&fecha_fin=2026-09-11T00:00:00Z
```

#### PATCH /reservas/{reserva_id}/cancelar

Cancela una reserva existente cambiando su estado a CANCELADA.

Ejemplo de respuesta:

```json
{
  "id": 1,
  "equipo_id": 1,
  "nombre_usuario": "Ana López",
  "correo_usuario": "ana@universidad.edu",
  "fecha_inicio": "2026-09-10T08:00:00Z",
  "fecha_fin": "2026-09-10T12:00:00Z",
  "estado": "CANCELADA"
}
```

## Flujo recomendado de pruebas end-to-end

### Fase 1: Inventario

1. Crear un equipo con POST /equipos/
2. Listar equipos con GET /equipos/
3. Actualizar un equipo con PUT /equipos/{equipo_id}

Ejemplo de creación:

```json
{
  "nombre": "Osciloscopio Digital",
  "numero_serie_mac": "OSC-001",
  "categoria": "Electrónica",
  "estado": "DISPONIBLE"
}
```

Ejemplo de actualización:

```json
{
  "estado": "EN MANTENIMIENTO"
}
```

### Fase 2: Reservas y validación

1. Crear una reserva válida con POST /reservas/
2. Intentar reservar el mismo equipo en un horario que se solape
3. Verificar que la API responde 400
4. Cancelar la reserva con PATCH /reservas/{reserva_id}/cancelar
5. Consultar estadísticas con GET /equipos/estadisticas/top

Ejemplo de reserva válida:

```json
{
  "equipo_id": 1,
  "nombre_usuario": "Ana López",
  "correo_usuario": "ana@universidad.edu",
  "fecha_inicio": "2026-09-10T08:00:00Z",
  "fecha_fin": "2026-09-10T12:00:00Z"
}
```

Ejemplo de reserva conflictiva:

```json
{
  "equipo_id": 1,
  "nombre_usuario": "Carlos Gómez",
  "correo_usuario": "carlos@universidad.edu",
  "fecha_inicio": "2026-09-10T11:00:00Z",
  "fecha_fin": "2026-09-10T14:00:00Z"
}
```

## Códigos HTTP esperados

- 200 OK: operación exitosa.
- 201 Created: creación exitosa.
- 400 Bad Request: conflicto de disponibilidad o request inválido.
- 404 Not Found: recurso no encontrado.
- 422 Unprocessable Entity: datos inválidos según Pydantic.

## Observaciones importantes

- Nota de Seguridad sobre la Base de Datos:
Soy consciente de que exponer cadenas de conexión en el repositorio o en el README es una mala práctica de seguridad crítica. Sin embargo, exclusivamente para los fines de esta prueba técnica y para brindar la mejor experiencia de revisión sin fricciones, he proporcionado una URL temporal de una base de datos de Supabase.

- La base de datos en Supabase puede desactivarse si se deja de usar un tiempo, si llega a fallar por eso, por favor avisarme para activarla

- El proyecto usa valores de texto para estados de equipo y reserva, por lo que se recomienda mantener una convención estable en la base de datos.
- El sistema de disponibilidad compara intervalos con la condición:
  - fecha_inicio < fecha_fin existente
  - fecha_fin > fecha_inicio solicitado
- Las reservas se conservan para histórico, en lugar de ser eliminadas permanentemente.

