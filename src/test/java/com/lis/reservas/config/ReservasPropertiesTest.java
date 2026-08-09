package com.lis.reservas.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link ReservasProperties} binding. Uses Spring's
 * {@link Binder} directly (no Spring context) to verify defaults and
 * explicit values — pure data binding, no mocks.
 */
class ReservasPropertiesTest {

    @Test
    void appliesDefaultsWhenNoPropertiesPresent() {
        var source = new MapConfigurationPropertySource();
        var binder = new Binder(source);

        ReservasProperties props = binder.bindOrCreate("reservas", ReservasProperties.class);

        assertThat(props.maxDuration()).isEqualTo(Duration.ofHours(8));
        assertThat(props.minDuration()).isEqualTo(Duration.ofMinutes(15));
        assertThat(props.auth()).isNotNull();
        assertThat(props.auth().google()).isNotNull();
        assertThat(props.auth().google().enabled()).isFalse();
        assertThat(props.auth().google().clientId()).isNull();
        assertThat(props.auth().google().allowedDomain()).isEqualTo("udea.edu.co");
    }

    @Test
    void bindsExplicitValuesAndNestedAuth() {
        var source = new MapConfigurationPropertySource();
        source.put("reservas.max-duration", "PT4H");
        source.put("reservas.min-duration", "PT30M");
        source.put("reservas.auth.google.enabled", "true");
        source.put("reservas.auth.google.client-id", "google-client-123");
        source.put("reservas.auth.google.allowed-domain", "udea.edu.co");
        var binder = new Binder(source);

        ReservasProperties props = binder.bindOrCreate("reservas", ReservasProperties.class);

        assertThat(props.maxDuration()).isEqualTo(Duration.ofHours(4));
        assertThat(props.minDuration()).isEqualTo(Duration.ofMinutes(30));
        assertThat(props.auth().google().enabled()).isTrue();
        assertThat(props.auth().google().clientId()).isEqualTo("google-client-123");
        assertThat(props.auth().google().allowedDomain()).isEqualTo("udea.edu.co");
    }

    @Test
    void bindsMaxDurationIso8601Form() {
        var source = new MapConfigurationPropertySource(Map.of("reservas.max-duration", "PT6H30M"));
        var binder = new Binder(source);

        ReservasProperties props = binder.bindOrCreate("reservas", ReservasProperties.class);

        assertThat(props.maxDuration()).isEqualTo(Duration.ofMinutes(390));
    }
}