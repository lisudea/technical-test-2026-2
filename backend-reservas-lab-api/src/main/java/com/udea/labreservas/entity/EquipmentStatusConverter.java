package com.udea.labreservas.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class EquipmentStatusConverter implements AttributeConverter<EquipmentStatus, String> {

    @Override
    public String convertToDatabaseColumn(EquipmentStatus attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public EquipmentStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EquipmentStatus.fromDbValue(dbData);
    }
}