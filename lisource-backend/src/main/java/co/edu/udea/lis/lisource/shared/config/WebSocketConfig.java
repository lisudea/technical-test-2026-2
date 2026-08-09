package co.edu.udea.lis.lisource.shared.config;

import co.edu.udea.lis.lisource.user.domain.UserAccount;
import co.edu.udea.lis.lisource.user.infrastructure.UserRepository;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final AppProperties properties;
    private final JwtDecoder decoder;
    private final UserRepository users;

    public WebSocketConfig(AppProperties properties, JwtDecoder decoder, UserRepository users) {
        this.properties = properties;
        this.decoder = decoder;
        this.users = users;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(properties.allowedOrigins().toArray(String[]::new));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) authenticate(accessor);
                return message;
            }
        });
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("WebSocket authentication is required");
        }
        Jwt jwt = decoder.decode(authorization.substring(7));
        long userId = Long.parseLong(jwt.getSubject());
        String activeRole = jwt.getClaimAsString("activeRole");
        UserAccount user = users.findById(userId)
                .filter(UserAccount::active)
                .filter(account -> account.roles().contains(activeRole))
                .orElseThrow(() -> new IllegalArgumentException("WebSocket account or role is unavailable"));
        accessor.setUser(new UsernamePasswordAuthenticationToken(user.email(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + activeRole))));
    }
}
