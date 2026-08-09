package com.example.lis_equipment_system.reservation.service;

import com.example.lis_equipment_system.reservation.dto.ReservationRequest;
import com.example.lis_equipment_system.reservation.dto.ReservationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReservationService {

    ReservationResponse create(ReservationRequest request, String userEmail);

    void cancel(Long id, String userEmail);

    Page<ReservationResponse> findAll(Long equipmentId, Pageable pageable);
}