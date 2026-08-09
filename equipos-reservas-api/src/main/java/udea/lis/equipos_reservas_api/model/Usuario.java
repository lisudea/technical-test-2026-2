package udea.lis.equipos_reservas_api.model;

// Importamos las clases necesarias para poder usar JPA y mapear esta clase a una tabla en la base de datos. Esta
// dependencia esta en el archivo pom.xml.
import jakarta.persistence.*;

@Entity //Le dice a la base de datos que esta clase es una entidad y que se debe crear una tabla para ella
@Table(name = "usuarios") //Le dice a la base de datos que el nombre de la tabla es "usuarios"
public class Usuario {
    @Id // Este atributo id es la llave primaria de la tabla
    @GeneratedValue(strategy = GenerationType.IDENTITY) //Le dice a la base de datos que el id es autoincrementable
    private Long id; //Lo definimos como Long porque es un número grande y no queremos que se nos acaben los ids

    @Column(name = "nombre", nullable = false, length = 100) //Este atributo representa una columna en la tabla de la base de datos.
    // Le dice a la base de datos que el nombre no puede ser nulo y que tiene un tamaño máximo de 100 caracteres
    private String nombre;

    @Column(name = "correo", nullable = false, unique = true) //Este atributo representa una columna en la tabla de la base de datos.
    // Le dice a la base de datos que el correo no puede ser nulo y que debe ser único.
    private String correo;

    // Definimos un constructor vacio, ya que la dependencia de JPA lo necesita para poder crear objetos de esta clase.
    // Si no lo definimos, JPA no podrá crear objetos de esta clase y nos dara un error en runtime.
    public Usuario() {
    }

    // Creamos este constructor con parámetros para poder crear objetos de esta clase de manera más fácil y usarlo de test.
    // Este constructor no es obligatorio, pero es recomendable tenerlo.
    public Usuario(String nombre, String correo) {
        this.nombre = nombre;
        this.correo = correo;
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

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getCorreo() {
        return correo;
    }

    // Sobreescribimos el método toString() para poder imprimir los objetos de esta clase de manera más fácil y legible.
    // Java ya tiene un método toString() por defecto, pero este no es muy legible, ya que nos suelta una dirección en memoria
    // y no nos sirve para imprimir los objetos de esta clase.
    public String toString() {
        return "Usuario{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", correo='" + correo + '\'' +
                '}';
    }

}