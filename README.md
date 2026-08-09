# LIS Equipment Management API

REST API for managing the inventory and reservations of hardware resources belonging to the **Laboratorio Integrado de Sistemas (LIS)** at Universidad de Antioquia.

The system allows users to register laboratory equipment, browse inventory with filtering and pagination, and create reservations with strict conflict detection to prevent double-booking.

---

## Technologies

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.0.7 |
| Build | Maven 3.9+ (wrapper included) |
| Persistence | Spring Data JPA + Hibernate 7 |
| Database | PostgreSQL 16 |
| Validation | Jakarta Validation |
| API Docs | SpringDoc OpenAPI 3.1 (Swagger) |
| Testing | JUnit 5 + Mockito + Testcontainers |
| Containerization | Docker + Docker Compose |

---

## Architecture

The project follows a layered architecture with clear separation of responsibilities:

```
Controller  →  DTO validation, HTTP handling, OpenAPI annotations
    ↓
Service     →  Business logic, transaction management, overlap detection
    ↓
Repository  →  Data access, custom queries, pessimistic locking
    ↓
Database    →  PostgreSQL (via Docker or local)
```

### Package Structure

```
com.udea.lis/
├── config/           Global exception handler, OpenAPI config
├── controller/       REST controllers
├── dto/
│   ├── request/      Inbound DTOs with Jakarta validation
│   └── response/     Outbound DTOs
├── entity/           JPA entities and enums
├── exception/        Custom exceptions
├── mapper/           Entity ↔ DTO converters
├── repository/       Spring Data JPA repositories
└── service/          Business logic services
```

---

## Requirements

- **Docker** (all you need — Docker Compose starts both PostgreSQL and the backend)
- Or: **Java 21** + **Maven** (to run the backend locally with only PostgreSQL in Docker)

---

## Quick Start

Pick one option:

### Option A: Everything via Docker (no Java/Maven required)

One command starts everything:

```bash
docker compose up -d
```

The API is at **http://localhost:8080**. To stop:

```bash
docker compose down -v
```

> No `.env` file is needed — all defaults are built into `docker-compose.yml`. Create a `.env` file only if you need to change the database password.

### Option B: Backend locally, PostgreSQL via Docker

```bash
# Start only PostgreSQL
docker compose up -d postgres

# Run the backend
./mvnw spring-boot:run
```

API at **http://localhost:8080**. Stop PostgreSQL with `docker compose down -v`.

### Option C: Full local (without Docker)

Requires PostgreSQL running locally. Create the database:

```bash
psql -U postgres -c "CREATE DATABASE lis_db;"
psql -U postgres -c "CREATE USER lis_user WITH PASSWORD 'lis_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE lis_db TO lis_user;"
```

Then set env vars and run:

```bash
export DB_HOST=localhost DB_PORT=5432 DB_NAME=lis_db DB_USERNAME=lis_user DB_PASSWORD=lis_pass
./mvnw spring-boot:run

```bash
docker compose up -d postgres
./mvnw spring-boot:run

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `lis_db` | Database name |
| `DB_USERNAME` | `lis_user` | Database user |
| `DB_PASSWORD` | `lis_pass` | Database password |
| `SERVER_PORT` | `8080` | Application port |

When using Docker Compose, `DB_HOST` is automatically set to `postgres` (the Docker service name) inside the backend container.

---

## Database

PostgreSQL 16 is used as the database engine. JPA is configured with `ddl-auto: update`, which means tables are automatically created or updated on application startup based on the entity definitions.

### Tables

| Table | Description |
|---|---|
| `users` | Registered users (name, email) |
| `equipment` | Laboratory equipment inventory |
| `reservations` | Equipment reservations with time ranges |

### Enums

- **EquipmentCategory**: `MICROCONTROLLERS`, `VR`, `NETWORKING`, `SENSORS`, `ROBOTICS`, `COMPUTING`
- **EquipmentStatus**: `AVAILABLE`, `RESERVED`, `MAINTENANCE`
- **ReservationStatus**: `ACTIVE`, `CANCELLED`

---

## API Endpoints

