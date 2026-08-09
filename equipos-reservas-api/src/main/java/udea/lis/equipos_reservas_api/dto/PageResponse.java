package udea.lis.equipos_reservas_api.dto;

import org.springframework.data.domain.Page;

// Se importan las clases necesarias para trabajar con la paginación.
import java.util.List;
import java.util.function.Function; // La interfaz Function representa una 
// función que toma un argumento y devuelve un resultado.

public class PageResponse<T> {
    // Esta clase representa una respuesta paginada que se enviará al cliente cuando se solicite información de manera paginada.
    private List<T> contenido;
    private int pagina;
    private int tamano;
    private long totalElementos;
    private int totalPaginas;

    public PageResponse() {
    }

    public PageResponse(List<T> contenido, int pagina, int tamano, long totalElementos, int totalPaginas) {
        this.contenido = contenido;
        this.pagina = pagina;
        this.tamano = tamano;
        this.totalElementos = totalElementos;
        this.totalPaginas = totalPaginas;
    }
    // Este método estático permite crear un objeto PageResponse a partir de un objeto Page de Spring Data JPA y una función de 
    // mapeo. La función de mapeo se utiliza para convertir los elementos de la página original a otro tipo de objeto, lo que 
    // permite personalizar la respuesta enviada al cliente. El método toma un objeto Page<E> y una función Function<E, T> como 
    // parámetros, y devuelve un objeto PageResponse<T> con los elementos mapeados y la información de paginación correspondiente.
    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        List<T> contenido = page.getContent().stream().map(mapper).toList();
        return new PageResponse<>(contenido, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    // Getters y setters para los atributos de la clase PageResponse.
    public List<T> getContenido() {
        return contenido;
    }

    public void setContenido(List<T> contenido) {
        this.contenido = contenido;
    }

    public int getPagina() {
        return pagina;
    }

    public void setPagina(int pagina) {
        this.pagina = pagina;
    }

    public int getTamano() {
        return tamano;
    }

    public void setTamano(int tamano) {
        this.tamano = tamano;
    }

    public long getTotalElementos() {
        return totalElementos;
    }

    public void setTotalElementos(long totalElementos) {
        this.totalElementos = totalElementos;
    }

    public int getTotalPaginas() {
        return totalPaginas;
    }

    public void setTotalPaginas(int totalPaginas) {
        this.totalPaginas = totalPaginas;
    }
}
