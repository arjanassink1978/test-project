# Multi-stage build for Spring Boot backend
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy parent pom and both module poms (for dependency caching)
COPY pom.xml ./
COPY backend/pom.xml ./backend/
COPY restassured-tests/pom.xml ./restassured-tests/

# Download dependencies for backend module only
RUN mvn dependency:resolve -pl backend -q 2>/dev/null || true

# Copy source code
COPY . .

# Build backend module only (skip tests)
RUN mvn clean package -pl backend -q -DskipTests

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
