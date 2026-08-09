package udea.lis.equipos_reservas_api.model;

// Importamos las clases necesarias para poder usar JPA y mapear esta clase a una tabla en la base de datos. Esta 
// dependencia esta en el archivo pom.xml.
import jakarta.persistence.*;

@Entity //Le dice a la base de datos que esta clase es una entidad y que se debe crear una tabla para ella
@Table(name = "equipos") //Le dice a la base de datos que el nombre de la tabla es "equipos"
public class Equipo{
    @Id // Este atributo id es la llave primaria de la tabla. El id lo asigna el cliente en el registro, por eso no tiene una
    // estrategia de generación automática (la columna ya no es autoincrementable en la base de datos).
    private Long id; //Lo definimos como Long porque es un número grande y no queremos que se nos acaben los ids

    @Column(name = "nombre", nullable = false, length = 100) //Este atributo representa una columna en la tabla de la base de 
    // datos. Le dice a la base de datos que el nombre no puede ser nulo y que tiene un tamaño máximo de 100 caracteres
    private String nombre;

    @Column(name = "numero_serie", nullable = false, unique = true) //Este atributo representa una columna en la tabla de la base 
    // de datos. Le dice a la base de datos que el número de serie no puede ser nulo y que debe ser único.
    private String numeroSerie;

    @Enumerated(EnumType.STRING) //Le dice a la base de datos que este atributo es un enum y que se debe guardar como un String 
    // en la base de datos. Esta clase viene de la clase EstadoEquipo.java y representa los posibles estados de un equipo
    //  (disponible, reservado o en mantenimiento)
    private EstadoEquipo estado;

    @Enumerated(EnumType.STRING) // Es el mismo caso que el atributo estado, pero este atributo representa la categoría del
    //  equipo (microcontroladores, VR o redes).
    private CategoriaEquipo categoria;


    // Definimos un constructor vacio, ya que la dependencia de JPA lo necesita para poder crear objetos de esta clase. 
    // Si no lo definimos, JPA no podrá crear objetos de esta clase y nos dara un error en runtime.
    public Equipo() {
    }

    // Creamos este constructor con parámetros para poder crear objetos de esta clase de manera más fácil y usarlo de test.
    //  Este constructor no es obligatorio, pero es recomendable tenerlo.
    public Equipo(String nombre, String numeroSerie, CategoriaEquipo categoria, EstadoEquipo estado) {
        this.nombre = nombre;
        this.numeroSerie = numeroSerie;
        this.categoria = categoria;
        this.estado = estado;
    }

    // Definimos los getters y setters para poder acceder a los atributos de esta clase desde otras clases.
    //  Esto es una buena práctica de programación orientada a objetos, ya que nos permite encapsular los atributos y controlar 
    // su acceso.
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

    public String getNumeroSerie() {
        return numeroSerie;
    }

    public void setNumeroSerie(String numeroSerie) {
        this.numeroSerie = numeroSerie;
    }

    public CategoriaEquipo getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaEquipo categoria) {
        this.categoria = categoria;
    }

    public EstadoEquipo getEstado() {
        return estado;
    }

    public void setEstado(EstadoEquipo estado) {
        this.estado = estado;
    }

    // Sobreescribimos el método toString() para poder imprimir los objetos de esta clase de manera más fácil y legible. Java ya 
    // tiene un método toString() por defecto, pero este no es muy legible, ya que nos suelta es una dirección en memoria
    //  y no nos sirve para imprimir los objetos de esta clase.
    public String toString() {
        return "Equipo{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", numeroSerie='" + numeroSerie + '\'' +
                ", categoria='" + categoria + '\'' +
                ", estado=" + estado +
                '}';
    }

}