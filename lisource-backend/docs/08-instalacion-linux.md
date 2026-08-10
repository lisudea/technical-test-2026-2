# Instalación en Ubuntu/Debian

[Inicio](../../README.md) · [Windows](07-instalacion-windows.md) · [Troubleshooting](13-troubleshooting.md)

Instale Git y un JDK 21 desde los repositorios de su distribución compatible. Node no es necesario para este worktree. Docker Engine, Postman web/desktop y `postgresql-client` son opcionales según vaya a ejecutar integración, colección o SQL.

```bash
git --version
java --version
docker --version  # solo si lo instaló
git clone <URL> lisource
cd lisource
git switch 1021805193-reto2
cd lisource-backend
cp .env.example .env
# edite .env sin versionarlo
./mvnw spring-boot:run
```

En otra terminal, `curl http://localhost:8080/actuator/health`. Base nueva: `01-estructura.sql`, luego `02-semilla.sql` y finalmente `03-pruebas.sql`. **No ejecute `01-estructura.sql` sobre información que deba conservar: recrea el esquema.**

```bash
./mvnw -B clean verify
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

En Linux el wrapper es `./mvnw` y puede necesitar `chmod +x mvnw`; en Windows se usa `mvnw.cmd`. Testcontainers requiere que el daemon Docker sea accesible por el usuario.

