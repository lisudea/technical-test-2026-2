# Sistema de Gestión y Reservas de Equipos - LIS

**Cristian Álvarez Cuartas**

### Descripción

Este proyecto implementa una API REST para gestionar los equipos de un laboratorio y las reservas que hacen los estudiantes sobre ellos.

El problema principal consiste en llevar un inventario de los recursos disponibles, permitir consultar dichos equipos de forma paginada y filtrada, y controlar que un mismo equipo no pueda ser reservado por dos estudiantes en una misma franja horaria.

Para la persistencia se utilizó una base de datos PostgreSQL alojada en Neon. El backend fue desarrollado con Java y Spring Boot.

### Objetivos

El objetivo principal es construir los servicios necesarios para:

- Registrar y consultar equipos del laboratorio.
- Actualizar el estado de un equipo.
- Listar equipos de forma paginada.
- Filtrar equipos por categoría o estado.
- Registrar y consultar estudiantes.
- Crear, consultar y cancelar reservas.
- Evitar traslapes entre reservas de un mismo equipo.
- Mostrar como funcionalidad adicional un Top 5 de los equipos más reservados.

### Construcción

El proyecto se separó por responsabilidades para que cada parte tenga una función clara.

**Equipos:** Se pueden registrar equipos indicando nombre, número de serie, categoría y estado. El número de serie debe ser único. Los estados manejados son `BUENO`, `REGULAR` y `MALO`, mientras que las categorías actuales son `MICROCONTROLADORES`, `VR`, `REDES` y `COMPUTADORES`.

**Listado:** La consulta de equipos se realiza de forma paginada. También es posible filtrar por categoría o por estado sin tener que crear endpoints distintos.

**Estudiantes:** Un estudiante se registra con nombre y correo. Luego su id se utiliza para asociarlo a las reservas.

**Reservas:** Para crear una reserva se recibe el estudiante, el equipo, una fecha de inicio y una fecha de fin. Antes de guardar se verifica que la fecha final sea posterior a la inicial, que la reserva no empiece en el pasado y que el equipo no tenga otra reserva que se cruce con ese horario.

**Control de traslapes:** Esta es la regla principal del sistema. Antes de guardar una reserva se consulta si existe otra del mismo equipo cuyo intervalo coincida con el nuevo. Si existe conflicto, la API rechaza la solicitud y devuelve un error.

**Estadísticas:** Como punto adicional se implementó un Top 5 de los equipos más reservados. La consulta agrupa las reservas por equipo, cuenta cuántas tiene cada uno y devuelve los cinco primeros ordenados de mayor a menor.

### Tecnologías

- Java 21
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Neon
- Lombok
- Maven
- Swagger / OpenAPI

### Organización del proyecto

La parte principal del código se encuentra en:

```text
src/main/java/com/github/cristianalvarez00/reservas_lis/
```

Se divide en:

- `controller`: Recibe las peticiones HTTP y devuelve las respuestas.
- `service`: Contiene la lógica y las validaciones del sistema.
- `repository`: Se comunica con la base de datos y contiene las consultas.
- `model`: Entidades que representan las tablas.
- `dto`: Objetos usados para recibir y devolver datos.
- `enums`: Categorías y estados permitidos.
- `exception`: Manejo general de errores.

La idea de esta separación es que el controlador no tenga toda la lógica. Por ejemplo, `ReservaController` recibe una solicitud de reserva, pero las validaciones de fechas y traslapes se realizan dentro de `ReservaService`.

### Configuración de la base de datos

El archivo `application.properties` utiliza las siguientes variables de entorno para la gestión de la conexión a la base de datos:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

Para **facilitar la ejecución**, dejo un .env.example preconfigurado con conexión a una db temporal en Neon. Si prefiere usar esa, cambie el nombre de `.env.example` a `.env`, o configure sus propias variables de entorno. 

Después de definirlas se puede iniciar el proyecto normalmente.

### Uso del programa

Para ejecutar el backend (**después de configurar variables de entorno**):

```bash
./mvnw spring-boot:run
```

En Windows:

```bash
mvnw.cmd spring-boot:run
```

Por defecto la API queda disponible en:

```text
http://localhost:8080
```

### Swagger

Los servicios se pueden probar desde Swagger en:

```text
http://localhost:8080/swagger-ui.html
```

Desde allí se pueden ejecutar las operaciones sin necesidad de Postman.

### Servicios disponibles

#### Equipos

**Registrar equipo**

```text
POST /equipos
```

Ejemplo:

```json
{
  "nombre": "Arduino Uno",
  "numSerie": "ARD-001",
  "categoriaEquipo": "MICROCONTROLADORES",
  "estadoEquipo": "BUENO"
}
```

**Listar equipos**

```text
GET /equipos
```

Parámetros disponibles:

```text
categoria
estado
pag
size
```

Ejemplo:

```text
GET /equipos?categoria=MICROCONTROLADORES&pag=0&size=10
```

También se puede consultar por estado:

```text
GET /equipos?estado=BUENO&pag=0&size=10
```

**Actualizar estado**

```text
PUT /equipos/{idEquipo}/{estadoNuevo}
```

Ejemplo:

```text
PUT /equipos/1/REGULAR
```

#### Estudiantes

**Registrar estudiante**

```text
POST /estudiantes
```

Ejemplo:

```json
{
  "nombre": "Juan Perez",
  "correo": "juan.perez@udea.edu.co"
}
```

**Listar estudiantes**

```text
GET /estudiantes
```

**Buscar estudiante por id**

```text
GET /estudiantes/estudiante/{id}
```

#### Reservas

**Crear reserva**

```text
POST /reservas
```

Ejemplo:

```json
{
  "fechaInicio": "2026-08-20T08:00:00",
  "fechaFin": "2026-08-20T10:00:00",
  "idEquipo": 1,
  "idEstudiante": 1
}
```

Si se intenta crear otra reserva sobre el mismo equipo dentro de esa franja, la solicitud es rechazada.

Por ejemplo:

```json
{
  "fechaInicio": "2026-08-20T09:00:00",
  "fechaFin": "2026-08-20T11:00:00",
  "idEquipo": 1,
  "idEstudiante": 2
}
```

En este caso existe un cruce entre las `09:00` y las `10:00`.

**Listar reservas de un estudiante**

```text
GET /reservas/{idEstudiante}
```

**Cancelar reserva**

```text
DELETE /reservas/{idReserva}
```

#### Estadísticas

**Top 5 de equipos más reservados**

```text
GET /reservas/estadisticas/top-equipos
```

Respuesta esperada:

```json
[
  {
    "equipoId": 1,
    "nombre": "Arduino Uno",
    "cantidadReservas": 5
  },
  {
    "equipoId": 2,
    "nombre": "Oculus Quest 2",
    "cantidadReservas": 4
  }
]
```

Si existen menos de cinco equipos con reservas, simplemente se devuelven los que tengan información.

### Manejo de errores

Los errores principales se devuelven como un JSON sencillo:

```json
{
  "error": "El equipo esta reservado para los tiempos dados."
}
```

Esto permite que el frontend tome el mensaje del backend y se lo muestre directamente al usuario.

### Consideraciones

Las reservas canceladas actualmente se eliminan de la base de datos. Por esta razón, el Top 5 se calcula sobre las reservas que se encuentran almacenadas en el momento de realizar la consulta.

La autenticación con Google o JWT no fue implementada por cuestiones de tiempo.

