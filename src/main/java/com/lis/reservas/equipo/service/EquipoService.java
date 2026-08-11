package com.lis.reservas.equipo.service;

import com.lis.reservas.categoria.entity.Categoria;
import com.lis.reservas.categoria.repository.CategoriaRepository;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.equipo.dto.EquipoCreateRequest;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.dto.EquipoUpdateRequest;
import com.lis.reservas.equipo.dto.EstadoPatchRequest;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.mapper.EquipoMapper;
import com.lis.reservas.equipo.repository.EquipoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for {@link Equipo}.
 *
 * <p>Listing supports three independent, AND-combined filters driven by the
 * public {@code GET /api/v1/equipos} query parameters: {@code categoria}
 * (category name), {@code estado} (lifecycle state) and {@code search}
 * (free-text over the equipo nombre). Filters are optional and degrade to
 * broader matches when null/blank — implemented with JPA Specifications
 * composed dynamically, which keeps the generated SQL tight (no
 * {@code LIKE '%%%'} sentinels).
 *
 * <p>Creation and full update resolve the {@code idCategoria} to a managed
 * {@link Categoria} entity (the mapper deliberately ignores the association
 * so the service owns referential integrity). The estado-only patch is the
 * single narrow exception to the full-update contract.
 */
@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository equipoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EquipoMapper equipoMapper;

    /**
     * Paginated equipo listing with optional categoria / estado / search
     * filters. All parameters are optional.
     *
     * @param categoria case-insensitive category name filter; blank = ignored.
     * @param estado    {@link EstadoEquipo} name filter; blank = ignored.
     * @param search    free-text fragment matched against {@code nombre}
     *                  (case-insensitive {@code LIKE}); blank = ignored.
     * @param pageable  page request.
     */
    @Transactional(readOnly = true)
    public PagedResponse<EquipoResponse> findPaginated(String categoria, String estado,
                                                        String search, Pageable pageable) {
        Specification<Equipo> spec = Specification.where(null);

        if (categoria != null && !categoria.isBlank()) {
            final String wanted = categoria.toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.equal(cb.lower(root.get("categoria").get("nombre")), wanted));
        }
        if (estado != null && !estado.isBlank()) {
            final EstadoEquipo estadoEquipo = EstadoEquipo.valueOf(estado.trim().toUpperCase());
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("estado"), estadoEquipo));
        }
        if (search != null && !search.isBlank()) {
            final String fragment = search.toLowerCase();
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("nombre")), "%" + fragment + "%"));
        }

        Page<Equipo> page = equipoRepository.findAll(spec, pageable);
        return PagedResponse.from(page.map(equipoMapper::toResponse));
    }

    /**
     * @throws RecursoNoEncontradoException if no equipo has that id.
     */
    @Transactional(readOnly = true)
    public EquipoResponse findById(Integer id) {
        return equipoRepository.findById(id)
                .map(equipoMapper::toResponse)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Equipo no encontrado: " + id));
    }

    /**
     * Create a new equipo. The {@code idCategoria} must reference an existing
     * categoria; the estado defaults to {@code DISPONIBLE} (set by the
     * entity's {@code @PrePersist}).
     */
    @Transactional
    public EquipoResponse create(EquipoCreateRequest request) {
        Categoria categoria = resolveCategoria(request.idCategoria());
        Equipo equipo = equipoMapper.toEntity(request);
        equipo.setCategoria(categoria);
        return equipoMapper.toResponse(equipoRepository.save(equipo));
    }

    /**
     * Full update: all non-optional fields are overwritten. The
     * {@code idCategoria} is re-resolved (it may move the equipo to a
     * different categoria). estado is preserved.
     */
    @Transactional
    public EquipoResponse update(Integer id, EquipoUpdateRequest request) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Equipo no encontrado: " + id));
        Categoria categoria = resolveCategoria(request.idCategoria());
        equipoMapper.updateEntity(request, equipo);
        equipo.setCategoria(categoria);
        return equipoMapper.toResponse(equipoRepository.save(equipo));
    }

    /**
     * Narrow estado transition: only the {@code estado} field changes.
     */
    @Transactional
    public EquipoResponse patchEstado(Integer id, EstadoPatchRequest request) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Equipo no encontrado: " + id));
        equipo.setEstado(request.estado());
        return equipoMapper.toResponse(equipoRepository.save(equipo));
    }

    private Categoria resolveCategoria(Integer idCategoria) {
        return categoriaRepository.findById(idCategoria)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Categoria no encontrada: " + idCategoria));
    }
}
