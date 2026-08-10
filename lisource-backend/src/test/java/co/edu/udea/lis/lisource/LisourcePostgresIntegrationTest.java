package co.edu.udea.lis.lisource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import co.edu.udea.lis.lisource.reservation.api.ReservationDtos.CreateReservationRequest;
import co.edu.udea.lis.lisource.reservation.application.ReservationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import java.time.Instant;
import java.time.OffsetDateTime;
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
    @Autowired org.springframework.security.oauth2.jwt.JwtEncoder jwtEncoder;
    @Autowired co.edu.udea.lis.lisource.shared.security.TokenCodec tokenCodec;
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
        List<String> expectedTables = List.of(
                "tbl_estado_registro", "tbl_estado_usuario", "tbl_estado_equipo", "tbl_estado_reserva",
                "tbl_rol", "tbl_idioma", "tbl_usuario", "tbl_usuario_rol", "tbl_sesion",
                "tbl_recuperacion_password", "tbl_categoria_equipo", "tbl_ubicacion", "tbl_equipo",
                "tbl_reserva", "tbl_reserva_equipo", "tbl_categoria_configuracion", "tbl_configuracion",
                "tbl_nivel_auditoria", "tbl_tipo_evento_auditoria", "tbl_auditoria");
        expectedTables.forEach(table -> assertThat(jdbc.sql("select count(*) from " + table)
                .query(Long.class).single()).as(table).isPositive());
        assertThat(jdbc.sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace "
                + "where n.nspname='public' and c.relname like 'tbl\\_%' escape '\\' and c.relrowsecurity")
                .query(Long.class).single()).isEqualTo(20);
        assertThat(jdbc.sql("select count(*) from information_schema.table_constraints "
                + "where table_schema='public' and constraint_type='PRIMARY KEY'")
                .query(Long.class).single()).isEqualTo(20);
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
        assertThat(jdbc.sql("""
                select count(*) from tbl_reserva r
                join tbl_reserva_equipo re on re.id_reserva=r.id_reserva
                join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                where re.id_equipo=:equipment and er.codigo='CONFIRMADA'
                  and r.fecha_inicio=:startsAt and r.fecha_fin=:endsAt
                """).param("equipment", equipment)
                .param("startsAt", OffsetDateTime.parse("2036-02-10T10:00:00Z"))
                .param("endsAt", OffsetDateTime.parse("2036-02-10T12:00:00Z"))
                .query(Long.class).single()).isEqualTo(1L);
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
        adminToken = loginWithRole("dual.demo@udea.edu.co", "DemoDual2026!", "ADMINISTRADOR");

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
        mvc.perform(get("/api/v1/profile")
                        .header("Authorization", "Bearer " + other.accessToken()))
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

    @Test @Order(12)
    void exercisesEquipmentCrudFiltersValidationAndAuthorization() throws Exception {
        String adminToken = loginWithRole("dual.demo@udea.edu.co", "DemoDual2026!", "ADMINISTRADOR");
        String userToken = login("reservas.demo@udea.edu.co", "DemoReservas2026!");
        int categoryId = jdbc.sql("select id_categoria_equipo from tbl_categoria_equipo where codigo='MICROCONTROLADORES'")
                .query(Integer.class).single();
        int locationId = jdbc.sql("select id_ubicacion from tbl_ubicacion where codigo='SALA_4'")
                .query(Integer.class).single();
        var valid = java.util.Map.of(
                "inventoryCode", "AUDIT-EQ-001", "name", "Equipo de auditoría",
                "description", "Cobertura CRUD integrada", "serialNumber", "AUDIT-SERIAL-001",
                "categoryId", categoryId, "locationId", locationId, "operationalStatus", "OPERATIVO");

        String createdBody = mvc.perform(post("/api/v1/equipment")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(valid)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inventoryCode").value("AUDIT-EQ-001"))
                .andExpect(jsonPath("$.visualStatus").value("AVAILABLE"))
                .andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(createdBody).path("id").asLong();

        mvc.perform(get("/api/v1/equipment/{id}", id).header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Equipo de auditoría"));
        mvc.perform(get("/api/v1/equipment?page=1&pageSize=1&search=AUDIT-EQ-001"
                        + "&category=MICROCONTROLADORES&status=AVAILABLE&operationalStatus=OPERATIVO")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(1)).andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].id").value(id));

        var updated = new java.util.LinkedHashMap<String, Object>(valid);
        updated.put("name", "Equipo de auditoría actualizado");
        mvc.perform(put("/api/v1/equipment/{id}", id).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(updated)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Equipo de auditoría actualizado"));
        mvc.perform(patch("/api/v1/equipment/{id}/status", id).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"operationalStatus\":\"MANTENIMIENTO\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.visualStatus").value("MAINTENANCE"));

        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(valid)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("EQUIPMENT_IDENTIFIER_CONFLICT"));
        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest());

        var unknownCategory = new java.util.LinkedHashMap<String, Object>(valid);
        unknownCategory.put("inventoryCode", "AUDIT-EQ-002"); unknownCategory.put("serialNumber", "AUDIT-SERIAL-002");
        unknownCategory.put("categoryId", 999999);
        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(unknownCategory)))
                .andExpect(status().isUnprocessableEntity());
        var unknownLocation = new java.util.LinkedHashMap<String, Object>(valid);
        unknownLocation.put("inventoryCode", "AUDIT-EQ-003"); unknownLocation.put("serialNumber", "AUDIT-SERIAL-003");
        unknownLocation.put("locationId", 999999);
        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(unknownLocation)))
                .andExpect(status().isUnprocessableEntity());
        var badStatus = new java.util.LinkedHashMap<String, Object>(valid);
        badStatus.put("inventoryCode", "AUDIT-EQ-004"); badStatus.put("serialNumber", "AUDIT-SERIAL-004");
        badStatus.put("operationalStatus", "DESCONOCIDO");
        mvc.perform(post("/api/v1/equipment").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(badStatus)))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/api/v1/equipment/999999999").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("EQUIPMENT_NOT_FOUND"));
        mvc.perform(patch("/api/v1/equipment/{id}/status", id).header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"operationalStatus\":\"OPERATIVO\"}"))
                .andExpect(status().isForbidden());
    }

    @Test @Order(13)
    void exercisesAllReservationOverlapShapesAtomicityCancellationAndOwnership() throws Exception {
        String ownerToken = login("reservas.demo@udea.edu.co", "DemoReservas2026!");
        String otherToken = login("usuario.demo@udea.edu.co", "DemoUsuario2026!");
        long firstEquipment = equipmentId("DEMO-MCU-001");
        long secondEquipment = equipmentId("DEMO-MCU-002");
        long freeEquipment = equipmentId("DEMO-IOT-001");

        String base = mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(firstEquipment),
                                "2050-01-10T10:00:00Z", "2050-01-10T11:00:00Z", "Intervalo base")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long reservationId = mapper.readTree(base).path("id").asLong();
        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(firstEquipment),
                                "2050-01-10T11:00:00Z", "2050-01-10T12:00:00Z", null)))
                .andExpect(status().isCreated());

        for (String[] interval : List.of(
                new String[]{"2050-01-10T10:30:00Z", "2050-01-10T11:30:00Z"},
                new String[]{"2050-01-10T10:15:00Z", "2050-01-10T10:45:00Z"},
                new String[]{"2050-01-10T09:30:00Z", "2050-01-10T11:30:00Z"},
                new String[]{"2050-01-10T10:00:00Z", "2050-01-10T11:00:00Z"})) {
            mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                            .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(firstEquipment),
                                    interval[0], interval[1], null)))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RESERVATION_CONFLICT"));
        }
        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(secondEquipment),
                                "2050-01-10T10:00:00Z", "2050-01-10T11:00:00Z", null)))
                .andExpect(status().isCreated());

        long before = jdbc.sql("select count(*) from tbl_reserva").query(Long.class).single();
        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(
                                List.of(freeEquipment, firstEquipment), "2050-01-10T10:30:00Z",
                                "2050-01-10T10:45:00Z", "Debe revertirse")))
                .andExpect(status().isConflict());
        assertThat(jdbc.sql("select count(*) from tbl_reserva").query(Long.class).single()).isEqualTo(before);

        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(freeEquipment),
                                "2050-02-10T10:00:00Z", "2050-02-10T10:00:00Z", null)))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("INVALID_DATE_RANGE"));
        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(freeEquipment),
                                "2050-02-10T11:00:00Z", "2050-02-10T10:00:00Z", null)))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(999999999L),
                                "2050-02-10T10:00:00Z", "2050-02-10T11:00:00Z", null)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("EQUIPMENT_NOT_FOUND"));

        mvc.perform(get("/api/v1/reservations/{id}", reservationId)
                        .header("Authorization", "Bearer " + otherToken)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/reservations/{id}/cancel", reservationId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"No autorizado\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/reservations/{id}/cancel", reservationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Cambio de horario\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledAt").isString())
                .andExpect(jsonPath("$.cancellationReason").value("Cambio de horario"));
        mvc.perform(post("/api/v1/reservations").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(reservationJson(List.of(firstEquipment),
                                "2050-01-10T10:00:00Z", "2050-01-10T11:00:00Z", null)))
                .andExpect(status().isCreated());
    }

    @Test @Order(14)
    void exercisesJwtRefreshRolesAndPasswordRecoveryEndToEnd() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reservas.demo@udea.edu.co\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"noexiste@udea.edu.co\",\"password\":\"Cualquiera2026!\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        LoginResult valid = loginResult("reservas.demo@udea.edu.co", "DemoReservas2026!");
        mvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + valid.accessToken()))
                .andExpect(status().isOk());
        String altered = valid.accessToken().substring(0, valid.accessToken().length() - 1)
                + (valid.accessToken().endsWith("a") ? "b" : "a");
        mvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + altered))
                .andExpect(status().isUnauthorized());

        Instant now = Instant.now();
        var expiredClaims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder()
                .issuer("lisource-backend").issuedAt(now.minusSeconds(7200)).expiresAt(now.minusSeconds(3600))
                .subject(Long.toString(userId("reservas.demo@udea.edu.co")))
                .claim("tokenUse", "ACCESS").claim("activeRole", "USUARIO")
                .claim("roles", List.of("USUARIO")).claim("sid", valid.sessionId()).build();
        var expiredHeader = org.springframework.security.oauth2.jwt.JwsHeader
                .with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).type("JWT").build();
        String expired = jwtEncoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters
                .from(expiredHeader, expiredClaims)).getTokenValue();
        mvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());

        var rotatedResponse = mvc.perform(post("/api/v1/auth/refresh").cookie(valid.refreshCookie()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isString())
                .andReturn().getResponse();
        assertThat(rotatedResponse.getCookie("lisource_refresh")).isNotNull();
        mvc.perform(post("/api/v1/auth/refresh").cookie(valid.refreshCookie()))
                .andExpect(status().isUnauthorized());

        var dualLogin = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"dual.demo@udea.edu.co\",\"password\":\"DemoDual2026!\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.roleSelectionRequired").value(true))
                .andReturn().getResponse();
        String selectionToken = mapper.readTree(dualLogin.getContentAsString()).path("selectionToken").asText();
        var selectedUser = mvc.perform(post("/api/v1/auth/select-role").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(java.util.Map.of(
                                "selectionToken", selectionToken, "role", "USUARIO"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn().getResponse();
        String userRoleToken = mapper.readTree(selectedUser.getContentAsString()).path("accessToken").asText();
        var roleCookie = selectedUser.getCookie("lisource_refresh");
        assertThat(roleCookie).isNotNull();
        mvc.perform(get("/api/v1/admin/categories").header("Authorization", "Bearer " + userRoleToken))
                .andExpect(status().isForbidden());
        var switched = mvc.perform(post("/api/v1/auth/switch-role")
                        .header("Authorization", "Bearer " + userRoleToken).cookie(roleCookie)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMINISTRADOR\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andReturn().getResponse();
        String adminRoleToken = mapper.readTree(switched.getContentAsString()).path("accessToken").asText();
        mvc.perform(get("/api/v1/admin/categories").header("Authorization", "Bearer " + adminRoleToken))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/refresh").cookie(roleCookie)).andExpect(status().isUnauthorized());

        long recoveryUser = userId("usuario.demo@udea.edu.co");
        insertRecovery(recoveryUser, "expired-recovery-token", now.minusSeconds(3600), null, null);
        insertRecovery(recoveryUser, "used-recovery-token", now.plusSeconds(3600), now.plusSeconds(60), null);
        for (String token : List.of("invalid-recovery-token", "expired-recovery-token", "used-recovery-token")) {
            mvc.perform(post("/api/v1/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(java.util.Map.of(
                                    "token", token, "newPassword", "NuevaSegura2026!"))))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"demo-reset-usuario-pendiente-2026-08\","
                                + "\"newPassword\":\"NuevaUsuario2026!\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"usuario.demo@udea.edu.co\",\"password\":\"DemoUsuario2026!\"}"))
                .andExpect(status().isUnauthorized());
        login("usuario.demo@udea.edu.co", "NuevaUsuario2026!");
        mvc.perform(post("/api/v1/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"demo-reset-usuario-pendiente-2026-08\","
                                + "\"newPassword\":\"OtraUsuario2026!\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @Order(15)
    void comparesStatisticsAndDashboardWithSqlAndVerifiesAuditCorrelation() throws Exception {
        String userToken = login("usuario.demo@udea.edu.co", "NuevaUsuario2026!");
        String topBody = mvc.perform(get("/api/v1/statistics/top-equipment?limit=3")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3))
                .andReturn().getResponse().getContentAsString();
        var top = mapper.readTree(topBody);
        List<java.util.Map<String, Long>> sqlTop = jdbc.sql("""
                select e.id_equipo id,count(*) total from tbl_reserva_equipo re
                join tbl_reserva r on r.id_reserva=re.id_reserva
                join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                join tbl_equipo e on e.id_equipo=re.id_equipo where er.codigo='CONFIRMADA'
                group by e.id_equipo order by total desc,e.id_equipo asc limit 3
                """).query((rs, row) -> java.util.Map.of("id", rs.getLong(1), "total", rs.getLong(2))).list();
        for (int index = 0; index < sqlTop.size(); index++) {
            assertThat(top.get(index).path("equipmentId").asLong()).isEqualTo(sqlTop.get(index).get("id"));
            assertThat(top.get(index).path("totalReservations").asLong()).isEqualTo(sqlTop.get(index).get("total"));
            assertThat(top.get(index).path("position").asInt()).isEqualTo(index + 1);
        }
        mvc.perform(get("/api/v1/statistics/top-equipment?limit=101")
                        .header("Authorization", "Bearer " + userToken)).andExpect(status().isUnprocessableEntity());

        String dashboardBody = mvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var dashboard = mapper.readTree(dashboardBody);
        var counts = jdbc.sql("""
                with states as (select e.id_equipo,case
                  when ee.codigo='OPERATIVO' and exists(select 1 from tbl_reserva_equipo re
                    join tbl_reserva r on r.id_reserva=re.id_reserva
                    join tbl_estado_reserva er on er.id_estado_reserva=r.id_estado_reserva
                    where re.id_equipo=e.id_equipo and er.codigo='CONFIRMADA'
                      and r.fecha_inicio<=now() and r.fecha_fin>now()) then 'RESERVED'
                  when ee.codigo='OPERATIVO' then 'AVAILABLE' when ee.codigo='MANTENIMIENTO' then 'MAINTENANCE'
                  when ee.codigo='FUERA_SERVICIO' then 'OUT_OF_SERVICE' else 'RETIRED' end visual_status
                  from tbl_equipo e join tbl_estado_equipo ee on ee.id_estado_equipo=e.id_estado_equipo)
                select count(*) total,count(*) filter(where visual_status='AVAILABLE') available,
                  count(*) filter(where visual_status='RESERVED') reserved,
                  count(*) filter(where visual_status='MAINTENANCE') maintenance,
                  count(*) filter(where visual_status='OUT_OF_SERVICE') out_of_service,
                  count(*) filter(where visual_status='RETIRED') retired from states
                """).query((rs, row) -> List.of(rs.getLong(1), rs.getLong(2), rs.getLong(3),
                        rs.getLong(4), rs.getLong(5), rs.getLong(6))).single();
        assertThat(List.of(dashboard.path("total").asLong(), dashboard.path("available").asLong(),
                dashboard.path("reserved").asLong(), dashboard.path("maintenance").asLong(),
                dashboard.path("outOfService").asLong(), dashboard.path("retired").asLong())).isEqualTo(counts);

        String adminToken = loginWithRole("dual.demo@udea.edu.co", "DemoDual2026!", "ADMINISTRADOR");
        long equipment = equipmentId("AUDIT-EQ-001");
        String supplied = "8f81f710-6fb3-4fe6-a993-3678ac77b688";
        mvc.perform(patch("/api/v1/equipment/{id}/status", equipment)
                        .header("Authorization", "Bearer " + adminToken).header("X-Correlation-ID", supplied)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"operationalStatus\":\"OPERATIVO\"}"))
                .andExpect(status().isOk()).andExpect(header().string("X-Correlation-ID", supplied));
        assertThat(jdbc.sql("""
                select count(*) from tbl_auditoria a join tbl_tipo_evento_auditoria te
                  on te.id_tipo_evento_auditoria=a.id_tipo_evento_auditoria
                where te.codigo='CAMBIAR_ESTADO_EQUIPO' and a.id_registro_afectado=:id
                  and a.correlation_id::text=:correlation and a.id_usuario_actor is not null
                  and a.fecha_evento is not null and a.datos_nuevos is not null
                """).param("id", equipment).param("correlation", supplied).query(Long.class).single()).isEqualTo(1);
        mvc.perform(patch("/api/v1/admin/configuration/LIMITE_TOP_EQUIPOS")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"value\":5}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.value").value(5));

        var generated = mvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andReturn().getResponse().getHeader("X-Correlation-ID");
        assertThatCode(() -> java.util.UUID.fromString(generated)).doesNotThrowAnyException();
        var replaced = mvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + userToken).header("X-Correlation-ID", "invalid"))
                .andExpect(status().isOk()).andReturn().getResponse().getHeader("X-Correlation-ID");
        assertThat(replaced).isNotEqualTo("invalid");
        assertThatCode(() -> java.util.UUID.fromString(replaced)).doesNotThrowAnyException();

        assertThat(jdbc.sql("""
                select count(distinct te.codigo) from tbl_auditoria a join tbl_tipo_evento_auditoria te
                  on te.id_tipo_evento_auditoria=a.id_tipo_evento_auditoria
                where te.codigo in ('LOGIN_LOCAL_EXITOSO','CERRAR_SESION','CREAR_EQUIPO',
                  'ACTUALIZAR_EQUIPO','CREAR_RESERVA','CANCELAR_RESERVA','RESERVA_CONFLICTO',
                  'ACTUALIZAR_CONFIGURACION')
                """).query(Long.class).single()).isEqualTo(8);
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

    private String reservationJson(List<Long> equipment, String start, String end, String notes) throws Exception {
        var body = new java.util.LinkedHashMap<String, Object>();
        body.put("equipmentIds", equipment); body.put("startsAt", start); body.put("endsAt", end);
        if (notes != null) body.put("notes", notes);
        return mapper.writeValueAsString(body);
    }

    private void insertRecovery(long userId, String rawToken, Instant expiresAt,
                                Instant usedAt, Instant revokedAt) {
        jdbc.sql("""
                insert into tbl_recuperacion_password
                  (id_usuario,token_hash,fecha_solicitud,fecha_expiracion,fecha_uso,fecha_revocacion)
                values (:userId,:hash,:requested,:expires,:used,:revoked)
                """).param("userId", userId).param("hash", tokenCodec.sha256(rawToken))
                .param("requested", java.time.OffsetDateTime.ofInstant(
                        expiresAt.minusSeconds(3600), java.time.ZoneOffset.UTC))
                .param("expires", java.time.OffsetDateTime.ofInstant(expiresAt, java.time.ZoneOffset.UTC))
                .param("used", usedAt == null ? null : java.time.OffsetDateTime.ofInstant(
                        usedAt, java.time.ZoneOffset.UTC), java.sql.Types.TIMESTAMP_WITH_TIMEZONE)
                .param("revoked", revokedAt == null ? null : java.time.OffsetDateTime.ofInstant(
                        revokedAt, java.time.ZoneOffset.UTC), java.sql.Types.TIMESTAMP_WITH_TIMEZONE)
                .update();
    }
}
