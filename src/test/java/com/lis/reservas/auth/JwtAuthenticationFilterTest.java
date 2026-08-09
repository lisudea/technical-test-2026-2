package com.lis.reservas.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JwtAuthenticationFilter}. The {@link JwtTokenProvider}
 * is mocked so the filter logic (header extraction + SecurityContext
 * population) is exercised in isolation against a real filter instance.
 */
class JwtAuthenticationFilterTest {

    private JwtTokenProvider jwtTokenProvider;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = mock(JwtTokenProvider.class);
        filter = new JwtAuthenticationFilter(jwtTokenProvider);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validBearerTokenSetsAuthenticationWithCorreoAsPrincipal() throws Exception {
        String token = "valid.jwt.token";
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getCorreoFromToken(token)).thenReturn("juan@udea.edu.co");

        filter.doFilter(requestWithBearer(token), new MockHttpServletResponse(), (req, res) -> {
        });

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getPrincipal()).isEqualTo("juan@udea.edu.co");
    }

    @Test
    void invalidTokenDoesNotSetAuthentication() throws Exception {
        String token = "tampered.jwt.token";
        when(jwtTokenProvider.validateToken(token)).thenReturn(false);

        filter.doFilter(requestWithBearer(token), new MockHttpServletResponse(), (req, res) -> {
        });

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtTokenProvider, never()).getCorreoFromToken(token);
    }

    @Test
    void missingAuthorizationHeaderDoesNotSetAuthentication() throws Exception {
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), (req, res) -> {
        });

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtTokenProvider, never()).validateToken(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void nonBearerHeaderDoesNotSetAuthentication() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Basic abc123");

        filter.doFilter(req, new MockHttpServletResponse(), (req1, res) -> {
        });

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void filterAlwaysProceedsChain() throws Exception {
        boolean[] chainCalled = {false};
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(),
                (req, res) -> chainCalled[0] = true);
        assertThat(chainCalled[0]).isTrue();
    }

    private HttpServletRequest requestWithBearer(String token) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer " + token);
        return req;
    }
}
