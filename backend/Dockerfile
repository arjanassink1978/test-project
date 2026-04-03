# Multi-stage build for Spring Boot backend
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy only pom.xml first (for better caching)
COPY pom.xml ./
COPY backend/pom.xml ./backend/
COPY restassured-tests/pom.xml ./restassured-tests/

# Download dependencies
RUN mvn dependency:resolve

# Copy source code
COPY . .

# Build backend module only
RUN mvn clean package -pl backend -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy JAR from builder
COPY --from=builder /app/backend/target/backend-*-exec.jar app.jar

# Health check
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
