package co.edu.udea.lis.lisource.statistics.application;

import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import co.edu.udea.lis.lisource.statistics.api.StatisticsDtos.*;
import co.edu.udea.lis.lisource.statistics.infrastructure.StatisticsRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class StatisticsService {
    private final StatisticsRepository repository;
    private final ConfigurationService configuration;
    public StatisticsService(StatisticsRepository repository, ConfigurationService configuration) {
        this.repository = repository;
        this.configuration = configuration;
    }
    public List<TopEquipment> top(Integer requestedLimit) {
        int limit = requestedLimit == null
                ? configuration.integerOr(ConfigurationService.TOP_LIMIT, 5) : requestedLimit;
        if (limit < 1 || limit > 100) throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_ERROR, "Top equipment limit must be between 1 and 100.");
        return repository.topEquipment(limit);
    }
    public DashboardSummary dashboard() { return repository.dashboard(); }
}

