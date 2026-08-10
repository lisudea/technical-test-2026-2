# Reto 3 — Dashboard de Monitoreo de Recursos

## Descripción

Desarrollo de una aplicación frontend para el monitoreo y gestión de los equipos del Laboratorio Integrado de Sistemas.

La aplicación consume la REST API desarrollada en el **Reto 2**, permitiendo visualizar los equipos disponibles, filtrar los recursos y realizar reservas desde una interfaz web responsiva.

## Tecnologías utilizadas

* **React**
* **Vite**
* **JavaScript**
* **Bootstrap**
* **Fetch API**
* **FastAPI** — Backend desarrollado en el Reto 2
* **PostgreSQL** — Base de datos
* **Docker** — Contenedor de PostgreSQL

## Funcionalidades implementadas

### 1. Dashboard de equipos

La aplicación consulta los equipos mediante la API del backend y los presenta mediante tarjetas.

Cada tarjeta muestra:

* Nombre del equipo.
* Número de serie.
* Categoría.
* Estado actual.

### 2. Indicadores visuales de estado

Los estados de los equipos se representan mediante colores:

* 🟢 **Disponible**
* 🔴 **Reservado**
* ⚪ **Mantenimiento**

Los equipos disponibles muestran además la opción para realizar una reserva.

### 3. Búsqueda de equipos

Se implementó un buscador dinámico que permite encontrar equipos mediante:

* Nombre.
* Número de serie.

El filtrado se realiza directamente en el frontend sin necesidad de recargar la página.

### 4. Filtro por categoría

Se implementó un selector dinámico de categorías.

Las categorías disponibles se obtienen a partir de los equipos retornados por la API.

### 5. Reserva de equipos

Los equipos disponibles cuentan con el botón **"Reservar equipo"**.

El formulario solicita:

* Nombre del usuario.
* Correo electrónico.
* Fecha y hora de inicio.
* Fecha y hora de finalización.

La información se envía al endpoint de reservas del backend.

### 6. Manejo de errores

La aplicación maneja diferentes situaciones de error.

Por ejemplo, cuando un equipo ya se encuentra reservado en el horario seleccionado, el backend responde con un conflicto (`409`) y el frontend muestra un mensaje informativo al usuario.

También se informa al usuario cuando no es posible establecer conexión con el backend.

### 7. Diseño responsivo

La interfaz fue desarrollada utilizando Bootstrap y clases responsivas para permitir su visualización en diferentes tamaños de pantalla.

## Estructura del proyecto

```text
reto3/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── public/
│
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Comunicación con el backend

El frontend consume la API desarrollada en el Reto 2.

URL base utilizada durante el desarrollo:

```text
http://127.0.0.1:8000
```

### Consultar equipos

```http
GET /equipos/
```

### Crear una reserva

```http
POST /reservas/
```

Los datos enviados para una reserva son:

```json
{
  "usuario_nombre": "Nombre del usuario",
  "usuario_correo": "correo@example.com",
  "equipo_id": 1,
  "fecha_inicio": "2026-08-10T10:00:00",
  "fecha_fin": "2026-08-10T11:00:00"
}
```

## Instalación

Desde la carpeta `reto3` ejecutar:

```bash
npm install
```

## Ejecución

Primero debe estar funcionando el backend del Reto 2.

Desde la carpeta `reto2`:

```bash
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Posteriormente, desde la carpeta `reto3`:

```bash
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

## Pruebas realizadas

Durante el desarrollo se verificó:

* Conexión entre React y FastAPI.
* Consulta de equipos mediante `GET /equipos/`.
* Visualización de los equipos registrados.
* Filtrado por nombre.
* Filtrado por número de serie.
* Filtrado por categoría.
* Visualización de estados.
* Creación de una reserva.
* Manejo del conflicto cuando un equipo ya está reservado.
* Manejo de errores de conexión con el backend.
* Diseño adaptable mediante Bootstrap.

## Control de versiones

El desarrollo del Reto 3 se realizó en una rama independiente:

```text
1013338862-reto3
```

Siguiendo el flujo de trabajo solicitado en la prueba técnica, evitando realizar cambios directamente sobre la rama `main`.

## Resultado

El Reto 3 integra el frontend desarrollado en React con la API REST del Reto 2, proporcionando una interfaz para consultar, filtrar y reservar los recursos del laboratorio.

La aplicación permite interactuar con los datos almacenados en PostgreSQL mediante el backend y proporciona retroalimentación visual al usuario ante operaciones exitosas o errores.

```
```
