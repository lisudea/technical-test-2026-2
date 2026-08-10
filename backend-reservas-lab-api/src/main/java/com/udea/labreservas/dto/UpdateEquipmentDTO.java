package com.udea.labreservas.dto;

import com.udea.labreservas.entity.EquipmentStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor 
@AllArgsConstructor
public class UpdateEquipmentDTO{
        
        private String equipmentName;
        private String macNumber;
        private EquipmentStatus status;
        private Integer categoryId;
}
