package co.edu.udea.lis.lisource.statistics.api;

import co.edu.udea.lis.lisource.statistics.api.StatisticsDtos.*;
import co.edu.udea.lis.lisource.statistics.application.StatisticsService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class StatisticsController {
    private final StatisticsService service;
    public StatisticsController(StatisticsService service) { this.service = service; }

    @GetMapping("/statistics/top-equipment")
    public List<TopEquipment> top(@RequestParam(required = false) Integer limit) { return service.top(limit); }

    @GetMapping("/dashboard/summary")
    public DashboardSummary dashboard() { return service.dashboard(); }
}
