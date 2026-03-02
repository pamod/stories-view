# =============================================================================
# Device Enrollment Service — Ballerina (pamod/des v0.1.0)
# Distribution: Swan Lake 2201.13.1
# =============================================================================
#
# Multi-stage build:
#   Stage 1 (builder) — compiles the Ballerina source into a self-contained JAR
#   Stage 2 (runtime) — runs the JAR on a minimal JRE 17 image
#
# Config.toml is NOT baked in; docker-compose mounts ./des/Config.toml at
# /home/ballerina/Config.toml so the runtime picks up the Docker DB settings.

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM ballerina/ballerina:2201.13.1 AS builder

WORKDIR /home/ballerina

# Copy project files (target/ is excluded via .dockerignore)
COPY . .

# bal build downloads dependencies from Ballerina Central and produces
# target/bin/des.jar (a fat JAR including all Ballerina + platform deps)
RUN bal build

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /home/ballerina

# Copy only the compiled fat JAR from the builder stage
COPY --from=builder /home/ballerina/target/bin/des.jar ./des.jar

# Config.toml is mounted here by docker-compose at runtime.
# Ballerina reads it from the current working directory (/home/ballerina).

EXPOSE 8080

CMD ["java", "-jar", "des.jar"]