### Equipment

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/equipment` | Create new equipment |
| `GET` | `/api/equipment` | List equipment (paginated, filterable) |
| `GET` | `/api/equipment/{id}` | Get equipment by ID |
| `PUT` | `/api/equipment/{id}` | Update equipment |

**Pagination & Filtering:**
```
GET /api/equipment?page=0&size=10
GET /api/equipment?category=VR
GET /api/equipment?status=AVAILABLE
GET /api/equipment?category=VR&status=AVAILABLE&page=0&size=5
```

### Users

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users` | Register a new user |
| `GET` | `/api/users/{id}` | Get user by ID |

### Reservations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reservations` | Create a reservation |
| `GET` | `/api/reservations` | List all reservations |
| `GET` | `/api/reservations/{id}` | Get reservation by ID |
| `DELETE` | `/api/reservations/{id}` | Cancel a reservation (logical) |
| `GET` | `/api/equipment/{id}/reservations` | Get reservations for equipment |

### Statistics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/statistics/top-equipment` | Top 5 most reserved equipment |

---

## Swagger

Once the application is running, access the interactive API documentation at:

```
http://localhost:8080/swagger-ui.html
```

The raw OpenAPI spec is available at:

```
http://localhost:8080/api-docs
```

---

## Testing

Tests use **Testcontainers** with a real PostgreSQL instance, so **Docker must be running**.

```bash
# Run all tests
./mvnw test

# Run a specific test class
./mvnw test -Dtest="EquipmentControllerTest"

# Run a specific test method
./mvnw test -Dtest="EquipmentControllerTest\$CreateEquipment#shouldCreateEquipment"
```

### Test Coverage

- **Equipment (16 tests)**: CRUD operations, validation, duplicate detection, filtering by category/status, pagination
- **Reservations (12 tests)**: Creation, date validation, conflict detection (409), back-to-back reservations, cancellation, cancelled reservations don't block new ones, equipment-scoped listing

---

## Examples

### Create Equipment

```bash
curl -X POST http://localhost:8080/api/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arduino Uno R3",
    "serialNumber": "SN-ARD-001",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "category": "MICROCONTROLLERS",
    "status": "AVAILABLE"
  }'
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Arduino Uno R3",
  "serialNumber": "SN-ARD-001",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "category": "MICROCONTROLLERS",
  "status": "AVAILABLE",
  "createdAt": "2026-08-09T12:00:00",
  "updatedAt": "2026-08-09T12:00:00"
}
```

### List Equipment with Filter

```bash
curl "http://localhost:8080/api/equipment?category=VR&status=AVAILABLE&page=0&size=10"
```

**Response (200):**
```json
{
  "content": [
    {
      "id": 2,
      "name": "Oculus Quest 2",
      "serialNumber": "SN-VR-001",
      "category": "VR",
      "status": "AVAILABLE",
      "createdAt": "2026-08-09T12:01:00",
      "updatedAt": "2026-08-09T12:01:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

### Create User

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Diego P",
    "email": "diego.p@udea.edu.co"
  }'
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Diego P",
  "email": "diego.p@udea.edu.co",
  "createdAt": "2026-08-09T12:00:00"
}
```

### Create Reservation

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": 1,
    "userId": 1,
    "startTime": "2026-08-10T10:00:00",
    "endTime": "2026-08-10T12:00:00"
  }'
```

**Response (201):**
```json
{
  "id": 1,
  "equipment": {
    "id": 1,
    "name": "Arduino Uno R3",
    "serialNumber": "SN-ARD-001"
  },
  "user": {
    "id": 1,
    "name": "Diego P",
    "email": "diego.p@udea.edu.co"
  },
  "startTime": "2026-08-10T10:00:00",
  "endTime": "2026-08-10T12:00:00",
  "createdAt": "2026-08-09T12:05:00",
  "status": "ACTIVE"
}
```

### Reservation Conflict

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": 1,
    "userId": 2,
    "startTime": "2026-08-10T11:00:00",
    "endTime": "2026-08-10T13:00:00"
  }'
```

