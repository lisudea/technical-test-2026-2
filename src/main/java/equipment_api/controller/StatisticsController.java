package equipment_api.controller;

import equipment_api.dto.TopEquipmentResponse;
import equipment_api.service.StatisticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/top-equipment")
    public List<TopEquipmentResponse> getTopEquipment() {
        return statisticsService.getTopEquipment();
    }
}