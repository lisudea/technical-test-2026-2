package udea.lis.equipos_reservas_api.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.model.Reserva;
import udea.lis.equipos_reservas_api.model.Usuario;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;
import udea.lis.equipos_reservas_api.repository.ReservaRepository;
import udea.lis.equipos_reservas_api.repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

// Componente de inicialización que inserta 20 equipos y 20 reservas de ejemplo la primera vez que la aplicación arranca
// contra una base de datos vacía. Incluye equipos en distintos estados y reservas activas (varias sobre el mismo equipo
// sin solaparse), finalizadas y canceladas, para poder probar los endpoints de inmediato sin cargar datos manualmente.
@Component
public class DataSeeder implements CommandLineRunner {

    // Se definen los repositorios que se utilizarán para insertar los datos de ejemplo. Estos componentes se inyectan a
    // través del constructor.
    private final EquipoRepository equipoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaRepository reservaRepository;

    // Constructor del seeder, que recibe los repositorios de equipos, usuarios y reservas como parámetros.
    public DataSeeder(EquipoRepository equipoRepository, UsuarioRepository usuarioRepository,
                      ReservaRepository reservaRepository) {
        this.equipoRepository = equipoRepository;
        this.usuarioRepository = usuarioRepository;
        this.reservaRepository = reservaRepository;
    }

