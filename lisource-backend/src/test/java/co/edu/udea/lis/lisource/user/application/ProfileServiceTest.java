package co.edu.udea.lis.lisource.user.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.user.domain.UserAccount;
import co.edu.udea.lis.lisource.user.infrastructure.UserRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProfileServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final AuditPublisher audit = mock(AuditPublisher.class);
    private final ProfileService service = new ProfileService(users, audit);

    @Test
    void authenticatedGoogleOnlyUserCanUpdateUnicodeNamesAndLanguageWithoutChangingIdentity() {
        UserAccount before = account("Carlos", "Usuario", "es");
        UserAccount after = account("María Camila", "De la Hoz Valencia", "fr");
        when(users.findById(7L)).thenReturn(Optional.of(before), Optional.of(after));
        when(users.isActiveLanguage("fr")).thenReturn(true);

        var result = service.update(7L, "USUARIO", "  María Camila  ", "De la Hoz Valencia", "fr");

        verify(users).updateProfile(7L, "María Camila", "De la Hoz Valencia", "fr");
        assertThat(result.firstName()).isEqualTo("María Camila");
        assertThat(result.lastName()).isEqualTo("De la Hoz Valencia");
        assertThat(result.preferredLanguage()).isEqualTo("fr");
        assertThat(result.email()).isEqualTo(before.email());
        assertThat(result.roles()).containsExactly("USUARIO");
    }

    @Test
    void rejectsBlankMarkupAndUnsupportedLanguageWithoutWriting() {
        when(users.findById(7L)).thenReturn(Optional.of(account("Carlos", "Usuario", "es")));
        when(users.isActiveLanguage("zz")).thenReturn(false);

        assertThatThrownBy(() -> service.update(7L, "USUARIO", "   ", null, null))
                .isInstanceOf(AppException.class);
        assertThatThrownBy(() -> service.update(7L, "USUARIO", "<script>", null, null))
                .isInstanceOf(AppException.class);
        assertThatThrownBy(() -> service.update(7L, "USUARIO", null, null, "zz"))
                .isInstanceOf(AppException.class);
        verify(users, never()).updateProfile(anyLong(), any(), any(), any());
    }

    private UserAccount account(String firstName, String lastName, String language) {
        return new UserAccount(7L, "google.demo@udea.edu.co", null, "google-sub", firstName,
                lastName, "ACTIVO", language, Set.of("USUARIO"));
    }
}
