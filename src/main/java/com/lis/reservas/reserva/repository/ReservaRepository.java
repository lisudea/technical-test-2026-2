package com.lis.reservas.reserva.repository;

import com.lis.reservas.reserva.entity.EstadoPrestamo;
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

    /**
     * Dynamic AND-combined filter for the {@code GET /api/v1/reservas}
     * listing. Every parameter is optional; a {@code null} parameter is
     * excluded from the predicate so the query degrades to broader matches.
     *
     * <p>The {@code desde}/{@code hasta} window bounds the reservation's own
     * interval: a reservation is returned when its {@code fechaHoraInicio} is
     * on or after {@code desde} and its {@code fechaHoraFin} is on or before
     * {@code hasta} (i.e. reservations fully contained in the requested
     * window).
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE (:idEquipo IS NULL OR r.equipo.idEquipo = :idEquipo)
              AND (:correo IS NULL OR r.usuario.correo = :correo)
              AND (:desde IS NULL OR r.fechaHoraInicio >= :desde)
              AND (:hasta IS NULL OR r.fechaHoraFin <= :hasta)
              AND (:estado IS NULL OR r.estado = :estado)
            """)
    Page<Reserva> findByFilters(@Param("idEquipo") Integer idEquipo,
                                @Param("correo") String correo,
                                @Param("desde") OffsetDateTime desde,
                                @Param("hasta") OffsetDateTime hasta,
                                @Param("estado") EstadoReserva estado,
                                Pageable pageable);

    // --- Loan desk ---------------------------------------------------------

    /**
     * The auxiliar's working queue for a day.
     *
     * <p>It is deliberately NOT just "bookings starting today". Equipment
     * handed over yesterday and not yet returned is still the desk's problem,
     * so anything left in {@link EstadoPrestamo#ENTREGADO} whose window has
     * already ended is pulled in regardless of its start date. Dropping those
     * rows would make outstanding equipment invisible the moment the clock
     * passed midnight.
     *
     * <p>Cancelled bookings are excluded unless they were cancelled by a
     * no-show declaration, which the desk still needs to see for the day.
     *
     * @param desde          start of the day, inclusive.
     * @param hasta          start of the next day, exclusive.
     * @param estadoPrestamo optional exact filter; {@code null} = all.
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE (:estadoPrestamo IS NULL OR r.estadoPrestamo = :estadoPrestamo)
              AND (
                    (r.fechaHoraInicio >= :desde AND r.fechaHoraInicio < :hasta
                     AND r.estado <> com.lis.reservas.reserva.entity.EstadoReserva.CANCELADA)
                 OR (r.estadoPrestamo = com.lis.reservas.reserva.entity.EstadoPrestamo.NO_RECLAMADO
                     AND r.fechaHoraInicio >= :desde AND r.fechaHoraInicio < :hasta)
                 OR (r.estadoPrestamo = com.lis.reservas.reserva.entity.EstadoPrestamo.ENTREGADO
                     AND r.fechaHoraFin < :hasta)
              )
            """)
    Page<Reserva> agenda(@Param("desde") OffsetDateTime desde,
                         @Param("hasta") OffsetDateTime hasta,
                         @Param("estadoPrestamo") EstadoPrestamo estadoPrestamo,
                         Pageable pageable);

    /** Count of a given loan state among bookings starting within the day. */
    @Query("""
            SELECT COUNT(r) FROM Reserva r
            WHERE r.fechaHoraInicio >= :desde AND r.fechaHoraInicio < :hasta
              AND r.estadoPrestamo = :estadoPrestamo
            """)
    long contarPorEstadoPrestamoEnDia(@Param("desde") OffsetDateTime desde,
                                      @Param("hasta") OffsetDateTime hasta,
                                      @Param("estadoPrestamo") EstadoPrestamo estadoPrestamo);

    /**
     * Equipment that is out and overdue: handed over, window already ended,
     * still not returned. Not bounded by the day — an item three days late is
     * more urgent, not less.
     */
    @Query("""
            SELECT COUNT(r) FROM Reserva r
            WHERE r.estadoPrestamo = com.lis.reservas.reserva.entity.EstadoPrestamo.ENTREGADO
              AND r.fechaHoraFin < :ahora
            """)
    long contarVencidos(@Param("ahora") OffsetDateTime ahora);

    long countByEstado(EstadoReserva estado);

    @Query("""
            SELECT COUNT(r) FROM Reserva r
            WHERE r.estado = com.lis.reservas.reserva.entity.EstadoReserva.ACTIVA
              AND r.fechaHoraInicio <= :ahora AND r.fechaHoraFin > :ahora
            """)
    long contarEnCurso(@Param("ahora") OffsetDateTime ahora);
}
