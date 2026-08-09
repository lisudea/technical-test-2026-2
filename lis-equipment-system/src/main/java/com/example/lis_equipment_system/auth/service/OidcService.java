package com.example.lis_equipment_system.auth.service;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class OidcService extends OidcUserService  {

    private static final String ALLOWED_DOMAIN = "@udea.edu.co";

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String email = oidcUser.getEmail();
        if (email == null || !email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("invalid_domain",
                    "Solo se permiten correos institucionales " + ALLOWED_DOMAIN, null)
            );
        }

        return oidcUser;
    }
}