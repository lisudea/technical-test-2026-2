package equipment_api.service;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
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

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests de la REGLA DE NEGOCIO CRITICA del enunciado:
 * un equipo no puede estar reservado por dos usuarios en la misma franja.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationService")
class ReservationServiceTest {

    private static final Long EQUIPMENT_ID = 1L;
    private static final String EMAIL = "carlos@udea.edu.co";
    private static final String NAME = "Carlos";

    private static final long MAX_HORAS = 8;

    @Mock private ReservationRepository reservationRepository;
    @Mock private EquipmentRepository equipmentRepository;
    @Mock private UserRepository userRepository;

    private ReservationService reservationService;

    private Equipment equipment;
    private User user;

    @BeforeEach
    void setUp() {
        // Se construye a mano en lugar de con @InjectMocks: el constructor tiene
        // un parametro primitivo (maxHours) al que Mockito asignaria 0, y con
        // ese valor cualquier reserva superaria la duracion maxima.
        reservationService = new ReservationService(
                reservationRepository, equipmentRepository, userRepository, MAX_HORAS);

        equipment = new Equipment();
        equipment.setId(EQUIPMENT_ID);
        equipment.setName("Arduino Uno R3");
        equipment.setSerialNumber("MCU-ARD-0001");
        equipment.setCategory(EquipmentCategory.MICROCONTROLLERS);
        equipment.setStatus(EquipmentStatus.AVAILABLE);

        user = new User(NAME, EMAIL);
        user.setId(10L);
    }

    private LocalDateTime at(int hour) {
        return LocalDateTime.now().plusDays(1).withHour(hour).withMinute(0).withSecond(0).withNano(0);
    }

    private void givenEquipmentAndUserExist() {
        when(equipmentRepository.findByIdForUpdate(EQUIPMENT_ID)).thenReturn(Optional.of(equipment));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
    }

    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Deteccion de solapamiento")
    class Overlap {

        @Test
        @DisplayName("rechaza con 409 cuando la franja se cruza con otra reserva")
        void rejectsOverlappingReservation() {

            givenEquipmentAndUserExist();
            when(reservationRepository.existsOverlappingReservation(eq(EQUIPMENT_ID), any(), any()))
                    .thenReturn(true);

            assertThatThrownBy(() -> reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, at(10), at(11)))
                    .isInstanceOf(ReservationConflictException.class)
                    .hasMessageContaining("ya tiene una reserva");

            verify(reservationRepository, never()).save(any());
        }

        @Test
        @DisplayName("acepta cuando el repositorio no reporta cruce (franjas contiguas)")
        void acceptsAdjacentReservation() {

            givenEquipmentAndUserExist();
            when(reservationRepository.existsOverlappingReservation(eq(EQUIPMENT_ID), any(), any()))
                    .thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            Reservation created = reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, at(11), at(12));

