package com.udea.labreservas.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ReservationScheduler {

    private final ReservationService reservationService;

    @Scheduled(cron = "${app.scheduler.reservation-finalize-cron:0 0 0 * * *}", zone = "America/Bogota")
    @Transactional
    public void finalizeCompletedReservations() {
        reservationService.markFinishedReservations();
    }
}