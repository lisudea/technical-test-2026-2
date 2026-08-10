# Instalación en Ubuntu/Debian

[Inicio](../../README.md) · [Windows](07-instalacion-windows.md) · [Troubleshooting](13-troubleshooting.md)

## Prerrequisitos

| Herramienta | Para qué se usa | Fuente oficial |
|---|---|---|
| Git | clonar/cambiar ramas | [Git downloads](https://git-scm.com/download/linux) |
| JDK 21 | Spring Boot | [Eclipse Temurin Linux](https://adoptium.net/installation/linux/) |
| Node.js 22 + npm | Reto 3/sistema completo | [Node.js download](https://nodejs.org/en/download) |
| Docker Engine | Testcontainers e imágenes; opcional | [Docker Engine](https://docs.docker.com/engine/install/) |
| Postman | colección manual; opcional | [Postman Linux](https://www.postman.com/downloads/) |
| `postgresql-client` | `psql`; opcional si usa Supabase SQL Editor | [PostgreSQL downloads](https://www.postgresql.org/download/linux/) |

Git y JDK 21 son obligatorios para backend; Node 22 solo para el sistema completo. El proyecto incluye Maven Wrapper, por lo que no requiere Maven global.

```bash
git --version
java --version
docker --version  # solo si lo instaló
git clone <URL> lisource
cd lisource
git switch 1021805193-reto2
cd lisource-backend
cp .env.example .env
# sustituya esta copia por backend.txt descargado desde Drive y renombrado .env
./mvnw spring-boot:run
```

Configuración de evaluación: [Drive](https://drive.google.com/drive/folders/1acpvFdobQNkvmGB5Q5b15UoR8ZOfqfgI?usp=sharing) → descargue `backend.txt` → renómbrelo `.env` → ubíquelo en `lisource-backend/.env`. En otra terminal, `curl http://localhost:8080/actuator/health`. Base nueva: `01-estructura.sql`, luego `02-semilla.sql` y finalmente `03-pruebas.sql`. **No ejecute `01-estructura.sql` sobre información que deba conservar: recrea el esquema.**

```bash
./mvnw -B clean verify
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

En Linux el wrapper es `./mvnw` y puede necesitar `chmod +x mvnw`; en Windows se usa `mvnw.cmd`. Testcontainers requiere que el daemon Docker sea accesible por el usuario.
