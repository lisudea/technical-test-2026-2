package udea.lis.equipos_reservas_api.model;

// Esta clase representa los posibles estados de un equipo. Es un enum, lo que significa que tiene un conjunto fijo 
// de valores posibles. Es usada en la clase Equipo para indicar si un equipo está disponible, reservado o en mantenimiento.
public enum EstadoEquipo {
    DISPONIBLE,
    RESERVADO,
    MANTENIMIENTO
}
