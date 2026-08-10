# Instalación en Windows

[Inicio](../../README.md) · [Linux](08-instalacion-linux.md) · [Troubleshooting](13-troubleshooting.md)

## Requisitos

Git, JDK 21 y PowerShell son obligatorios; Docker Desktop solo es necesario para Testcontainers/imagen local; Postman y `psql` son opcionales. Compruebe:

```powershell
git --version
java --version
docker --version
```

## Ejecución

```powershell
git clone <URL> lisource
cd lisource
git switch 1021805193-reto2
cd lisource-backend
Copy-Item .env.example .env
# complete .env con los valores entregados fuera de Git
.\mvnw.cmd spring-boot:run
```

La aplicación escucha en `8080`. Verifique `http://localhost:8080/actuator/health`. Para preparar una base nueva ejecute `01-estructura.sql`, `02-semilla.sql`, `03-pruebas.sql` en ese orden. **El primero es destructivo; no lo ejecute contra datos que deba conservar.**

## Validación y Docker

```powershell
.\mvnw.cmd -B clean verify
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

El Dockerfile usa etapas separadas para compilar y ejecutar; el contenedor runtime no necesita Maven. Si quiere backend y frontend simultáneos, vea la opción `git worktree` del README.

