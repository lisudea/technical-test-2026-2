package co.edu.udea.lis.lisource.shared.config;

import java.util.Arrays;
import java.sql.Connection;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSafetyGuard implements ApplicationRunner {
    private final Environment environment;
    private final DataSource dataSource;

    public DatabaseSafetyGuard(Environment environment, DataSource dataSource) {
        this.environment = environment;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        boolean test = Arrays.asList(environment.getActiveProfiles()).contains("test");
        if (test) {
            try (Connection connection = dataSource.getConnection()) {
                String url = connection.getMetaData().getURL();
                if (url != null && url.toLowerCase().contains("supabase")) {
                    throw new IllegalStateException("Test profile must never connect to Supabase");
                }
            }
        }
    }
}
