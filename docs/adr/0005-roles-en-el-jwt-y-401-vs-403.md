# ADR 0005 — Roles dentro del JWT, y 401 y 403 como respuestas distintas

- **Estado**: Aceptado
- **Fecha**: 2026-08-10
- **Especificación de referencia**: [Spec 02 — Backend](../specs/02-backend-spec.md)
- **Relacionada**: [ADR 0003 — Google SSO](0003-google-sso-en-vez-de-auth-propio.md)

## Contexto

Hasta este punto todo usuario autenticado tenía exactamente la misma
autoridad: si tenías un JWT válido, podías hacer todo lo que no fuera
público. El laboratorio, en cambio, tiene tres papeles reales:

- **Estudiante** — reserva equipos para sí mismo.
- **Auxiliar** — atiende el mostrador: valida entregas y devoluciones, marca
  no-shows y manda equipos a mantenimiento.
- **Administrador** — es dueño del catálogo, de los roles y de las sanciones.

Dos preguntas de diseño quedaban abiertas.

**Primera: ¿dónde vive el rol en tiempo de request?** Las opciones son
llevarlo como *claim* dentro del token, o consultarlo en la base de datos en
cada petición.

**Segunda: ¿qué respondemos cuando alguien autenticado no tiene permiso?**
La tentación es tratar todos los rechazos igual. Spring Security, si no se
configura explícitamente, hace justamente eso en este montaje: el rechazo
sale como `401`.

## Decisión

**El rol viaja como claim `rol` dentro del JWT.** `JwtAuthenticationFilter`
lo traduce a una `GrantedAuthority` (`ROLE_ADMIN`, `ROLE_AUXILIAR`,
`ROLE_ESTUDIANTE`), que es lo que hace funcionar a `hasRole(...)` y a
`@PreAuthorize`.

**401 y 403 significan cosas distintas y se responden distinto:**

| Código | Tipo RFC 7807 | Significado |
|---|---|---|
| `401` | `no-autenticado` | No sé quién eres: falta el token, expiró o es inválido |
| `403` | `acceso-denegado` | Sé perfectamente quién eres, y no puedes |

Esto exige **dos** piezas explícitas en `SecurityConfig`, no una:

```java
.authorizeHttpRequests(auth -> auth
    .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
    ...)
.exceptionHandling(eh -> eh
    .authenticationEntryPoint(problemDetailEntryPoint())      // 401
    .accessDeniedHandler(problemDetailAccessDeniedHandler())) // 403
```

## Consecuencias

**Del rol en el token:**

- No hay una consulta a la base por petición solo para resolver permisos. El
  filtro es puramente criptográfico.
- **Un cambio de rol se hace efectivo en el siguiente inicio de sesión.** Los
  tokens son stateless y no hay lista de revocación. La expiración de 30
  minutos acota la ventana de desactualización.
- Ese retraso es el precio directo de no consultar la base en cada request.
  Es aceptable aquí porque los roles cambian rara vez, y porque el peor caso
  es que alguien conserve un permiso 30 minutos de más, no que lo gane.
- La promoción se documenta en el README y se avisa en la interfaz al cambiar
  un rol, porque es la clase de detalle que hace pensar que la función está
  rota cuando en realidad está funcionando como se diseñó.

**Del 401 contra 403:**

- El cliente puede actuar distinto en cada caso, que es el punto: el frontend
  descarta la sesión en `401` y solo muestra el mensaje en `403`.
- Colapsarlos expulsaría a un administrador válido en cuanto tocara una
  pantalla sin permisos, y lo devolvería a un login que le entrega la misma
  identidad que acaba de ser rechazada. Un bucle.
- Registrar el `AccessDeniedHandler` **no es cosmético**. Sin él, el rechazo
  lo escribe la maquinaria de error del contenedor, que reenvía a `/error`;
  ese *dispatch* vuelve a entrar al filtro **sin** el
  `JwtAuthenticationFilter` (es un `OncePerRequestFilter`, y esos se saltan
  los dispatch de error por defecto), la petición parece anónima en el
  segundo pase y el `403` honesto termina reescrito como `401`.

## Alternativas descartadas

**Consultar el rol en base en cada petición.** El cambio de rol sería
inmediato, sin ventana de desactualización. Se descartó porque añade una
consulta por request a la ruta más caliente del sistema para resolver un dato
que cambia muy pocas veces al año. Si en el futuro hiciera falta revocación
inmediata, el cambio correcto es una lista de revocación o tokens de vida
corta con refresh, no consultar el rol en cada llamada.

**Un único código para todo rechazo.** Más simple de implementar y
estrictamente peor para el cliente: pierde la información que necesita para
decidir si tiene sentido reintentar autenticándose.

**Roles como tabla `usuario_roles` (varios roles por persona).** El modelo
del laboratorio es jerárquico y excluyente: nadie es auxiliar *y* estudiante
a la vez, y un administrador puede todo lo de un auxiliar. Un `ENUM` ordenado
expresa eso con una comparación (`rol.atLeast(...)`) en lugar de una consulta
con `JOIN` y una semántica de unión de permisos que aquí no aporta.

## Notas

- El orden de declaración del enum `Rol` **es** el orden de privilegio;
  `atLeast()` compara por `ordinal()`. Insertar un rol en medio cambia todas
  esas comparaciones: añadir al final, o revisar cada llamada.
- Un token con rol irreconocible degrada a `ESTUDIANTE`, nunca hacia arriba.
  Fallar hacia el privilegio sería una vulnerabilidad; fallar hacia el mínimo
  es, como mucho, una molestia.
- La distinción 401/403 solo se reproduce en un contenedor de servlets real.
  Las pruebas con MockMvc no ejecutan el reenvío a `/error`, así que estaban
  en verde mientras producción respondía mal. Los tests de regresión
  verifican el **cuerpo** de la respuesta, no solo el código, para fijar qué
  componente la produjo.
