package co.edu.udea.lis.lisource.reservation.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.catalog.infrastructure.CatalogRepository;
import co.edu.udea.lis.lisource.equipment.infrastructure.EquipmentRepository;
import co.edu.udea.lis.lisource.reservation.infrastructure.ReservationRepository;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.web.RealtimeEventPublisher;
import java.time.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ReservationServiceTest {
    private ReservationService service;

    @BeforeEach
    void setUp() {
        service = new ReservationService(mock(ReservationRepository.class), mock(EquipmentRepository.class),
                mock(CatalogRepository.class), mock(AuditPublisher.class),
                Clock.fixed(Instant.parse("2026-08-07T12:00:00Z"), ZoneOffset.UTC),
                mock(RealtimeEventPublisher.class));
    }

    @Test void rejectsEndEqualToOrBeforeStart() {
        Instant start = Instant.parse("2026-08-08T10:00:00Z");
        assertThatThrownBy(() -> service.validateRange(start, start)).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> service.validateRange(start, start.minusSeconds(1))).isInstanceOf(AppException.class);
    }

    @Test void acceptsHalfOpenAdjacentRange() {
        assertThatCode(() -> service.validateRange(Instant.parse("2026-08-08T12:00:00Z"),
                Instant.parse("2026-08-08T14:00:00Z"))).doesNotThrowAnyException();
    }
}
