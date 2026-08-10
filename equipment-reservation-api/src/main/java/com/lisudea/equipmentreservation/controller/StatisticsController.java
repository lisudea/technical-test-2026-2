package com.lisudea.equipmentreservation.controller;

import com.lisudea.equipmentreservation.dto.response.TopEquipmentResponse;
import com.lisudea.equipmentreservation.service.EquipmentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final EquipmentService equipmentService;

    public StatisticsController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping("/top-reserved")
    public List<TopEquipmentResponse> topReserved() {
        return equipmentService.getTopReserved();
    }
}
