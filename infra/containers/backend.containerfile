# =====================================================================
# Multi-stage Containerfile for the Reservas LIS backend (Spring Boot 3 / Java 21).
# Build with Podman or Docker:
#   podman build -f infra/containers/backend.containerfile -t reservas-backend .
# =====================================================================

# ---- Stage 1: build -------------------------------------------------
FROM docker.io/library/maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

# Cache dependency resolution separately from source changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Copy source and build the fat jar. Tests run in CI; skip them here to
# keep the image build fast and decoupled from the test database.
COPY src ./src
RUN mvn -B -q clean package -DskipTests \
    && mv target/reservas-lis-*.jar /workspace/app.jar

# ---- Stage 2: runtime ----------------------------------------------
# Alpine JRE keeps the runtime image small (~200MB).
FROM docker.io/library/eclipse-temurin:21-jre-alpine

# Non-root user for the container runtime.
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar

EXPOSE 8080

USER app

# Spring Boot listens on 0.0.0.0:8080 by default; server.port is set in
# application.yml. Flyway runs migrations on startup.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
