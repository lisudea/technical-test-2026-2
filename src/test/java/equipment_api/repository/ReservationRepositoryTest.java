package equipment_api.repository;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
import equipment_api.entity.EquipmentStatus;
import equipment_api.entity.Reservation;
import equipment_api.entity.ReservationStatus;
import equipment_api.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
// En Spring Boot 4 las anotaciones de "test slice" cambiaron de paquete:
// antes org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Ejercita la consulta JPQL de solapamiento contra una base de datos real
 * (H2 en memoria). Es el test mas importante del proyecto: comprueba la regla
 * de negocio critica del enunciado sobre SQL de verdad, no sobre mocks.
 *
 * Reserva existente de referencia:  10:00 -------- 12:00
 */
@DataJpaTest
@DisplayName("ReservationRepository.existsOverlappingReservation")
class ReservationRepositoryTest {

    @Autowired private ReservationRepository reservationRepository;
    @Autowired private EquipmentRepository equipmentRepository;
    @Autowired private UserRepository userRepository;

    private Equipment equipment;
    private Equipment otherEquipment;
    private User user;
    private LocalDate day;

    @BeforeEach
    void setUp() {
        day = LocalDate.now().plusDays(1);

        equipment = equipmentRepository.save(
                newEquipment("Arduino Uno R3", "MCU-ARD-0001"));
        otherEquipment = equipmentRepository.save(
                newEquipment("Meta Quest 3", "VR-MQ3-0006"));

        user = userRepository.save(new User("Carlos", "carlos@udea.edu.co"));

        // Reserva de referencia: 10:00 - 12:00
        reservationRepository.save(newReservation(equipment, 10, 0, 12, 0, ReservationStatus.ACTIVE));
    }

    private Equipment newEquipment(String name, String serial) {
        Equipment e = new Equipment();
        e.setName(name);
        e.setSerialNumber(serial);
        e.setCategory(EquipmentCategory.MICROCONTROLLERS);
        e.setStatus(EquipmentStatus.AVAILABLE);
        return e;
    }

    private Reservation newReservation(Equipment target,
                                       int startHour, int startMinute,
                                       int endHour, int endMinute,
                                       ReservationStatus status) {
        Reservation r = new Reservation();
        r.setEquipment(target);
        r.setUser(user);
        r.setStartTime(at(startHour, startMinute));
        r.setEndTime(at(endHour, endMinute));
        r.setStatus(status);
        return r;
    }

    private LocalDateTime at(int hour, int minute) {
        return day.atTime(LocalTime.of(hour, minute));
    }

    private boolean overlaps(int startHour, int startMinute, int endHour, int endMinute) {
        return reservationRepository.existsOverlappingReservation(
                equipment.getId(), at(startHour, startMinute), at(endHour, endMinute));
    }

    // ------------------------------------------------------------------

    @ParameterizedTest(name = "{4}: {0}:{1} - {2}:{3} SI se solapa con 10:00-12:00")
    @CsvSource({
            "10, 0,  12, 0,  identica",
            "10, 30, 11, 30, contenida dentro",
            " 9, 0,  11, 0,  cruza el inicio",
            "11, 0,  13, 0,  cruza el final",
            " 9, 0,  13, 0,  la envuelve por completo",
            "11, 59, 13, 0,  se cruza por un minuto al final",
            " 9, 0,  10, 1,  se cruza por un minuto al inicio"
    })
    void detectsOverlap(int sh, int sm, int eh, int em, String caseName) {
        assertThat(overlaps(sh, sm, eh, em))
                .as(caseName)
                .isTrue();
    }

    @ParameterizedTest(name = "{4}: {0}:{1} - {2}:{3} NO se solapa con 10:00-12:00")
    @CsvSource({
            " 8, 0,  10, 0,  termina justo cuando empieza (contigua)",
            "12, 0,  14, 0,  empieza justo cuando termina (contigua)",
            " 6, 0,   7, 0,  muy anterior",
            "18, 0,  20, 0,  muy posterior"
    })
    void ignoresNonOverlapping(int sh, int sm, int eh, int em, String caseName) {
        assertThat(overlaps(sh, sm, eh, em))
                .as(caseName)
                .isFalse();
    }

    @Test
    @DisplayName("una reserva CANCELLED libera la franja")
    void cancelledReservationDoesNotBlock() {

        // La franja 14:00-16:00 esta ocupada...
        Reservation cancelled = reservationRepository.save(
                newReservation(equipment, 14, 0, 16, 0, ReservationStatus.ACTIVE));

        assertThat(overlaps(14, 30, 15, 30)).isTrue();

        // ...pero al cancelarla queda libre.
        cancelled.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(cancelled);

        assertThat(overlaps(14, 30, 15, 30)).isFalse();
    }

    @Test
    @DisplayName("las reservas de otro equipo no bloquean")
    void otherEquipmentDoesNotBlock() {

        boolean conflict = reservationRepository.existsOverlappingReservation(
                otherEquipment.getId(), at(10, 30), at(11, 30));

        assertThat(conflict).isFalse();
    }
}