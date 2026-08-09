# Despliegue de backend en Render

`render.yaml` define un Web Service Docker con raíz `Backend`, health `/actuator/health` y perfil `prod`.

1. Crear Blueprint desde el repositorio y revisar que Root Directory sea `Backend`.
2. Configurar `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `APP_FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` y `GOOGLE_CLIENT_ID` como secretos/valores del entorno.
3. Confirmar `DB_SSLMODE=require`, `COOKIE_SECURE=true` y `COOKIE_SAME_SITE=None`.
4. Usar en CORS la URL HTTPS exacta de Vercel; para previews adicionales, enumerar cada origen permitido.
5. Desplegar y comprobar `/actuator/health`. Render suministra `PORT` automáticamente.
6. Configurar en Vercel `VITE_API_URL=https://<servicio-render>/api/v1` y el mismo Client ID público de Google.

El servicio honra forwarded headers, graceful shutdown y no publica Swagger por defecto en producción. Supabase debe aceptar la conexión desde Render y conservar exactamente el esquema de 20 tablas.
