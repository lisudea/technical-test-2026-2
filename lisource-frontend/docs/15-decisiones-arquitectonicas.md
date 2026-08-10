# Decisiones arquitectónicas frontend

[Inicio](../../README.md) · [Arquitectura](02-arquitectura-frontend.md)

| Decisión | Alternativa | Por qué encaja en LISource | Trade-off | Cuándo elegiría la alternativa |
|---|---|---|---|---|
| React 19 + TypeScript | JavaScript sin tipos / otro framework | composición por componentes y contratos de API tipados | toolchain y compilación | equipo estandarizado en Angular/Vue o página mínima |
| TanStack Router | rutas manuales/React Router | rutas de archivo tipadas y coherentes con TanStack Start | convención y generación de árbol | SPA simple ya estandarizada en otra librería |
| TanStack Query | `fetch` distribuido por componentes | cache, estados, invalidación y mutaciones centralizadas | capa adicional y disciplina de query keys | pocos requests estáticos sin estado remoto complejo |
| Cliente HTTP central | `fetch` directo por vista | Bearer, refresh, retry y Problem Details en un punto | abstracción propia a mantener | SDK generado completo desde OpenAPI |
| Access token en memoria + refresh HttpOnly | access en `localStorage` | reduce persistencia de un token robable por XSS | refresh al recargar y dependencia de cookie | cliente no navegador con secure storage nativo |
| i18next + catálogos | strings duplicados/condicionales | seis idiomas con paridad de claves comprobable | mantenimiento de traducciones | producto monolingüe sin requisito futuro |
| Cards responsive + tabla | tabla completa móvil | conserva acciones y lectura en 320–768 px | dos representaciones del mismo dato | datasets densos para usuarios desktop exclusivamente |
| Tailwind + Radix UI | CSS ad hoc / framework monolítico | estilos consistentes y primitives accesibles | clases extensas y dependencia de primitives | design system corporativo ya implementado |
| React Hook Form + Zod | validación manual | esquema y errores coherentes en formularios | dos librerías adicionales | formulario trivial sin reglas compartidas |
| STOMP invalida queries | fusionar eventos manualmente | recupera estado autoritativo tras eventos | request adicional tras evento | cargas masivas donde se necesite aplicar deltas optimizados |
| Barras CSS en Top 5 | Recharts en esa vista | visual simple sin complejidad innecesaria | menos capacidades analíticas | series múltiples, ejes, tooltip y accesibilidad gráfica avanzada |
| Vercel | hosting tradicional | build/deploy/CDN adecuados al frontend | dependencia del proveedor | runtime/red privada/control del servidor |
| GitHub Actions + CodeQL/Trivy | build/deploy manual | validación repetible, SAST e imagen escaneada | tiempo de pipeline | prototipo no desplegado |
| AWS OIDC | access keys estáticas | credenciales temporales y trust por rama | configuración IAM/Terraform inicial | plataforma con identidad federada equivalente |

Estas decisiones describen el código actual. No se afirma uso activo de Recharts en Top 5 solo porque la dependencia y un componente base existen.
