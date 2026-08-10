<div align="center">

<h1>Prueba Técnica LIS 2026-2 — Reto 2: Backend</h1>
<h3>Sistema de Gestión y Reservas de Equipos del LIS</h3>

<p>
<strong>Karen Jimenez Castro</strong><br/>
Estudiante de Ingeniería de Sistemas<br/>
Universidad de Antioquia
</p>

<p>
<img alt="Java 21" src="https://img.shields.io/badge/Java-21-007396?style=for-the-badge&logo=openjdk&logoColor=white">
<img alt="Spring Boot 4" src="https://img.shields.io/badge/Spring%20Boot-4.1.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white">
<img alt="Maven" src="https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white">
<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img alt="Docker" src="https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white">
<img alt="JWT" src="https://img.shields.io/badge/JWT-Bearer-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
<img alt="Google OAuth2" src="https://img.shields.io/badge/Google-OAuth2-4285F4?style=for-the-badge&logo=google&logoColor=white">
<img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=for-the-badge&logo=githubactions&logoColor=white">
</p>

</div>

<details>
<summary><strong>📚 Tabla de contenidos </strong></summary>

- 0) Contexto y requerimientos del reto
- 1) Requisitos previos
- 2) Clonar el repositorio y ubicarse en la rama
- 3) Variables de entorno
- 4) Ejecutar localmente con Maven
- 5) Ejecutar con Docker Compose (recomendado)
- 6) Verificar que la API responde
- 7) Base de datos (esquema y migraciones)
- 8) Estructura del proyecto
- 9) Autenticación (Google SSO + JWT)
- 10) Reglas de negocio clave
- 11) Endpoints principales
- 12) Cómo probar los endpoints
- 13) Estadísticas (bonus)
- 14) CI/CD
- 15) Pruebas Unitarias
- 16) Despliegue en render
- 17) Resolución de problemas
- 18) Seguridad y variables

</details>

## 0) Contexto y requerimientos del reto

El objetivo es desarrollar un backend (REST API) que gestione el inventario y las reservas de recursos de hardware del laboratorio LIS, cumpliendo los siguientes requerimientos funcionales obligatorios:

1) **Gestión de equipos**: registro, actualización y visualización, con ID único, nombre, número de serie/MAC, categoría (Microcontroladores, VR, Redes) y estado actual.
2) **Listado avanzado**: consulta paginada con filtros por categoría y/o estado.
3) **Gestión de reservas**: un usuario (identificado por nombre y correo) puede crear, cancelar y listar reservas de un equipo específico, con fecha/hora de inicio y de fin.
4) **Regla de negocio crítica**: al crear una reserva, el sistema valida estrictamente que el equipo no esté ya reservado por otro usuario en la misma franja horaria. En caso de conflicto, la API responde con el código HTTP adecuado (`409 Conflict`).

Adicionalmente, implementé los dos bonus de nivel avanzado:

- **Estadísticas**: Top 5 de equipos más solicitados históricamente, reservas agrupadas por categoría, y tasa de cancelación global.
- **Autenticación integrada**: login con Google (OIDC), restringido a correos institucionales `@udea.edu.co`, que emite un JWT propio para proteger la creación/cancelación de reservas y la creación de equipos (solo rol `ADMIN`).

## 1) Requisitos previos para ejecutar en local

Instala lo siguiente en este orden. Usa Windows PowerShell (recomendado desde VS Code: Terminal > New Terminal).

**1) Git**
```powershell
git --version
```

**2) Java 21 (JDK)**
```powershell
java -version
```

**3) Maven**
```powershell
mvn -version
```

**4) Docker Desktop** 
```powershell
docker --version
docker-compose --version
```
Asegúrate de que Docker Desktop esté **abierto y corriendo** (ícono de la ballena estable en la barra de tareas) antes de usar `docker-compose`.

**5) Visual Studio Code** (opcional, recomendado) con la extensión **REST Client** (`humao.rest-client`) para probar los endpoints con los archivos `.rest` incluidos.

Sin embargo, la app se encuentra desplega en Render por lo que también se puede ejecutar en 'https://technical-test-2026-2.onrender.com'. Dado a que Render duerme la aplicación después de que no se usa, se puede demorar un par de minutos en volverse a levantar.

## 2) Clonar el repositorio y ubicarse en la rama

