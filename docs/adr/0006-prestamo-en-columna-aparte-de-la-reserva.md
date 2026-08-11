# ADR 0006 — El préstamo físico en una columna aparte del estado de la reserva

- **Estado**: Aceptado
- **Fecha**: 2026-08-10
- **Especificación de referencia**: [Spec 04 — Base de datos](../specs/04-database-spec.md)
- **Relacionada**: [ADR 0002 — Validar el solape en la aplicación](0002-validar-solape-en-app-no-en-mysql.md)

## Contexto

El módulo del auxiliar necesita registrar algo que el sistema no guardaba en
ninguna parte: **qué pasó físicamente en el mostrador**. ¿Se entregó el
equipo? ¿Volvió? ¿La persona nunca apareció?

La reserva es una promesa; el préstamo es el hecho. La pregunta de diseño es
si ese hecho cabe dentro de la columna `reservas.estado`, que hoy vale
`ACTIVA` / `CANCELADA` / `COMPLETADA`.

La tentación es obvia: añadir `ENTREGADO` a ese mismo `ENUM`. Una sola
columna, un solo ciclo de vida, menos que explicar.

Pero `reservas.estado` no es un campo cualquiera. Es **lo que lee la consulta
de solape**:

```sql
WHERE r.estado = 'ACTIVA' AND r.fecha_hora_inicio < ? AND r.fecha_hora_fin > ?
```

Y lo que lee la view `estadisticas_equipos_top`, y lo que ordena el índice
`idx_reservas_conflicto`.

## Decisión

**Dos columnas ortogonales sobre la misma fila:**

- `estado` — la **reserva**: `ACTIVA` / `CANCELADA` / `COMPLETADA`. Es lo que
  ocupa la franja horaria.
- `estado_prestamo` — el **hecho físico**: `PENDIENTE` / `ENTREGADO` /
  `DEVUELTO` / `NO_RECLAMADO`.

Transiciones legales, todas propiedad exclusiva de `PrestamoService`:

```
PENDIENTE --entregar-----> ENTREGADO --devolver--> DEVUELTO
    |
    +------no-reclamado------------------------> NO_RECLAMADO
```

Los estados terminales son terminales: reentregar algo devuelto, o recibir
algo que nunca salió, se rechazan con `400` nombrando el estado que bloqueó
la acción.

## Consecuencias

- **Ni una sola consulta existente cambió de significado.** Todo lo que
  preguntaba `estado = 'ACTIVA'` sigue preguntando exactamente lo mismo: la
  validación de solape, la view de estadísticas y su índice quedaron intactos.
- Un equipo entregado sigue ocupando su franja, que es lo correcto: está
  fuera del laboratorio.
- Declarar un no-show **cancela** la reserva además de marcar
  `NO_RECLAMADO`, liberando la franja para otra persona. Una reserva que
  nadie reclamó no debería seguir bloqueando el equipo el resto de su turno.
- Cuesta una columna más y una explicación más en el modelo. Es el precio de
  no acoplar dos ciclos de vida que cambian por razones distintas.
- La migración `V10` rellena las reservas ya `COMPLETADA` como `DEVUELTO`
  (esas sí ocurrieron físicamente) y deja las `CANCELADA` en `PENDIENTE`: no
  se reetiquetan como no-shows, porque inventar una historia que el sistema
  nunca observó envenenaría las estadísticas.

## Alternativas descartadas

**Añadir `ENTREGADO` al `ENUM` de `estado`.** Habría obligado a cada
predicado `estado = 'ACTIVA'` a aprender un segundo valor equivalente a
"activo". Son al menos tres sitios —la consulta de solape, la view de
estadísticas y el índice compuesto— y el modo de fallo es el peor posible:
nada rompe, las consultas simplemente **dejan de ver filas en silencio** y el
sistema empieza a permitir dobles reservas. La regla de negocio más crítica
del sistema quedaría a merced de un `ENUM` que alguien amplió sin revisar sus
lectores.

**Una tabla `prestamos` aparte, con FK a `reservas`.** Es el modelo más
purista y sería la elección correcta si un préstamo pudiera existir sin
reserva, o si hubiera varios préstamos por reserva. Ninguna de las dos cosas
pasa: la relación es estrictamente 1 a 0..1. Un `JOIN` obligatorio en la
consulta de la agenda —la vista más caliente del módulo del auxiliar— a
cambio de ninguna capacidad nueva.

## Notas

- Los márgenes de tiempo (`reservas.prestamo.*`) no son burocracia. Entregar
  un equipo horas antes rompe en silencio la reserva siguiente, porque la
  validación de solape conoce **franjas reservadas**, no equipos que ya no
  están físicamente en el laboratorio. El margen para declarar un no-show
  existe para no sancionar a alguien atrapado en el tráfico dos minutos
  después de la hora.
- Las observaciones se **acumulan** (`entrega | devolución`) en lugar de
  sobrescribirse: las dos son parte del registro, y la segunda no debe borrar
  la primera.
- Quién entregó y quién recibió se toman del **token**, nunca del cuerpo de
  la petición. Una atribución que el cliente puede elegir no es atribución.
