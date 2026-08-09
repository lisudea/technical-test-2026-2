package co.edu.udea.lis.lisource.auth.infrastructure;

import co.edu.udea.lis.lisource.auth.domain.PasswordRecoveryNotifier;
import co.edu.udea.lis.lisource.shared.config.AppProperties;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@ConditionalOnExpression("'${MAIL_HOST:}' != ''")
public class LocalPasswordRecoveryNotifier implements PasswordRecoveryNotifier {
    private final AppProperties properties;
    private final JavaMailSender mailSender;
    private final String mailFrom;

    public LocalPasswordRecoveryNotifier(AppProperties properties, JavaMailSender mailSender,
                                           @Value("${MAIL_FROM:}") String mailFrom) {
        this.properties = properties;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    @Override
    public void notify(String email, String rawToken) {
        String url = UriComponentsBuilder.fromUriString(properties.frontendUrl())
                .path("/reset-password").queryParam("token", rawToken).build().toUriString();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(email);
            helper.setFrom(mailFrom, "LISource");
            helper.setSubject("Recuperación de contraseña · LISource");
            helper.setText("""
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
                      <h2>Recupera tu acceso a LISource</h2>
                      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                      <p><a href="%s" style="background:#006837;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Crear nueva contraseña</a></p>
                      <p>El enlace es de un solo uso y expira pronto. Si no hiciste esta solicitud, ignora este mensaje.</p>
                    </div>
                    """.formatted(url), true);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new IllegalStateException("Password recovery email could not be delivered", exception);
        }
    }
}
