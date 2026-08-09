package co.edu.udea.lis.lisource.auth.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EmailDomainPolicyTest {
    private EmailDomainPolicy policy;

    @BeforeEach
    void setUp() {
        ConfigurationService configuration = mock(ConfigurationService.class);
        when(configuration.stringOr(ConfigurationService.EMAIL_DOMAIN, "udea.edu.co")).thenReturn("udea.edu.co");
        policy = new EmailDomainPolicy(configuration);
    }

    @Test void acceptsExactInstitutionalDomainAndNormalizes() {
        assertThat(policy.requireInstitutional(" Person@UDEA.EDU.CO ")).isEqualTo("person@udea.edu.co");
    }

    @Test void rejectsLookalikesAndSubdomains() {
        assertThatThrownBy(() -> policy.requireInstitutional("person@gmail.com")).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> policy.requireInstitutional("person@udea.edu.co.evil.com")).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> policy.requireInstitutional("udea.edu.co@evil.com")).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> policy.requireInstitutional("person@subdominio.udea.edu.co")).isInstanceOf(AppException.class);
    }
}

