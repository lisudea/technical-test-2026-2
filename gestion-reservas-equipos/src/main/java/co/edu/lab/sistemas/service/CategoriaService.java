package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.dto.CategoriaRequestDTO;
import co.edu.lab.sistemas.dto.CategoriaResponseDTO;
import co.edu.lab.sistemas.exception.ConflictException;
import co.edu.lab.sistemas.exception.ResourceNotFoundException;
import co.edu.lab.sistemas.model.Categoria;
import co.edu.lab.sistemas.repository.EquipoRepository;
import co.edu.lab.sistemas.repository.CategoriaRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;

// Servicio para la gestión de categorías, incluyendo creación y listado.
@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final EquipoRepository equipoRepository;

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

    public CategoriaResponseDTO actualizar(Long id, CategoriaRequestDTO request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La categoria con id " + id + " no existe"));

        categoria.setNombre(request.nombre());
        categoria.setDescripcion(request.descripcion());

        Categoria actualizada = categoriaRepository.save(categoria);
        return toResponseDTO(actualizada);
    }

    public void eliminar(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La categoria con id " + id + " no existe"));

        if (equipoRepository.existsByCategoriaId(categoria.getId())) {
            throw new ConflictException("No se puede borrar la categoria porque tiene equipos asociados; reasigna o elimina esos equipos primero");
        }

        categoriaRepository.delete(categoria);
    }

    private CategoriaResponseDTO toResponseDTO(Categoria categoria) {
        return new CategoriaResponseDTO(
                categoria.getId(),
                categoria.getNombre(),
                categoria.getDescripcion()
        );
    }
}