```powershell
git clone https://github.com/lisudea/technical-test-2026-2.git
cd technical-test-2026-2
git fetch --all
git checkout 1094244076-reto2
git branch --show-current
```

Salida esperada:
```text
1094244076-reto2
```

Entra a la carpeta del proyecto:
```powershell
cd lis-equipment-system
```

## 3) Variables de entorno

El proyecto no trae credenciales reales en el repositorio por seguridad. Debes configurarlas como variables de entorno antes de ejecutar:

| Variable | Valor |
|---|---|
| `DB_URL` | 	Cadena JDBC de conexión a PostgreSQL |
| `DB_USERNAME` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `GOOGLE_CLIENT_ID` | Client ID de OAuth2 de Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | 	Client Secret de OAuth2 de Google Cloud Console |


Nota importante sobre el JWT: no necesitas configurar un jwt.secret. La clave de firma se genera aleatoriamente en memoria cada vez que la aplicación arranca — al reiniciar el backend, todos los tokens emitidos anteriormente quedan inválidos automáticamente. Además, cada token se persiste en la tabla access_tokens, lo que permite invalidarlo manualmente antes de que expire mediante POST /api/v1/auth/logout.

## 4) Ejecutar localmente con Maven

Con las variables de entorno ya configuradas y una base PostgreSQL accesible en `DB_URL`:

```powershell
mvn spring-boot:run
```

Al arrancar correctamente verás en consola que Flyway aplica las migraciones (`V1` a `V7`) y luego:
```text
Tomcat started on port 8080 (http)
Started LisEquipmentSystemApplication in X seconds
```

## 5) Ejecutar con Docker Compose

Esta opción levanta **su propia base de datos PostgreSQL local** además de la app, sin que necesites una base externa. Es la forma más simple de correr el proyecto completo con un solo comando.

Crea un archivo `.env` en `lis-equipment-system/` con las creedenciales de Google:
```properties
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

Levanta todo:
```powershell
docker-compose up --build
```

Qué deberías ver: Docker construye la imagen, levanta Postgres, espera a que esté saludable (`healthcheck`), y luego arranca la app aplicando las migraciones Flyway automáticamente. Al final:
```text
lis-equipment-system-app-1  | Started LisEquipmentSystemApplication in X seconds
```

La API queda expuesta en `http://localhost:8080` igual que en ejecución local con Maven.

## 6) Verificar que la API responde

Con la app corriendo, abre otra terminal:

```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/api/v1/equipment?page=0&size=10'
```

Deberías recibir un `200 OK` con una página vacía o con equipos (si ya corriste el seed de datos demo).

## 7) Base de datos (esquema y migraciones)

Motor: **PostgreSQL** (Neon en desarrollo/producción, o el contenedor local levantado por Docker Compose). Las migraciones se gestionan con **Flyway** (`src/main/resources/db/migration/`), se aplican automáticamente al arrancar la aplicación.

| Versión | Archivo | Propósito |
|---|---|---|
| V1 | `V1__create_equipment_table.sql` | Tabla `equipment` |
| V2 | `V2__create_users_table.sql` | Tabla `users` |
| V3 | `V3__create_reservation_table.sql` | Tabla `reservation` (FK a `equipment` y `users`) |
| V4 | `V4__add_no_overlap_constraint.sql` | Constraint `EXCLUDE` anti-solapamiento a nivel de base de datos |
| V5 | `V5__seed_admin_user.sql` | Usuario administrador semilla |
| V6 | `V6__seed_data.sql` | Datos demo (equipos, usuarios, reservas) |
| V6 | `V7__insert_admin_lab_user` | laboratorio.lis@udea.edu.co tiene rol de 'Admin' para las pruebas |

### Tabla: equipment

| Columna | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-generado (IDENTITY) |
| name | varchar(150) | NOT NULL |
| mac_serial_number | varchar(100) | NOT NULL, UNIQUE |
| category | varchar(50) | NOT NULL (`MICROCONTROLADORES`, `VR`, `REDES`) |
| status | varchar(30) | NOT NULL (`DISPONIBLE`, `EN_MANTENIMIENTO`, `DADO_DE_BAJA`) |
| registration_date | timestamp | default now() |
| update_date | timestamp | |

### Tabla: users

| Columna | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-generado |
| name | varchar(150) | NOT NULL |
| email | varchar(150) | NOT NULL, UNIQUE |
| role | varchar(20) | NOT NULL (`ADMIN`, `USER`), default `USER` |
| registration_date | timestamp | default now() |

