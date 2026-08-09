package udea.lis.equipos_reservas_api.dto;

// Esta clase representa la respuesta que se enviará al cliente cuando se solicite información sobre los equipos más reservados.
// Contiene los atributos relevantes de cada equipo, como su id, nombre y la cantidad de reservas asociadas.
public class TopEquipoResponse {

    private Long equipoId;
    private String equipoNombre;
    private long cantidadReservas;

    public TopEquipoResponse() {
    }

    public TopEquipoResponse(Long equipoId, String equipoNombre, long cantidadReservas) {
        this.equipoId = equipoId;
        this.equipoNombre = equipoNombre;
        this.cantidadReservas = cantidadReservas;
    }

    public Long getEquipoId() {
        return equipoId;
    }

    public void setEquipoId(Long equipoId) {
        this.equipoId = equipoId;
    }

    public String getEquipoNombre() {
        return equipoNombre;
    }

    public void setEquipoNombre(String equipoNombre) {
        this.equipoNombre = equipoNombre;
    }

    public long getCantidadReservas() {
        return cantidadReservas;
    }

    public void setCantidadReservas(long cantidadReservas) {
        this.cantidadReservas = cantidadReservas;
    }
}
