package udea.lis.equipos_reservas_api.model;

// Esta clase representa los posibles estados de una reserva. Es un enum, lo que significa que tiene un conjunto fijo
// de valores posibles. Es usada en la clase Reserva para indicar si una reserva está activa, finalizada o cancelada.
// Su intención es que si una reserva es cancelada, no se elimine de la base de datos, sino que se cambie su estado a cancelada,
// para poder llevar un historial de las reservas. El estado FINALIZADA se asigna automáticamente cuando la fecha de devolución
// de una reserva activa ya pasó.
public enum EstadoReserva {
    ACTIVA,
    FINALIZADA,
    CANCELADA
}