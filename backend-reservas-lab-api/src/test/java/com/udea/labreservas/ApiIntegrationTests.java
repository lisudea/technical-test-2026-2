package com.udea.labreservas;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private MvcResult postJson(String url, String body, String token) throws Exception {
        var request = post(url).contentType(MediaType.APPLICATION_JSON).content(body);
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(request).andReturn();
    }

    private String tokenFrom(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }

@Test
    void registroPermiteSoloDominioInstitucional() throws Exception {
        String valid = """
                {"name":"Ana","lastName":"Lopez","email":"ana@udea.edu.co","password":"Secret123"}
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(valid))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty());

        String invalid = """
                {"name":"Ana","lastName":"Lopez","email":"ana@gmail.com","password":"Secret123"}
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void registroDuplicadoDevuelve409() throws Exception {
        String body = "{\"name\":\"Juan\",\"lastName\":\"Perez\",\"email\":\"juan@udea.edu.co\",\"password\":\"Secret123\"}";

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void loginConCredencialesIncorrectasDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nadie@udea.edu.co\",\"password\":\"mala-clave\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void soloAdministradorPuedeGestionarEquipos() throws Exception {
        MvcResult registration = postJson("/api/auth/register",
                "{\"name\":\"Maria\",\"lastName\":\"Castro\",\"email\":\"maria@udea.edu.co\",\"password\":\"Secret123\"}",
                null);
        String userToken = tokenFrom(registration);

        MvcResult adminLogin = postJson("/api/auth/login",
                "{\"email\":\"admin@udea.edu.co\",\"password\":\"Admin1234\"}", null);
        String adminToken = tokenFrom(adminLogin);

        String equipmentBody = """
                {"equipmentName":"Router Prueba","macNumber":"AA:BB:CC:00:11:22","status":"DISPONIBLE","categoryId":1}
                """;

        mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(equipmentBody)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(equipmentBody)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.equipmentId").exists());
    }

    @Test
    void noSePermitenReservasConHorarioTraslapado() throws Exception {
        MvcResult registration = postJson("/api/auth/register",
                "{\"name\":\"Carlos\",\"lastName\":\"Gomez\",\"email\":\"carlos@udea.edu.co\",\"password\":\"Secret123\"}",
                null);
        String userToken = tokenFrom(registration);

        MvcResult adminLogin = postJson("/api/auth/login",
                "{\"email\":\"admin@udea.edu.co\",\"password\":\"Admin1234\"}", null);
        String adminToken = tokenFrom(adminLogin);

        int categoryId = 1;
        String equipmentBody = """
                {"equipmentName":"Sonda Laboratorio","macNumber":"AA:BB:CC:00:00:01","status":"DISPONIBLE","categoryId":%d}
                """.formatted(categoryId);

        MvcResult equipmentCreated = mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(equipmentBody)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andReturn();

        int equipmentId = objectMapper.readTree(equipmentCreated.getResponse().getContentAsString())
                .get("equipmentId").asInt();

        String reservation = """
                {"equipmentId":%d,"startTime":"2026-08-10T08:00:00","endTime":"2026-08-10T11:00:00"}
                """.formatted(equipmentId);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservation)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservationId").exists());

        String overlapping = """
                {"equipmentId":%d,"startTime":"2026-08-10T09:00:00","endTime":"2026-08-10T12:00:00"}
                """.formatted(equipmentId);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(overlapping)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("traslapa")));

        String noOverlap = """
                {"equipmentId":%d,"startTime":"2026-08-10T12:00:00","endTime":"2026-08-10T14:00:00"}
                """.formatted(equipmentId);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noOverlap)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated());
    }

    @Test
    void cancelarReservaYListarEquiposConFiltros() throws Exception {
        mockMvc.perform(get("/api/equipment")
                        .param("page", "0")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + loginUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$._embedded.equipmentDTOList").isArray())
                .andExpect(jsonPath("$.page.number").value(0));

        mockMvc.perform(get("/api/equipment")
                        .param("status", "DISPONIBLE")
                        .header("Authorization", "Bearer " + loginUser()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/equipment/1")
                        .header("Authorization", "Bearer " + loginUser()))
                .andExpect(status().isOk());
    }

    private String loginUser() throws Exception {
        MvcResult result = postJson("/api/auth/login",
                "{\"email\":\"estudiante@udea.edu.co\",\"password\":\"Usuario1234\"}", null);
        return tokenFrom(result);
    }
}