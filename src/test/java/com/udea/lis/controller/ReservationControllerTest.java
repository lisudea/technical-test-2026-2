package com.udea.lis.controller;

import com.udea.lis.dto.request.CreateEquipmentRequest;
import com.udea.lis.dto.request.CreateReservationRequest;
import com.udea.lis.dto.request.CreateUserRequest;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@DisplayName("Reservation Controller Integration Tests")
class ReservationControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    private static final LocalDateTime BASE_DATE = LocalDateTime.of(2026, 8, 10, 10, 0);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        cleanDatabase();
    }

    private long createUser(String name, String email) throws Exception {
        CreateUserRequest request = CreateUserRequest.builder()
                .name(name).email(email).build();
        MvcResult result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long createEquipment(String name, String serial) throws Exception {
        CreateEquipmentRequest request = CreateEquipmentRequest.builder()
                .name(name).serialNumber(serial)
                .category(EquipmentCategory.COMPUTING).status(EquipmentStatus.AVAILABLE)
                .build();
        MvcResult result = mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private CreateReservationRequest buildReservation(long equipmentId, long userId,
                                                       LocalDateTime start, LocalDateTime end) {
        return CreateReservationRequest.builder()
                .equipmentId(equipmentId).userId(userId)
                .startTime(start).endTime(end).build();
    }

    private String format(LocalDateTime dt) {
        return dt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    @Nested
    @DisplayName("POST /api/reservations")
    class CreateReservation {

        long equipmentId;
        long userId;

        @BeforeEach
        void seed() throws Exception {
            equipmentId = createEquipment("Test Equipment", "SN-RES-001");
            userId = createUser("Test User", "test@udea.edu.co");
        }

        @Test
        @DisplayName("should create reservation and return 201")
        void shouldCreateReservation() throws Exception {
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildReservation(equipmentId, userId, BASE_DATE, BASE_DATE.plusHours(2)))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNumber())
                    .andExpect(jsonPath("$.status", is("ACTIVE")))
                    .andExpect(jsonPath("$.equipment.id", is((int) equipmentId)))
                    .andExpect(jsonPath("$.user.id", is((int) userId)));
        }

        @Test
        @DisplayName("should reject reservation when start equals end")
        void shouldRejectEqualDates() throws Exception {
            LocalDateTime same = BASE_DATE;
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildReservation(equipmentId, userId, same, same))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should reject reservation when start is after end")
        void shouldRejectInvalidDateOrder() throws Exception {
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildReservation(equipmentId, userId,
                                            BASE_DATE.plusHours(2), BASE_DATE))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for nonexistent equipment")
        void shouldRejectNonexistentEquipment() throws Exception {
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildReservation(999L, userId, BASE_DATE, BASE_DATE.plusHours(2)))))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 404 for nonexistent user")
        void shouldRejectNonexistentUser() throws Exception {
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildReservation(equipmentId, 999L, BASE_DATE, BASE_DATE.plusHours(2)))))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should reject overlapping reservation with 409")
        void shouldRejectOverlappingReservation() throws Exception {
            CreateReservationRequest first = buildReservation(equipmentId, userId,
                    BASE_DATE, BASE_DATE.plusHours(2));
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(first)))
                    .andExpect(status().isCreated());

            CreateReservationRequest overlapping = buildReservation(equipmentId, userId,
                    BASE_DATE.plusHours(1), BASE_DATE.plusHours(3));
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(overlapping)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.error", is("Conflict")));
        }

        @Test
        @DisplayName("should allow back-to-back reservation (no gap, no overlap)")
        void shouldAllowBackToBackReservation() throws Exception {
            CreateReservationRequest first = buildReservation(equipmentId, userId,
                    BASE_DATE, BASE_DATE.plusHours(1));
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(first)))
                    .andExpect(status().isCreated());

            CreateReservationRequest backToBack = buildReservation(equipmentId, userId,
                    BASE_DATE.plusHours(1), BASE_DATE.plusHours(2));
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(backToBack)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("should ignore cancelled reservation and allow new one")
        void shouldIgnoreCancelledReservation() throws Exception {
            CreateReservationRequest first = buildReservation(equipmentId, userId,
                    BASE_DATE, BASE_DATE.plusHours(2));
            MvcResult result = mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(first)))
                    .andExpect(status().isCreated())
                    .andReturn();

            long reservationId = objectMapper.readTree(
                    result.getResponse().getContentAsString()).get("id").asLong();

            mockMvc.perform(delete("/api/reservations/" + reservationId))
                    .andExpect(status().isNoContent());

            CreateReservationRequest overlapping = buildReservation(equipmentId, userId,
                    BASE_DATE.plusHours(1), BASE_DATE.plusHours(3));
            mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(overlapping)))
                    .andExpect(status().isCreated());
        }
    }

    @Nested
    @DisplayName("DELETE /api/reservations/{id}")
    class CancelReservation {

        @Test
        @DisplayName("should cancel reservation and return 204")
        void shouldCancelReservation() throws Exception {
            long equipmentId = createEquipment("Eq", "SN-CANCEL-001");
            long userId = createUser("User", "cancel@udea.edu.co");

            MvcResult result = mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildReservation(equipmentId, userId, BASE_DATE, BASE_DATE.plusHours(2)))))
                    .andExpect(status().isCreated())
                    .andReturn();

            long reservationId = objectMapper.readTree(
                    result.getResponse().getContentAsString()).get("id").asLong();

            mockMvc.perform(delete("/api/reservations/" + reservationId))
                    .andExpect(status().isNoContent());

            mockMvc.perform(get("/api/reservations/" + reservationId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("CANCELLED")));
        }

        @Test
        @DisplayName("should return 404 when cancelling nonexistent reservation")
        void shouldReturn404ForNonexistent() throws Exception {
            mockMvc.perform(delete("/api/reservations/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/equipment/{equipmentId}/reservations")
    class GetEquipmentReservations {

        @Test
        @DisplayName("should return reservations for equipment")
        void shouldReturnReservationsForEquipment() throws Exception {
            long equipmentId = createEquipment("Eq2", "SN-EQ-RES-001");
            long userId = createUser("User2", "eqres@udea.edu.co");

            mockMvc.perform(post("/api/reservations")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(
                            buildReservation(equipmentId, userId, BASE_DATE, BASE_DATE.plusHours(1)))))
                    .andExpect(status().isCreated());

            mockMvc.perform(post("/api/reservations")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(
                            buildReservation(equipmentId, userId, BASE_DATE.plusHours(2), BASE_DATE.plusHours(3)))))
                    .andExpect(status().isCreated());

            mockMvc.perform(get("/api/equipment/" + equipmentId + "/reservations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)));
        }

        @Test
        @DisplayName("should return 404 for nonexistent equipment")
        void shouldReturn404ForNonexistent() throws Exception {
            mockMvc.perform(get("/api/equipment/999/reservations"))
                    .andExpect(status().isNotFound());
        }
    }

    private void cleanDatabase() {
        jdbcTemplate.execute("TRUNCATE TABLE reservations, equipment, users RESTART IDENTITY CASCADE");
    }
}
