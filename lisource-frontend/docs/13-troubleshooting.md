# Troubleshooting frontend

[Inicio](../../README.md) · [Windows](08-instalacion-windows.md) · [Linux](09-instalacion-linux.md)

| Síntoma | Causa/comprobación | Acción |
|---|---|---|
| `npm ci` falla | Node/lockfile/archivo bloqueado | use Node 22, cierre Vite y repita; no borre lockfile |
| API responde 404 | URL sin `/api/v1` o endpoint | corrija `VITE_API_URL` y reinicie build/dev |
| CORS/cookie | origen, HTTPS, SameSite/Secure | ajuste backend; no intente resolver con `no-cors` |
| Google no aparece/falla | client ID/origen autorizado | configure ID público y origins en Google |
| sesión entra en loop | refresh inválido/401 repetido | el cliente reintenta una vez; limpie cookie y vuelva a login |
| `409` al reservar | solapamiento real | consulte horario y cambie selección; no es fallo de red |
| datos mock inesperados | `VITE_DATA_MODE=mock` | use `api` y reinicie Vite |
| deep link Vercel | routing/deploy | confirme configuración SSR y ruta directamente |
| texto/acción recortada | ancho/zoom/idioma | capture viewport y reporte componente; no agregue overflow global |
| Render tarda | cold start | espere health y reintente con timeout razonable |

Nunca copie al reporte `.env`, token, cookie o Google credential. Use estado HTTP, Problem Details y correlation ID sanitizado.
