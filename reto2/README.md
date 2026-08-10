# Reto 2 — Backend

## REST API — Sistema de Gestión y Reservas de Equipos del LIS

### Descripción

Este proyecto corresponde al **Reto 2 de la prueba técnica Technical Test 2026-2** para el cargo de Auxiliar de Programación del Laboratorio Integrado de Sistemas (LIS).

El objetivo es desarrollar una API REST para gestionar el inventario de equipos del laboratorio y permitir la creación, consulta y cancelación de reservas, garantizando que no existan conflictos de horario para un mismo equipo.

La aplicación utiliza una arquitectura basada en **FastAPI + SQLAlchemy + PostgreSQL**, con PostgreSQL ejecutándose mediante Docker para garantizar la persistencia de los datos.

---

## Tecnologías utilizadas

* **Python 3.13.7**
* **FastAPI 0.141.1**
* **Uvicorn 0.52.1**
* **SQLAlchemy 2.0.51**
* **PostgreSQL 16**
* **Psycopg 3.3.4**
* **Docker / Docker Compose**
* **Pydantic**
* **Swagger UI** para documentación y pruebas de la API
* **Git / GitHub** para control de versiones

---

## Arquitectura

La aplicación sigue la siguiente estructura:

```text
Cliente
   │
   ▼
FastAPI
   │
   ▼
Routers
   │
   ▼
Schemas / Pydantic
   │
   ▼
SQLAlchemy
   │
   ▼
PostgreSQL
   │
   ▼
Docker
```

---

## Estructura del proyecto

```text
reto2/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── equipo.py
│   │   └── reserva.py
│   │
│   ├── schemas/
│   │   ├── equipo.py
│   │   └── reserva.py
│   │
│   └── routers/
│       ├── equipos.py
│       └── reservas.py
│
├── docker-compose.yml
├── requirements.txt
├── .gitignore
└── README.md
```

La carpeta `venv/` se utiliza únicamente para el entorno virtual local y se encuentra excluida mediante `.gitignore`.

---

# Configuración y ejecución

## Requisitos

Para ejecutar el proyecto se necesita tener instalado:

