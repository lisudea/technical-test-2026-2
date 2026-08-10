# LIS UdeA - Sistema de Gestión y Reservas de Equipos

Backend REST desarrollado con Spring Boot 3.5, Java 21, PostgreSQL, Spring Data JPA y Swagger/OpenAPI.


## Tecnologías

* **Lenguaje:** Java 21
* **Framework:** Spring Boot 3.5
* **Persistencia:** Spring Data JPA / Hibernate
* **Base de Datos:** PostgreSQL 15+
* **Documentación:** OpenAPI 3 / Swagger UI
* **Gestor de Dependencias:** Maven 3.9+

## Requisitos previos

* Java 21 JDK instalado y configurado en el PATH
* Docker Desktop (Para la instalación de PostgreSQL en contenedor)


## Despliegue local
## 1. Iniciar PostgreSQL

Desde el directorio del Backend donde se encuentra el archivo `docker-compose.yml`, ejecuta:

```bash
docker compose up -d
```

Verificar:

```bash
docker ps
```

Esto desplegará un contenedor PostgreSQL en el puerto 5432 con las siguientes credenciales por defecto:

* Host: `localhost`
* Puerto: `5432`
* Base de datos: `lis_reservas`
* Usuario: `lis`
* Contraseña: `lis`

## 2. Ejecutar la aplicación

Inicia el servidor Spring Boot usando el wrapper de Maven:

```En Linux/macOS
./mvnw spring-boot:run
```

```En Windows (CMD/PowerShell)
mvnw.cmd spring-boot:run
```

El servidor quedará disponible en http://localhost:8080

## 3. Documentación de la API y pruebas (Swagger)

El proyecto incluye la interfaz de Swagger UI para probar y explorar todos los servios REST interactivos directamente desde el navegador:

* Swagger UI: http://localhost:8080/swagger-ui.html

Documentación OpenAPI: http://localhost:8080/v3/api-docs

## Endpoints principales

### Equipos (/api/equipos)

* `GET /api/equipos:` Listado de equipos con soporte para paginación (page, size, sort) y filtros (categoria, estado, search).

* `POST /api/equipos:` Registra un nuevo equipo. El campo codigo (ej. EQ-001) sirve como identificador visible.

* `GET /api/equipos/{id}:` Obtiene el detalle de un equipo por su ID interno.

* `PUT /api/equipos/{id}:` Modifica los datos o el estado del equipo (DISPONIBLE o EN_MANTENIMIENTO).

* `DELETE /api/equipos/{id}:` Elimina el equipo siempre que no tenga reservas asociadas.


### Reservas (/api/reservas)

* `GET /api/reservas:` Lista el historial completo de reservas creadas.

* `POST /api/reservas:` Crea una nueva reserva para un equipo.

*  `GET /api/reservas/{id}:` Obtiene el detalle de una reserva específica.

* `DELETE /api/reservas/{id}:` Cancela una reserva activa.

* `GET /api/reservas/equipo/{equipoId}:` Lista las reservas asociadas a un equipo particular.


### Estadísticas (/api/estadisticas)

* `GET /api/estadisticas/resumen:` Retorna el conteo general para el panel principal (totales, disponibles y reservados).

* `GET /api/estadisticas/top-equipos:` Retorna el listado de los equipos más solicitados.

* `GET /api/estadisticas/categorias:` Retorna la distribución de equipos por categoría.

## Ejemplo de equipo

```json
{
  "codigo": "EQ-001",
  "nombre": "Arduino Mega 2560",
  "numeroSerie": "ARD-2560-001",
  "categoria": "MICROCONTROLADORES",
  "estado": "DISPONIBLE"
}
```

## Ejemplo de reserva

```json
{
  "equipoId": 1,
  "nombreUsuario": "Juan Pérez",
  "correoUsuario": "juan@udea.edu.co",
  "fechaInicio": "2026-08-10T09:00:00",
  "fechaFin": "2026-08-10T12:00:00"
}
```

## Prueba del conflicto

Crear primero una reserva de:

`2026-08-10T09:00:00` a `2026-08-10T12:00:00`

Después intentar:

`2026-08-10T10:00:00` a `2026-08-10T13:00:00`

La segunda solicitud debe responder:

```http
409 Conflict
```

No se aceptan cruces parciales ni reservas contenidas dentro de otra.

## Reglas de negocio Backend

## 1. Cálculo Automático del Estado RESERVADO:

* El estado de un equipo en la base de datos almacena únicamente la condición física (DISPONIBLE o EN_MANTENIMIENTO).

* El estado RESERVADO se evalúa dinámicamente: un equipo pasa automáticamente al estado visual RESERVADO únicamente cuando la fecha y la hora actual coinciden con el rango exacto de una reserva activa. Al terminar dicha franja horaria, el equipo vuelve a estar DISPONIBLE.

## 2. Validación de reservas en franjas horarias:

* El servicio valida que no existan reservas cruzadas para un mismo equipo en el mismo intervalo de tiempo. Si la franja solicitada coincide parcial o totalmente con otra reserva activa, el backend responde con 409 Conflict.

## 3. Integridad:

* No se permite eliminar un equipo si ya posee reservas registradas. Intentar borrarlo retornará un error 409 Conflict.

## ID del equipo

El campo `id` de la base de datos es interno y autogenerado por PostgreSQL. Para cumplir el requisito del reto de solicitar un ID único al registrar un equipo, la API usa el campo `codigo`, con formato `EQ-001`, `EQ-002`, etc. Este es el identificador visible que puede usar el frontend.

Si vienes de una versión anterior del proyecto que ya creó tablas y datos, ejecuta una sola vez `docker compose down -v` para eliminar el volumen anterior y luego `docker compose up -d`. Esto permite que Hibernate cree la nueva columna `codigo` correctamente.


## Estados de equipos
- DISPONIBLE: puede reservarse.
- RESERVADO: se calcula automáticamente cuando existe una reserva activa.
- EN_MANTENIMIENTO: no puede reservarse.