### Tabla: reservation

| Columna | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-generado |
| id_equipment | bigint | NOT NULL, FK → equipment(id) |
| id_user | bigint | NOT NULL, FK → users(id) |
| date_start_time | timestamp | NOT NULL |
| date_end_time | timestamp | NOT NULL, CHECK (fin > inicio) |
| status | varchar(20) | NOT NULL (`ACTIVE`, `CANCELLED`), default `ACTIVE` |
| creation_date | timestamp | default now() |

Además de la validación en el service, existe un **constraint `EXCLUDE` con `btree_gist`** que impide, a nivel de base de datos, que dos reservas `ACTIVE` del mismo equipo se solapen en el tiempo — es la red de seguridad final contra condiciones de carrera.

## 8) Estructura del proyecto

Arquitectura en **capas técnicas** (`config`, `controller`, `dto`, `entity`, `repository`, `service`/`service.impl`), organizada así:

```
lis-equipment-system/
├── Dockerfile
├── docker-compose.yml
├── pom.xml
├── equipment.rest
├── reservation.rest
├── stats.rest
└── src/main/
    ├── java/com/example/lis_equipment_system/
    │   ├── LisEquipmentSystemApplication.java
    │   ├── auth/
    │   │   ├── config/          # SecurityConfig, JwtConfig
    │   │   ├── controller/      # (login gestionado por Spring Security + Google)
    │   │   ├── handler/         # OAuth2Handler (emite el JWT tras login exitoso)
    │   │   └── service/         # CustomOidcUserService, JwtService
    │   ├── equipment/
    │   │   ├── controller/      # EquipmentController
    │   │   ├── dto/             # EquipmentRequest, EquipmentUpdateRequest, EquipmentResponse
    │   │   ├── entity/          # Equipment + enumerator/ (EquipmentCategory, EquipmentStatus)
    │   │   ├── repository/      # EquipmentRepository, EquipmentSpecifications
    │   │   └── service/         # EquipmentService + impl/
    │   ├── reservation/
    │   │   ├── controller/      # ReservationController
    │   │   ├── dto/             # ReservationRequest, ReservationResponse
    │   │   ├── entity/          # Reservation + enumerator/ (ReservationStatus)
    │   │   ├── repository/      # ReservationRepository (query de solapamiento y estadísticas)
    │   │   └── service/         # ReservationService + impl/
    │   ├── user/
    │   │   ├── entity/          # User + enumerator/ (Role)
    │   │   ├── repository/      # UserRepository
    │   │   └── service/         # UserService + impl/
    │   ├── stats/
    │   │   ├── controller/      # StatsController
    │   │   ├── dto/             # TopEquipmentResponse, CategoryReservationResponse, CancellationRateResponse
    │   │   └── service/         # StatsService + impl/
    │   └── common/
    │       └── exception/       # GlobalExceptionHandler, ApiError, excepciones custom
    └── resources/
        ├── application.properties
        └── db/migration/        # Scripts Flyway V1-V6
```

## 9) Autenticación (Google SSO + JWT)

Flujo completo:

1. El usuario entra a `http://localhost:8080/` → la app redirige automáticamente a `/oauth2/authorization/google`.
2. Inicia sesión con su cuenta de Google.
3. `CustomOidcUserService` valida que el correo termine en `@udea.edu.co`; si no, rechaza el login.
4. Si es válido, se busca/crea el usuario en la tabla `users` (con rol `USER` por defecto).
5. `OAuth2Handler` genera un JWT (firmado con clave HS256 generada en memoria) con el email y el rol como claims, lo guarda en la tabla `access_tokens`, y lo devuelve como JSON en la respuesta.
6. Ese token se usa como `Authorization: Bearer <token>` en las peticiones protegidas. En cada request, `JwtDecoder` valida la firma **y** consulta `access_tokens` para confirmar que no esté revocado.
7. `POST /api/v1/auth/logout` marca el token actual como `revoked = true` — logout real, sin depender de reiniciar el backend.

Roles y permisos:

| Rol | Puede |
|---|---|
| `USER` | Listar equipos/reservas/estadísticas (público), crear y cancelar sus propias reservas |
| `ADMIN` | Todo lo de `USER`, más registrar/actualizar equipos, y cancelar reservas de cualquier usuario |

