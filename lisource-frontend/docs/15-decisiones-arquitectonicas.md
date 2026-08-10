# Decisiones arquitectónicas frontend

[Inicio](../../README.md) · [Arquitectura](02-arquitectura-frontend.md) · [API y estado](04-api-y-estado-remoto.md)

Las decisiones siguientes describen código y configuración existentes. Cada una distingue beneficio, coste y posible evolución.

## 1. React, TypeScript y TanStack frente a una interfaz estática

- **Contexto:** el producto tiene autenticación, rutas protegidas, filtros, paginación, formularios, mutaciones y datos que cambian.
- **Decisión:** usar React 19 y TypeScript con TanStack Start/Router para composición y navegación tipada.
- **Razón:** permite reutilizar estados y componentes, mantener contratos explícitos y representar flujos públicos, autenticados y administrativos.
- **Alternativa considerada:** HTML/JavaScript estático o una página monolítica.
- **Por qué no se eligió:** trasladaría manualmente routing, estado y composición a código ad hoc; no reduce la complejidad real del dominio.
- **Consecuencias positivas:** rutas de archivo, componentes testeables, feedback inmediato y refactors asistidos por tipos.
- **Limitaciones:** toolchain mayor, hidratación/SSR y necesidad de controlar dependencias.
- **Posible evolución:** lazy loading por ruta y límites de error más granulares si el bundle o la cantidad de módulos crece.

## 2. TanStack Query para estado remoto

- **Contexto:** equipos, reservas, perfil y estadísticas pertenecen al servidor y pueden cambiar entre vistas o por STOMP.
- **Decisión:** modelarlos como queries/mutations con keys, cache e invalidación; conservar filtros, formularios y overlays como estado local o derivado.
- **Razón:** evita duplicar datos remotos en múltiples stores y hace explícitos loading, error, success y refetch.
- **Alternativa considerada:** `fetch` en cada componente o copiar todas las respuestas a un store global.
- **Por qué no se eligió:** produciría lógica repetida, riesgo de cache divergente y sincronización manual.
- **Consecuencias positivas:** reintentos e invalidación coherentes; STOMP solo señala cambios y luego se recupera el estado autoritativo.
- **Limitaciones:** exige disciplina de query keys y puede hacer un request adicional tras cada evento.
- **Posible evolución:** ajustar stale times, paginación anticipada o aplicar deltas solo si la escala justifica su complejidad.

## 3. Frontend separado del acceso a Supabase

- **Contexto:** las reglas de roles, reservas, auditoría y transacciones no pueden confiarse al navegador.
- **Decisión:** todo acceso funcional pasa por servicios REST/STOMP hacia Spring Boot; no se distribuyen credenciales de base de datos.
- **Razón:** concentra autorización, validaciones y transacciones en un límite controlado.
- **Alternativa considerada:** usar el SDK de Supabase directamente desde cada vista.
- **Por qué no se eligió:** duplicaría reglas, expondría una superficie de datos mayor y dificultaría garantizar el `409` transaccional.
- **Consecuencias positivas:** contrato API auditable, cliente desacoplado del esquema físico y secretos fuera del bundle.
- **Limitaciones:** un salto de red adicional y dependencia de disponibilidad del backend.
- **Posible evolución:** generar un SDK TypeScript desde OpenAPI sin eliminar el límite backend.

## 4. Cliente HTTP central y Problem Details

- **Contexto:** todos los módulos necesitan base URL, Bearer, cookies, refresh, parseo de error y cancelación coherentes.
- **Decisión:** centralizar esas reglas en `http-client.ts` y mapear errores a `ApiError`.
- **Razón:** evita que cada vista implemente seguridad y códigos HTTP de forma distinta.
- **Alternativa considerada:** `fetch` directo por ruta o un SDK generado completo.
- **Por qué no se eligió:** `fetch` disperso duplica lógica; el SDK no estaba integrado al alcance actual.
- **Consecuencias positivas:** retry único tras refresh, manejo específico de `409` y errores consistentes.
- **Limitaciones:** abstracción propia que debe mantenerse alineada con OpenAPI.
- **Posible evolución:** sustituir gradualmente servicios por cliente generado y conservar interceptores de sesión.

## 5. Access token en memoria y refresh HttpOnly

- **Contexto:** el cliente requiere Bearer para requests y continuidad de sesión sin persistir un token sensible accesible a scripts.
- **Decisión:** conservar el access token corto en memoria; delegar refresh token a cookie HttpOnly del backend y limpiar sesión al fallar el refresh.
- **Razón:** reduce la exposición persistente ante XSS y evita leer el refresh desde JavaScript.
- **Alternativa considerada:** access token largo en `localStorage` o sesión completamente server-side.
- **Por qué no se eligió:** `localStorage` amplía el impacto de XSS; una sesión distinta cambiaría el contrato implementado por el backend.
- **Consecuencias positivas:** menor persistencia del access y renovación transparente una vez.
- **Limitaciones:** depende de CORS/cookies correctos y puede requerir refresh tras recarga.
- **Posible evolución:** reforzar CSP, telemetría de sesión y rotación/alertas sin cambiar la frontera HttpOnly.

