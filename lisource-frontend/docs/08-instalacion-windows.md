# Instalación en Windows

[Inicio](../../README.md) · [Linux](09-instalacion-linux.md) · [Troubleshooting](13-troubleshooting.md)

Requiere Git, Node.js 22/npm y navegador moderno. PowerShell ya viene con Windows; Docker Desktop y Postman son opcionales.

```powershell
git --version
node --version
npm --version
docker --version # opcional
git clone <URL> lisource
cd lisource
git switch 1021805193-reto3
cd lisource-frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Configure `VITE_API_URL`, `VITE_DATA_MODE` y, si prueba Google, `VITE_GOOGLE_CLIENT_ID`; son valores públicos de build. Abra `http://localhost:3000`. Para API real, backend debe estar en `8080` con CORS habilitado para ese origen.

```powershell
npm test
npm run lint
npm run build
docker build -t lisource-frontend .
docker run --rm -p 3000:3000 lisource-frontend
```

Los `ARG VITE_*` se fijan durante `docker build`; para producción páselos con `--build-arg`. La imagen runtime escucha en 3000.
