package co.edu.udea.lis.lisource.shared.security;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class TokenCodecTest {
    private final TokenCodec codec = new TokenCodec();

    @Test
    void generatesUrlSafeUniqueTokensAndLowercaseSha256() {
        String first = codec.generate();
        String second = codec.generate();
        assertThat(first).isNotEqualTo(second).matches("^[A-Za-z0-9_-]{43}$");
        assertThat(codec.sha256(first)).matches("^[0-9a-f]{64}$");
    }
}

