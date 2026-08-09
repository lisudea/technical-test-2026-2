package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.dto.CategoriaResumenDTO;
import co.edu.lab.sistemas.dto.EquipoRequestDTO;
import co.edu.lab.sistemas.dto.EquipoResponseDTO;
import co.edu.lab.sistemas.enums.EstadoFisico;
import co.edu.lab.sistemas.exception.ConflictException;
import co.edu.lab.sistemas.exception.ResourceNotFoundException;
import co.edu.lab.sistemas.model.Categoria;
import co.edu.lab.sistemas.model.Equipo;
import co.edu.lab.sistemas.repository.CategoriaRepository;
import co.edu.lab.sistemas.repository.EquipoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

// Servicio para la gestion completa de equipos de laboratorio.
@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository equipoRepository;
    private final CategoriaRepository categoriaRepository;

    @Transactional
    public EquipoResponseDTO crear(EquipoRequestDTO request) {
        Categoria categoria = buscarCategoriaPorId(request.categoriaId());
        validarIdentificadorDisponible(request.identificador(), null);

        Equipo equipo = new Equipo();
        equipo.setNombre(request.nombre());
        equipo.setIdentificador(request.identificador());
        equipo.setCategoria(categoria);
        equipo.setEstadoFisico(request.estadoFisico());

        return toResponseDTO(equipoRepository.save(equipo));
    }

    @Transactional
    public EquipoResponseDTO actualizar(Long id, EquipoRequestDTO request) {
        Equipo equipo = buscarEquipoPorIdEntidad(id);
        Categoria categoria = buscarCategoriaPorId(request.categoriaId());
        validarIdentificadorDisponible(request.identificador(), id);

        equipo.setNombre(request.nombre());
        equipo.setIdentificador(request.identificador());
        equipo.setCategoria(categoria);
        equipo.setEstadoFisico(request.estadoFisico());

        return toResponseDTO(equipoRepository.save(equipo));
    }

    @Transactional(readOnly = true)
    public EquipoResponseDTO buscarPorId(Long id) {
        return toResponseDTO(buscarEquipoPorIdEntidad(id));
    }

    @Transactional(readOnly = true)
    public Page<EquipoResponseDTO> listar(Pageable pageable, Long categoriaId, EstadoFisico estadoFisico) {
        Specification<Equipo> specification = Specification.where(EquipoSpecification.conCategoriaId(categoriaId))
                .and(EquipoSpecification.conEstadoFisico(estadoFisico));

        return equipoRepository.findAll(specification, pageable)
                .map(this::toResponseDTO);
    }

    private Categoria buscarCategoriaPorId(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La categoria con id " + id + " no existe"));
    }

    private Equipo buscarEquipoPorIdEntidad(Long id) {
        return equipoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El equipo con id " + id + " no existe"));
    }

    private void validarIdentificadorDisponible(String identificador, Long idEquipoActual) {
        boolean duplicado = idEquipoActual == null
                ? equipoRepository.existsByIdentificador(identificador)
                : equipoRepository.existsByIdentificadorAndIdNot(identificador, idEquipoActual);

        if (duplicado) {
            throw new ConflictException("Ya existe un equipo con el identificador " + identificador);
        }
    }

    private EquipoResponseDTO toResponseDTO(Equipo equipo) {
        Categoria categoria = equipo.getCategoria();
        CategoriaResumenDTO categoriaResumen = new CategoriaResumenDTO(
                categoria.getId(),
                categoria.getNombre()
        );

        return new EquipoResponseDTO(
                equipo.getId(),
                equipo.getNombre(),
                equipo.getIdentificador(),
                categoriaResumen,
                equipo.getEstadoFisico(),
                equipo.getFechaRegistro(),
                equipo.getFechaActualizacion()
        );
    }
}