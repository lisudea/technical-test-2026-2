package co.edu.udea.lis.lisource.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

class Argon2DemoPasswordTest {
    private final Argon2PasswordEncoder encoder = new Argon2PasswordEncoder(16, 32, 4, 65_536, 3);

    @Test void suppliedDemoHashesMatchTheirPasswords() {
        assertThat(encoder.matches("DemoAdmin2026!",
                "$argon2id$v=19$m=65536,t=3,p=4$hUj7+BkHK9ufqI49nnnBCA$LyydI5IW8OEkGGhR2U1oI6KSgAuyeAW/1YwFDij+uP0")).isTrue();
        assertThat(encoder.matches("DemoUsuario2026!",
                "$argon2id$v=19$m=65536,t=3,p=4$fEsCA2VTDNUvNtnwNKSp0Q$gU2mG8qxppnOPopdTGY9oPN1MNK22t49mCCqsLrKE6I")).isTrue();
    }
}

