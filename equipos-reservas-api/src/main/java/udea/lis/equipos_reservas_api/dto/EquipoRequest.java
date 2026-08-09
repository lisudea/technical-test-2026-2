package udea.lis.equipos_reservas_api.dto;

//Se importan las anotaciones de validación de Jakarta Bean Validation para asegurar que los datos recibidos en la solicitud 
// cumplan con ciertos criterios antes de ser procesados.
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;

public class EquipoRequest {

    // El id es solicitado en el registro según el requerimiento (ID único). Al ser asignado por el cliente, no puede ser nulo.
    @NotNull(message = "El id del equipo es obligatorio")
    private Long id;

    // Se definen los atributos de la clase EquipoRequest, que representan los datos necesarios para crear o actualizar un equipo.
    @NotBlank(message = "El nombre del equipo es obligatorio")
    private String nombre;

    @NotBlank(message = "El número de serie es obligatorio")
    private String numeroSerie;

    @NotNull(message = "La categoría del equipo es obligatoria")
    private CategoriaEquipo categoria;

    @NotNull(message = "El estado del equipo es obligatorio")
    private EstadoEquipo estado;

    // Se definen constructores, getters y setters para la clase EquipoRequest. 
    public EquipoRequest() {
    }

    public EquipoRequest(Long id, String nombre, String numeroSerie, CategoriaEquipo categoria, EstadoEquipo estado) {
        this.id = id;
        this.nombre = nombre;
        this.numeroSerie = numeroSerie;
        this.categoria = categoria;
        this.estado = estado;
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
}
