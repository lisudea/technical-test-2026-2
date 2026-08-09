package udea.lis.equipos_reservas_api.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;

// Componente de inicialización que inserta equipos de ejemplo la primera vez que la aplicación arranca contra una
// base de datos vacía. Esto permite probar los endpoints de inmediato sin cargar datos manualmente.
@Component
public class DataSeeder implements CommandLineRunner {

    private final EquipoRepository equipoRepository;

    public DataSeeder(EquipoRepository equipoRepository) {
        this.equipoRepository = equipoRepository;
    }

    @Override
    public void run(String... args) {
        if (equipoRepository.count() > 0) {
            return;
        }
        // El id lo asigna el cliente (no es autoincremental), por lo que se debe fijar explícitamente.
        equipoRepository.save(equipo(1L, "Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE));
        equipoRepository.save(equipo(2L, "Kit Oculus Quest 2", "SN-002", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE));
        equipoRepository.save(equipo(3L, "Router Cisco", "SN-003", CategoriaEquipo.REDES, EstadoEquipo.DISPONIBLE));
        equipoRepository.save(equipo(4L, "Raspberry Pi 4", "SN-004", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.MANTENIMIENTO));
    }

    private Equipo equipo(Long id, String nombre, String numeroSerie, CategoriaEquipo categoria, EstadoEquipo estado) {
        Equipo equipo = new Equipo(nombre, numeroSerie, categoria, estado);
        equipo.setId(id);
        return equipo;
    }
}
