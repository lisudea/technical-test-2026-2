# Sistema de Gestión y Reservas de Equipos del LIS

API REST para gestionar el inventario de equipos de un laboratorio (LIS) y sus reservas, evitando que un mismo equipo se reserve dos veces en el mismo horario. Incluye autenticación con Google (restringida a correos institucionales `@udea.edu.co`) para proteger la creación de reservas.

## Tecnologías utilizadas

- Node.js + Express (servidor y rutas)
- PostgreSQL (base de datos, alojada en [Neon](https://neon.tech))
- Prisma ORM (conexión y consultas a la base de datos)
- dotenv (manejo de variables de entorno)
- Google OAuth 2.0 (inicio de sesión)
- JSON Web Token / JWT (protección de endpoints)

## Requisitos para ejecutarlo

- Node.js instalado (v18 o superior)
- Una cuenta gratuita en [Neon](https://neon.tech)
- Una cuenta de Google (para configurar OAuth en Google Cloud Console)
- Postman (para probar los endpoints)

## Instalación

1. Clona o descarga este proyecto.
2. Instala las dependencias:
```bash
   npm install
```

## Configuración del `.env`

Este proyecto ya incluye un archivo `prisma.config.ts` que lee automáticamente
la variable `DATABASE_URL` desde tu `.env` (no necesitas tocar ese archivo).

1. Crea una base de datos en [Neon](https://neon.tech) (o usa una existente).
2. Copia la cadena de conexión que te da Neon.
3. Crea un archivo `.env` en la raíz del proyecto con este contenido:

DATABASE_URL="postgresql://usuario:contraseña@host/neondb?sslmode=require"
PORT=3000
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
JWT_SECRET=una_clave_secreta_larga_e_inventada

## Conectar la base de datos y crear las tablas

Ejecuta:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Esto crea las tablas `Equipo` y `Reserva` en tu base de datos de Neon automáticamente.

## Configuración de Google OAuth (para el login)

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) y crea un proyecto nuevo.
2. Ve a **"Pantalla de consentimiento de OAuth"**, elige tipo **"Externo"** y completa el formulario básico (nombre de la app, correo de soporte y de contacto).
3. Ve a **"Credenciales"** → **"+ Crear credenciales"** → **"ID de cliente de OAuth"**.
4. Tipo de aplicación: **"Aplicación web"**.
5. En **"Orígenes autorizados de JavaScript"**, agrega: `http://localhost:3000`.
6. Crea las credenciales y copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).
7. Pega ese ID en dos lugares:
   - `.env` → `GOOGLE_CLIENT_ID`
   - `public/login.html` → en el atributo `data-client_id`

## Ejecutar el servidor

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

## Cómo iniciar sesión y obtener el JWT

1. Con el servidor corriendo, abre en tu navegador: `http://localhost:3000/login.html`.
2. Haz clic en **"Acceder con Google"** y elige tu cuenta.
3. Si tu correo termina en `@udea.edu.co`, la página te mostrará un JWT — cópialo con el botón **"Copiar token"**.
4. Si tu correo NO es institucional, verás un mensaje de acceso denegado y no se genera ningún token.

## Cómo usar el JWT en Postman

En cualquier petición a `POST /reservas`, agrega este header: