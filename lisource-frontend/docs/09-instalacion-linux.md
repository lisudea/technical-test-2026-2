# Instalación en Ubuntu/Debian

[Inicio](../../README.md) · [Windows](08-instalacion-windows.md) · [Troubleshooting](13-troubleshooting.md)

## Prerrequisitos

| Herramienta | Para qué se usa | Fuente oficial |
|---|---|---|
| Git | clonar/cambiar ramas | [Git Linux](https://git-scm.com/download/linux) |
| Node.js 22 + npm | instalar, probar y ejecutar | [Node.js](https://nodejs.org/en/download) |
| Docker Engine | imagen local; opcional | [Docker Engine](https://docs.docker.com/engine/install/) |
| Postman | probar API; opcional | [Postman](https://www.postman.com/downloads/) |

Verifique Node 22 en vez de asumir la versión del repositorio de la distribución.

```bash
git --version
node --version
npm --version
git clone <URL> lisource
cd lisource
git switch 1021805193-reto3
cd lisource-frontend
# descargue frontend.txt desde Drive y guárdelo como .env aquí
npm ci
npm run dev
```

Configuración de evaluación: [Drive](https://drive.google.com/drive/folders/1acpvFdobQNkvmGB5Q5b15UoR8ZOfqfgI?usp=sharing) → `frontend.txt` → `lisource-frontend/.env`. Abra `http://localhost:3000`. Para validar:

```bash
npm test
npm run lint
npm run build
docker build -t lisource-frontend .
docker run --rm -p 3000:3000 lisource-frontend
```

No necesita `psql` ni JDK para el frontend. Si ejecuta sistema completo, use otra carpeta/worktree para Reto 2 e inicie DB/backend antes. En Linux las variables temporales usan `export`; `.env` sigue siendo la opción reproducible y está ignorado.
