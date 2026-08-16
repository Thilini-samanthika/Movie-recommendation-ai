# Multi-Stage Dockerfile for Spring Boot Backend
# Stage 1: Build Java Application using Maven
FROM maven:3.8.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy Maven POM and source code
COPY pom.xml .
COPY src ./src

# Package application into executable JAR (skipping tests for container packaging)
RUN mvn clean package -DskipTests

# Stage 2: Minimal Runtime Image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security compliance
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR artifact from build stage
COPY --from=builder /app/target/*.jar app.jar

# Expose Spring Boot HTTP Port
EXPOSE 8080

# Environment variables
ENV JAVA_OPTS="-Xms256m -Xmx512m"

# Application entrypoint
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
