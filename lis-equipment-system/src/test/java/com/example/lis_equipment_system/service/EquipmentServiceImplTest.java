package com.example.lis_equipment_system.service;

import com.example.lis_equipment_system.common.exception.DuplicateResourceException;
import com.example.lis_equipment_system.common.exception.ResourceNotFoundException;
import com.example.lis_equipment_system.equipment.dto.EquipmentRequest;
import com.example.lis_equipment_system.equipment.dto.EquipmentResponse;
import com.example.lis_equipment_system.equipment.dto.EquipmentUpdateRequest;
import com.example.lis_equipment_system.equipment.entity.Equipment;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import com.example.lis_equipment_system.equipment.repository.EquipmentRepository;
import com.example.lis_equipment_system.equipment.service.impl.EquipmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EquipmentServiceImplTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private EquipmentServiceImpl equipmentService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createShouldPersistEquipmentAndReturnResponse() {
        EquipmentRequest request = new EquipmentRequest("Microscopio", "ABC-123", EquipmentCategory.COMPUTO,
                EquipmentStatus.DISPONIBLE);

        Equipment savedEquipment = new Equipment();
        savedEquipment.setId(10L);
        savedEquipment.setName(request.getName());
        savedEquipment.setMacSerialNumber(request.getMacSerialNumber());
        savedEquipment.setCategory(request.getCategory());
        savedEquipment.setStatus(request.getStatus());
        savedEquipment.setRegistrationDate(LocalDateTime.now());

        when(equipmentRepository.existsByMacSerialNumber(request.getMacSerialNumber())).thenReturn(false);
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(savedEquipment);

        EquipmentResponse response = equipmentService.create(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(request.getName(), response.getName());
        assertEquals(request.getMacSerialNumber(), response.getMacSerialNumber());
        assertEquals(request.getCategory(), response.getCategory());
        assertEquals(request.getStatus(), response.getStatus());
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void createShouldThrowWhenMacSerialNumberAlreadyExists() {
        EquipmentRequest request = new EquipmentRequest("Microscopio", "ABC-123", EquipmentCategory.COMPUTO,
                EquipmentStatus.DISPONIBLE);

        when(equipmentRepository.existsByMacSerialNumber(request.getMacSerialNumber())).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> equipmentService.create(request));

        assertTrue(exception.getMessage().contains("ABC-123"));
        verify(equipmentRepository, never()).save(any(Equipment.class));
    }

    @Test
    void updateShouldModifyExistingEquipment() {
        Equipment existing = new Equipment();
        existing.setId(7L);
        existing.setName("Viejo");
        existing.setMacSerialNumber("X1");
        existing.setCategory(EquipmentCategory.AUDIO_VIDEO);
        existing.setStatus(EquipmentStatus.EN_MANTENIMIENTO);

        EquipmentUpdateRequest request = new EquipmentUpdateRequest("Nuevo", EquipmentCategory.COMPUTO,
                EquipmentStatus.DISPONIBLE);

        when(equipmentRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipmentResponse response = equipmentService.update(7L, request);

        assertEquals("Nuevo", response.getName());
        assertEquals(EquipmentCategory.COMPUTO, response.getCategory());
        assertEquals(EquipmentStatus.DISPONIBLE, response.getStatus());
        assertNotNull(existing.getUpdateDate());
        verify(equipmentRepository).save(existing);
    }

    @Test
    void findByIdShouldThrowWhenEquipmentDoesNotExist() {
        when(equipmentRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.findById(99L));

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    void findAllShouldFilterAndMapThePage() {
        Equipment equipment = new Equipment();
        equipment.setId(3L);
        equipment.setName("Router");
        equipment.setMacSerialNumber("MAC-3");
        equipment.setCategory(EquipmentCategory.REDES);
        equipment.setStatus(EquipmentStatus.DISPONIBLE);

        Page<Equipment> page = new PageImpl<>(List.of(equipment));
        when(equipmentRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<EquipmentResponse> responsePage = equipmentService.findAll(EquipmentCategory.REDES,
                EquipmentStatus.DISPONIBLE, PageRequest.of(0, 10));

        assertEquals(1, responsePage.getContent().size());
        assertEquals("Router", responsePage.getContent().get(0).getName());
        verify(equipmentRepository).findAll(any(Specification.class), any(PageRequest.class));
    }
}
