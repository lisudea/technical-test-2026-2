package co.edu.udea.lis.lisource.equipment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.edu.udea.lis.lisource.shared.config.AppProperties;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestClient;

class EquipmentImageStorageTest {
    private final EquipmentImageStorage storage = new EquipmentImageStorage(
            new AppProperties(null, null, null, null, null, null,
                    new AppProperties.Storage(null, null, "equipment-images")), RestClient.builder());

    @Test
    void detectsPngFromMagicBytesInsteadOfTrustingFilenameOrHeader() {
        byte[] png = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0};
        var file = new MockMultipartFile("file", "payload.svg", "image/svg+xml", png);
        assertThat(storage.detectedContentType(storage.readAndValidate(file))).isEqualTo("image/png");
    }

    @Test
    void rejectsSvgAndOversizedPayloadsWithStableCodes() {
        var svg = new MockMultipartFile("file", "image.svg", "image/svg+xml", "<svg/>".getBytes());
        assertThatThrownBy(() -> storage.readAndValidate(svg)).isInstanceOfSatisfying(AppException.class,
                error -> assertThat(error.code()).isEqualTo(ErrorCode.INVALID_IMAGE_TYPE));

        var large = new MockMultipartFile("file", "image.jpg", "image/jpeg",
                new byte[(int) EquipmentImageStorage.MAX_BYTES + 1]);
        assertThatThrownBy(() -> storage.readAndValidate(large)).isInstanceOfSatisfying(AppException.class,
                error -> assertThat(error.code()).isEqualTo(ErrorCode.IMAGE_TOO_LARGE));
    }
}
