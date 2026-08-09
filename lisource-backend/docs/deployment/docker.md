# Ejecución con Docker

Desde la raíz:

```powershell
docker compose config
docker compose up --build
```

Compose usa Supabase; no levanta ni modifica un PostgreSQL local. Requiere `Backend/.env` completo. El frontend se construye con `VITE_API_URL=http://localhost:8080/api/v1`, URL vista por el navegador, y queda en `http://localhost:3000`. Backend: `http://localhost:8080`; health: `/actuator/health`.

Las imágenes son multi-stage y ejecutan usuarios sin privilegios. `.dockerignore` excluye `.env`, resultados de build y dependencias locales. No pase secretos como `ARG`; el backend los recibe solo al ejecutar.

En la verificación del 7 de agosto de 2026 el cliente Docker estaba instalado, pero el daemon de Docker Desktop no estaba disponible. Por eso se validó el archivo con `docker compose config` cuando fue posible y los builds normales, pero no debe asumirse que las imágenes fueron construidas hasta repetir estos comandos con el daemon activo.
