package co.edu.udea.lis.lisource.auth.infrastructure;

import co.edu.udea.lis.lisource.auth.domain.PasswordRecoveryNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("'${MAIL_HOST:}' == ''")
public class NoopPasswordRecoveryNotifier implements PasswordRecoveryNotifier {
    private static final Logger log = LoggerFactory.getLogger(NoopPasswordRecoveryNotifier.class);
    @Override public void notify(String email, String rawToken) {
        log.warn("Password recovery email was not sent because SMTP is not configured");
    }
}
