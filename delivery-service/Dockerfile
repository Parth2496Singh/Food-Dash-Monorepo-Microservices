# Stage 1: Builder
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src ./src
# Compile the .jar file
RUN ./mvnw clean package -DskipTests

# Stage 2: Production Runner
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Create a dedicated non-root user/group for Spring
RUN addgroup -S spring && adduser -S spring -G spring
# Copy the compiled jar
COPY --from=builder /app/target/*.jar app.jar
RUN chown spring:spring app.jar
# Secure the container
USER spring:spring
EXPOSE 3004
# Use Docker-aware JVM flags to prevent Out-Of-Memory crashes
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]