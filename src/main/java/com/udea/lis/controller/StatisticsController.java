package com.udea.lis.controller;

import com.udea.lis.dto.response.TopEquipmentResponse;
import com.udea.lis.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Tag(name = "Statistics", description = "Equipment usage statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/top-equipment")
    @Operation(summary = "Get top 5 most historically reserved equipment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Top 5 equipment with reservation counts")
    })
    public ResponseEntity<List<TopEquipmentResponse>> getTopEquipment() {
        List<TopEquipmentResponse> topEquipment = statisticsService.getTop5Equipment();
        return ResponseEntity.ok(topEquipment);
    }
}
