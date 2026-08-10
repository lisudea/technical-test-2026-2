package com.lis.backend.service;

import com.lis.backend.dto.EquipoRequest;
import com.lis.backend.dto.EquipoResponse;
import com.lis.backend.entity.CategoriaEquipo;
import com.lis.backend.entity.Equipo;
import com.lis.backend.entity.EstadoEquipo;
import com.lis.backend.exception.BadRequestException;
import com.lis.backend.exception.ConflictException;
import com.lis.backend.exception.ResourceNotFoundException;
import com.lis.backend.repository.EquipoRepository;
import com.lis.backend.repository.ReservaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EquipoService {

        private final EquipoRepository equipoRepository;
        private final ReservaRepository reservaRepository;

        public EquipoService(
                EquipoRepository equipoRepository,
                ReservaRepository reservaRepository
        ) {
        this.equipoRepository = equipoRepository;
        this.reservaRepository = reservaRepository;
        }

        public EquipoResponse crear(EquipoRequest request) {


        String codigo = request.codigo().trim().toUpperCase();

        if (equipoRepository.existsByCodigoIgnoreCase(codigo)) {
                throw new ConflictException(
                        "Ya existe un equipo con el código indicado."
                );
        }


        String numeroSerie = request.numeroSerie().trim();

        if (equipoRepository.existsByNumeroSerieIgnoreCase(numeroSerie)) {
                throw new ConflictException(
                        "Ya existe un equipo con el número de serie/MAC indicado."
                );
        }


        validarEstadoAdministrativo(request.estado());

        Equipo equipo = new Equipo();

        equipo.setCodigo(codigo);
        equipo.setNombre(request.nombre().trim());
        equipo.setNumeroSerie(numeroSerie);
        equipo.setCategoria(request.categoria());
        equipo.setEstado(request.estado());

        Equipo guardado = equipoRepository.save(equipo);

        return toResponse(guardado);
        }


        @Transactional(readOnly = true)
        public Page<EquipoResponse> listar(
                String search,
                CategoriaEquipo categoria,
                EstadoEquipo estado,
                Pageable pageable
        ) {


        List<Equipo> equipos = equipoRepository.findAll();


        if (search != null && !search.isBlank()) {

                String texto = search.trim().toLowerCase();

                equipos = equipos.stream()
                        .filter(equipo ->
                                contiene(equipo.getCodigo(), texto)
                                        || contiene(equipo.getNombre(), texto)
                                        || contiene(equipo.getNumeroSerie(), texto)
                        )
                        .collect(Collectors.toList());
        }


        if (categoria != null) {

                equipos = equipos.stream()
                        .filter(equipo ->
                                equipo.getCategoria() == categoria
                        )
                        .collect(Collectors.toList());
        }


        if (estado != null) {

                equipos = equipos.stream()
                        .filter(equipo ->
                                equipo.getEstado() == estado
                        )
                        .collect(Collectors.toList());
        }

        Comparator<Equipo> comparator =
                Comparator.comparing(
                        Equipo::getNombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                );

        if (pageable.getSort().isSorted()) {

                pageable.getSort().forEach(order -> {

                // Actualmente usamos nombre como orden principal.
                // Se puede ampliar después para código, categoría, etc.
                });

            // Orden predeterminado por nombre
                equipos.sort(comparator);

        } else {
                equipos.sort(comparator);
        }

        // Paginación manual
        int total = equipos.size();

        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();

        int inicio = Math.min(page * size, total);
        int fin = Math.min(inicio + size, total);

        List<Equipo> equiposPagina =
                equipos.subList(inicio, fin);

        // Convertir a DTO
        List<EquipoResponse> respuestas = equiposPagina.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(
                respuestas,
                pageable,
                total
        );
        }


        @Transactional(readOnly = true)
        public EquipoResponse obtener(Long id) {

        Equipo equipo = findEntity(id);

        return toResponse(equipo);
        }


        public EquipoResponse actualizar(
                Long id,
                EquipoRequest request
        ) {

        Equipo equipo = findEntity(id);

        String nuevoCodigo =
                request.codigo().trim().toUpperCase();

        String nuevoNumeroSerie =
                request.numeroSerie().trim();


        if (!equipo.getCodigo().equalsIgnoreCase(nuevoCodigo)
                && equipoRepository.existsByCodigoIgnoreCase(nuevoCodigo)) {

                throw new ConflictException(
                        "Ya existe otro equipo con el código indicado."
                );
        }


        if (!equipo.getNumeroSerie().equalsIgnoreCase(nuevoNumeroSerie)
                && equipoRepository.existsByNumeroSerieIgnoreCase(nuevoNumeroSerie)) {

                throw new ConflictException(
                        "Ya existe otro equipo con el número de serie/MAC indicado."
                );
        }

        validarEstadoAdministrativo(request.estado());

        equipo.setCodigo(nuevoCodigo);
        equipo.setNombre(request.nombre().trim());
        equipo.setNumeroSerie(nuevoNumeroSerie);
        equipo.setCategoria(request.categoria());
        equipo.setEstado(request.estado());

        Equipo actualizado =
                equipoRepository.save(equipo);

        return toResponse(actualizado);
        }


        public void eliminar(Long id) {

        Equipo equipo = findEntity(id);

        // No permitir eliminar equipos que tengan reservas
        if (reservaRepository.countByEquipoId(id) > 0) {

                throw new ConflictException(
                        "No se puede eliminar un equipo que tiene " +
                        "historial de reservas. Puede cambiar su estado " +
                        "a EN_MANTENIMIENTO."
                );
        }

        equipoRepository.delete(equipo);
        }


        @Transactional(readOnly = true)
        public Equipo findEntity(Long id) {

        return equipoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Equipo no encontrado: " + id
                        )
                );
        }

        /**
     * Convertir entidad a respuesta.
     *
     * El estado visual se determina así:
     *
     * EN_MANTENIMIENTO -> EN_MANTENIMIENTO
     * Reserva activa    -> RESERVADO
     * En cualquier otro caso -> DISPONIBLE
     */
        private EquipoResponse toResponse(Equipo equipo) {

        LocalDateTime ahora = LocalDateTime.now();

        String estadoVisual;

        // Si está en mantenimiento, siempre tiene prioridad.
        if (equipo.getEstado() == EstadoEquipo.EN_MANTENIMIENTO) {

                estadoVisual = "EN_MANTENIMIENTO";

        } else {

                /*
             * Verificamos si existe una reserva activa.
             *
             * Si el método contarReservaVigente() está correctamente
             * definido en ReservaRepository, el equipo aparecerá
             * automáticamente como RESERVADO.
             */
                boolean reservadoAhora = false;

                try {

                reservadoAhora =
                        reservaRepository.contarReservaVigente(
                                equipo.getId(),
                                ahora
                        ) > 0;

                } catch (Exception e) {

                /*
                 * Si existe un problema con la consulta de reservas,
                 * no queremos que GET /api/equipos se caiga con un 500.
                 *
                 * En ese caso mostramos el estado administrativo.
                 */
                reservadoAhora = false;
                }

                if (reservadoAhora) {
                estadoVisual = "RESERVADO";
                } else {
                estadoVisual = "DISPONIBLE";
                }
        }

        return new EquipoResponse(
                equipo.getId(),
                equipo.getCodigo(),
                equipo.getNombre(),
                equipo.getNumeroSerie(),
                equipo.getCategoria(),
                equipo.getEstado(),
                estadoVisual
        );
        }

        /**
     * Validar que RESERVADO no pueda asignarse manualmente.
     *
     * El usuario solamente puede registrar:
     *
     * DISPONIBLE
     * EN_MANTENIMIENTO
     *
     * RESERVADO se genera automáticamente cuando
     * existe una reserva activa.
     */
        private void validarEstadoAdministrativo(
                EstadoEquipo estado
        ) {

        if (estado == EstadoEquipo.RESERVADO) {

                throw new BadRequestException(
                        "El estado RESERVADO se asigna automáticamente " +
                        "cuando existe una reserva activa. " +
                        "Al crear o editar un equipo use DISPONIBLE " +
                        "o EN_MANTENIMIENTO."
                );
        }
        }

        /**
     * Comprobar si un texto contiene otro texto
     */
        private boolean contiene(
                String valor,
                String texto
        ) {

        return valor != null
                && valor.toLowerCase().contains(texto);
        }
}