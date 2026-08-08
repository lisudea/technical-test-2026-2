package com.lis.reservas.reserva.repository;

import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Repository for {@link Reserva}.
 *
 * <p>The overlap/conflict detection query {@link #findConflictingForUpdate}
 * is the critical path of the whole system. It runs inside the service-layer
 * {@code @Transactional} reservation creation, AFTER pre-validation, and
 * uses a {@link LockModeType#PESSIMISTIC_WRITE} lock so concurrent creators
 * targeting the same equipo serialize on that equipo's active-reserva rows
 * (the {@code idx_reservas_conflicto} index keeps the scan cheap). The
 * {@code @Lock} annotation makes Spring Data JPA emit {@code SELECT ... FOR
 * UPDATE}, satisfying both the spec's SQL requirement and the design's
 * explicit-lock decision.
 *
 * <p>Overlap predicate uses half-open intervals {@code [inicio, fin)}:
 * a new window {@code [ni, nf)} conflicts with an existing active window
 * {@code [ei, ef)} iff {@code ei < nf AND ef > ni}. Touching boundaries
 * (ni == ef) does NOT conflict — back-to-back reservations are allowed.
 */
@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Active reservations of an equipo that overlap {@code [inicio, fin)}.
     * Locked with {@code FOR UPDATE} for race-free conflict validation.
     *
     * @return conflicting active reservations; empty if the slot is free.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.equipo.idEquipo = :idEquipo
              AND r.estado = com.lis.reservas.reserva.entity.EstadoReserva.ACTIVA
              AND r.fechaHoraInicio < :fin
              AND r.fechaHoraFin > :inicio
            """)
    List<Reserva> findConflictingForUpdate(@Param("idEquipo") Integer idEquipo,
                                           @Param("inicio") OffsetDateTime inicio,
                                           @Param("fin") OffsetDateTime fin);

    Page<Reserva> findByUsuarioCorreo(String correo, Pageable pageable);

    Page<Reserva> findByEquipoIdEquipo(Integer idEquipo, Pageable pageable);

    /**
     * Reservations of a usuario optionally filtered by estado, newest first.
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.usuario.correo = :correo
              AND (:estado IS NULL OR r.estado = :estado)
            """)
    Page<Reserva> findByUsuarioCorreoAndEstado(@Param("correo") String correo,
                                               @Param("estado") EstadoReserva estado,
                                               Pageable pageable);
}
