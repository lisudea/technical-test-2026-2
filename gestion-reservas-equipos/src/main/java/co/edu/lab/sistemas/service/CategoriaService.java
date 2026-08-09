package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.dto.CategoriaRequestDTO;
import co.edu.lab.sistemas.dto.CategoriaResponseDTO;
import co.edu.lab.sistemas.model.Categoria;
import co.edu.lab.sistemas.repository.CategoriaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

// Servicio para la gestión de categorías, incluyendo creación y listado.
@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public CategoriaResponseDTO crear(CategoriaRequestDTO request) {
        Categoria categoria = new Categoria();
        categoria.setNombre(request.nombre());
        categoria.setDescripcion(request.descripcion());

        Categoria guardada = categoriaRepository.save(categoria);
        return toResponseDTO(guardada);
    }

    // Método para listar todas las categorías existentes.
    public List<CategoriaResponseDTO> listar() {
        return categoriaRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    private CategoriaResponseDTO toResponseDTO(Categoria categoria) {
        return new CategoriaResponseDTO(
                categoria.getId(),
                categoria.getNombre(),
                categoria.getDescripcion()
        );
    }
}