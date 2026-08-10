# Instalación en Windows

[Inicio](../../README.md) · [Linux](09-instalacion-linux.md) · [Troubleshooting](13-troubleshooting.md)

## Prerrequisitos

| Herramienta | Para qué se usa | Instalación oficial | Verificación |
|---|---|---|---|
| Git | clonar/cambiar ramas | [Git for Windows](https://git-scm.com/download/win) | `git --version` |
| Node.js 22 + npm | instalar, probar y ejecutar | [Node.js](https://nodejs.org/en/download) | `node --version` / `npm --version` |
| Navegador moderno | evaluar UI/responsive | Chrome, Edge o Firefox actualizado | abrir DevTools |
| Docker Desktop | construir/ejecutar imagen; opcional | [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) | `docker version` |
| Postman | preparar/login/probar API; opcional | [Postman](https://www.postman.com/downloads/) | abrir la aplicación |

PowerShell viene con Windows. Para el sistema completo también necesita JDK 21 en Reto 2; el frontend por sí solo no lo usa.

```powershell
git --version
node --version
npm --version
docker --version # opcional
git clone <URL> lisource
cd lisource
git switch 1021805193-reto3
cd lisource-frontend
# Descargue frontend.txt desde Drive y guárdelo como .env en esta carpeta
npm ci
npm run dev
```

Configuración de evaluación: [Drive](https://drive.google.com/drive/folders/1acpvFdobQNkvmGB5Q5b15UoR8ZOfqfgI?usp=sharing) → descargue `frontend.txt` → renómbrelo `.env` → ubíquelo en `lisource-frontend/.env`. El archivo contiene `VITE_API_URL`, `VITE_DATA_MODE` y el client ID público cuando aplica. Abra `http://localhost:3000`. Para API real, backend debe estar en `8080` con CORS habilitado para ese origen.

```powershell
npm test
npm run lint
npm run build
docker build -t lisource-frontend .
docker run --rm -p 3000:3000 lisource-frontend
```

Los `ARG VITE_*` se fijan durante `docker build`; para producción páselos con `--build-arg`. La imagen runtime escucha en 3000.
