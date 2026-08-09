FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S lisource && adduser -S lisource -G lisource
WORKDIR /app
COPY --from=build /workspace/target/lisource-backend-*.jar app.jar
USER lisource
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
