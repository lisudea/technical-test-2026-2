# ADR 0007 — Sanciones como filas con vigencia derivada, no como un flag en `usuarios`

- **Estado**: Aceptado
- **Fecha**: 2026-08-10
- **Especificación de referencia**: [Spec 04 — Base de datos](../specs/04-database-spec.md)
- **Relacionada**: [ADR 0006 — El préstamo en columna aparte](0006-prestamo-en-columna-aparte-de-la-reserva.md)

## Contexto

Un administrador necesita poder impedir temporalmente que alguien reserve:
devolvió un equipo dañado, no se presentó dos veces, lo que sea. La
restricción vence sola pasado un plazo.

La forma más corta de escribir eso es una columna booleana en `usuarios`,
quizá con una fecha al lado. La pregunta es qué se pierde con esa forma.

Lo que el laboratorio necesita saber después no es solo *si* alguien está
sancionado, sino **quién lo sancionó, por qué, desde cuándo, hasta cuándo, y
si se levantó antes de tiempo y quién lo decidió**. Un booleano no carga nada
de eso, y el histórico se pierde en el momento en que la sanción vence y
alguien pone el flag en `false`.

Además hay una pregunta de mantenimiento: si «vigente» es un valor
almacenado, algo tiene que **vencerlo**. Un job programado, un `@Scheduled`,
un cron. Y ese algo puede no correr.

## Decisión

Una tabla `sanciones` donde cada fila es una sanción con su ventana de
validez, y **«vigente» es una consulta, no un estado guardado**:

```sql
estado = 'ACTIVA' AND fecha_fin > NOW()
```

El `estado` distingue solo dos hechos que sí son decisiones humanas:

- `ACTIVA` — la sanción se mantiene.
- `LEVANTADA` — un administrador la levantó **antes** de tiempo, y queda
  registrado quién y por qué.

No existe un estado `EXPIRADA`. Que el plazo se haya cumplido se deriva de la
fecha.

El índice `idx_sanciones_vigencia (id_usuario, estado, fecha_fin)` sigue el
orden exacto del predicado, porque esa comprobación corre en **cada intento
de reserva**.

## Consecuencias

- Nada tiene que barrer la tabla para mantener los datos honestos. Una
  sanción vencida deja de coincidir con la consulta sin que nadie la toque.
  No hay job que pueda no correr.
- El histórico completo sobrevive: las sanciones no se borran nunca.
- «Vencida» y «levantada» quedan distinguidas, que son cosas distintas: una
  es que se cumplió el plazo, la otra es que alguien decidió perdonar.
- El backend calcula el campo `vigente` y lo envía en la respuesta, en lugar
  de dejar que cada cliente lo re-derive de las fechas crudas —cada uno con
  su propio error de zona horaria.
- Cuesta una tabla y un `JOIN` más que un booleano. A cambio, la pregunta
  «¿por qué no puedo reservar?» tiene respuesta, y el rechazo puede nombrar
  el motivo y la fecha de fin en vez de un «no puedes» sin salida.
- Se rechaza **acumular** sanciones: alguien ya sancionado no puede recibir
  otra solapada, porque haría ambigua la pregunta «¿cuándo vuelvo a estar
  libre?». Para extender, se levanta la vigente y se crea una nueva.

## Alternativas descartadas

**`usuarios.sancionado_hasta DATETIME NULL`.** Es tentador: una columna, cero
`JOIN`s, y la vigencia también sería derivada. Se descartó porque no guarda
motivo, ni autor, ni histórico: al vencer o levantarse, la información
desaparece. Y la disciplina es exactamente el terreno donde alguien va a
preguntar, tres meses después, por qué se tomó una decisión.

**Un flag booleano con job de expiración.** Añade una pieza móvil que puede
fallar en silencio, y cuando falla el sistema miente en la dirección más
cara: gente bloqueada de más. La vigencia derivada no tiene ese modo de fallo.

**Borrar la sanción al levantarla.** Simplifica las consultas y destruye
justo lo que hace útil el registro: que se levantó antes de tiempo, quién lo
decidió y con qué justificación.

## Notas

- El rechazo por sanción es `403`, no `409`. Nada en la franja pedida está en
  conflicto; simplemente el solicitante no puede reservar ahora. Un `409`
  mandaría al usuario a buscar otro horario que no existe.
- La sanción automática por no-show no extiende una sanción vigente: sería
  alargar un castigo por la espalda de quien lo impuso.
- El repositorio expone `findVigentesByUsuario` devolviendo una `List`, y no
  un `Optional` detrás de un método `default`. Los métodos `default` de una
  interfaz de repositorio **se mockean como cualquier otro** en pruebas
  unitarias: el helper devolvería `null` en vez de delegar en su `@Query`.