    @Override
    @Transactional // Esta anotación indica que el método se ejecutará dentro de una transacción de base de datos. Si ocurre
    // algún error, la transacción se revertirá automáticamente.
    public void run(String... args) {
        // Si la base ya tiene equipos o reservas, no se vuelve a sembrar para no duplicar datos.
        if (equipoRepository.count() > 0 || reservaRepository.count() > 0) {
            return;
        }

        // Se crean los 20 equipos de ejemplo. El id lo asigna el cliente (no es autoincremental), por lo que se debe fijar
        // explícitamente. Los equipos 1 a 4 conservan los ids que usan la documentación y el smoke test.
        Map<Long, Equipo> equipos = new HashMap<>();
        equipos.put(1L, equipo(1L, "Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipos.put(2L, equipo(2L, "Kit Oculus Quest 2", "SN-002", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE));
        equipos.put(3L, equipo(3L, "Router Cisco", "SN-003", CategoriaEquipo.REDES, EstadoEquipo.DISPONIBLE));
        equipos.put(4L, equipo(4L, "Raspberry Pi 4", "SN-004", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.MANTENIMIENTO));
        equipos.put(5L, equipo(5L, "ESP32 DevKit V1", "SN-005", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipos.put(6L, equipo(6L, "Raspberry Pi Pico W", "SN-006", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipos.put(7L, equipo(7L, "Kit Oculus Quest 3", "SN-007", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE));
        equipos.put(8L, equipo(8L, "Lentes HTC Vive Pro", "SN-008", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE));
        equipos.put(9L, equipo(9L, "Switch Cisco 2960", "SN-009", CategoriaEquipo.REDES, EstadoEquipo.DISPONIBLE));
        equipos.put(10L, equipo(10L, "Access Point Ubiquiti", "SN-010", CategoriaEquipo.REDES, EstadoEquipo.DISPONIBLE));
        equipos.put(11L, equipo(11L, "Arduino Mega 2560", "SN-011", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipos.put(12L, equipo(12L, "STM32 Nucleo", "SN-012", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipos.put(13L, equipo(13L, "Controladores Oculus Touch", "SN-013", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE));
        equipos.put(14L, equipo(14L, "Sensor Intel RealSense", "SN-014", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE));
        equipos.put(15L, equipo(15L, "Router MikroTik", "SN-015", CategoriaEquipo.REDES, EstadoEquipo.DISPONIBLE));
        equipos.put(16L, equipo(16L, "Analizador de redes WiFi", "SN-016", CategoriaEquipo.REDES, EstadoEquipo.MANTENIMIENTO));
        equipos.put(17L, equipo(17L, "Kit LEGO Mindstorms", "SN-017", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipos.put(18L, equipo(18L, "HoloLens 2", "SN-018", CategoriaEquipo.VR, EstadoEquipo.MANTENIMIENTO));
        equipos.put(19L, equipo(19L, "Patch Panel 24 puertos", "SN-019", CategoriaEquipo.REDES, EstadoEquipo.DISPONIBLE));
        equipos.put(20L, equipo(20L, "Kit Raspberry Pi 5", "SN-020", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipoRepository.saveAll(equipos.values());

        // Se crean los 9 usuarios de ejemplo, reutilizando el mismo usuario cuando se repite el correo.
        Map<String, Usuario> usuarios = new HashMap<>();
        Usuario ana = usuario("Ana Pérez", "ana.perez@udea.edu.co", usuarios);
        Usuario luis = usuario("Luis Gómez", "luis.gomez@udea.edu.co", usuarios);
        Usuario marta = usuario("Marta Ríos", "marta.rios@udea.edu.co", usuarios);
        Usuario juan = usuario("Juan Torres", "juan.torres@udea.edu.co", usuarios);
        Usuario carlos = usuario("Carlos Díaz", "carlos.diaz@udea.edu.co", usuarios);
        Usuario diana = usuario("Diana Ruiz", "diana.ruiz@udea.edu.co", usuarios);
        Usuario sara = usuario("Sara López", "sara.lopez@udea.edu.co", usuarios);
        Usuario pedro = usuario("Pedro Sáenz", "pedro.saenz@udea.edu.co", usuarios);
        Usuario laura = usuario("Laura Gil", "laura.gil@udea.edu.co", usuarios);

        // Las fechas de las reservas se calculan relativas a la fecha actual: las activas quedan en el futuro y las
        // finalizadas y canceladas en el pasado.
        LocalDateTime ahora = LocalDateTime.now();

        // 7 reservas ACTIVAS en el futuro. El equipo 1 (Arduino Uno) tiene tres reservas activas que no se solapan
        // entre sí, demostrando que un equipo puede tener varias reservas activas simultáneas.
        reserva(ana, equipos.get(1L), ahora.plusDays(1).withHour(8).withMinute(0), ahora.plusDays(1).withHour(10).withMinute(0), EstadoReserva.ACTIVA);
        reserva(luis, equipos.get(1L), ahora.plusDays(1).withHour(10).withMinute(0), ahora.plusDays(1).withHour(12).withMinute(0), EstadoReserva.ACTIVA);
        reserva(marta, equipos.get(1L), ahora.plusDays(2).withHour(8).withMinute(0), ahora.plusDays(2).withHour(9).withMinute(30), EstadoReserva.ACTIVA);
        reserva(juan, equipos.get(2L), ahora.plusDays(2).withHour(14).withMinute(0), ahora.plusDays(2).withHour(16).withMinute(0), EstadoReserva.ACTIVA);
        reserva(carlos, equipos.get(3L), ahora.plusDays(5).withHour(9).withMinute(0), ahora.plusDays(5).withHour(11).withMinute(0), EstadoReserva.ACTIVA);
        reserva(ana, equipos.get(5L), ahora.plusDays(1).withHour(9).withMinute(0), ahora.plusDays(1).withHour(11).withMinute(0), EstadoReserva.ACTIVA);
        reserva(luis, equipos.get(7L), ahora.plusDays(3).withHour(10).withMinute(0), ahora.plusDays(3).withHour(12).withMinute(0), EstadoReserva.ACTIVA);

        // 7 reservas FINALIZADAS en el pasado, útiles para probar el top 5 de equipos más solicitados y el filtro por estado.
        reserva(sara, equipos.get(1L), ahora.minusDays(5).withHour(8).withMinute(0), ahora.minusDays(5).withHour(10).withMinute(0), EstadoReserva.FINALIZADA);
        reserva(pedro, equipos.get(2L), ahora.minusDays(4).withHour(9).withMinute(0), ahora.minusDays(4).withHour(11).withMinute(0), EstadoReserva.FINALIZADA);
        reserva(diana, equipos.get(3L), ahora.minusDays(3).withHour(10).withMinute(0), ahora.minusDays(3).withHour(12).withMinute(0), EstadoReserva.FINALIZADA);
        reserva(sara, equipos.get(5L), ahora.minusDays(2).withHour(14).withMinute(0), ahora.minusDays(2).withHour(16).withMinute(0), EstadoReserva.FINALIZADA);
        reserva(juan, equipos.get(7L), ahora.minusDays(1).withHour(8).withMinute(0), ahora.minusDays(1).withHour(10).withMinute(0), EstadoReserva.FINALIZADA);
        reserva(marta, equipos.get(9L), ahora.minusDays(4).withHour(15).withMinute(0), ahora.minusDays(4).withHour(17).withMinute(0), EstadoReserva.FINALIZADA);
        reserva(carlos, equipos.get(11L), ahora.minusDays(2).withHour(9).withMinute(0), ahora.minusDays(2).withHour(11).withMinute(0), EstadoReserva.FINALIZADA);

        // 6 reservas CANCELADAS, algunas con fecha futura y otras pasadas, para probar el historial de reservas.
        reserva(laura, equipos.get(1L), ahora.plusDays(4).withHour(8).withMinute(0), ahora.plusDays(4).withHour(10).withMinute(0), EstadoReserva.CANCELADA);
        reserva(diana, equipos.get(2L), ahora.minusDays(3).withHour(11).withMinute(0), ahora.minusDays(3).withHour(13).withMinute(0), EstadoReserva.CANCELADA);
        reserva(pedro, equipos.get(6L), ahora.plusDays(1).withHour(10).withMinute(0), ahora.plusDays(1).withHour(12).withMinute(0), EstadoReserva.CANCELADA);
        reserva(ana, equipos.get(10L), ahora.minusDays(1).withHour(9).withMinute(0), ahora.minusDays(1).withHour(11).withMinute(0), EstadoReserva.CANCELADA);
        reserva(luis, equipos.get(13L), ahora.plusDays(2).withHour(9).withMinute(0), ahora.plusDays(2).withHour(10).withMinute(0), EstadoReserva.CANCELADA);
        reserva(sara, equipos.get(15L), ahora.minusDays(2).withHour(16).withMinute(0), ahora.minusDays(2).withHour(18).withMinute(0), EstadoReserva.CANCELADA);

        // Los equipos con al menos una reserva ACTIVA quedan marcados como "RESERVADO"; el resto conserva su estado inicial.
        Set<Equipo> equiposReservados = new HashSet<>();
        for (Reserva r : reservaRepository.findAll()) {
            if (r.getEstado() == EstadoReserva.ACTIVA) {
                equiposReservados.add(r.getEquipo());
            }
        }
        for (Equipo e : equiposReservados) {
            e.setEstado(EstadoEquipo.RESERVADO);
            equipoRepository.save(e);
        }
    }

    private Equipo equipo(Long id, String nombre, String numeroSerie, CategoriaEquipo categoria, EstadoEquipo estado) {
        Equipo equipo = new Equipo(nombre, numeroSerie, categoria, estado);
        equipo.setId(id);
        return equipo;
    }

    // Este método crea un usuario si su correo aún no existe entre los sembrados y lo guarda en la base de datos.
    private Usuario usuario(String nombre, String correo, Map<String, Usuario> creados) {
        return creados.computeIfAbsent(correo, c -> {
            Usuario usuario = new Usuario(nombre, correo);
            return usuarioRepository.save(usuario);
        });
    }

    // Este método crea una reserva con el estado indicado y la guarda en la base de datos.
    private void reserva(Usuario usuario, Equipo equipo, LocalDateTime inicio, LocalDateTime fin, EstadoReserva estado) {
        Reserva reserva = new Reserva(inicio, fin, usuario, equipo);
        reserva.setEstado(estado);
        reservaRepository.save(reserva);
    }
}