* Python 3.13 o compatible
* Docker Desktop
* Git

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/lisudea/technical-test-2026-2.git
cd technical-test-2026-2
```

Cambiar a la rama correspondiente al Reto 2:

```bash
git checkout 1013338862-reto2
```

Entrar al proyecto:

```bash
cd reto2
```

---

## 2. Crear el entorno virtual

Se recomienda utilizar Python 3.13:

```bash
py -3.13 -m venv venv
```

Activar el entorno virtual en Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

---

## 3. Instalar las dependencias

Con el entorno virtual activo:

```bash
pip install -r requirements.txt
```

---

# Base de datos

La aplicación utiliza **PostgreSQL 16** ejecutándose mediante Docker.

La configuración se encuentra en `docker-compose.yml`.

### Configuración utilizada

```text
Base de datos: lis_db
Usuario: lis_user
Contraseña: lis_password
Puerto: 5432
Contenedor: lis_postgres
```

Para iniciar PostgreSQL:

```bash
docker compose up -d
```

Comprobar que el contenedor esté ejecutándose:

```bash
docker ps
```

Debe aparecer el contenedor:

```text
lis_postgres
```

Para detenerlo:

```bash
docker compose down
```

Los datos de PostgreSQL se almacenan en un volumen de Docker llamado `postgres_data`, permitiendo mantener la información aunque el contenedor sea detenido.

---

# Ejecución de la API

Con PostgreSQL ejecutándose y el entorno virtual activado:

```bash
uvicorn app.main:app --reload
```

La API estará disponible en:

```text
http://127.0.0.1:8000
```

---

# Documentación interactiva

FastAPI genera automáticamente documentación mediante Swagger UI.

Está disponible en:

```text
http://127.0.0.1:8000/docs
```

Desde Swagger se pueden consultar y probar todos los endpoints implementados.

---

# Gestión de equipos

## Crear equipo

### Endpoint

```http
POST /equipos/
```

### Ejemplo

```json
{
  "nombre": "Arduino Uno",
  "numero_serie": "ARD-001",
  "categoria": "Microcontroladores",
  "estado": "Disponible"
}
```

### Respuesta esperada

```json
{
  "id": 1,
  "nombre": "Arduino Uno",
  "numero_serie": "ARD-001",
  "categoria": "Microcontroladores",
  "estado": "Disponible"
}
```

El endpoint devuelve `409 Conflict` si ya existe un equipo con el mismo número de serie.

---

## Listar equipos

### Endpoint

```http
GET /equipos/
```

Permite consultar los equipos registrados.

### Paginación

Se pueden utilizar los parámetros:

```text
page
limit
```

Ejemplo:

```text
GET /equipos/?page=1&limit=10
```

### Filtros

También se puede filtrar por categoría:

```text
GET /equipos/?categoria=Microcontroladores
```

o por estado:

```text
GET /equipos/?estado=Disponible
```

También es posible combinar filtros y paginación:

```text
GET /equipos/?categoria=VR&estado=Disponible&page=1&limit=10
```

---

## Consultar un equipo

### Endpoint

```http
GET /equipos/{equipo_id}
```

Ejemplo:

```text
GET /equipos/1
```

Si el equipo no existe, se retorna:

```text
404 Not Found
```

---

## Actualizar un equipo

### Endpoint

```http
PUT /equipos/{equipo_id}
```

### Ejemplo

```json
{
  "nombre": "Arduino Uno Rev3",
  "numero_serie": "ARD-001",
  "categoria": "Microcontroladores",
  "estado": "En mantenimiento"
}
```

Si el equipo no existe, se retorna `404 Not Found`.

---

# Gestión de reservas

## Crear reserva

### Endpoint

```http
POST /reservas/
```

### Ejemplo

```json
{
  "usuario_nombre": "Sarah",
  "usuario_correo": "sarah@udea.edu.co",
  "equipo_id": 1,
  "fecha_inicio": "2026-08-10T10:00:00",
  "fecha_fin": "2026-08-10T12:00:00"
}
```

---

## Validación de fechas

La fecha de finalización debe ser posterior a la fecha de inicio.

Una solicitud con:

```text
fecha_fin <= fecha_inicio
```

es rechazada por la validación del esquema.

---

# Regla de negocio: conflictos de reservas

Uno de los requisitos principales del reto es impedir que un equipo sea reservado por dos usuarios durante el mismo intervalo de tiempo.

Antes de crear una reserva se comprueba si existe otra reserva para el mismo equipo cuyo intervalo se cruce con el solicitado.

La condición utilizada es:

```text
reserva_existente.fecha_inicio < nueva.fecha_fin
AND
reserva_existente.fecha_fin > nueva.fecha_inicio
```

### Ejemplo de conflicto

Reserva existente:

```text
10:00 ───────── 12:00
```

Nueva reserva:

```text
11:00 ───────── 13:00
```

Los horarios se cruzan, por lo que la API responde:

```text
409 Conflict
```

con:

```json
{
  "detail": "El equipo ya está reservado en ese horario"
}
```

### Caso permitido

Reserva existente:

```text
10:00 ───────── 12:00
```

Nueva reserva:

```text
12:00 ───────── 14:00
```

Esta solicitud sí es válida porque una reserva termina exactamente cuando comienza la siguiente.

---

# Listar reservas

### Endpoint

```http
GET /reservas/
```

Permite consultar las reservas registradas.

También permite filtrar por equipo:

```text
GET /reservas/?equipo_id=1
```

---

# Cancelar reserva

### Endpoint

```http
DELETE /reservas/{reserva_id}
```

Ejemplo:

```text
DELETE /reservas/1
```

Si la reserva existe, es eliminada y se devuelve:

```text
204 No Content
```

Si no existe:

```text
404 Not Found
```

---

# Códigos HTTP principales

| Código           | Uso                                               |
| ---------------- | ------------------------------------------------- |
| `200 OK`         | Consulta o actualización exitosa                  |
| `201 Created`    | Equipo o reserva creada correctamente             |
| `204 No Content` | Reserva cancelada correctamente                   |
| `404 Not Found`  | Equipo o reserva inexistente                      |
| `409 Conflict`   | Conflicto de número de serie o reserva de horario |

---

# Persistencia de datos

Los datos no se almacenan en arreglos ni variables estáticas.

La aplicación utiliza:

```text
FastAPI
   ↓
SQLAlchemy
   ↓
PostgreSQL
```

PostgreSQL se ejecuta en un contenedor Docker y utiliza un volumen persistente:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

De esta manera, los registros permanecen almacenados aunque el contenedor sea detenido.

---

# Pruebas realizadas

Durante el desarrollo se verificaron las siguientes funcionalidades:

* Creación de equipos.
* Consulta de equipos.
* Consulta individual por ID.
* Actualización de equipos.
* Filtrado por categoría.
* Filtrado por estado.
* Paginación.
* Creación de reservas.
* Validación de fechas.
* Validación de existencia del equipo.
* Detección de reservas con horarios superpuestos.
* Rechazo de conflictos mediante `409 Conflict`.
* Consulta de reservas.
* Cancelación de reservas.
* Persistencia de los datos en PostgreSQL.
* Funcionamiento de la documentación Swagger.

---

# Consideraciones

La API fue desarrollada priorizando la separación de responsabilidades entre:

* **Models:** representación de las tablas de la base de datos.
* **Schemas:** validación y serialización de datos mediante Pydantic.
* **Routers:** definición de los endpoints y lógica de las operaciones.
* **Database:** configuración de la conexión y sesiones con PostgreSQL.
* **Docker:** ejecución y persistencia de la base de datos.

---

# Autor

**Reto 2 — Technical Test 2026-2**

Laboratorio Integrado de Sistemas — Universidad de Antioquia
