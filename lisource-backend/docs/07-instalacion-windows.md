# Instalación en Windows

[Inicio](../../README.md) · [Linux](08-instalacion-linux.md) · [Troubleshooting](13-troubleshooting.md)

## Prerrequisitos

| Herramienta | Para qué se usa | Instalación oficial | Verificación |
|---|---|---|---|
| Git | clonar y cambiar entre Reto 2/Reto 3 | [Git for Windows](https://git-scm.com/download/win) | `git --version` |
| JDK 21 | compilar/ejecutar Spring Boot | [Eclipse Temurin 21](https://adoptium.net/temurin/releases/?version=21) | `java --version` |
| PowerShell | ejecutar comandos de Windows | incluido en Windows; [PowerShell](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows) | `$PSVersionTable.PSVersion` |
| Node.js 22 + npm | ejecutar Reto 3 | [Node.js](https://nodejs.org/en/download) | `node --version` / `npm --version` |
| Docker Desktop | Testcontainers y builds de imagen | [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) | `docker version` |
| Postman | evaluación manual de los 59 requests | [Postman](https://www.postman.com/downloads/) | abrir la aplicación |
| `psql` | ejecutar SQL desde consola; opcional si usa Supabase SQL Editor | [PostgreSQL Windows](https://www.postgresql.org/download/windows/) | `psql --version` |

Git y JDK 21 son obligatorios para backend. Node 22 es obligatorio para el sistema completo. Docker, Postman y `psql` son opcionales según qué verificación vaya a ejecutar. **No instale Maven global:** el repositorio incluye Maven Wrapper.

Compruebe:

```powershell
git --version
java --version
node --version
npm --version
docker --version # opcional
```

## Ejecución

```powershell
git clone <URL> lisource
cd lisource
git switch 1021805193-reto2
cd lisource-backend
# Descargue backend.txt desde la carpeta de evaluación y guárdelo como .env aquí
.\mvnw.cmd spring-boot:run
```

Credenciales/configuración de evaluación: [Drive](https://drive.google.com/drive/folders/1acpvFdobQNkvmGB5Q5b15UoR8ZOfqfgI?usp=sharing). Descargue `backend.txt` → renómbrelo `.env` → ubíquelo en `lisource-backend/.env`. La aplicación escucha en `8080`. Verifique `http://localhost:8080/actuator/health`. Para preparar una base nueva ejecute `01-estructura.sql`, `02-semilla.sql`, `03-pruebas.sql` en ese orden. **El primero es destructivo; no lo ejecute contra datos que deba conservar.**

## Validación y Docker

```powershell
.\mvnw.cmd -B clean verify
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

El Dockerfile usa etapas separadas para compilar y ejecutar; el contenedor runtime no necesita Maven. Si quiere backend y frontend simultáneos, vea la opción `git worktree` del README.
