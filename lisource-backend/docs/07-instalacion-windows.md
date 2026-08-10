# Instalación en Windows

[Inicio](../../README.md) · [Linux](08-instalacion-linux.md) · [Troubleshooting](13-troubleshooting.md)

## Prerrequisitos

| Herramienta | Clasificación | Uso | Verificación |
|---|---|---|---|
| Git | obligatoria | ramas/worktrees | `git --version` |
| JDK 21 | obligatoria backend | Spring Boot/Maven Wrapper | `java --version` |
| Node.js 22 + npm | obligatoria solo sistema completo | frontend | `node --version`, `npm --version` |
| Navegador | obligatorio | Swagger y frontend | abrir URL local |
| Docker Desktop | desarrollo opcional | Testcontainers/build de imagen | `docker --version` |
| Postman | opcional | 59 solicitudes importables | abrir aplicación/web |
| `psql` | opcional | ejecutar SQL; Supabase SQL Editor lo reemplaza | `psql --version` |
| Terraform 1.15.x + AWS CLI | solo infraestructura | validar OIDC y consultar STS | `terraform version`, `aws --version` |

No instale Maven global: `mvnw.cmd` descarga/usa la versión del proyecto.

## Backend local

```powershell
git clone --branch 1021805193-reto2 --single-branch https://github.com/lisudea/technical-test-2026-2.git lisource-reto2
cd lisource-reto2\lisource-backend
.\mvnw.cmd spring-boot:run
```

Antes de iniciar, descargue `backend.txt` de la carpeta privada de Drive, renómbrelo `.env` y guárdelo en `lisource-reto2/lisource-backend/.env`. Active **Extensiones de nombre de archivo** en Explorer y confirme que no sea `.env.txt`. Compare solo los nombres con `.env.example`; `git status --short` no debe mostrarlo.

En una base nueva ejecute `01-estructura.sql`, `02-semilla.sql`, `03-pruebas.sql` desde Supabase SQL Editor. `01` es destructivo. Mantenga la terminal backend abierta y compruebe health/Swagger en el puerto 8080.

## Sistema completo y validación

Clone `1021805193-reto3` en otra carpeta, coloque `frontend.txt` como `lisource-frontend/.env`, ejecute `npm ci` y `npm run dev`; mantenga las dos terminales abiertas.

```powershell
.\mvnw.cmd -B clean verify
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

Docker es alternativo a la ejecución con wrapper y usa `.env` solo en runtime; nunca lo incorpore a la imagen.