**Response (409):**
```json
{
  "timestamp": "2026-08-09T12:05:01",
  "status": 409,
  "error": "Conflict",
  "message": "The equipment with id 1 is already reserved during the requested period",
  "path": "/api/reservations"
}
```

### Cancel Reservation

```bash
curl -X DELETE http://localhost:8080/api/reservations/1
```

**Response: 204 No Content**

---

## Reservation Conflict Rule

This is the core business rule of the system.

### Overlap Detection

A reservation is rejected if there is already an **ACTIVE** reservation for the same equipment that overlaps with the requested time period.

Two intervals `[startA, endA)` and `[startB, endB)` overlap when:

```
startA < endB  AND  endA > startB
```

Time is treated as half-open: reservations are `[startTime, endTime)`. This means two reservations **can** be back-to-back (one ending at 12:00, the next starting at 12:00) without conflict.

### Examples

Given an existing reservation **10:00 → 12:00**, the following **are rejected**:
- 09:00 → 11:00 (overlaps)
- 11:00 → 13:00 (overlaps)
- 10:30 → 11:30 (overlaps)
- 09:00 → 13:00 (overlaps)

The following **are allowed**:
- 08:00 → 10:00 (back-to-back, no overlap)
- 12:00 → 14:00 (back-to-back, no overlap)

### Concurrency

To prevent race conditions (two users reserving the same equipment simultaneously), the system uses **pessimistic write locking** (`SELECT ... FOR UPDATE`) via Spring Data JPA's `@Lock(LockModeType.PESSIMISTIC_WRITE)`. The lock is acquired on the equipment row within a `@Transactional` service method, ensuring that no two transactions can check availability and insert a reservation for the same equipment at the same time.

### Cancelled Reservations

Cancelled reservations (`CANCELLED`) are **ignored** during conflict detection — they do not block new reservations for the same time period.

---

## Statistics

The endpoint `GET /api/statistics/top-equipment` returns the **top 5 most historically reserved** pieces of equipment.

**Counting policy**: All reservations (both `ACTIVE` and `CANCELLED`) are counted, since the interest is in total historical demand regardless of final status.

---

## Testing with Postman

Base URL: **http://localhost:8080** — all requests need the header `Content-Type: application/json`.

### 1. Equipment

**Create an Arduino (expect 201):**
```
POST /api/equipment
{
  "name": "Arduino Uno R3",
  "serialNumber": "SN-ARD-001",
  "category": "MICROCONTROLLERS",
  "status": "AVAILABLE"
}
```

**Create Oculus (expect 201):**
```
POST /api/equipment
{
  "name": "Oculus Quest 2",
  "serialNumber": "SN-VR-001",
  "category": "VR",
  "status": "AVAILABLE"
}
```

**Create Cisco Router (expect 201):**
```
POST /api/equipment
{
  "name": "Cisco Router",
  "serialNumber": "SN-NET-001",
  "category": "NETWORKING",
  "status": "MAINTENANCE"
}
```

**List all equipment — paginated (expect 200):**
```
GET /api/equipment
```
→ Returns 3 items, `totalElements: 3`, `totalPages: 1`

**Paginate with page size 2 (expect 200):**
```
GET /api/equipment?page=0&size=2
```
→ Returns 2 items, `totalPages: 2`, `first: true`, `last: false`

**Filter by category VR (expect 200):**
```
GET /api/equipment?category=VR
```
→ Returns only the Oculus

**Filter by status AVAILABLE (expect 200):**
```
GET /api/equipment?status=AVAILABLE
```
→ Returns Arduino and Oculus

**Get equipment by ID (expect 200):**
```
GET /api/equipment/1
```

**Get non-existent equipment (expect 404):**
```
GET /api/equipment/999
```

**Update equipment (expect 200):**
```
PUT /api/equipment/1
{
  "name": "Arduino Uno R3 Updated",
  "serialNumber": "SN-ARD-001",
  "category": "MICROCONTROLLERS",
  "status": "MAINTENANCE"
}
```

**Duplicate serial number (expect 409):**
```
POST /api/equipment
{
  "name": "Duplicate",
  "serialNumber": "SN-ARD-001",
  "category": "MICROCONTROLLERS"
}
```

