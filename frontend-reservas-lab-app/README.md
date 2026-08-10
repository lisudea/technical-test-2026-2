# Frontend de Reservas de equipos del Laboratorio Integrado de Sistemas

Aplicacion de frontend (React + Vite + Tailwind CSS) que consume la API REST de
Spring Boot desarrollada para el reto 2 de la prueba técnica.

Los estilos estan basados en la página actual del laboratorio integrado de sistemas https://lis.udea.edu.co (paleta `#0e7774`, tipografia Source Sans Pro, y con diseño responsivo con filosofía mobile-first).

## Requisitos

- Node.js >= 20 (probado con Node 24)
- El backend corriendo en `http://localhost:8080`

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicacion queda corriendo en `http://localhost:5173`. 

Variables de entorno (opcionales, ver `.env.example`):

| Variable                  | Uso                                                                 |
| ------------------------- | ------------------------------------------------------------------- |
| `VITE_API_BASE_URL`       | Base de las peticiones. Por defecto `/http://localhost:8080/api` |
| `VITE_GOOGLE_CLIENT_ID`   | Client ID de la app Google. Debe coincidir con el `client-id` que el backend valida como audiencia. Si se omite, el boton "Continuar con Google" se oculta. |



## Credenciales de prueba (seed del backend)

- Administrador: `admin@udea.edu.co` / `Admin1234`
- Usuario: `estudiante@udea.edu.co` / `Usuario1234`

## Arquitectura

```
src/
├── api/                   Capa de peticiones HTTP (client generico + modulos por recurso)
│   ├── client.js             fetch generico: Authorization Bearer, JSON/plano, ApiErrorDTO
│   ├── authApi.js            POST /auth/register|login|google, GET /auth/me
│   ├── equipmentApi.js
│   ├── reservationApi.js
│   ├── userApi.js
│   └── categoryApi.js
├── models/                Capa de modelos equivalente a los DTO del backend
│   ├── api-error.js          ApiErrorDTO, AuthResponseDTO
│   ├── user.js               UserDTO, RegisterUserRequest, LoginRequest
│   ├── category.js           CategoryDTO, CreateCategoryDTO
│   ├── equipment.js          EquipmentDTO, CreateEquipmentDTO, UpdateEquipmentDTO
│   ├── reservation.js        ReservationDTO, CreateReservationDTO
│   ├── paged.js              PagedModelDTO (normaliza HATEOAS y Page<T>), PageMetadataDTO
│   └── enums.js              Role, EquipmentStatus, ReservationStatus (mismo @JsonValue)
├── hooks/                 Capa de hooks de consumo por endpoint
│   ├── useAuth.js            (via context) / useLoadable.js / usePagination.js
│   ├── useEquipment.js       listado filtrado + paginado + CRUD
│   ├── useReservation.js     mis reservas, todas (admin), crear, cancelar
│   ├── useUser.js            listado de usuarios (admin)
│   └── useCategory.js        categorias + creacion
├── context/               AuthContext (sesion JWT, login/register/google, 401 global)
├── components/            Layout, UI kit y modales de reservas/equipos
└── pages/                 Login, Registro, Dashboard, Equipos, Mis reservas y modulos admin
```

### Flujo de autenticacion Google

1. La aplicacion usa el boton de Google Identity Services (`@react-oauth/google`).
2. Se envia el `credential` (idToken) que otorga Google como cuerpo en **texto
   plano** a `POST /api/auth/google`.
3. El backend valida firma/audiencia con su `client-id` y exige el dominio
   `@udea.edu.co`; emite el JWT de la aplicacion.
4. El frontend guarda el JWT y lo envia en `Authorization: Bearer`.

El registro manual tambien valida el dominio `@udea.edu.co` tanto en el
formulario como en el backend.

### Reglas de negocio reflejadas

- Un usuario solo ve y gestiona **sus** reservas (`GET /api/reservations`).
- Cualquier usuario puede listar equipos con filtros y paginacion hechas en el
  backend (`GET /api/equipment?categoryId&status&page&size`).
- Al crear una reserva el backend valida superposicion de horarios (409) y
  equipos en mantenimiento.
- El administrador puede listar todos los usuarios y reservas, y gestionar
  equipos (crear/editar/eliminar) y categorias (crear).
