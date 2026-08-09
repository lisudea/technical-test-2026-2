package co.edu.udea.lis.lisource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import co.edu.udea.lis.lisource.reservation.api.ReservationDtos.CreateReservationRequest;
import co.edu.udea.lis.lisource.reservation.application.ReservationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LisourcePostgresIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("lisource_test")
            .withUsername("lisource")
            .withPassword("lisource")
            .withInitScripts("db/01-estructura.sql", "db/02-semilla.sql", "db/03-pruebas.sql");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.jwt.secret-base64", () -> "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        registry.add("app.google-client-id", () -> "");
        registry.add("springdoc.api-docs.enabled", () -> "true");
        registry.add("springdoc.swagger-ui.enabled", () -> "true");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcClient jdbc;
    @Autowired ReservationService reservations;
    @LocalServerPort int serverPort;

    @Test @Order(1)
    void validatesTwentyTablesAndDemoCounts() {
        long tables = jdbc.sql("select count(*) from information_schema.tables where table_schema='public' and table_name like 'tbl\\_%' escape '\\'")
                .query(Long.class).single();
        assertThat(tables).isEqualTo(20);
        assertThat(jdbc.sql("select count(*) from tbl_usuario").query(Long.class).single()).isEqualTo(6);
        assertThat(jdbc.sql("select count(*) from tbl_equipo").query(Long.class).single()).isEqualTo(15);
        assertThat(jdbc.sql("select count(*) from tbl_reserva").query(Long.class).single()).isEqualTo(12);
        assertThat(jdbc.sql("select count(*) from tbl_reserva_equipo").query(Long.class).single()).isEqualTo(15);
    }

    @Test @Order(2)
    void authenticatesDemoUsersAndRejectsInactiveUser() throws Exception {
        String selection = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin.demo@udea.edu.co\",\"password\":\"DemoAdmin2026!\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.roleSelectionRequired").value(true))
                .andExpect(jsonPath("$.availableRoles").isArray())
                .andExpect(jsonPath("$.selectionToken").isString())
                .andReturn().getResponse().getContentAsString();
        String selectionToken = mapper.readTree(selection).path("selectionToken").asText();
        mvc.perform(post("/api/v1/auth/select-role").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of(
                                "selectionToken", selectionToken, "role", "ADMINISTRADOR"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"inactivo.demo@udea.edu.co\",\"password\":\"DemoInactivo2026!\"}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_INACTIVE"));
    }

    @Test @Order(3)
    void enforcesAuthenticationPaginationFiltersAndRbac() throws Exception {
        mvc.perform(get("/api/v1/equipment")).andExpect(status().isUnauthorized());
        String userToken = login("usuario.demo@udea.edu.co", "DemoUsuario2026!");
        mvc.perform(get("/api/v1/equipment?page=1&pageSize=5&category=MICROCONTROLADORES")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(5));
        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test @Order(4)
    void allowsAdjacentIntervalsAndRejectsOverlap() {
        long user = userId("usuario.demo@udea.edu.co");
        long equipment = equipmentId("DEMO-MCU-001");
        reservations.create(request(equipment, "2035-01-10T10:00:00Z", "2035-01-10T12:00:00Z"), user);
        reservations.create(request(equipment, "2035-01-10T12:00:00Z", "2035-01-10T14:00:00Z"), user);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                reservations.create(request(equipment, "2035-01-10T11:59:00Z", "2035-01-10T13:00:00Z"), user))
                .isInstanceOfSatisfying(AppException.class, error -> assertThat(error.code().name()).isEqualTo("RESERVATION_CONFLICT"));
    }

    @Test @Order(5)
    void concurrentRequestsProduceExactlyOneSuccessAndOneConflict() throws Exception {
        long user = userId("reservas.demo@udea.edu.co");
        long equipment = equipmentId("DEMO-MCU-002");
        CreateReservationRequest request = request(equipment, "2036-02-10T10:00:00Z", "2036-02-10T12:00:00Z");
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<String> task = () -> {
            ready.countDown(); start.await(10, TimeUnit.SECONDS);
            try { reservations.create(request, user); return "CREATED"; }
            catch (AppException exception) { return exception.code().name(); }
        };
        Future<String> first = executor.submit(task);
        Future<String> second = executor.submit(task);
        assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        List<String> results = List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS));
        executor.shutdownNow();
        assertThat(results).containsExactlyInAnyOrder("CREATED", "RESERVATION_CONFLICT");
    }

    @Test @Order(6)
    void multiEquipmentConflictRollsBackAtomicallyAndCancelledDoesNotBlock() {
        long user = userId("usuario.demo@udea.edu.co");
        long a = equipmentId("DEMO-IOT-001");
        long b = equipmentId("DEMO-IOT-002");
        reservations.create(request(b, "2037-03-10T10:00:00Z", "2037-03-10T12:00:00Z"), user);
        long before = jdbc.sql("select count(*) from tbl_reserva").query(Long.class).single();
        CreateReservationRequest both = new CreateReservationRequest(List.of(a, b),
                Instant.parse("2037-03-10T10:30:00Z"), Instant.parse("2037-03-10T11:30:00Z"), null);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reservations.create(both, user))
                .isInstanceOf(AppException.class);
        assertThat(jdbc.sql("select count(*) from tbl_reserva").query(Long.class).single()).isEqualTo(before);

        var cancellable = reservations.create(request(a, "2038-04-10T10:00:00Z", "2038-04-10T12:00:00Z"), user);
        reservations.cancel(cancellable.id(), user, false, "No longer needed");
        assertThat(reservations.create(request(a, "2038-04-10T10:00:00Z", "2038-04-10T12:00:00Z"), user)).isNotNull();
    }

    @Test @Order(7)
    void topFiveExcludesCancelledReservations() throws Exception {
        String token = login("usuario.demo@udea.edu.co", "DemoUsuario2026!");
        mvc.perform(get("/api/v1/statistics/top-equipment").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].totalReservations").isNumber());
        long cancelledContribution = jdbc.sql("""
                select count(*) from tbl_reserva_equipo re join tbl_reserva r on r.id_reserva=re.id_reserva
                join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                where r.codigo_reserva in ('DEMO-RES-003','DEMO-RES-010') and er.codigo='CONFIRMADA'
                """).query(Long.class).single();
        assertThat(cancelledContribution).isZero();
    }

    @Test @Order(8)
    void administersUsersRolesAndCatalogsAndProtectsLastAdministrator() throws Exception {
        String adminToken = loginWithRole("admin.demo@udea.edu.co", "DemoAdmin2026!", "ADMINISTRADOR");
        long adminId = userId("admin.demo@udea.edu.co");
        long dualId = userId("dual.demo@udea.edu.co");

        mvc.perform(get("/api/v1/admin/users?page=1&pageSize=3&role=ADMINISTRADOR")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(patch("/api/v1/admin/users/{id}/status", adminId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVO\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("LAST_ADMIN_PROTECTION"));

        mvc.perform(put("/api/v1/admin/users/{id}/roles/ADMINISTRADOR", dualId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.roles").isArray());
        mvc.perform(patch("/api/v1/admin/users/{id}/status", adminId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVO\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INACTIVO"));

        String code = "TEST_CONTAINER_CATEGORY";
        String created = mvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + code + "\",\"name\":\"Testcontainer category\",\"description\":\"Isolated integration test\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString();
        int categoryId = mapper.readTree(created).path("id").asInt();
        mvc.perform(patch("/api/v1/admin/categories/{id}/status", categoryId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVO\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        mvc.perform(get("/api/v1/admin/locations").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
    }

    @Test @Order(9)
    void publishesEvaluatorReadyOpenApiContract() throws Exception {
        mvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
        String body = mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
                .andExpect(jsonPath("$.paths['/api/v1/auth/login'].post.tags[0]").value("Authentication"))
                .andExpect(jsonPath("$.paths['/api/v1/auth/login'].post.security").isArray())
                .andExpect(jsonPath("$.paths['/api/v1/reservations'].post.responses['409'].content['application/problem+json'].examples.RESERVATION_CONFLICT.value.code").value("RESERVATION_CONFLICT"))
                .andExpect(jsonPath("$.paths['/api/v1/equipment/{id}/image'].post.requestBody.content['multipart/form-data'].schema.properties.file.format").value("binary"))
                .andExpect(jsonPath("$.paths['/api/v1/admin/users'].get.tags[0]").value("Administration - Users"))
                .andReturn().getResponse().getContentAsString();
        var api = mapper.readTree(body);
        int operations = 0;
        int requestBodies = 0;
        for (var path : api.path("paths")) {
            for (var operation : path) {
                if (operation.has("responses")) {
                    operations++;
                    assertThat(operation.path("summary").asText()).isNotBlank();
                    assertThat(operation.path("description").asText()).contains("Acceso:");
                    assertThat(operation.path("tags").size()).isEqualTo(1);
                    if (operation.has("requestBody")) {
                        requestBodies++;
                        boolean hasExample = false;
                        for (var mediaType : operation.path("requestBody").path("content")) {
                            hasExample |= mediaType.has("example") || !mediaType.path("examples").isEmpty();
                        }
                        assertThat(hasExample).as("request body example for %s", operation.path("operationId").asText()).isTrue();
                    }
                }
            }
        }
        assertThat(operations).isGreaterThanOrEqualTo(45);
        assertThat(requestBodies).isEqualTo(25);
        assertThat(api.path("components").path("schemas").path("ApiProblem").path("properties").path("code").isObject()).isTrue();

        List<String> brokenReferences = new ArrayList<>();
        api.findValues("$ref").forEach(referenceNode -> {
            String reference = referenceNode.asText();
            if (reference.startsWith("#/") && api.at(reference.substring(1)).isMissingNode()) {
                brokenReferences.add(reference);
            }
        });
        assertThat(brokenReferences).isEmpty();
    }

    @Test @Order(10)
    void authenticatesRealStompConnectionAndReceivesAfterCommitEvent() throws Exception {
        String token = login("usuario.demo@udea.edu.co", "DemoUsuario2026!");
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + token);
        StompSession session = client.connectAsync("ws://localhost:" + serverPort + "/ws",
                        new WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() {})
                .get(10, TimeUnit.SECONDS);
        CompletableFuture<String> event = new CompletableFuture<>();
        session.subscribe("/topic/reservations", new StompFrameHandler() {
            @Override public java.lang.reflect.Type getPayloadType(StompHeaders headers) { return byte[].class; }
            @Override public void handleFrame(StompHeaders headers, Object payload) {
                event.complete(new String((byte[]) payload, java.nio.charset.StandardCharsets.UTF_8));
            }
        });
        long user = userId("usuario.demo@udea.edu.co");
        long equipment = equipmentId("DEMO-IOT-001");
        reservations.create(request(equipment, "2040-05-10T10:00:00Z", "2040-05-10T12:00:00Z"), user);
        assertThat(event.get(10, TimeUnit.SECONDS)).contains("RESERVATION_CREATED");
        session.disconnect();
        client.stop();
    }

    @Test @Order(11)
    void hardensProfileAndActiveSessionLifecycle() throws Exception {
        String email = "usuario.demo@udea.edu.co";
        LoginResult current = loginResult(email, "DemoUsuario2026!");
        LoginResult other = loginResult(email, "DemoUsuario2026!");
        long userId = userId(email);
        long expiredId = jdbc.sql("""
                insert into tbl_sesion
                  (id_usuario,refresh_token_hash,fecha_creacion,fecha_expiracion,ip_origen,user_agent)
                values (:userId,:hash,now()-interval '10 days',now()-interval '3 days','::1','ExpiredTest')
                returning id_sesion
                """).param("userId", userId).param("hash", "e".repeat(64)).query(Long.class).single();
        long revokedId = jdbc.sql("""
                insert into tbl_sesion
                  (id_usuario,refresh_token_hash,fecha_creacion,fecha_expiracion,fecha_revocacion,ip_origen,user_agent)
                values (:userId,:hash,now()-interval '1 day',now()+interval '6 days',now()-interval '1 hour',
                        '127.0.0.1','RevokedTest')
                returning id_sesion
                """).param("userId", userId).param("hash", "f".repeat(64)).query(Long.class).single();

        String sessionsBody = mvc.perform(get("/api/v1/sessions")
                        .header("Authorization", "Bearer " + current.accessToken()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var sessions = mapper.readTree(sessionsBody);
        assertThat(sessions).anyMatch(session -> session.path("id").asLong() == current.sessionId()
                && session.path("current").asBoolean());
        assertThat(sessions).noneMatch(session -> session.path("id").asLong() == expiredId
                || session.path("id").asLong() == revokedId);

        mvc.perform(delete("/api/v1/sessions/{id}", other.sessionId())
                        .header("Authorization", "Bearer " + current.accessToken()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/sessions").header("Authorization", "Bearer " + current.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.current == true)]").isNotEmpty());
        mvc.perform(post("/api/v1/auth/refresh").cookie(other.refreshCookie()))
                .andExpect(status().isUnauthorized());

        LoginResult third = loginResult(email, "DemoUsuario2026!");
        mvc.perform(post("/api/v1/sessions/logout-others")
                        .header("Authorization", "Bearer " + current.accessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.revokedSessions").isNumber());
        mvc.perform(post("/api/v1/auth/refresh").cookie(third.refreshCookie()))
                .andExpect(status().isUnauthorized());

        mvc.perform(patch("/api/v1/profile")
                        .header("Authorization", "Bearer " + current.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"  María Camila  ","lastName":"De la Hoz Valencia",
                                 "languageCode":"fr","email":"attacker@udea.edu.co","roles":["ADMINISTRADOR"],
                                 "id":999}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("María Camila"))
                .andExpect(jsonPath("$.lastName").value("De la Hoz Valencia"))
                .andExpect(jsonPath("$.preferredLanguage").value("fr"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.roles[0]").value("USUARIO"));
        mvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + current.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("María Camila"))
                .andExpect(jsonPath("$.preferredLanguage").value("fr"));
        mvc.perform(patch("/api/v1/profile")
                        .header("Authorization", "Bearer " + current.accessToken())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"firstName\":\"   \"}"))
                .andExpect(status().isUnprocessableEntity());

        LoginResult allPeer = loginResult(email, "DemoUsuario2026!");
        mvc.perform(post("/api/v1/auth/logout-all")
                        .header("Authorization", "Bearer " + current.accessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.revokedSessions").isNumber());
        mvc.perform(post("/api/v1/auth/refresh").cookie(current.refreshCookie()))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh").cookie(allPeer.refreshCookie()))
                .andExpect(status().isUnauthorized());

        List<LoginResult> limited = new ArrayList<>();
        for (int login = 0; login < 6; login++) {
            limited.add(loginResult(email, "DemoUsuario2026!"));
        }
        LoginResult latest = limited.getLast();
        mvc.perform(get("/api/v1/sessions").header("Authorization", "Bearer " + latest.accessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[?(@.current == true)]").isNotEmpty());
        mvc.perform(post("/api/v1/auth/refresh").cookie(limited.getFirst().refreshCookie()))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + latest.accessToken())
                        .cookie(latest.refreshCookie()))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/auth/refresh").cookie(latest.refreshCookie()))
                .andExpect(status().isUnauthorized());
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).path("accessToken").asText();
    }

    private LoginResult loginResult(String email, String password) throws Exception {
        var response = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse();
        String accessToken = mapper.readTree(response.getContentAsString()).path("accessToken").asText();
        String payload = new String(java.util.Base64.getUrlDecoder().decode(accessToken.split("\\.")[1]),
                java.nio.charset.StandardCharsets.UTF_8);
        long sessionId = mapper.readTree(payload).path("sid").asLong();
        jakarta.servlet.http.Cookie refresh = response.getCookie("lisource_refresh");
        assertThat(refresh).isNotNull();
        return new LoginResult(accessToken, sessionId, refresh);
    }

    private record LoginResult(String accessToken, long sessionId, jakarta.servlet.http.Cookie refreshCookie) {}

    private String loginWithRole(String email, String password, String role) throws Exception {
        String loginBody = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var loginJson = mapper.readTree(loginBody);
        if (!loginJson.path("roleSelectionRequired").asBoolean()) return loginJson.path("accessToken").asText();
        String selected = mvc.perform(post("/api/v1/auth/select-role").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of(
                                "selectionToken", loginJson.path("selectionToken").asText(), "role", role))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(selected).path("accessToken").asText();
    }

    private long userId(String email) {
        return jdbc.sql("select id_usuario from tbl_usuario where correo=:email").param("email", email).query(Long.class).single();
    }

    private long equipmentId(String code) {
        return jdbc.sql("select id_equipo from tbl_equipo where codigo_inventario=:code").param("code", code).query(Long.class).single();
    }

    private CreateReservationRequest request(long equipment, String start, String end) {
        return new CreateReservationRequest(List.of(equipment), Instant.parse(start), Instant.parse(end), null);
    }
}