Para dar rol `ADMIN` a un usuario adicional (aparte del sembrado por el seed o de laboratorio.lis@udea.edu.co):
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'correo@udea.edu.co';
```

## 10) Reglas de negocio clave

- **Solapamiento de reservas**: al crear una reserva, se valida que no exista otra reserva `ACTIVE` del mismo equipo cuya franja se cruce con la solicitada. Conflicto → `409 Conflict`.
- **Fechas**: `dateEndTime` debe ser posterior a `dateStartTime` → si no, `400 Bad Request`.
- **MAC/Serial único**: no se pueden registrar dos equipos con el mismo número de serie/MAC → `409 Conflict` en la creación; ese campo **no es editable** después del registro.
- **Cancelación de reservas**: solo el dueño de la reserva o un `ADMIN` pueden cancelarla → `403 Forbidden` en otro caso.
- **Dominio institucional**: solo correos `@udea.edu.co` pueden autenticarse.

## 11) Endpoints principales

Base URL local: `http://localhost:8080`
Base URL desplegada: 'https://technical-test-2026-2.onrender.com'

### Equipos

| Método | Ruta | Seguridad | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/equipment` | `ADMIN` | Registrar equipo |
| `PUT` | `/api/v1/equipment/{id}` | `ADMIN` | Actualizar equipo (no permite cambiar el MAC/serial) |
| `GET` | `/api/v1/equipment/{id}` | Pública | Detalle de un equipo |
| `GET` | `/api/v1/equipment?category=&status=&page=&size=` | Pública | Listado paginado y filtrado |

### Reservas

| Método | Ruta | Seguridad | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/reservation` | Autenticado | Crear reserva (valida solapamiento) |
| `PATCH` | `/api/v1/reservation/{id}/cancellation` | Autenticado (dueño o `ADMIN`) | Cancelar reserva |
| `GET` | `/api/v1/reservation?equipmentId=&page=&size=` | Pública | Listado paginado, opcionalmente filtrado por equipo |

### Estadísticas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/stats/top-equipment` | Top 5 equipos más reservados históricamente |
| `GET` | `/api/v1/stats/reservations-by-category` | Total de reservas agrupadas por categoría |
| `GET` | `/api/v1/stats/cancellation-rate` | Tasa de cancelación global de reservas |

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Redirige automáticamente al login de Google |
| `GET` | `/oauth2/authorization/google` | Inicia el flujo OAuth2 con Google |
| `POST` | `/api/v1/auth/logout` | Revoca el JWT actual (logout real) |

Códigos de estado usados consistentemente: `201` creación, `200` lectura, `204` cancelación, `400` validación, `401` sin token/token inválido, `403` sin permiso, `404` no encontrado, `409` conflicto (MAC duplicado o solapamiento de reserva).

## 12) Cómo probar los endpoints

El proyecto incluye tres archivos `.rest` (formato de la extensión **REST Client** de VS Code) con casos de prueba listos, incluyendo los de error esperado:

- `equipment.rest`: crear/actualizar/listar equipos, casos de MAC duplicada y validación.
- `reservation.rest`: crear/cancelar/listar reservas, incluyendo el caso de **solapamiento (409)**.
- `stats.rest`: los tres endpoints de estadísticas.

Para probar endpoints protegidos en local:
1. Abre `http://localhost:8080/` en el **navegador** (no en REST Client) e inicia sesión con tu correo `@udea.edu.co`.
2. Copia el `token` del JSON de respuesta.
3. Pégalo en la variable `@token` al inicio del archivo `.rest` correspondiente.
4. Ejecuta las peticiones con el botón "Send Request" que aparece sobre cada bloque.

Recuerda: el token deja de ser válido si reinicias el backend o la página (la clave de firma se regenera en cada arranque).


Para probar endpoints protegidos desplegado:
1. Abre `https://technical-test-2026-2.onrender.com` en el **navegador** (no en REST Client) e inicia sesión con tu correo `@udea.edu.co`.
2. Actualiza el `@host` con esta URL.
3. Copia el `token` del JSON de respuesta.
4. Pégalo en la variable `@token` al inicio del archivo `.rest` correspondiente.
5. Ejecuta las peticiones con el botón "Send Request" que aparece sobre cada bloque.
   
## 13) Estadísticas

Implementadas como servicio de solo lectura sobre la tabla `reservation`, sin afectar el modelo de datos:

- **Top 5 equipos más solicitados**: cuenta reservas históricas (activas y canceladas) por equipo.
- **Reservas por categoría**: agrupa por `category` de `equipment`, útil para ver qué tipo de recurso tiene más demanda en general.
- **Tasa de cancelación**: porcentaje de reservas `CANCELLED` sobre el total, mide qué tan confiables son las reservas hechas.

## 14) CI/CD

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta automáticamente en cada `push` o `pull request` hacia la rama `1094244076-reto2`:

1. Checkout del código.
2. Configura Java 21 (Temurin).
3. Compila y corre pruebas (`mvn clean verify`).
4. Valida que la imagen Docker construya correctamente.

Revisa el resultado en la pestaña **Actions** del repositorio en GitHub.

## 15) Pruebas unitarias

El backend cuenta con pruebas unitarias para la capa de servicio, usando JUnit 5 y Mockito para aislar la lógica de negocio de la base de datos.

### Cobertura

**`EquipmentServiceImplTest`**
- Creación de equipo y mapeo correcto a `EquipmentResponse`.
- Rechazo de creación cuando el `macSerialNumber` ya existe (`DuplicateResourceException`).
- Actualización de un equipo existente.
- `ResourceNotFoundException` al buscar un equipo inexistente.
- Filtrado y paginación en `findAll`.

**`ReservationServiceImplTest`**
- Creación de reserva exitosa cuando no hay solapamiento de horarios.
- Rechazo con `ReservationConflictException` cuando el horario ya está ocupado.
- Cancelación permitida al dueño de la reserva y a un usuario `ADMIN`.
- Rechazo de cancelación (`AccessDeniedException`) cuando el usuario no es dueño ni admin.
- Listado y mapeo de reservas paginadas.

**`StatsServiceImplTest`**
- Top de equipos más solicitados.
- Conteo de reservas por categoría.
- Cálculo de la tasa de cancelación (porcentaje redondeado sobre el total).

### Ejecutar las pruebas

```bash
mvn test
```

## 16) Despliegue en Render

El servicio está desplegado como Web Service en Render, construido directamente desde el Dockerfile:

Link de ingreso: https://technical-test-2026-2.onrender.com/
Root Directory: lis-equipment-system
Dockerfile Path: lis-equipment-system/Dockerfile
Docker Build Context Directory: lis-equipment-system/
Environment Variables: las mismas cinco de la sección 3, configuradas en el panel de Render (nunca en el repo)
Auto-Deploy: activado, cada push a 1094244076-reto2 redespliega automáticamente

## 17) Resolución de problemas

- **`Failed to determine a suitable driver class` / `'url' attribute is not specified`**: falta el driver de Postgres en el `pom.xml`, o el archivo de configuración no está en `src/main/resources/`, o tiene el nombre/extensión incorrecta (no mezclar sintaxis YAML en un archivo `.properties`).
- **`'url' must start with jdbc`**: la variable de entorno `DB_URL` no se está resolviendo (revisa que esté definida en el mismo proceso/terminal que ejecuta la app) o le falta el prefijo `jdbc:`.
- **`Found non-empty schema(s) "public" but no schema history table`**: ya existen tablas creadas manualmente sin el control de Flyway. Solución: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` y volver a arrancar para que Flyway cree todo desde cero.
- **401 al probar endpoints protegidos desde REST Client/Postman**: el navegador y el cliente REST no comparten el token automáticamente. Haz login en el navegador, copia el token del JSON de respuesta, y pégalo manualmente en la variable `@token` del archivo `.rest`.
- **`unable to get image ... dockerDesktopLinuxEngine`**: Docker Desktop no está corriendo. Ábrelo y espera a que el ícono de la ballena esté estable antes de correr `docker-compose`.

## 18) Seguridad y variables

- No se sube ninguna credencial real al repositorio. Todo se referencia vía variables de entorno (${DB_URL}, ${GOOGLE_CLIENT_SECRET}, etc.) en application.properties.
- Las credenciales reales se comparten únicamente por canal privado (no en el README, no en Issues, no en Pull Requests) a quien necesite correr el proyecto localmente.
- Al desplegar, las variables se configuran directamente en el panel de Render — nunca en un archivo del repo.
- El JWT usa una clave simétrica generada en memoria en cada arranque (no persistida), lo que invalida automáticamente todos los tokens emitidos si el servidor se reinicia. Adicionalmente, cada token se persiste en access_tokens para permitir revocación manual vía POST /api/v1/auth/logout.
