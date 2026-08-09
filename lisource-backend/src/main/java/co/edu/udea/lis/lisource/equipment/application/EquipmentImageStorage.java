package co.edu.udea.lis.lisource.equipment.application;

import co.edu.udea.lis.lisource.shared.config.AppProperties;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EquipmentImageStorage {
    static final long MAX_BYTES = 5L * 1024 * 1024;
    private final AppProperties properties;
    private final RestClient client;

    public EquipmentImageStorage(AppProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        this.client = builder.build();
    }

    public StoredEquipmentImage store(long equipmentId, MultipartFile file) {
        byte[] bytes = readAndValidate(file);
        String contentType = detectedContentType(bytes);
        String extension = switch (contentType) {
            case MediaType.IMAGE_JPEG_VALUE -> "jpg";
            case MediaType.IMAGE_PNG_VALUE -> "png";
            default -> "webp";
        };
        AppProperties.Storage storage = requiredConfiguration();
        String path = "equipment/" + equipmentId + "/" + UUID.randomUUID() + "." + extension;
        try {
            client.post().uri(objectUrl(storage, path))
                    .header("Authorization", "Bearer " + storage.secretKey())
                    .header("apikey", storage.secretKey())
                    .header("x-upsert", "false")
                    .contentType(MediaType.parseMediaType(contentType)).body(bytes)
                    .retrieve().toBodilessEntity();
            String publicUrl = normalizedBase(storage.url()) + "/storage/v1/object/public/"
                    + storage.bucket() + "/" + path;
            return new StoredEquipmentImage(path, publicUrl);
        } catch (RuntimeException exception) {
            throw new AppException(HttpStatus.BAD_GATEWAY, ErrorCode.IMAGE_UPLOAD_FAILED,
                    "The equipment image could not be stored.");
        }
    }

    public void delete(String path) {
        AppProperties.Storage storage = requiredConfiguration();
        if (path == null || !path.matches("^equipment/[0-9]+/[0-9a-fA-F-]+\\.(jpg|png|webp)$")) return;
        try {
            client.delete().uri(objectUrl(storage, path))
                    .header("Authorization", "Bearer " + storage.secretKey())
                    .header("apikey", storage.secretKey()).retrieve().toBodilessEntity();
        } catch (RuntimeException ignored) {
            // Cleanup is best effort; the database remains the source of truth.
        }
    }

    public void deleteByPublicUrl(String publicUrl) {
        AppProperties.Storage storage = requiredConfiguration();
        String prefix = normalizedBase(storage.url()) + "/storage/v1/object/public/" + storage.bucket() + "/";
        if (publicUrl != null && publicUrl.startsWith(prefix)) delete(publicUrl.substring(prefix.length()));
    }

    byte[] readAndValidate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw invalidType();
        if (file.getSize() > MAX_BYTES) {
            throw new AppException(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCode.IMAGE_TOO_LARGE,
                    "Equipment images must not exceed 5 MB.");
        }
        try {
            byte[] bytes = file.getBytes();
            detectedContentType(bytes);
            return bytes;
        } catch (IOException exception) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_IMAGE_TYPE,
                    "The equipment image could not be read.");
        }
    }

    String detectedContentType(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff)
            return MediaType.IMAGE_JPEG_VALUE;
        if (bytes.length >= 8 && Arrays.equals(Arrays.copyOf(bytes, 8),
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}))
            return MediaType.IMAGE_PNG_VALUE;
        if (bytes.length >= 12 && new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
                && new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP"))
            return "image/webp";
        throw invalidType();
    }

    private AppProperties.Storage requiredConfiguration() {
        if (properties.storage() == null || !properties.storage().configured()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.IMAGE_UPLOAD_FAILED,
                    "Equipment image storage is not configured.");
        }
        return properties.storage();
    }

    private URI objectUrl(AppProperties.Storage storage, String path) {
        return URI.create(normalizedBase(storage.url()) + "/storage/v1/object/" + storage.bucket() + "/" + path);
    }

    private String normalizedBase(String value) { return value.replaceAll("/+$", ""); }
    private AppException invalidType() {
        return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_IMAGE_TYPE,
                "Only valid JPEG, PNG and WebP images are accepted.");
    }
}

record StoredEquipmentImage(String path, String publicUrl) {}
