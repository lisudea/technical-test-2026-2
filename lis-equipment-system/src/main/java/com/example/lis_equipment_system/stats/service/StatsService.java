package com.example.lis_equipment_system.stats.service;

import com.example.lis_equipment_system.stats.dto.CancellationRateResponse;
import com.example.lis_equipment_system.stats.dto.CategoryReservationResponse;
import com.example.lis_equipment_system.stats.dto.TopEquipmentResponse;

import java.util.List;

public interface StatsService {
    List<TopEquipmentResponse> getTopRequestedEquipment();
    List<CategoryReservationResponse> getReservationsByCategory();
    CancellationRateResponse getCancellationRate();
}