## 6. Rol activo y autorización duplicada solo para UX

- **Contexto:** un usuario puede tener `USUARIO` y `ADMINISTRADOR`, pero debe operar con un contexto de privilegio explícito.
- **Decisión:** seleccionar/cambiar rol mediante API, mapearlo a `USER`/`ADMIN` en el cliente y filtrar navegación.
- **Razón:** reduce acciones accidentales y hace visible el contexto operativo.
- **Alternativa considerada:** activar todos los privilegios simultáneamente o confiar solo en menús ocultos.
- **Por qué no se eligió:** los privilegios simultáneos reducen claridad; ocultar UI nunca es un control de seguridad.
- **Consecuencias positivas:** navegación simple y menor privilegio efectivo por sesión.
- **Limitaciones:** existe mapeo entre vocabularios backend/frontend y cada cambio requiere renovar contexto.
- **Posible evolución:** compartir tipos generados y añadir una pantalla explícita de permisos si crece el modelo RBAC.

## 7. i18next y textos centralizados

- **Contexto:** el bonus exige español/inglés y la implementación incluye seis idiomas.
- **Decisión:** claves semánticas, catálogos JSON y selector persistido con pruebas de paridad.
- **Razón:** evita condicionales por idioma y facilita detectar claves ausentes.
- **Alternativa considerada:** strings en componentes o duplicar componentes por idioma.
- **Por qué no se eligió:** genera divergencia, traducciones incompletas y cambios repetidos.
- **Consecuencias positivas:** ES/EN/FR/PT/DE/IT comparten estructura y el idioma se cambia sin recargar rutas.
- **Limitaciones:** toda nueva clave requiere actualizar seis catálogos; paridad no garantiza calidad lingüística.
- **Posible evolución:** extracción automática, revisión profesional y formatos plurales más ricos.

## 8. Cards responsive, tabla administrativa y primitives accesibles

- **Contexto:** inventario y acciones deben funcionar desde 320 px hasta escritorio.
- **Decisión:** cards en anchos estrechos, tabla cuando existe espacio, navegación Sheet y overlays Radix limitados al viewport.
- **Razón:** una tabla densa no conserva legibilidad ni acciones en móvil.
- **Alternativa considerada:** tabla con scroll horizontal para todos los anchos o vistas móviles completamente separadas.
- **Por qué no se eligió:** el scroll oculta contexto y las vistas separadas duplican lógica.
- **Consecuencias positivas:** reflow, controles alcanzables y primitives con manejo de foco/teclado.
- **Limitaciones:** dos representaciones visuales de algunos datos y necesidad de auditorías manuales.
- **Posible evolución:** pruebas visuales automatizadas, auditoría con lector de pantalla y virtualización si el volumen crece.

## 9. Vercel, Render y Supabase

- **Contexto:** frontend, backend y datos tienen necesidades operativas diferentes dentro del alcance de una prueba técnica.
- **Decisión:** Vercel sirve el frontend, Render ejecuta la API y Supabase proporciona PostgreSQL/servicios asociados.
- **Razón:** separación clara, despliegues especializados y bajo coste de operación para el alcance.
- **Alternativa considerada:** una VM o plataforma única para todo.
- **Por qué no se eligió:** exigiría más operación, certificados, redes, backups y escalado manual.
- **Consecuencias positivas:** CDN/build del frontend y ciclos de despliegue independientes.
- **Limitaciones:** CORS/cookies entre dominios, dependencia de tres proveedores y cold starts posibles.
- **Posible evolución:** observabilidad unificada, ambientes preview y migración a una plataforma común si los requisitos operativos lo exigen.

## 10. GitHub Actions, Terraform y AWS OIDC/IAM

- **Contexto:** el pipeline necesita demostrar identidad segura sin almacenar access keys permanentes.
- **Decisión:** Terraform declara proveedor OIDC y roles IAM restringidos por audiencia/rama; Actions solicita credenciales STS temporales.
- **Razón:** reduce secretos de larga duración y deja infraestructura de identidad reproducible.
- **Alternativa considerada:** access key/secret en GitHub o configuración IAM manual no versionada.
- **Por qué no se eligió:** las claves requieren rotación y amplían el impacto de filtraciones; lo manual deriva entre ambientes.
- **Consecuencias positivas:** trust auditable y credenciales efímeras.
- **Limitaciones:** configuración IAM inicial y necesidad de proteger estado/planes Terraform.
- **Posible evolución:** políticas mínimas por artefacto o proveedor si aparecen tareas AWS reales.

> AWS no aloja LISource: en la implementación actual solo participa en identidad OIDC/IAM de CI/CD. El workflow frontend despliega en Vercel y no ejecuta `terraform apply`.
