package udea.lis.equipos_reservas_api.dto;

import udea.lis.equipos_reservas_api.model.EstadoReserva;

import java.time.LocalDateTime;
// Esta clase representa la respuesta que se enviará al cliente cuando se solicite información sobre una reserva. Contiene los
// atributos relevantes de la reserva, como su id, fechas de reserva y devolución, estado, equipo y usuario asociados.
public class ReservaResponse {

    private Long id;
    private LocalDateTime fechaReserva;
    private LocalDateTime fechaDevolucion;
    private EstadoReserva estado;
    private EquipoResumen equipo;
    private UsuarioResumen usuario;

    public ReservaResponse() {
    }

    public ReservaResponse(Long id, LocalDateTime fechaReserva, LocalDateTime fechaDevolucion,
                           EstadoReserva estado, EquipoResumen equipo, UsuarioResumen usuario) {
        this.id = id;
        this.fechaReserva = fechaReserva;
        this.fechaDevolucion = fechaDevolucion;
        this.estado = estado;
        this.equipo = equipo;
        this.usuario = usuario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDateTime fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public LocalDateTime getFechaDevolucion() {
        return fechaDevolucion;
    }

    public void setFechaDevolucion(LocalDateTime fechaDevolucion) {
        this.fechaDevolucion = fechaDevolucion;
    }

    public EstadoReserva getEstado() {
        return estado;
    }

    public void setEstado(EstadoReserva estado) {
        this.estado = estado;
    }

    public EquipoResumen getEquipo() {
        return equipo;
    }

    public void setEquipo(EquipoResumen equipo) {
        this.equipo = equipo;
    }

    public UsuarioResumen getUsuario() {
        return usuario;
    }

    public void setUsuario(UsuarioResumen usuario) {
        this.usuario = usuario;
    }

    // Clases internas para representar un resumen del equipo y del usuario asociados a la reserva. 
    // Estas clases contienen solo los atributos relevantes para la respuesta de la API, evitando exponer
    //  información sensible o innecesaria.
    public static class EquipoResumen {
        private Long id;
        private String nombre;

        public EquipoResumen() {
        }

        public EquipoResumen(Long id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }
    }

    // Clase interna para representar un resumen del usuario asociado a la reserva.
    public static class UsuarioResumen {
        private String nombre;
        private String correo;

        public UsuarioResumen() {
        }

        public UsuarioResumen(String nombre, String correo) {
            this.nombre = nombre;
            this.correo = correo;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public String getCorreo() {
            return correo;
        }

        public void setCorreo(String correo) {
            this.correo = correo;
        }
    }
}
