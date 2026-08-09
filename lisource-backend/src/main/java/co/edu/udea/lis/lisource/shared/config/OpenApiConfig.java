package co.edu.udea.lis.lisource.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem.HttpMethod;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import java.util.*;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    static final String BEARER = "bearerAuth";

    @Bean
    OpenAPI lisourceOpenApi() {
        return new OpenAPI()
                .info(new Info().title("LISource Backend API").version("v1")
                        .description("API REST de la plataforma LISource para autenticación institucional, inventario, reservas, estadísticas y administración. Los access tokens usan Bearer JWT; el refresh token se entrega exclusivamente en una cookie HttpOnly.")
                        .contact(new Contact().name("LISource technical challenge")))
                .servers(List.of(new Server().url("http://localhost:8080").description("Servidor local")))
                .components(new Components()
                        .addSecuritySchemes(BEARER, new SecurityScheme().type(SecurityScheme.Type.HTTP)
                                .scheme("bearer").bearerFormat("JWT")
                                .description("Pegue únicamente el access token emitido por login/select-role. No use el refresh token.")))
                .tags(tags())
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }

    @Bean
    OpenApiCustomizer lisourceOperationDocumentation() {
        return openApi -> {
            if (openApi.getComponents() == null) openApi.setComponents(new Components());
            openApi.getComponents().addSchemas("ApiProblem", problemSchema());
            openApi.getPaths().forEach((path, item) ->
                    item.readOperationsMap().forEach((method, operation) -> document(path, method, operation)));
        };
    }

    private void document(String path, HttpMethod method, Operation operation) {
        Doc doc = docs(method.name() + " " + path);
        operation.setTags(List.of(doc.tag));
        operation.setSummary(doc.summary);
        operation.setDescription(doc.description + "\n\n**Acceso:** " + doc.access + ".");
        if (doc.access.equals("PUBLIC")) operation.setSecurity(List.of());
        else operation.setSecurity(List.of(new SecurityRequirement().addList(BEARER)));
        describeParameters(operation);
        doc.errors.forEach(status -> operation.getResponses().addApiResponse(String.valueOf(status), error(status, path)));
        applyRequestExample(path, method, operation);
        applyResponseExample(path, method, operation);
        if (path.equals("/api/v1/equipment/{id}/image") && method == HttpMethod.POST) multipart(operation);
    }

    private Doc docs(String key) {
        return switch (key) {
            case "POST /api/v1/auth/login" -> pub("Authentication", "Iniciar sesión local", "Valida correo institucional y contraseña. Si existe un único rol activo emite JWT y cookie de refresh; si hay varios devuelve un selectionToken temporal.", 400,401,403,422);
            case "POST /api/v1/auth/google" -> pub("Authentication", "Iniciar sesión con Google", "Verifica una credencial Google Identity, enlaza o crea el usuario institucional y aplica el mismo flujo multirrol.", 400,401,403,422);
            case "POST /api/v1/auth/select-role" -> pub("Authentication", "Seleccionar rol activo", "Intercambia el selectionToken temporal por una sesión y un JWT limitado al rol elegido y asignado.", 400,401,403,422);
            case "POST /api/v1/auth/refresh" -> pub("Authentication", "Renovar sesión", "Rota el refresh token HttpOnly, vuelve a comprobar usuario y rol activos y emite un access token nuevo.", 401,403);
            case "POST /api/v1/auth/forgot-password" -> pub("Authentication", "Solicitar recuperación", "Genera un token de un solo uso y envía instrucciones por SMTP sin revelar si la cuenta existe.", 400,422);
            case "POST /api/v1/auth/reset-password" -> pub("Authentication", "Restablecer contraseña", "Consume una sola vez el token de recuperación y revoca las sesiones existentes.", 400,401,422);
            case "POST /api/v1/auth/switch-role" -> auth("Authentication", "Cambiar rol activo", "Rota la sesión actual y emite un JWT para otro rol activo realmente asignado al usuario.", 400,401,403,422);
            case "POST /api/v1/auth/logout" -> auth("Authentication", "Cerrar sesión actual", "Revoca la sesión representada por la cookie HttpOnly y elimina la cookie del navegador.", 401);
            case "POST /api/v1/auth/logout-all" -> auth("Authentication", "Cerrar todas las sesiones", "Revoca todas las sesiones activas del usuario autenticado.", 401);
            case "POST /api/v1/auth/set-password" -> auth("Authentication", "Configurar contraseña local", "Permite a una cuenta creada con Google definir por primera vez una contraseña local.", 400,401,409,422);
            case "POST /api/v1/auth/change-password" -> auth("Authentication", "Cambiar contraseña", "Verifica la contraseña actual, guarda un hash Argon2id y revoca todas las sesiones.", 400,401,422);
            case "GET /api/v1/profile" -> auth("Profile", "Consultar perfil", "Devuelve identidad, idioma, roles disponibles y activeRole del JWT.", 401);
            case "PATCH /api/v1/profile" -> auth("Profile", "Actualizar perfil", "Actualiza nombres, apellidos o idioma mediante campos opcionales validados.", 400,401,422);
            case "GET /api/v1/sessions" -> auth("Sessions", "Listar sesiones activas", "Lista sesiones no revocadas e identifica cuál corresponde a la cookie actual.", 401);
            case "DELETE /api/v1/sessions/{sessionId}" -> auth("Sessions", "Revocar una sesión", "Revoca una sesión propia; si es la actual también elimina la cookie HttpOnly.", 401,404);
            case "GET /api/v1/equipment" -> auth("Equipment", "Listar equipos", "Listado paginado en servidor con búsqueda, categoría, estado visual, estado operativo y orden seguro.", 401,422);
            case "GET /api/v1/equipment/{id}" -> auth("Equipment", "Consultar equipo", "Devuelve el detalle de una unidad física del inventario.", 401,404);
            case "POST /api/v1/equipment" -> admin("Equipment", "Crear equipo", "Registra una unidad física. Requiere activeRole ADMINISTRADOR y serie o MAC no duplicadas.", 400,401,403,409,422);
            case "PUT /api/v1/equipment/{id}" -> admin("Equipment", "Actualizar equipo", "Reemplaza los datos editables preservando reglas de identificadores y reservas vigentes.", 400,401,403,404,409,422);
            case "PATCH /api/v1/equipment/{id}/status" -> admin("Equipment", "Cambiar estado operativo", "Cambia el estado persistente; evita retirar de operación un equipo comprometido por reservas.", 400,401,403,404,409,422);
            case "POST /api/v1/equipment/{id}/image" -> admin("Equipment", "Cargar o reemplazar imagen", "Carga multipart/form-data a Supabase Storage. Acepta JPEG, PNG o WebP de máximo 5 MB y limpia archivos huérfanos ante rollback.", 400,401,403,404,413,422,502);
            case "DELETE /api/v1/equipment/{id}/image" -> admin("Equipment", "Eliminar imagen", "Elimina la referencia y el objeto asociado en Storage sin borrar el equipo.", 401,403,404,502);
            case "POST /api/v1/reservations" -> auth("Reservations", "Crear reserva", "Reserva atómicamente uno o varios equipos mediante bloqueo pesimista. Los intervalos adyacentes se permiten; cualquier solapamiento revierte toda la operación.", 400,401,404,409,422);
            case "GET /api/v1/reservations/me" -> auth("Reservations", "Listar mis reservas", "Devuelve las reservas del usuario autenticado con sus equipos y estados.", 401);
            case "GET /api/v1/reservations/{id}" -> auth("Reservations", "Consultar reserva", "Devuelve una reserva propia; ADMINISTRADOR puede consultar cualquier reserva.", 401,403,404);
            case "POST /api/v1/reservations/{id}/cancel" -> auth("Reservations", "Cancelar reserva", "Realiza cancelación lógica, conserva historial y deja de bloquear disponibilidad.", 400,401,403,404,409,422);
            case "GET /api/v1/equipment/{id}/busy-slots" -> auth("Reservations", "Consultar intervalos ocupados", "Lista intervalos confirmados que bloquean la disponibilidad del equipo.", 401,404);
            case "GET /api/v1/equipment/{id}/availability" -> auth("Reservations", "Comprobar disponibilidad", "Indica si el equipo está disponible durante el intervalo UTC solicitado.", 400,401,404,422);
            case "GET /api/v1/dashboard/summary" -> auth("Dashboard", "Consultar resumen del dashboard", "Devuelve agregados actuales de inventario y reservas para el dashboard.", 401);
            case "GET /api/v1/statistics/top-equipment" -> auth("Statistics", "Consultar Top de equipos", "Devuelve Top 5 por defecto (o el límite solicitado) contando únicamente reservas confirmadas.", 401,422);
            case "GET /api/v1/catalogs/categories" -> auth("Catalogs", "Listar categorías activas", "Catálogo activo para filtros y formularios de equipos.", 401);
            case "GET /api/v1/catalogs/locations" -> auth("Catalogs", "Listar ubicaciones activas", "Catálogo activo de ubicaciones físicas.", 401);
            case "GET /api/v1/catalogs/equipment-statuses" -> auth("Catalogs", "Listar estados de equipo", "Lista el catálogo de estados operativos del inventario.", 401);
            case "GET /api/v1/catalogs/languages" -> auth("Catalogs", "Listar idiomas activos", "Lista idiomas habilitados para la preferencia de perfil.", 401);
            case "GET /api/v1/admin/users" -> admin("Administration - Users", "Listar usuarios", "Listado paginado y filtrable por texto, estado y rol activo.", 401,403,422);
            case "GET /api/v1/admin/users/{id}" -> admin("Administration - Users", "Consultar usuario", "Devuelve estado, idioma, fechas y roles activos del usuario.", 401,403,404);
            case "PATCH /api/v1/admin/users/{id}/status" -> admin("Administration - Users", "Activar o inactivar usuario", "Cambia estado lógico, revoca sesiones al inactivar y protege al último administrador.", 400,401,403,404,409,422);
            case "PUT /api/v1/admin/users/{id}/roles/{role}" -> admin("Administration - Users", "Activar o desactivar asignación de rol", "Administra tbl_usuario_rol sin borrar historial y protege la última asignación administrativa.", 400,401,403,404,409,422);
            case "GET /api/v1/admin/roles" -> admin("Administration - Roles", "Listar roles", "Lista roles del sistema incluyendo su estado lógico.", 401,403);
            case "PATCH /api/v1/admin/roles/{role}/status" -> admin("Administration - Roles", "Cambiar estado de rol", "Activa o desactiva lógicamente un rol. Nunca permite desactivar ADMINISTRADOR dejando el sistema sin administración.", 400,401,403,404,409,422);
            case "GET /api/v1/admin/categories" -> admin("Administration - Categories", "Listar todas las categorías", "Incluye categorías activas e inactivas para administración.", 401,403);
            case "POST /api/v1/admin/categories" -> admin("Administration - Categories", "Crear categoría", "Crea una categoría activa con código y nombre únicos.", 400,401,403,409,422);
            case "PUT /api/v1/admin/categories/{id}" -> admin("Administration - Categories", "Editar categoría", "Actualiza código, nombre y descripción sin eliminar referencias.", 400,401,403,404,409,422);
            case "PATCH /api/v1/admin/categories/{id}/status" -> admin("Administration - Categories", "Cambiar estado de categoría", "Activa o inactiva lógicamente una categoría; el histórico permanece intacto.", 400,401,403,404,422);
            case "GET /api/v1/admin/locations" -> admin("Administration - Locations", "Listar todas las ubicaciones", "Incluye ubicaciones activas e inactivas para administración.", 401,403);
            case "POST /api/v1/admin/locations" -> admin("Administration - Locations", "Crear ubicación", "Crea una ubicación física activa con código y nombre únicos.", 400,401,403,409,422);
            case "PUT /api/v1/admin/locations/{id}" -> admin("Administration - Locations", "Editar ubicación", "Actualiza código, nombre y descripción sin eliminar equipos relacionados.", 400,401,403,404,409,422);
            case "PATCH /api/v1/admin/locations/{id}/status" -> admin("Administration - Locations", "Cambiar estado de ubicación", "Activa o inactiva lógicamente una ubicación conservando historial.", 400,401,403,404,422);
            case "GET /api/v1/admin/configuration" -> admin("Administration - Configuration", "Listar configuración", "Consulta valores agrupados por categoría, sin exponer secretos de infraestructura.", 401,403);
            case "PATCH /api/v1/admin/configuration/{key}" -> admin("Administration - Configuration", "Actualizar configuración", "Actualiza únicamente claves funcionales permitidas y valida el tipo JSON esperado.", 400,401,403,404,422);
            case "GET /api/v1/admin/audit" -> admin("Administration - Audit", "Consultar auditoría", "Consulta trazabilidad administrativa paginada y filtrable por tipo de evento o correlation ID.", 401,403,422);
            default -> auth("LISource", "Operación LISource", "Operación documentada de la API.", 401);
        };
    }

    private void describeParameters(Operation operation) {
        if (operation.getParameters() == null) return;
        Map<String,String> descriptions = Map.ofEntries(
                Map.entry("page","Página basada en 1."), Map.entry("pageSize","Elementos por página (1–100)."),
                Map.entry("search","Búsqueda parcial por nombre, código o correo según el recurso."),
                Map.entry("category","Código de categoría."), Map.entry("status","Estado visual o lógico según el endpoint."),
                Map.entry("operationalStatus","Estado operativo persistente."), Map.entry("sort","Orden seguro: campo,dirección."),
                Map.entry("limit","Cantidad solicitada (por defecto 5)."), Map.entry("id","Identificador numérico del recurso."),
                Map.entry("sessionId","Identificador de una sesión propia."), Map.entry("role","Código del rol."),
                Map.entry("key","Clave funcional de configuración."), Map.entry("eventType","Código del evento de auditoría."),
                Map.entry("correlationId","UUID de correlación."), Map.entry("startsAt","Inicio UTC ISO-8601."),
                Map.entry("endsAt","Fin UTC ISO-8601; debe ser posterior al inicio."));
        operation.getParameters().forEach(parameter -> parameter.setDescription(descriptions.getOrDefault(parameter.getName(), parameter.getDescription())));
    }

    private void applyRequestExample(String path, HttpMethod method, Operation operation) {
        Object value = switch (method.name()+" "+path) {
            case "POST /api/v1/auth/login" -> Map.of("email","usuario@udea.edu.co","password","<PASSWORD>");
            case "POST /api/v1/auth/google" -> Map.of("credential","<GOOGLE_ID_TOKEN>");
            case "POST /api/v1/auth/select-role" -> Map.of("selectionToken","<ROLE_SELECTION_TOKEN>","role","ADMINISTRADOR");
            case "POST /api/v1/auth/switch-role" -> Map.of("role","USUARIO");
            case "POST /api/v1/auth/forgot-password" -> Map.of("email","usuario@udea.edu.co");
            case "POST /api/v1/auth/reset-password" -> Map.of(
                    "token","<PASSWORD_RECOVERY_TOKEN>","newPassword","<NEW_PASSWORD>");
            case "POST /api/v1/auth/set-password" -> Map.of("newPassword","<NEW_PASSWORD>");
            case "POST /api/v1/auth/change-password" -> Map.of(
                    "oldPassword","<CURRENT_PASSWORD>","newPassword","<NEW_PASSWORD>");
            case "POST /api/v1/reservations" -> Map.of("equipmentIds",List.of(1),"startsAt","2026-08-12T15:00:00Z","endsAt","2026-08-12T17:00:00Z","notes","Reserva para práctica");
            case "POST /api/v1/reservations/{id}/cancel" -> Map.of("reason","Cambio de horario de la práctica");
            case "POST /api/v1/equipment" -> Map.of("inventoryCode","LIS-MCU-016","name","Kit ESP32","description","Kit de práctica IoT","serialNumber","SN-ESP32-016","macAddress","02:00:00:00:00:16","categoryId",1,"locationId",1,"operationalStatus","OPERATIVO");
            case "PUT /api/v1/equipment/{id}" -> Map.of("inventoryCode","LIS-MCU-016","name","Kit ESP32 actualizado","description","Kit IoT con cable y sensores","serialNumber","SN-ESP32-016","macAddress","02:00:00:00:00:16","categoryId",1,"locationId",1,"operationalStatus","OPERATIVO");
            case "PATCH /api/v1/equipment/{id}/status" -> Map.of("operationalStatus","MANTENIMIENTO");
            case "PATCH /api/v1/profile" -> Map.of("firstName","Ana","lastName","Gómez","languageCode","es");
            case "PATCH /api/v1/admin/users/{id}/status", "PATCH /api/v1/admin/categories/{id}/status", "PATCH /api/v1/admin/locations/{id}/status", "PATCH /api/v1/admin/roles/{role}/status" -> Map.of("status","INACTIVO");
            case "PUT /api/v1/admin/users/{id}/roles/{role}" -> Map.of("active",true);
            case "POST /api/v1/admin/categories", "PUT /api/v1/admin/categories/{id}" -> Map.of(
                    "code","SENSORES","name","Sensores","description","Sensores para prácticas de electrónica e IoT");
            case "POST /api/v1/admin/locations", "PUT /api/v1/admin/locations/{id}" -> Map.of(
                    "code","LAB_3","name","Laboratorio 3","description","Tercer piso, bloque de laboratorios");
            case "PATCH /api/v1/admin/configuration/{key}" -> Map.of("value",5);
            default -> null;
        };
        if (value != null && operation.getRequestBody()!=null && operation.getRequestBody().getContent()!=null)
            operation.getRequestBody().getContent().values().forEach(media -> media.addExamples("example",new Example().summary("Ejemplo válido").value(value)));
    }

    private void applyResponseExample(String path, HttpMethod method, Operation operation) {
        Object value = switch (method.name()+" "+path) {
            case "POST /api/v1/auth/login" -> Map.of("accessToken","<JWT_ACCESS_TOKEN>","tokenType","Bearer","expiresIn",900,"roleSelectionRequired",false,
                    "availableRoles",List.of("USUARIO"),"user",Map.of("id",2,"email","usuario@udea.edu.co","roles",List.of("USUARIO"),"activeRole","USUARIO"));
            case "GET /api/v1/equipment" -> Map.of("items",List.of(),"page",1,"pageSize",20,"totalItems",15,"totalPages",1);
            case "GET /api/v1/equipment/{id}/availability" -> Map.of("available",true);
            default -> null;
        };
        if (value == null || operation.getResponses()==null) return;
        operation.getResponses().entrySet().stream().filter(entry -> entry.getKey().startsWith("2")).findFirst()
                .map(Map.Entry::getValue).map(ApiResponse::getContent).filter(Objects::nonNull)
                .ifPresent(content -> content.values().forEach(media -> media.addExamples("example",new Example().summary("Respuesta de ejemplo").value(value))));
    }

    private void multipart(Operation operation) {
        ObjectSchema schema = new ObjectSchema();
        schema.addProperty("file", new StringSchema().format("binary").description("Archivo JPEG, PNG o WebP; máximo 5 MB."));
        operation.getRequestBody().setRequired(true);
        operation.getRequestBody().setDescription("Parte `file` binaria obligatoria.");
        operation.getRequestBody().setContent(new Content().addMediaType("multipart/form-data",
                new MediaType().schema(schema).addExamples("image",
                        new Example().summary("Imagen PNG de equipo").value(Map.of("file","<BINARY_PNG_FILE>")))));
    }

    private ApiResponse error(int status, String path) {
        String code = status==409 && path.equals("/api/v1/reservations") ? "RESERVATION_CONFLICT" : switch(status) {
            case 400,422 -> "VALIDATION_ERROR"; case 401 -> "INVALID_CREDENTIALS"; case 403 -> "ACCESS_DENIED";
            case 404 -> "RESOURCE_NOT_FOUND"; case 409 -> "RESOURCE_CONFLICT"; case 413 -> "IMAGE_TOO_LARGE";
            case 502 -> "IMAGE_UPLOAD_FAILED"; default -> "INTERNAL_ERROR";
        };
        String detail = code.equals("RESERVATION_CONFLICT")
                ? "One or more equipment items overlap an existing confirmed reservation. No reservation was created."
                : "La solicitud no pudo completarse; consulte code, detail y correlationId.";
        Map<String,Object> value = new LinkedHashMap<>();
        value.put("type","about:blank"); value.put("title",code.equals("RESERVATION_CONFLICT")?"Reservation conflict":"LISource request failed");
        value.put("status",status); value.put("detail",detail); value.put("instance",path);
        value.put("code",code); value.put("correlationId","123e4567-e89b-12d3-a456-426614174000"); value.put("fieldErrors",List.of());
        return new ApiResponse().description(errorDescription(status,code)).content(new Content().addMediaType("application/problem+json",
                new MediaType().schema(new Schema<>().$ref("#/components/schemas/ApiProblem"))
                        .addExamples(code,new Example().summary(code).value(value))));
    }

    private String errorDescription(int status,String code) {
        return status==409 && code.equals("RESERVATION_CONFLICT")
                ? "Conflicto transaccional de horario (`RESERVATION_CONFLICT`): toda la reserva, incluidos todos sus equipos, se revierte."
                : switch(status){case 400->"JSON o formato inválido.";case 401->"JWT/cookie ausente, inválido o expirado.";case 403->"activeRole sin autorización o cuenta inactiva.";case 404->"Recurso inexistente.";case 409->"Conflicto con estado o datos existentes.";case 413->"Imagen mayor de 5 MB.";case 422->"Validación semántica fallida.";case 502->"Fallo del proveedor de Storage.";default->"Error.";};
    }

    private static Schema<?> problemSchema() {
        ObjectSchema fieldError = new ObjectSchema();
        fieldError.addProperty("field", new StringSchema().example("startsAt"));
        fieldError.addProperty("code", new StringSchema().example("NotNull"));
        fieldError.addProperty("message", new StringSchema().example("must not be null"));

        ObjectSchema problem = new ObjectSchema();
        problem.description("Error estándar RFC 9457 enriquecido con código estable, correlation ID y errores de campo.");
        problem.addProperty("type",new StringSchema().format("uri").example("about:blank"));
        problem.addProperty("title",new StringSchema().example("Reservation conflict"));
        problem.addProperty("status",new IntegerSchema().format("int32").example(409));
        problem.addProperty("detail",new StringSchema().example(
                "One or more requested equipment items are unavailable for the selected time range."));
        problem.addProperty("instance",new StringSchema().format("uri").example("/api/v1/reservations"));
        problem.addProperty("code",new StringSchema().example("RESERVATION_CONFLICT"));
        problem.addProperty("correlationId",new StringSchema().format("uuid")
                .example("550e8400-e29b-41d4-a716-446655440000"));
        problem.addProperty("fieldErrors",new ArraySchema().items(fieldError).example(List.of()));
        problem.setRequired(List.of("title","status","detail","code","correlationId","fieldErrors"));
        return problem;
    }

    private static List<Tag> tags() {
        return List.of(tag("Authentication","Login local/Google, selección y cambio de rol, refresh, logout y contraseñas."),
                tag("Profile","Perfil e idioma del usuario autenticado."),tag("Sessions","Consulta y revocación de sesiones HttpOnly."),
                tag("Equipment","Inventario, estado operativo e imágenes en Storage."),tag("Reservations","Disponibilidad, creación y cancelación transaccional."),
                tag("Dashboard","Resumen operacional."),tag("Statistics","Top de equipos confirmados."),tag("Catalogs","Catálogos activos de consulta."),
                tag("Administration - Users","Usuarios, estados y asignaciones de roles."),tag("Administration - Roles","Catálogo lógico de roles."),
                tag("Administration - Categories","Administración lógica de categorías."),tag("Administration - Locations","Administración lógica de ubicaciones."),
                tag("Administration - Configuration","Configuración funcional tipada."),tag("Administration - Audit","Trazabilidad y correlation ID."));
    }
    private static Tag tag(String name,String description){return new Tag().name(name).description(description);}
    private static Doc pub(String tag,String summary,String description,Integer...errors){return new Doc(tag,summary,description,"PUBLIC",Set.of(errors));}
    private static Doc auth(String tag,String summary,String description,Integer...errors){return new Doc(tag,summary,description,"AUTHENTICATED (activeRole USUARIO o ADMINISTRADOR)",Set.of(errors));}
    private static Doc admin(String tag,String summary,String description,Integer...errors){return new Doc(tag,summary,description,"AUTHENTICATED — activeRole ADMINISTRADOR",Set.of(errors));}
    private record Doc(String tag,String summary,String description,String access,Set<Integer> errors){}
}
