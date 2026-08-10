# Instalación en Ubuntu/Debian

[Inicio](../../README.md) · [Windows](07-instalacion-windows.md) · [Troubleshooting](13-troubleshooting.md)

## Prerrequisitos

Git y JDK 21 son obligatorios para backend. Node.js 22/npm se requieren solo para el sistema completo. Docker Engine, Postman y `postgresql-client` son opcionales; Terraform 1.15.x/AWS CLI solo se requieren para infraestructura. Instale desde las fuentes oficiales apropiadas para su distribución y verifique:

```bash
git --version
java --version
node --version
npm --version
docker --version  # si utilizará Docker
```

El repositorio incluye Maven Wrapper; no requiere Maven global.

## Backend local

```bash
git clone --branch 1021805193-reto2 --single-branch https://github.com/lisudea/technical-test-2026-2.git lisource-reto2
cd lisource-reto2/lisource-backend
chmod +x mvnw
./mvnw spring-boot:run
```

Antes de iniciar, descargue `backend.txt` de la carpeta privada de Drive, renómbrelo `.env` y guárdelo en `lisource-reto2/lisource-backend/.env`. Compare solo los nombres con `.env.example`; `git status --short` no debe mostrarlo.

En Supabase SQL Editor ejecute `01-estructura.sql`, `02-semilla.sql`, `03-pruebas.sql` sobre una base nueva. `01` reconstruye el modelo. Mantenga el backend abierto; en otra terminal use `curl http://localhost:8080/actuator/health` y abra Swagger.

## Sistema completo y validación

Clone la rama Reto 3 en otra carpeta, coloque `frontend.txt` como `lisource-frontend/.env`, ejecute `npm ci`/`npm run dev` y mantenga ambos procesos abiertos.

```bash
./mvnw -B clean verify
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

Testcontainers requiere acceso al daemon Docker. `psql` no es obligatorio si utiliza Supabase SQL Editor.
