package udea.lis.equipos_reservas_api.model;

// Esta clase representa los posibles estados de una reserva. Es un enum, lo que significa que tiene un conjunto fijo
// de valores posibles. Es usada en la clase Reserva para indicar si una reserva está activa o cancelada. Su intención
// es que si una reserva es cancelada, no se elimine de la base de datos, sino que se cambie su estado a cancelada, para poder 
// llevar un historial de las reservas.
public enum EstadoReserva {
    ACTIVA,
    CANCELADA
}