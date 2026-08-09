# ADR 0003 — Google SSO en vez de auth propia con passwords

- **Estado**: Aceptado
- **Fecha**: 2026-08-09
- **Especulación de referencia**: [Spec 02 — Backend](../specs/02-backend-spec.md) (sección Autenticación Google SSO)

## Contexto

El sistema necesita identificar a los usuarios que creen y cancelen reservas
(los endpoints de escritura requieren autenticación). Los usuarios finales son
estudiantes y docentes de la Universidad de Antioquia, que ya disponen de
cuentas institucionales Google Workspace con correo `@udea.edu.co`.

La decisión es entre:

- **Auth propia con contraseña**: una tabla `usuarios` con hash bcrypt, flujo
  de registro/login, reset de contraseña, bloqueo por intentos, etc.
- **Google OAuth 2.0 (SSO) delegado**: el frontend obtiene un `id_token` de
  Google Identity Services; el backend valida la firma del token contra las
  llaves públicas de Google, verifica `email_verified=true` y que el dominio
  sea `@udea.edu.co`, y emite su propio JWT de sesión.

El enunciado marca Google SSO como **bonus**, no como obligatorio. La base
sin bonus dejaría los endpoints de escritura abiertos. Aquí se documenta por
qué, dado que se implementa el bonus, se elige delegar a Google en vez de
construir auth propia.

## Decisión

Implementar **Google SSO** como único mecanismo de autenticación: el backend
valida el `id_token` de Google, aplica la restricción de dominio institucional
y emite un JWT propio firmado con una clave desde Secrets Manager. No se
almacenan contraseñas en ningún lugar del sistema.

Flujo:

1. El cliente (frontend en reto 3) obtiene un `id_token` con Google Identity
   Services tras el login del usuario en Google.
2. `POST /api/v1/auth/google` envía `{ "idToken": "..." }`.
3. `GoogleTokenValidator` valida firma y claims (`iss`, `aud`, `exp`,
   `email_verified`); `AuthService` verifica que `email` termine en
   `@udea.edu.co` (sino `DominioNoAutorizadoException` → 403).
4. Se hace upsert del `usuarios` por `correo` (la identidad natural) y se
   emite un JWT propio (~30 min) firmado con `auth.jwt.secret`.
5. Los endpoints protegidos se autentican vía `JwtAuthenticationFilter`, que
   extrae el Bearer token y popula el `SecurityContextHolder`.

## Consecuencias

### Positivas

- **Menor superficie de ataque**: no hay almacén de contraseñas que filtrar,
  no hay hashing que configurar, no hay reset de contraseña que implementar.
  Si se filtra la base de datos, no hay credenciales que comprometer.
- **Verificación de identidad delegada**: Google ya verificó el correo; el
  backend confía en `email_verified=true` y en el dominio institucional. No
  reusamos verificar lo que Google ya verificó.
- **Restricción institucional trivial**: la verificación `@udea.edu.co` es
  un `endsWith` sobre el claim `email`; cualquier intento con correo externo
  se rechaza con 403 (`DominioNoAutorizadoException`).
- **Sin gestión de contraseñas para el usuario**: un estudiante que ya usa su
  cuenta UdeA no necesita recordar otra contraseña para reservar un microcontrolador.
- **JWT propio permite control de sesión**: expiración, revocación futura vía
  lista negra, claims a medida — todo en nuestras manos sin depender de la
  caducidad del token de Google.

### Negativas

- **Dependencia de Google como IdP**: si Google tiene un incidente, el login
  se cae. Mitigado con el JWT propio de ~30 min: una vez emitido, las
  operaciones de reserva no dependen de Google hasta que el token caduque.
- **Requiere configurar OAuth Client**: hay que crear un client en Google
  Cloud Console con `client_id` y `client_secret`, y almacenar el
  `client_secret` en Secrets Manager (nunca en el repo). Es un paso de
  setup que la auth propia no tiene.
- **Sin modo offline para el login**: si no hay internet hacia Google, no se
  pueden emitir nuevos JWT. Aceptable para un sistema de laboratorio
  universitario que asume conectividad.
- **No es alcance del reto 2 sin el bonus**: el enunciado permite dejar la
  escritura abierta en la base. La decisión de implementar el bonus es un
  plus de evaluación, no un requisito.

## Alternativas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| Auth propia con bcrypt + JWT | Reimplementa verificación de identidad, reset de contraseña, bloqueo por intentos; superficie de ataque mayor sin valor añadido frente a Google SSO |
| Sesiones server-side (Spring Session + Redis) | Añade un componente (Redis) al stack; el JWT stateless es más simple a esta escala y suficiente |
| Solo `id_token` de Google sin JWT propio | Ata el ciclo de vida de la sesión a la caducidad del token de Google (1 h); no permite claims a medida ni revocación |
| Autenticación por API key | No identifica a un usuario individual, solo a un cliente; no sirve para auditar quién reservó qué |