            assertThat(created).isNotNull();
            assertThat(created.getStatus()).isEqualTo(ReservationStatus.ACTIVE);
            assertThat(created.getEquipment()).isSameAs(equipment);
            assertThat(created.getUser()).isSameAs(user);
            verify(reservationRepository).save(any(Reservation.class));
        }

        @Test
        @DisplayName("consulta el solapamiento con exactamente el equipo y las fechas pedidas")
        void passesExactArgumentsToTheOverlapQuery() {

            givenEquipmentAndUserExist();
            LocalDateTime start = at(9);
            LocalDateTime end = at(10);

            when(reservationRepository.existsOverlappingReservation(EQUIPMENT_ID, start, end))
                    .thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            reservationService.createReservation(EQUIPMENT_ID, EMAIL, null, null, start, end);

            verify(reservationRepository).existsOverlappingReservation(EQUIPMENT_ID, start, end);
        }

        @Test
        @DisplayName("bloquea la fila del equipo para evitar dobles reservas simultaneas")
        void locksEquipmentRow() {

            givenEquipmentAndUserExist();
            when(reservationRepository.existsOverlappingReservation(anyLong(), any(), any()))
                    .thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            reservationService.createReservation(EQUIPMENT_ID, EMAIL, null, null, at(8), at(9));

            // findByIdForUpdate emite SELECT ... FOR UPDATE; findById no bloquea.
            verify(equipmentRepository).findByIdForUpdate(EQUIPMENT_ID);
            verify(equipmentRepository, never()).findById(anyLong());
        }
    }

    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Validacion de fechas")
    class DateValidation {

        @Test
        @DisplayName("rechaza si el inicio es posterior al fin")
        void rejectsStartAfterEnd() {

            assertThatThrownBy(() -> reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, at(12), at(10)))
                    .isInstanceOf(InvalidReservationException.class)
                    .hasMessageContaining("anterior")
                    .extracting(e -> ((InvalidReservationException) e).getCode())
                    .isEqualTo(ErrorCode.INVALID_TIME_RANGE);
        }

        @Test
        @DisplayName("rechaza si el inicio es igual al fin (duracion cero)")
        void rejectsZeroLengthReservation() {

            LocalDateTime moment = at(10);

            assertThatThrownBy(() -> reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, moment, moment))
                    .isInstanceOf(InvalidReservationException.class)
                    .extracting(e -> ((InvalidReservationException) e).getCode())
                    .isEqualTo(ErrorCode.INVALID_TIME_RANGE);
        }

        @Test
        @DisplayName("rechaza una reserva que supera la duracion maxima")
        void rejectsTooLongReservation() {

            LocalDateTime inicio = at(8);

            assertThatThrownBy(() -> reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, inicio, inicio.plusHours(MAX_HORAS + 1)))
                    .isInstanceOf(InvalidReservationException.class)
                    .extracting(e -> ((InvalidReservationException) e).getCode())
                    .isEqualTo(ErrorCode.RESERVATION_TOO_LONG);

            // Ni siquiera llega a tocar la base de datos.
            verify(equipmentRepository, never()).findByIdForUpdate(anyLong());
        }

        @Test
        @DisplayName("acepta una reserva de exactamente la duracion maxima")
        void acceptsReservationAtTheLimit() {

            givenEquipmentAndUserExist();
            when(reservationRepository.existsOverlappingReservation(anyLong(), any(), any()))
                    .thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            LocalDateTime inicio = at(8);

            Reservation creada = reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, inicio, inicio.plusHours(MAX_HORAS));

            assertThat(creada).isNotNull();
        }
    }

    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Estado del equipo")
    class EstadoDelEquipo {

        @Test
        @DisplayName("no permite reservar un equipo en mantenimiento")
        void rejectsEquipmentUnderMaintenance() {

            equipment.setStatus(EquipmentStatus.MAINTENANCE);
            when(equipmentRepository.findByIdForUpdate(EQUIPMENT_ID)).thenReturn(Optional.of(equipment));

            assertThatThrownBy(() -> reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, at(10), at(11)))
                    .isInstanceOf(EquipmentNotAvailableException.class)
                    .hasMessageContaining("mantenimiento");

            verify(reservationRepository, never()).save(any());
            // La comprobacion es previa: no llega a consultar el solapamiento.
            verify(reservationRepository, never())
                    .existsOverlappingReservation(anyLong(), any(), any());
        }

        @Test
        @DisplayName("permite reservar un equipo marcado como RESERVED si la franja esta libre")
        void allowsReservedEquipmentWhenSlotIsFree() {

            // RESERVED describe que tiene reservas, no que este inutilizable:
            // la disponibilidad real la decide el solapamiento de franjas.
            equipment.setStatus(EquipmentStatus.RESERVED);
            givenEquipmentAndUserExist();
            when(reservationRepository.existsOverlappingReservation(anyLong(), any(), any()))
                    .thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            Reservation creada = reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, null, null, at(10), at(11));

            assertThat(creada).isNotNull();
        }
    }

    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Identificacion del usuario")
    class UserIdentification {

        @Test
        @DisplayName("da de alta al usuario anonimo que se identifica con nombre y correo")
        void registersAnonymousUserFromBody() {

            when(equipmentRepository.findByIdForUpdate(EQUIPMENT_ID)).thenReturn(Optional.of(equipment));
            when(userRepository.findByEmail("nuevo@udea.edu.co")).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(reservationRepository.existsOverlappingReservation(anyLong(), any(), any())).thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            Reservation created = reservationService.createReservation(
                    EQUIPMENT_ID, null, "Nuevo Usuario", "Nuevo@udea.edu.co", at(8), at(9));

            assertThat(created.getUser().getName()).isEqualTo("Nuevo Usuario");
            // El correo se normaliza a minusculas para que la unicidad funcione.
            assertThat(created.getUser().getEmail()).isEqualTo("nuevo@udea.edu.co");
        }

        @Test
        @DisplayName("el token tiene prioridad sobre el nombre y correo del cuerpo")
        void authenticatedIdentityWins() {

            givenEquipmentAndUserExist();
            when(reservationRepository.existsOverlappingReservation(anyLong(), any(), any())).thenReturn(false);
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            Reservation created = reservationService.createReservation(
                    EQUIPMENT_ID, EMAIL, "Impostor", "impostor@gmail.com", at(8), at(9));

            assertThat(created.getUser().getEmail()).isEqualTo(EMAIL);
            verify(userRepository, never()).findByEmail("impostor@gmail.com");
        }

        @Test
        @DisplayName("rechaza la peticion anonima que no aporta nombre ni correo")
        void rejectsAnonymousWithoutIdentity() {

            when(equipmentRepository.findByIdForUpdate(EQUIPMENT_ID)).thenReturn(Optional.of(equipment));

            assertThatThrownBy(() -> reservationService.createReservation(
                    EQUIPMENT_ID, null, null, null, at(8), at(9)))
                    .isInstanceOf(InvalidReservationException.class)
                    .hasMessageContaining("userName")
                    .extracting(e -> ((InvalidReservationException) e).getCode())
                    .isEqualTo(ErrorCode.IDENTITY_REQUIRED);
        }
    }

    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Equipo inexistente")
    class MissingEquipment {

        @Test
        @DisplayName("lanza EquipmentNotFoundException (404)")
        void throwsWhenEquipmentDoesNotExist() {

            when(equipmentRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.createReservation(
                    99L, EMAIL, null, null, at(8), at(9)))
                    .isInstanceOf(EquipmentNotFoundException.class);
        }
    }

    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Cancelacion")
    class Cancellation {

        private Reservation existingReservation() {
            Reservation reservation = new Reservation();
            reservation.setId(5L);
            reservation.setEquipment(equipment);
            reservation.setUser(user);
            reservation.setStartTime(at(10));
            reservation.setEndTime(at(11));
            reservation.setStatus(ReservationStatus.ACTIVE);
            return reservation;
        }

        @Test
        @DisplayName("marca la reserva como CANCELLED en lugar de borrarla")
        void cancelsLogically() {

            Reservation reservation = existingReservation();
            when(reservationRepository.findById(5L)).thenReturn(Optional.of(reservation));

            reservationService.cancelReservation(5L, EMAIL);

            assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
            verify(reservationRepository).save(reservation);
            verify(reservationRepository, never()).delete(any());
        }

        @Test
        @DisplayName("acepta el correo del dueno sin distinguir mayusculas")
        void ownerEmailIsCaseInsensitive() {

            Reservation reservation = existingReservation();
            when(reservationRepository.findById(5L)).thenReturn(Optional.of(reservation));

            reservationService.cancelReservation(5L, EMAIL.toUpperCase());

            assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        }

        @Test
        @DisplayName("rechaza con 403 si quien cancela no es el dueno")
        void rejectsNonOwner() {

            when(reservationRepository.findById(5L)).thenReturn(Optional.of(existingReservation()));

            assertThatThrownBy(() -> reservationService.cancelReservation(5L, "otro@udea.edu.co"))
                    .isInstanceOf(AccessDeniedException.class);

            verify(reservationRepository, never()).save(any());
        }

        @Test
        @DisplayName("rechaza con 403 si no se aporta ningun correo")
        void rejectsMissingEmail() {

            when(reservationRepository.findById(5L)).thenReturn(Optional.of(existingReservation()));

            assertThatThrownBy(() -> reservationService.cancelReservation(5L, null))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("lanza 404 si la reserva no existe")
        void throwsWhenReservationMissing() {

            when(reservationRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.cancelReservation(404L, EMAIL))
                    .isInstanceOf(ReservationNotFoundException.class);
        }

        @Test
        @DisplayName("cancelar dos veces es idempotente")
        void cancellingTwiceIsIdempotent() {

            Reservation reservation = existingReservation();
            reservation.setStatus(ReservationStatus.CANCELLED);
            when(reservationRepository.findById(5L)).thenReturn(Optional.of(reservation));

            reservationService.cancelReservation(5L, EMAIL);

            verify(reservationRepository, never()).save(any());
        }
    }
}