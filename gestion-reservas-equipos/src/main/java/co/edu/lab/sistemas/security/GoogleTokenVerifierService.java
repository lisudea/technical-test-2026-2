package co.edu.lab.sistemas.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import co.edu.lab.sistemas.exception.ForbiddenException;
import co.edu.lab.sistemas.exception.InvalidGoogleTokenException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.GeneralSecurityException;
import java.io.IOException;
import java.util.Collections;

@Component
public class GoogleTokenVerifierService {

    // Dominio permitido para los correos electrónicos de la universidad
    private static final String DOMINIO_PERMITIDO = "@udea.edu.co";

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierService(@Value("${application.google.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public String verificarYExtraerCorreo(String idTokenString) {
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString);
        } catch (Exception e) {
            throw new InvalidGoogleTokenException("El token de Google no tiene un formato válido");
        }

        if (idToken == null) {
            throw new InvalidGoogleTokenException("El token de Google es inválido o expiró");
        }

        String correo = idToken.getPayload().getEmail();
        if (correo == null || !correo.endsWith("@udea.edu.co")) {
            throw new InvalidGoogleTokenException("El correo asociado al token no pertenece al dominio institucional");
        }

        return correo;
    }
}