**Validation error — blank name (expect 400):**
```
POST /api/equipment
{
  "name": "",
  "serialNumber": "SN-BAD",
  "category": "VR"
}
```

---

### 2. Users

**Create John (expect 201):**
```
POST /api/users
{
  "name": "John Doe",
  "email": "john.doe@udea.edu.co"
}
```

**Create Jane (expect 201):**
```
POST /api/users
{
  "name": "Jane Doe",
  "email": "jane.doe@udea.edu.co"
}
```

**Duplicate email (expect 409):**
```
POST /api/users
{
  "name": "John Clone",
  "email": "john.doe@udea.edu.co"
}
```

**Get user by ID (expect 200):**
```
GET /api/users/1
```

**Get non-existent user (expect 404):**
```
GET /api/users/999
```

---

### 3. Reservations

**John reserves Arduino 10:00-12:00 (expect 201):**
```
POST /api/reservations
{
  "equipmentId": 1,
  "userId": 1,
  "startTime": "2026-08-10T10:00:00",
  "endTime": "2026-08-10T12:00:00"
}
```

**Conflict — Jane tries 11:00-13:00 overlapping (expect 409):**
```
POST /api/reservations
{
  "equipmentId": 1,
  "userId": 2,
  "startTime": "2026-08-10T11:00:00",
  "endTime": "2026-08-10T13:00:00"
}
```

**Back-to-back — John reserves 12:00-14:00 (expect 201):**
```
POST /api/reservations
{
  "equipmentId": 1,
  "userId": 1,
  "startTime": "2026-08-10T12:00:00",
  "endTime": "2026-08-10T14:00:00"
}
```
> This proves that back-to-back reservations are allowed — [10:00, 12:00) and [12:00, 14:00) don't overlap.

**Invalid dates — start equals end (expect 400):**
```
POST /api/reservations
{
  "equipmentId": 1,
  "userId": 1,
  "startTime": "2026-08-10T15:00:00",
  "endTime": "2026-08-10T15:00:00"
}
```

**Non-existent equipment (expect 404):**
```
POST /api/reservations
{
  "equipmentId": 999,
  "userId": 1,
  "startTime": "2026-08-11T10:00:00",
  "endTime": "2026-08-11T12:00:00"
}
```

**Non-existent user (expect 404):**
```
POST /api/reservations
{
  "equipmentId": 1,
  "userId": 999,
  "startTime": "2026-08-11T10:00:00",
  "endTime": "2026-08-11T12:00:00"
}
```

**List all reservations (expect 200):**
```
GET /api/reservations
```

**Get reservations for equipment 1 (expect 200):**
```
GET /api/equipment/1/reservations
```
→ Returns both of John's reservations

**Cancel John's first reservation (expect 204):**
```
DELETE /api/reservations/1
```

**Verify it's now CANCELLED (expect 200):**
```
GET /api/reservations/1
```
→ `"status": "CANCELLED"`

**Cancelled doesn't block — Jane reserves 10:00-12:00 (expect 201):**
```
POST /api/reservations
{
  "equipmentId": 1,
  "userId": 2,
  "startTime": "2026-08-10T10:00:00",
  "endTime": "2026-08-10T12:00:00"
}
```
> Proves cancelled reservations don't block new ones for the same time slot.

---

### 4. Statistics

**Top 5 most reserved equipment (expect 200):**
```
GET /api/statistics/top-equipment
```
→ Equipment 1 (Arduino) should be at the top with 3 reservations.

---

### Quick End-to-End Sequence

Run these in order — takes 2 minutes and demonstrates every feature:

```
1.  POST /api/equipment      # Arduino
2.  POST /api/equipment      # Oculus
3.  POST /api/users          # John
4.  POST /api/users          # Jane
5.  POST /api/reservations   # John reserves Arduino 10-12
6.  POST /api/reservations   # Jane tries overlap → 409
7.  POST /api/reservations   # John reserves Arduino 12-14 (back-to-back)
8.  GET  /api/equipment/1/reservations  # Both of John's
9.  DELETE /api/reservations/1          # Cancel John's first
10. GET  /api/statistics/top-equipment   # Arduino at top
```
