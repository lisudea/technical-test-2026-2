package udea.lis.equipos_reservas_api.dto;

import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;

// Esta clase representa la respuesta que se enviará al cliente cuando se solicite información sobre un equipo. Contiene los 
// atributos relevantes del equipo, como su id, nombre, número de serie, categoría y estado.
public class EquipoResponse {

    private Long id;
    private String nombre;
    private String numeroSerie;
    private CategoriaEquipo categoria;
    private EstadoEquipo estado;

    public EquipoResponse() {
    }

    public EquipoResponse(Long id, String nombre, String numeroSerie, CategoriaEquipo categoria, EstadoEquipo estado) {
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
