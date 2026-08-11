package equipment_api.service;

import equipment_api.dto.ReservationResponse;
import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentStatus;
import equipment_api.entity.Reservation;
import equipment_api.entity.ReservationStatus;
import equipment_api.entity.User;
import equipment_api.exception.EquipmentNotAvailableException;
import equipment_api.exception.EquipmentNotFoundException;
import equipment_api.exception.ErrorCode;
import equipment_api.exception.InvalidReservationException;
import equipment_api.exception.ReservationConflictException;
import equipment_api.exception.ReservationNotFoundException;
import equipment_api.repository.EquipmentRepository;
import equipment_api.repository.ReservationRepository;
import equipment_api.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    /**
     * Duracion maxima de una reserva, en horas. Evita que alguien bloquee un
     * equipo durante semanas con una sola peticion. Configurable con
     * `app.reservations.max-hours`.
     */
    private final long maxHours;

    public ReservationService(
            ReservationRepository reservationRepository,
            EquipmentRepository equipmentRepository,
            UserRepository userRepository,
            @Value("${app.reservations.max-hours:8}") long maxHours) {

        this.reservationRepository = reservationRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
        this.maxHours = maxHours;
    }

    /**
     * Crea una reserva aplicando la regla de negocio critica del enunciado:
     * el equipo no puede estar ya reservado en la misma franja horaria.
     *
     * @param authenticatedEmail email extraido del JWT/sesion, o null si la
     *                           peticion llega sin autenticar. Cuando viene, se
     *                           usa este y se ignoran fallbackName/fallbackEmail:
     *                           impide suplantar a otro usuario.
     *
     * Es @Transactional y bloquea la fila del equipo (SELECT ... FOR UPDATE)
     * para que dos peticiones simultaneas no puedan pasar las dos la
     * comprobacion de solapamiento y provocar una doble reserva.
     */
    @Transactional
    public Reservation createReservation(
            Long equipmentId,
            String authenticatedEmail,
            String fallbackName,
            String fallbackEmail,
            LocalDateTime startTime,
            LocalDateTime endTime) {

        // 1. Validar el orden de las fechas
        if (!startTime.isBefore(endTime)) {
            throw new InvalidReservationException(
                    ErrorCode.INVALID_TIME_RANGE,
                    "La fecha y hora de inicio debe ser anterior a la de fin"
            );
        }

        // 2. Limitar la duracion: sin este tope, una sola peticion podria
        //    bloquear un equipo durante meses.
        long horas = Duration.between(startTime, endTime).toHours();
        if (horas > maxHours) {
            throw new InvalidReservationException(
                    ErrorCode.RESERVATION_TOO_LONG,
                    "La reserva no puede superar las " + maxHours + " horas (se pidieron " + horas + ")"
            );
        }

        // 3. Bloquear el equipo mientras dure la transaccion
        Equipment equipment = equipmentRepository.findByIdForUpdate(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        // 4. Un equipo en mantenimiento no esta operativo. El frontend ya
        //    deshabilita el boton, pero la regla tiene que vivir en la API:
        //    de lo contrario bastaria una peticion directa para saltarsela.
        if (equipment.getStatus() == EquipmentStatus.MAINTENANCE) {
            throw new EquipmentNotAvailableException(equipment.getId(), equipment.getName());
        }

        // 5. Resolver quien reserva
        User user = resolveUser(authenticatedEmail, fallbackName, fallbackEmail);

        // 6. Verificar solapamiento (solo contra reservas ACTIVE)
        boolean conflict = reservationRepository.existsOverlappingReservation(
                equipmentId,
                startTime,
                endTime
        );

        if (conflict) {
            throw new ReservationConflictException(equipmentId);
        }

        // 7. Crear y guardar
        Reservation reservation = new Reservation();

        reservation.setEquipment(equipment);
        reservation.setUser(user);
        reservation.setStartTime(startTime);
        reservation.setEndTime(endTime);
        reservation.setStatus(ReservationStatus.ACTIVE);

        return reservationRepository.save(reservation);
    }

    /**
     * Dos caminos de identificacion:
     *
     *  a) Peticion autenticada -> el usuario sale del token. Ya existe en la
     *     base de datos porque se registra durante el login (ver
     *     CustomOAuth2UserService), pero se crea por si acaso.
     *
     *  b) Peticion anonima -> se exigen nombre y correo en el cuerpo, tal y
     *     como pide el requisito obligatorio del enunciado, y se da de alta al
     *     usuario si es la primera vez.
     */
    private User resolveUser(String authenticatedEmail, String fallbackName, String fallbackEmail) {

        if (authenticatedEmail != null && !authenticatedEmail.isBlank()) {

            String email = authenticatedEmail.trim().toLowerCase();

            return userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.save(new User(email, email)));
        }

        if (fallbackEmail == null || fallbackEmail.isBlank()
                || fallbackName == null || fallbackName.isBlank()) {

            throw new InvalidReservationException(
                    ErrorCode.IDENTITY_REQUIRED,
                    "Debes indicar 'userName' y 'userEmail' para reservar, "
                            + "o iniciar sesion para que se tomen de tu cuenta"
            );
        }

        String email = fallbackEmail.trim().toLowerCase();
        String name = fallbackName.trim();

        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(new User(name, email)));
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByEquipment(Long equipmentId) {

        equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        return reservationRepository.findByEquipmentId(equipmentId)
                .stream()
                .map(ReservationResponse::new)
                .toList();
    }

    /**
     * Cancelacion LOGICA: la reserva pasa a CANCELLED en lugar de borrarse.
     * La franja queda libre de inmediato (la consulta de solapamiento solo mira
     * reservas ACTIVE) pero el historico se conserva para las estadisticas.
     *
     * @param requesterEmail email de quien pide cancelar: del token si la
     *                       peticion viene autenticada, o del parametro `email`
     *                       si es anonima. Debe coincidir con el dueno.
     */
    @Transactional
    public void cancelReservation(Long id, String requesterEmail) {

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationNotFoundException(id));

        if (requesterEmail == null || requesterEmail.isBlank()) {
            throw new AccessDeniedException(
                    "Indica el correo con el que se creo la reserva (parametro 'email') "
                            + "o inicia sesion para cancelarla"
            );
        }

        String owner = reservation.getUser().getEmail();

        if (!owner.equalsIgnoreCase(requesterEmail.trim())) {
            throw new AccessDeniedException(
                    "Solo puedes cancelar las reservas creadas con tu propio correo"
            );
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            // Idempotente: cancelar dos veces no es un error.
            return;
        }

        reservation.setStatus(ReservationStatus.CANCELLED);

        reservationRepository.save(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {

        return reservationRepository.findAllByOrderByStartTimeDesc()
                .stream()
                .map(ReservationResponse::new)
                .toList();
    }
}