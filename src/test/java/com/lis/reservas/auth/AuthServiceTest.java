package com.lis.reservas.auth;

import com.lis.reservas.auth.dto.GoogleAuthRequest;
import com.lis.reservas.auth.dto.PerfilResponse;
import com.lis.reservas.auth.dto.TokenResponse;
import com.lis.reservas.common.exception.DominioNoAutorizadoException;
import com.lis.reservas.usuario.dto.UsuarioResponse;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthService}. All collaborators are mocked so the
 * orchestration (validate -> upsert -> issue JWT, and profile lookup) is
 * verified in isolation.
 */
class AuthServiceTest {

    private GoogleTokenValidator googleTokenValidator;
    private UsuarioService usuarioService;
    private JwtTokenProvider jwtTokenProvider;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        googleTokenValidator = mock(GoogleTokenValidator.class);
        usuarioService = mock(UsuarioService.class);
        jwtTokenProvider = mock(JwtTokenProvider.class);
        authService = new AuthService(googleTokenValidator, usuarioService, jwtTokenProvider);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticateIssuesJwtAndUpsertsUser() {
        String idToken = "google-id-token";
        when(googleTokenValidator.verify(idToken))
                .thenReturn(new GoogleTokenValidator.GoogleUserInfo(
                        "juan@udea.edu.co", "Juan Perez"));
        when(jwtTokenProvider.generateToken("juan@udea.edu.co", "Juan Perez"))
                .thenReturn("signed.jwt");
        when(jwtTokenProvider.expirationSeconds()).thenReturn(1800L);

        TokenResponse response = authService.authenticate(new GoogleAuthRequest(idToken));

        assertThat(response.token()).isEqualTo("signed.jwt");
        assertThat(response.tipo()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(1800L);
        verify(usuarioService).upsertByCorreo("juan@udea.edu.co", "Juan Perez");
    }

    @Test
    void authenticatePropagatesDomainException() {
        String idToken = "google-id-token";
        when(googleTokenValidator.verify(idToken))
                .thenThrow(new DominioNoAutorizadoException("fuera de dominio"));

        assertThatThrownBy(() -> authService.authenticate(new GoogleAuthRequest(idToken)))
                .isInstanceOf(DominioNoAutorizadoException.class);

        verify(usuarioService, never()).upsertByCorreo(any(), any());
        verify(jwtTokenProvider, never()).generateToken(any(), any());
    }

    @Test
    void getPerfilReturnsStoredUserProfile() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "juan@udea.edu.co", null, List.of()));
        when(usuarioService.findByCorreo("juan@udea.edu.co"))
                .thenReturn(new UsuarioResponse(1, "Juan Perez", "juan@udea.edu.co"));

        PerfilResponse perfil = authService.getPerfil();

        assertThat(perfil.nombre()).isEqualTo("Juan Perez");
        assertThat(perfil.correo()).isEqualTo("juan@udea.edu.co");
    }

    @Test
    void getPerfilRejectsAnonymousPrincipal() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "anonymousUser", null, List.of()));

        assertThatThrownBy(() -> authService.getPerfil())
                .isInstanceOf(AccessDeniedException.class);
        verify(usuarioService, never()).findByCorreo(any());
    }

    @Test
    void getPerfilRejectsMissingAuthentication() {
        assertThatThrownBy(() -> authService.getPerfil())
                .isInstanceOf(AccessDeniedException.class);
    }
}
