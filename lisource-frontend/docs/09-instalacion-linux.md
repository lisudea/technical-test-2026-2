# Instalación en Linux / Bash

[Inicio](../../README.md) · [Windows](08-instalacion-windows.md) · [Troubleshooting](13-troubleshooting.md)

## Qué instalar

| Clasificación | Herramienta | Uso | Fuente |
|---|---|---|---|
| Obligatorio | Git | clonar ramas | [Git para Linux](https://git-scm.com/download/linux) |
| Obligatorio | Node.js 22 + npm | frontend | [Node.js](https://nodejs.org/en/download) |
| Obligatorio | navegador actualizado | usar/evaluar UI | Chrome, Firefox o equivalente |
| Sistema completo | JDK 21 | backend | distribución OpenJDK 21 |
| Sistema completo | acceso a Supabase | SQL Editor | proyecto entregado |
| Opcional | Docker Engine | imagen local | [Docker Engine](https://docs.docker.com/engine/install/) |
| Opcional | Postman | pruebas de API | [Postman](https://www.postman.com/downloads/) |
| Solo infraestructura | Terraform y AWS CLI | OIDC/IAM | sitios oficiales |

No necesita Maven global: use `mvnw`. Tampoco necesita `psql` si ejecuta 01, 02 y 03 desde Supabase SQL Editor.

```bash
git --version
java --version       # sistema completo
node --version
npm --version
docker --version     # opcional
terraform version    # solo infraestructura
aws --version        # solo infraestructura
```

## Preparar variables

Descargue `backend.txt` y `frontend.txt` de la carpeta privada de Drive. Renómbrelos `.env` y ubíquelos respectivamente en `lisource-backend/.env` de Reto 2 y `lisource-frontend/.env` de Reto 3. Compare únicamente los nombres con `.env.example`, nunca publique valores y confirme con `git status --short` que Git no muestra esos archivos.

## Ejecutar el sistema completo

### Terminal 1: backend

```bash
git clone --branch 1021805193-reto2 https://github.com/lisudea/technical-test-2026-2.git lisource-backend-reto2
cd lisource-backend-reto2/lisource-backend
# coloque backend.txt renombrado como .env aquí
```

En Supabase SQL Editor ejecute en orden:

1. `src/main/resources/db/01-estructura.sql` — reconstruye las 20 tablas/políticas y es destructivo.
2. `src/main/resources/db/02-semilla.sql` — carga catálogos/configuración con operaciones idempotentes.
3. `src/main/resources/db/03-pruebas.sql` — carga escenarios demo tras la reconstrucción.

```bash
./mvnw spring-boot:run
```

Mantenga abierta la terminal. Compruebe `http://localhost:8080/actuator/health` y `http://localhost:8080/swagger-ui/index.html`.

### Terminal 2: frontend

```bash
git clone --branch 1021805193-reto3 https://github.com/lisudea/technical-test-2026-2.git lisource-frontend-reto3
cd lisource-frontend-reto3/lisource-frontend
# coloque frontend.txt renombrado como .env aquí
npm ci
npm run dev
```

Mantenga abierta esta terminal y visite `http://localhost:3000`.

## Validaciones y Docker opcional

```bash
npm test
npm run lint
npm run build
docker build -t lisource-frontend .
docker run --rm -p 3000:3000 lisource-frontend
```

El build incorpora variables `VITE_*` al cliente; no use secretos. La imagen escucha en `3000`.

## Comprobación funcional

- base de datos preparada;
- backend, health y Swagger accesibles;
- frontend cargando;
- login y catálogo funcionales;
- reserva futura creada;
- conflicto superpuesto presentado como `409` comprensible.
