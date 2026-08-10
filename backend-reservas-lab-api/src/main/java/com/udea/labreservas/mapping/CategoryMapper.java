package com.udea.labreservas.mapping;

import com.udea.labreservas.dto.CategoryDTO;
import com.udea.labreservas.entity.EquipmentCategory;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryDTO toDto(EquipmentCategory category) {
        if (category == null) {
            return null;
        }
        return new CategoryDTO(category.getCategoryId(), category.getCategoryName());
    }
}