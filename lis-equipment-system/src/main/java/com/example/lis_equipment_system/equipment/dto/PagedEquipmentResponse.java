package com.example.lis_equipment_system.equipment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagedEquipmentResponse {

    private List<EquipmentResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
