package udea.lis.equipos_reservas_api.model;

// Importamos las clases necesarias para poder usar JPA y mapear esta clase a una tabla en la base de datos. Esta
// dependencia esta en el archivo pom.xml.
import jakarta.persistence.*;
// Importamos la clase LocalDateTime para poder usarla como tipo de dato en los atributos de esta clase. Nos será útil para
//  guardar la fecha y hora de la reserva y la devolución del equipo.
import java.time.LocalDateTime;

@Entity //Le dice a la base de datos que esta clase es una entidad y que se debe crear una tabla para ella
@Table(name = "reservas") //Le dice a la base de datos que el nombre de la tabla es "reservas"
public class Reserva {
    @Id // Este atributo id es la llave primaria de la tabla
    @GeneratedValue(strategy = GenerationType.IDENTITY) //Le dice a la base de datos que el id es autoincrementable
    private Long id; //Lo definimos como Long porque es un número grande y no queremos que se nos acaben los ids

    @Column(name = "fecha_reserva", nullable = false) //Este atributo representa una columna en la tabla de la base de datos.
    // Le dice a la base de datos que la fecha de reserva no puede ser nula.
    private LocalDateTime fechaReserva;

    @Column(name = "fecha_devolucion", nullable = false) //Este atributo representa una columna en la tabla de la base de datos.
    // Le dice a la base de datos que la fecha de devolución no puede ser nula.
    private LocalDateTime fechaDevolucion;

    @ManyToOne // Le dice a la base de datos que este atributo es una relación de muchos a uno con la clase Usuario. Esto significa que
    //  un usuario puede tener muchas reservas, pero una reserva solo puede pertenecer a un usuario. Esta relación se representa 
    // en la base de datos con una llave foránea.
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne // Es el mismo caso que el atributo usuario, pero este atributo es una relación de muchos a uno con la clase Equipo. 
    // Esto significa que un equipo puede tener muchas reservas (no al mismo tiempo, sino a lo largo del tiempo), 
    // pero una reserva solo puede pertenecer a un equipo.
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    @Enumerated(EnumType.STRING) // Le dice a la base de datos que este atributo es un enum y que se debe guardar como un String 
    // en la base de datos. Esta clase viene de la clase EstadoReserva.java y representa los posibles estados de una reserva 
    // (activa o cancelada). Su intención es que si una reserva es cancelada, no se elimine de la base de datos, sino que se 
    // cambie su estado a cancelada, para poder llevar un historial de las reservas.
    private EstadoReserva estado;

    // Definimos un constructor vacio, ya que la dependencia de JPA lo necesita para poder crear objetos de esta clase.
    // Si no lo definimos, JPA no podrá crear objetos de esta clase y nos dara un error en runtime.
    public Reserva() {
    }

    // Creamos este constructor con parámetros para poder crear objetos de esta clase de manera más fácil y usarlo de test.
    // Este constructor no es obligatorio, pero es recomendable tenerlo.
    public Reserva(LocalDateTime fechaReserva, LocalDateTime fechaDevolucion, Usuario usuario, Equipo equipo) {
        this.fechaReserva = fechaReserva;
        this.fechaDevolucion = fechaDevolucion;
        this.usuario = usuario;
        this.equipo = equipo;
        this.estado = EstadoReserva.ACTIVA;
    }

    // Definimos los getters y setters para poder acceder a los atributos de esta clase desde otras clases.
    // Esto es una buena práctica de programación orientada a objetos, ya que nos permite encapsular los atributos y controlar
    // su acceso.
    
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

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Equipo getEquipo() {
        return equipo;
    }

    public void setEquipo(Equipo equipo) {
        this.equipo = equipo;
    }

    // Sobreescribimos el método toString() para poder imprimir los objetos de esta clase de manera más fácil y legible.
    // Java ya tiene un método toString() por defecto, pero este no es muy legible, ya que nos suelta una dirección en memoria
    // y no nos sirve para imprimir los objetos de esta clase.
    public String toString() {
        return "Reserva{" +
                "id=" + id +
                ", fechaReserva=" + fechaReserva +
                ", fechaDevolucion=" + fechaDevolucion +
                ", usuario=" + usuario +
                ", equipo=" + equipo +
                ", estado=" + estado +
                '}';
    }
}
