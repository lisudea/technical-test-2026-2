package com.udea.labreservas.service;

import com.udea.labreservas.dto.CategoryDTO;
import com.udea.labreservas.dto.CreateCategoryDTO;
import com.udea.labreservas.entity.EquipmentCategory;
import com.udea.labreservas.exception.AlreadyExistsException;
import com.udea.labreservas.exception.ResourceNotFoundException;
import com.udea.labreservas.mapping.CategoryMapper;
import com.udea.labreservas.repository.EquipmentCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentCategoryService {

    private final EquipmentCategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<CategoryDTO> findAll() {
        return categoryRepository.findAll().stream().map(categoryMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public CategoryDTO findById(Integer categoryId) {
        return categoryMapper.toDto(requireById(categoryId));
    }

    @Transactional
    public CategoryDTO create(CreateCategoryDTO dto) {
        String categoryName = dto.categoryName().trim();
        boolean exists = categoryRepository.findAll().stream()
                .anyMatch(c -> c.getCategoryName().equalsIgnoreCase(categoryName));
        if (exists) {
            throw new AlreadyExistsException("Ya existe una categoria con el nombre " + categoryName);
        }

        EquipmentCategory category = new EquipmentCategory();
        category.setCategoryName(categoryName);
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public EquipmentCategory requireById(Integer categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe la categoria con id " + categoryId));
    }
}