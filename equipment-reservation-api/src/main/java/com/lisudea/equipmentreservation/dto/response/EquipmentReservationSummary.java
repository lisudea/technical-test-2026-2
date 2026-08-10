package com.lisudea.equipmentreservation.dto.response;

public class EquipmentReservationSummary {
    private Long id;
    private String name;
    private CategoryResponse category;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public CategoryResponse getCategory() { return category; }
    public void setCategory(CategoryResponse category) { this.category = category; }
}
