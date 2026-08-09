package com.udea.lis.controller;

import tools.jackson.databind.ObjectMapper;
import com.udea.lis.dto.request.CreateEquipmentRequest;
import com.udea.lis.dto.request.UpdateEquipmentRequest;
import com.udea.lis.entity.EquipmentCategory;
import com.udea.lis.entity.EquipmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@DisplayName("Equipment Controller Integration Tests")
class EquipmentControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private CreateEquipmentRequest validRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        cleanDatabase();
        validRequest = CreateEquipmentRequest.builder()
                .name("Raspberry Pi 5")
                .serialNumber("SN-RPI-001")
                .macAddress("B8:27:EB:00:00:01")
                .category(EquipmentCategory.COMPUTING)
                .status(EquipmentStatus.AVAILABLE)
                .build();
    }

    @Nested
    @DisplayName("POST /api/equipment")
    class CreateEquipment {

        @Test
        @DisplayName("should create equipment and return 201")
        void shouldCreateEquipment() throws Exception {
            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNumber())
                    .andExpect(jsonPath("$.name", is("Raspberry Pi 5")))
                    .andExpect(jsonPath("$.serialNumber", is("SN-RPI-001")))
                    .andExpect(jsonPath("$.category", is("COMPUTING")))
                    .andExpect(jsonPath("$.status", is("AVAILABLE")));
        }

        @Test
        @DisplayName("should reject equipment with blank name")
        void shouldRejectBlankName() throws Exception {
            validRequest.setName("");

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("Bad Request")));
        }

        @Test
        @DisplayName("should reject equipment with null category")
        void shouldRejectNullCategory() throws Exception {
            validRequest.setCategory(null);

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should reject duplicate serial number")
        void shouldRejectDuplicateSerialNumber() throws Exception {
            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated());

            validRequest.setMacAddress("B8:27:EB:00:00:02");

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("Serial number")));
        }

        @Test
        @DisplayName("should reject duplicate MAC address")
        void shouldRejectDuplicateMacAddress() throws Exception {
            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated());

            validRequest.setSerialNumber("SN-RPI-002");

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("MAC address")));
        }

        @Test
        @DisplayName("should default status to AVAILABLE when not provided")
        void shouldDefaultStatusToAvailable() throws Exception {
            validRequest.setStatus(null);

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status", is("AVAILABLE")));
        }
    }

    @Nested
    @DisplayName("GET /api/equipment/{id}")
    class GetEquipment {

        @Test
        @DisplayName("should return equipment by ID")
        void shouldReturnEquipment() throws Exception {
            String location = mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andReturn().getResponse().getHeader("Location");

            mockMvc.perform(get("/api/equipment/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(1)))
                    .andExpect(jsonPath("$.name", is("Raspberry Pi 5")));
        }

        @Test
        @DisplayName("should return 404 for non-existent equipment")
        void shouldReturn404() throws Exception {
            mockMvc.perform(get("/api/equipment/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error", is("Not Found")));
        }
    }

    @Nested
    @DisplayName("PUT /api/equipment/{id}")
    class UpdateEquipment {

        @Test
        @DisplayName("should update equipment")
        void shouldUpdateEquipment() throws Exception {
            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated());

            UpdateEquipmentRequest update = UpdateEquipmentRequest.builder()
                    .name("Raspberry Pi 5 Updated")
                    .serialNumber("SN-RPI-001-U")
                    .macAddress("B8:27:EB:00:00:99")
                    .category(EquipmentCategory.NETWORKING)
                    .status(EquipmentStatus.MAINTENANCE)
                    .build();

            mockMvc.perform(put("/api/equipment/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(update)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name", is("Raspberry Pi 5 Updated")))
                    .andExpect(jsonPath("$.serialNumber", is("SN-RPI-001-U")))
                    .andExpect(jsonPath("$.category", is("NETWORKING")))
                    .andExpect(jsonPath("$.status", is("MAINTENANCE")));
        }

        @Test
        @DisplayName("should return 404 when updating non-existent equipment")
        void shouldReturn404ForNonExistent() throws Exception {
            UpdateEquipmentRequest update = UpdateEquipmentRequest.builder()
                    .name("Ghost")
                    .serialNumber("SN-GHOST")
                    .category(EquipmentCategory.VR)
                    .status(EquipmentStatus.AVAILABLE)
                    .build();

            mockMvc.perform(put("/api/equipment/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(update)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/equipment")
    class ListEquipment {

        @BeforeEach
        void seedEquipment() throws Exception {
            for (int i = 1; i <= 5; i++) {
                CreateEquipmentRequest req = CreateEquipmentRequest.builder()
                        .name("Equipment " + i)
                        .serialNumber("SN-LIST-" + i)
                        .category(i <= 2 ? EquipmentCategory.MICROCONTROLLERS :
                                i <= 4 ? EquipmentCategory.VR : EquipmentCategory.NETWORKING)
                        .status(i % 2 == 1 ? EquipmentStatus.AVAILABLE : EquipmentStatus.MAINTENANCE)
                        .build();
                mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)));
            }
        }

        @Test
        @DisplayName("should list all equipment with pagination")
        void shouldListAllEquipment() throws Exception {
            mockMvc.perform(get("/api/equipment"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(5)))
                    .andExpect(jsonPath("$.totalElements", is(5)))
                    .andExpect(jsonPath("$.totalPages", is(1)))
                    .andExpect(jsonPath("$.first", is(true)))
                    .andExpect(jsonPath("$.last", is(true)));
        }

        @Test
        @DisplayName("should paginate equipment")
        void shouldPaginate() throws Exception {
            mockMvc.perform(get("/api/equipment?page=0&size=2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.totalElements", is(5)))
                    .andExpect(jsonPath("$.totalPages", is(3)))
                    .andExpect(jsonPath("$.first", is(true)))
                    .andExpect(jsonPath("$.last", is(false)));
        }

        @Test
        @DisplayName("should filter by category")
        void shouldFilterByCategory() throws Exception {
            mockMvc.perform(get("/api/equipment?category=VR"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.content[0].category", is("VR")))
                    .andExpect(jsonPath("$.content[1].category", is("VR")));
        }

        @Test
        @DisplayName("should filter by status")
        void shouldFilterByStatus() throws Exception {
            mockMvc.perform(get("/api/equipment?status=AVAILABLE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(3)))
                    .andExpect(jsonPath("$.content[0].status", is("AVAILABLE")));
        }

        @Test
        @DisplayName("should combine category and status filter")
        void shouldCombineFilters() throws Exception {
            mockMvc.perform(get("/api/equipment?category=MICROCONTROLLERS&status=AVAILABLE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)));
        }

        @Test
        @DisplayName("should return empty page when no equipment matches filter")
        void shouldReturnEmptyPage() throws Exception {
            mockMvc.perform(get("/api/equipment?category=SENSORS"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)))
                     .andExpect(jsonPath("$.totalElements", is(0)));
        }
    }

    private void cleanDatabase() {
        jdbcTemplate.execute("TRUNCATE TABLE reservations, equipment, users RESTART IDENTITY CASCADE");
    }
}
