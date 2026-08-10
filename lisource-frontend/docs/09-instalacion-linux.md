# Instalación en Ubuntu/Debian

[Inicio](../../README.md) · [Windows](08-instalacion-windows.md) · [Troubleshooting](13-troubleshooting.md)

Instale Git y Node.js 22 desde una fuente compatible/administrador de versiones; verifique en vez de asumir el paquete por defecto de la distribución. Docker Engine es opcional.

```bash
git --version
node --version
npm --version
git clone <URL> lisource
cd lisource
git switch 1021805193-reto3
cd lisource-frontend
cp .env.example .env
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para validar:

```bash
npm test
npm run lint
npm run build
docker build -t lisource-frontend .
docker run --rm -p 3000:3000 lisource-frontend
```

No necesita `psql` ni JDK para el frontend. Si ejecuta sistema completo, use otra carpeta/worktree para Reto 2 e inicie DB/backend antes. En Linux las variables temporales usan `export`; `.env` sigue siendo la opción reproducible y está ignorado.
