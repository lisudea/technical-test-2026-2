# Instalación en Windows / PowerShell

[Inicio](../../README.md) · [Linux](09-instalacion-linux.md) · [Troubleshooting](13-troubleshooting.md)

## Qué instalar

| Clasificación | Herramienta | Uso | Fuente |
|---|---|---|---|
| Obligatorio | Git | clonar las ramas | [Git for Windows](https://git-scm.com/download/win) |
| Obligatorio | Node.js 22 + npm | frontend | [Node.js](https://nodejs.org/en/download) |
| Obligatorio | navegador actualizado | usar/evaluar UI | Chrome, Edge o Firefox |
| Sistema completo | JDK 21 | backend | distribución OpenJDK 21 |
| Sistema completo | acceso a Supabase | ejecutar SQL desde SQL Editor | proyecto entregado |
| Opcional | Docker Desktop | imagen local | [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) |
| Opcional | Postman | pruebas de API | [Postman](https://www.postman.com/downloads/) |
| Solo infraestructura | Terraform y AWS CLI | OIDC/IAM | sitios oficiales |

Maven global y `psql` no son obligatorios: el backend incluye Maven Wrapper y los scripts se pueden ejecutar en Supabase SQL Editor.

```powershell
git --version
java --version       # sistema completo
node --version
npm --version
docker --version     # opcional
terraform version    # solo infraestructura
aws --version        # solo infraestructura
```

## Preparar variables

Descargue de la carpeta privada de Drive:

- `backend.txt` → `lisource-backend/.env` dentro de la copia Reto 2.
- `frontend.txt` → `lisource-frontend/.env` dentro de la copia Reto 3.

Active **Ver → Mostrar → Extensiones de nombre de archivo** y confirme que ninguno quedó como `.env.txt`. Compare solo los nombres con cada `.env.example`; no copie valores a GitHub, documentación o consola compartida. Ejecute `git status --short`: los `.env` deben continuar ignorados.

## Ejecutar el sistema completo

Las ramas son distintas; use dos carpetas y dos terminales.

### Terminal 1: backend

```powershell
git clone --branch 1021805193-reto2 https://github.com/lisudea/technical-test-2026-2.git lisource-backend-reto2
cd lisource-backend-reto2\lisource-backend
# Coloque backend.txt renombrado como .env en esta carpeta
```

En Supabase SQL Editor ejecute desde esa copia, en orden:

1. `src/main/resources/db/01-estructura.sql` — recrea las 20 tablas y políticas; es destructivo sobre esa estructura.
2. `src/main/resources/db/02-semilla.sql` — carga catálogos/configuración base de forma idempotente.
3. `src/main/resources/db/03-pruebas.sql` — carga escenarios demo; úselo después de reconstruir con 01 y 02.

Después inicie y **deje abierta la terminal**:

```powershell
.\mvnw.cmd spring-boot:run
```

Compruebe `http://localhost:8080/actuator/health` y `http://localhost:8080/swagger-ui/index.html`.

### Terminal 2: frontend

```powershell
git clone --branch 1021805193-reto3 https://github.com/lisudea/technical-test-2026-2.git lisource-frontend-reto3
cd lisource-frontend-reto3\lisource-frontend
# Coloque frontend.txt renombrado como .env en esta carpeta
npm ci
npm run dev
```

Deje abierta también esta terminal y abra `http://localhost:3000`.

## Validaciones y contenedor opcional

```powershell
npm test
npm run lint
npm run build
docker build -t lisource-frontend .
docker run --rm -p 3000:3000 lisource-frontend
```

Los `VITE_*` se fijan al compilar y son públicos en el bundle. La imagen multi-stage escucha en `3000`; no coloque secretos en `--build-arg`.

## Comprobación funcional

- backend y Swagger responden;
- frontend carga;
- login local funciona con credencial privada de evaluación;
- catálogo, filtros y paginación muestran datos;
- una reserva futura devuelve éxito;
- una segunda franja superpuesta muestra el `409` sin perder el contexto.
