package com.lisudea.equipmentreservation.repository;

import com.lisudea.equipmentreservation.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
