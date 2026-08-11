package equipment_api.service;

import equipment_api.dto.TopEquipmentResponse;
import equipment_api.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@Service
public class StatisticsService {

    private final ReservationRepository reservationRepository;

    public StatisticsService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public List<TopEquipmentResponse> getTopEquipment() {
        return reservationRepository.findTopEquipment(
            PageRequest.of(0, 5)
        );
    }
}