# Docker backend

Desde `lisource-backend`:

```bash
docker build -t lisource-backend .
docker run --rm --env-file .env -p 8080:8080 lisource-backend
```

El Dockerfile multi-stage compila con Maven/JDK y ejecuta el artefacto en una imagen runtime. No incorpore `.env` a la imagen.
