# ADR 0002 — Validar el solape de reservas en la aplicación, no en MySQL

- **Estado**: Aceptado
- **Fecha**: 2026-08-09
- **Especulación de referencia**: [Spec 02 — Backend](../specs/02-backend-spec.md), [Spec 04 — Base de datos](../specs/04-database-spec.md)

## Contexto

La regla de negocio más crítica del sistema es: **dos reservas `activas` no
pueden solapar la misma franja horaria del mismo equipo**. La violación se
debe responder con `HTTP 409 Conflict`, no con un error genérico de BD.

La base de datos elegida es **MySQL 8** (por requisito del enunciado). La
pregunta de diseño es: ¿quién garantiza el no-solape, la base de datos con un
constraint nativo, o la aplicación con lógica transaccional?

En PostgreSQL existiría `EXCLUDE USING GIST` con `tsrange`, que permite
expresar exactamente "ninguna otra fila activa solapa esta franja" como un
constraint de integridad a nivel de BD. En MySQL 8 **no existe** ninguna
construcción equivalente: ni exclusion constraints, ni índices GIST, ni
rangos temporales nativos. Solo quedan `CHECK` (que no pueden referenciar
otras filas) y `UNIQUE` (que no expresa solape temporal).

## Decisión

Implementar la validación de solape **en la capa de aplicación**, dentro de
`ReservaService`, usando una consulta `SELECT ... FOR UPDATE` dentro de una
transacción serializable a nivel de la lógica de negocio:

```sql
SELECT id_reserva
FROM reservas
WHERE id_equipo = :idEquipo
  AND estado = 'activa'
  AND fecha_hora_inicio < :nuevaFin
  AND fecha_hora_fin > :nuevaInicio
FOR UPDATE;
```

El `FOR UPDATE` toma un candado pesimista sobre las filas de reservas activas
del equipo, de modo que dos peticiones concurrentes que intenten reservar la
misma franja se serializan: la primera pasa la validación e inserta; la
segunda, al re-leer bajo el candado, encuentra la nueva fila y se rechaza con
`ReservaEnConflictoException` → 409. El índice compuesto
`idx_reservas_conflicto (id_equipo, estado, fecha_hora_inicio, fecha_hora_fin)`
mantiene la consulta eficiente incluso con histórico crecido.

Adicionalmente, el servicio valida (antes de adquirir el candado):
`fecha_hora_inicio < fecha_hora_fin`, que `inicio` no esté en el pasado,
duración dentro del rango configurable (`reservas.min-duration`,
`reservas.max-duration`, por defecto 15 min y 8 h) y que el equipo esté en
estado `disponible`.

## Consecuencias

### Positivas

- **Garantía real de no-solape bajo concurrencia**: el candado pesimista
  serializa la validación+inserción, evitando la condición de carrera en la que
  dos peticiones pasan la validación a la vez y ambas insertan. Hay un test
  dedicado (`ReservaServiceTest`) que lanza dos hilos simultáneos sobre la
  misma franja y verifica que exactamente uno gana y el otro recibe 409.
- **Respuesta de dominio clara**: la excepción `ReservaEnConflictoException`
  se traduce a un RFC 7807 Problem Details con `status: 409` y un `detail`
  que nombra el equipo y la franja en conflicto, en vez de un error 500
  genérico de violación de constraint.
- **Independiente del motor**: si en el futuro se migra a PostgreSQL, el
  servicio puede reemplazar la lógica por un `EXCLUDE` constraint y el
  contrato HTTP no cambia. La validación es de aplicación, así que la
  decisión de migrar motor no toca los controladores ni los clientes.
- **Mensajes de error útiles para el usuario**: al estar en la aplicación,
  podemos incluir el identificador del equipo, el correo del usuario y la
  franja conflictiva en el `detail`, algo que un constraint de BD nunca
  podría.

### Negativas

- **Rango de candado más amplio que un constraint**: el `FOR UPDATE` candado
  las filas activas del equipo, no solo la franja. Para la carga esperada
  (reservas puntuales, no miles por minuto) es irrelevante, pero es
  limitación teórica frente a un `EXCLUDE` GIST que solo candad el rango
  exacto.
- **Correctitud depende de la transacción**: la lógica debe ejecutarse dentro
  de un método `@Transactional`; olvidar la anotación rompería la garantía. Es
  un riesgo de mantenimiento, mitigado con tests de concurrencia que fallarían
  si la transacción se pierde.
- **No protege contra accesos a la BD fuera de la app**: si otra herramienta
  escribiera reservas directamente en la tabla sin pasar por el servicio,
  podría violar el no-solape. A esta escala es aceptable; en un sistema más
  grande se mitigaría restringiendo el acceso de escritura a la app.

## Alternativas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| `EXCLUDE USING GIST` nativo | No existe en MySQL 8; requeriría migrar a PostgreSQL |
| `UNIQUE` sobre `(id_equipo, fecha_hora_inicio)` | No expresa solape, solo igualdad exacta de inicio; no previene solapes parciales |
| `CHECK` constraint | En MySQL 8 los `CHECK` no pueden referenciar otras filas; solo validan la fila actual |
| Validación optimista (sin `FOR UPDATE`) | Sufre la condición de carrera: dos lecturas concurrentes ven "sin conflicto" y ambas insertan |
| Validación solo en memoria / sin BD | Se pierde al reiniciar; no escala a múltiples instancias del backend |

## Notas

- El candado pesimista es coherente con la baja contención esperada: dos
  reservas del mismo equipo solapándose en el mismo milisegundo son un evento
  raro, no el caso común. Si la contención creciera, convendría evaluar
  `SELECT ... FOR UPDATE NOWAIT` o `SKIP LOCKED` para fallar rápido en vez de
  esperar, pero no es necesario a esta escala.
- El índice `idx_reservas_conflicto` está ordenado para que la consulta de
  solape sea un index range scan, no un full scan.
