package equipment_api.config;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
import equipment_api.entity.EquipmentStatus;
import equipment_api.entity.Reservation;
import equipment_api.entity.ReservationStatus;
import equipment_api.entity.User;
import equipment_api.repository.EquipmentRepository;
import equipment_api.repository.ReservationRepository;
import equipment_api.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Carga el catalogo de equipos del laboratorio y unas reservas de ejemplo.
 *
 * Es IDEMPOTENTE y se aplica POR NUMERO DE SERIE: en cada arranque inserta
 * unicamente los equipos que aun no existen. Eso permite ampliar el catalogo
 * sobre una base de datos que ya tiene registros, sin duplicar nada y sin
 * tener que vaciar la tabla.
 *
 * Se desactiva con `app.seed.enabled=false`.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String DEMO_EMAIL = "demo.lis@udea.edu.co";

    private final EquipmentRepository equipmentRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public DataSeeder(EquipmentRepository equipmentRepository,
                      ReservationRepository reservationRepository,
                      UserRepository userRepository) {

        this.equipmentRepository = equipmentRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Catalogo de referencia: 15 equipos repartidos entre las tres categorias
     * y los tres estados. El numero de serie es la clave: si ya existe, no se
     * vuelve a insertar.
     */
    private List<Equipment> catalogo() {
        return List.of(
                // --- Microcontroladores (6) ---
                equipo("Arduino Uno R3", "MCU-ARD-0001", EquipmentCategory.MICROCONTROLLERS, EquipmentStatus.AVAILABLE),
                equipo("Arduino Mega 2560", "MCU-ARD-0002", EquipmentCategory.MICROCONTROLLERS, EquipmentStatus.AVAILABLE),
                equipo("ESP32 DevKit v1", "MCU-ESP-0003", EquipmentCategory.MICROCONTROLLERS, EquipmentStatus.RESERVED),
                equipo("Raspberry Pi 4 Model B", "MCU-RPI-0004", EquipmentCategory.MICROCONTROLLERS, EquipmentStatus.MAINTENANCE),
                equipo("STM32 Nucleo F401RE", "MCU-STM-0005", EquipmentCategory.MICROCONTROLLERS, EquipmentStatus.AVAILABLE),
                equipo("Raspberry Pi Pico W", "MCU-RPP-0013", EquipmentCategory.MICROCONTROLLERS, EquipmentStatus.AVAILABLE),

                // --- Realidad virtual (5) ---
                equipo("Meta Quest 3", "VR-MQ3-0006", EquipmentCategory.VR, EquipmentStatus.AVAILABLE),
                equipo("HTC Vive Pro 2", "VR-HTC-0007", EquipmentCategory.VR, EquipmentStatus.RESERVED),
                equipo("Valve Index", "VR-VAL-0008", EquipmentCategory.VR, EquipmentStatus.AVAILABLE),
                equipo("Leap Motion Controller", "VR-LMC-0009", EquipmentCategory.VR, EquipmentStatus.MAINTENANCE),
                equipo("HP Reverb G2", "VR-HPR-0014", EquipmentCategory.VR, EquipmentStatus.AVAILABLE),

                // --- Redes (4) ---
                equipo("Cisco Catalyst 2960", "NET-CIS-0010", EquipmentCategory.NETWORKS, EquipmentStatus.AVAILABLE),
                equipo("Router Mikrotik hEX S", "NET-MKT-0011", EquipmentCategory.NETWORKS, EquipmentStatus.AVAILABLE),
                equipo("Analizador de espectro WiFi", "NET-WIF-0012", EquipmentCategory.NETWORKS, EquipmentStatus.RESERVED),
                equipo("Access Point Ubiquiti UniFi 6", "NET-UBI-0015", EquipmentCategory.NETWORKS, EquipmentStatus.AVAILABLE)
        );
    }

    @Override
    @Transactional
    public void run(String... args) {

        backfillLegacyReservations();

        int insertados = sembrarEquipos();

        // Las reservas de ejemplo solo se crean la primera vez, para no
        // ensuciar una base con la que ya se este trabajando.
        if (reservationRepository.count() == 0) {
            sembrarReservas();
        }

        long total = equipmentRepository.count();

        if (insertados > 0) {
            log.info("Datos semilla: {} equipo(s) nuevo(s) insertado(s). Total en catalogo: {}", insertados, total);
        } else {
            log.info("Datos semilla: el catalogo ya estaba completo ({} equipos)", total);
        }
    }

    /**
     * Inserta solo los equipos cuyo numero de serie no existe todavia.
     * Devuelve cuantos se anadieron.
     */
    private int sembrarEquipos() {

        List<Equipment> nuevos = new ArrayList<>();

        for (Equipment candidato : catalogo()) {
            if (equipmentRepository.findBySerialNumber(candidato.getSerialNumber()).isEmpty()) {
                nuevos.add(candidato);
            }
        }

        if (nuevos.isEmpty()) return 0;

        equipmentRepository.saveAll(nuevos);

        nuevos.forEach(e -> log.info("  + {} ({})", e.getName(), e.getSerialNumber()));

        return nuevos.size();
    }

    private void sembrarReservas() {

        User demo = userRepository.findByEmail(DEMO_EMAIL)
                .orElseGet(() -> userRepository.save(new User("Usuario Demo LIS", DEMO_EMAIL)));

        LocalDate manana = LocalDate.now().plusDays(1);

        // Franjas futuras y sin solaparse entre si, para que el Top 5 tenga
        // datos y el frontend muestre horarios ya ocupados.
        crearReserva("MCU-ARD-0001", demo, manana.atTime(LocalTime.of(8, 0)), manana.atTime(LocalTime.of(10, 0)));
        crearReserva("MCU-ARD-0001", demo, manana.atTime(LocalTime.of(14, 0)), manana.atTime(LocalTime.of(16, 0)));
        crearReserva("MCU-ESP-0003", demo, manana.atTime(LocalTime.of(9, 0)), manana.atTime(LocalTime.of(11, 0)));
        crearReserva("VR-MQ3-0006", demo, manana.atTime(LocalTime.of(10, 0)), manana.atTime(LocalTime.of(12, 0)));
        crearReserva("VR-HTC-0007", demo, manana.plusDays(1).atTime(LocalTime.of(8, 0)), manana.plusDays(1).atTime(LocalTime.of(9, 30)));
        crearReserva("NET-WIF-0012", demo, manana.plusDays(1).atTime(LocalTime.of(11, 0)), manana.plusDays(1).atTime(LocalTime.of(13, 0)));

        log.info("Datos semilla: reservas de ejemplo creadas");
    }

    private void crearReserva(String serialNumber, User user, LocalDateTime inicio, LocalDateTime fin) {

        equipmentRepository.findBySerialNumber(serialNumber).ifPresent(equipo -> {
            Reservation r = new Reservation();
            r.setEquipment(equipo);
            r.setUser(user);
            r.setStartTime(inicio);
            r.setEndTime(fin);
            r.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(r);
        });
    }

    /**
     * Las reservas creadas antes de introducir el campo `status` tienen la
     * columna a NULL. Se rellenan a ACTIVE para que la consulta de solapamiento
     * siga teniendolas en cuenta.
     */
    private void backfillLegacyReservations() {

        int actualizadas = reservationRepository.backfillNullStatus();

        if (actualizadas > 0) {
            log.info("Se asigno el estado ACTIVE a {} reserva(s) creadas antes de este campo", actualizadas);
        }
    }

    private Equipment equipo(String name, String serial,
                             EquipmentCategory category, EquipmentStatus status) {

        Equipment e = new Equipment();
        e.setName(name);
        e.setSerialNumber(serial);
        e.setCategory(category);
        e.setStatus(status);
        return e;
    }
}