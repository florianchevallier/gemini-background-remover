## ADDED Requirements

### Requirement: Multi-stage Docker build
The Dockerfile SHALL use multi-stage builds for optimized image size.

#### Scenario: Build stage
- **WHEN** Docker image is built
- **THEN** a separate build stage SHALL compile and bundle the application
- **THEN** all build dependencies SHALL be isolated to the build stage

#### Scenario: Production stage
- **WHEN** creating the final image
- **THEN** only production runtime files SHALL be copied from build stage
- **THEN** development dependencies SHALL be excluded

#### Scenario: Image size optimization
- **WHEN** the final Docker image is created
- **THEN** the image size SHALL be under 500MB
- **THEN** unnecessary files and caches SHALL be removed

### Requirement: Base image selection
The Docker image SHALL use an appropriate Node.js base image.

#### Scenario: Node.js version
- **WHEN** building the Docker image
- **THEN** Node.js version 18 LTS or later SHALL be used
- **THEN** the exact version SHALL be pinned in the Dockerfile

#### Scenario: Alpine vs Debian
- **WHEN** selecting the base image variant
- **THEN** Alpine Linux SHALL be preferred for smaller image size
- **THEN** if GeminiWatermarkTool requires glibc, Debian slim SHALL be used instead

### Requirement: GeminiWatermarkTool installation
The Docker image SHALL include the GeminiWatermarkTool binary.

#### Scenario: Binary download during build
- **WHEN** the Docker image is built
- **THEN** the GeminiWatermarkTool binary SHALL be downloaded from GitHub releases
- **THEN** the download SHALL verify the release exists

#### Scenario: Binary installation
- **WHEN** GeminiWatermarkTool is downloaded
- **THEN** it SHALL be extracted and installed to `/usr/local/bin`
- **THEN** execute permissions SHALL be set on the binary

#### Scenario: Binary verification
- **WHEN** the Docker image build completes
- **THEN** the build SHALL verify GeminiWatermarkTool can be executed
- **THEN** the build SHALL fail if the binary is not functional

### Requirement: Environment configuration
The Docker container SHALL support configuration via environment variables.

#### Scenario: Port configuration
- **WHEN** the container starts
- **THEN** it SHALL listen on the port specified by PORT environment variable
- **THEN** the default port SHALL be 3000 if PORT is not set

#### Scenario: Node environment
- **WHEN** the container runs in production
- **THEN** NODE_ENV SHALL be set to "production"
- **THEN** production optimizations SHALL be enabled

#### Scenario: Temp directory configuration
- **WHEN** the container needs temp storage
- **THEN** it SHALL use TEMP_DIR environment variable if set
- **THEN** the default SHALL be the system temp directory

### Requirement: Container startup
The Docker container SHALL start the application server automatically.

#### Scenario: Container startup command
- **WHEN** the container starts
- **THEN** it SHALL execute the production server command
- **THEN** the server SHALL bind to 0.0.0.0 for external access

#### Scenario: Startup health check
- **WHEN** the container is starting
- **THEN** it SHALL perform a health check after startup
- **THEN** the container SHALL report ready when health check passes

#### Scenario: Startup failure handling
- **WHEN** the application fails to start
- **THEN** the container SHALL exit with non-zero status code
- **THEN** error logs SHALL be written to stdout/stderr

### Requirement: Docker image layers
The Dockerfile SHALL optimize layer caching for faster rebuilds.

#### Scenario: Dependency installation layer
- **WHEN** building the Docker image
- **THEN** package.json and lock files SHALL be copied before other code
- **THEN** dependencies SHALL be installed in a separate layer

#### Scenario: Code change rebuilds
- **WHEN** application code changes but dependencies don't
- **THEN** only code layers SHALL be rebuilt
- **THEN** dependency layers SHALL be reused from cache

### Requirement: Security hardening
The Docker image SHALL follow security best practices.

#### Scenario: Non-root user
- **WHEN** the container runs
- **THEN** the application SHALL run as a non-root user
- **THEN** the user SHALL have minimal necessary permissions

#### Scenario: Minimal attack surface
- **WHEN** the image is built
- **THEN** unnecessary packages SHALL not be installed
- **THEN** package manager caches SHALL be cleaned up

#### Scenario: Dependency scanning
- **WHEN** validating the Docker image
- **THEN** it SHALL not contain critical security vulnerabilities
- **THEN** outdated dependencies SHALL be updated

### Requirement: Docker Compose support
The project SHALL include Docker Compose configuration for local development.

#### Scenario: Docker Compose file
- **WHEN** running locally with Docker Compose
- **THEN** a docker-compose.yml file SHALL define the service
- **THEN** volume mounts SHALL be configured for development

#### Scenario: Local development volumes
- **WHEN** running with Docker Compose in development
- **THEN** source code SHALL be mounted as a volume
- **THEN** node_modules SHALL be preserved in the container

#### Scenario: Port mapping
- **WHEN** running with Docker Compose
- **THEN** the application port SHALL be mapped to host port 3000
- **THEN** the port mapping SHALL be configurable

### Requirement: Build arguments
The Dockerfile SHALL support build arguments for customization.

#### Scenario: Node version argument
- **WHEN** building the Docker image
- **THEN** a NODE_VERSION build argument SHALL be supported
- **THEN** the default SHALL be 18

#### Scenario: GeminiWatermarkTool version argument
- **WHEN** building the Docker image
- **THEN** a TOOL_VERSION build argument SHALL specify which release to download
- **THEN** the default SHALL be "latest"

### Requirement: Container logging
The container SHALL output logs to stdout/stderr for proper log aggregation.

#### Scenario: Application logs
- **WHEN** the application logs messages
- **THEN** they SHALL be written to stdout
- **THEN** error logs SHALL be written to stderr

#### Scenario: Process logs
- **WHEN** GeminiWatermarkTool processes images
- **THEN** processing logs SHALL be captured and logged
- **THEN** timestamps SHALL be included in log entries

### Requirement: Container health checks
The Docker image SHALL include health check configuration.

#### Scenario: HTTP health check
- **WHEN** Docker checks container health
- **THEN** it SHALL make an HTTP request to the health endpoint
- **THEN** a 200 OK response SHALL indicate healthy status

#### Scenario: Health check timing
- **WHEN** the container starts
- **THEN** health checks SHALL start after 10 seconds
- **THEN** health checks SHALL run every 30 seconds
- **THEN** 3 consecutive failures SHALL mark the container unhealthy

### Requirement: Production deployment support
The Docker image SHALL be suitable for production deployment on common platforms.

#### Scenario: Cloud Run compatibility
- **WHEN** deploying to Google Cloud Run
- **THEN** the container SHALL respect the PORT environment variable
- **THEN** the container SHALL handle SIGTERM for graceful shutdown

#### Scenario: ECS compatibility
- **WHEN** deploying to AWS ECS
- **THEN** the container SHALL work with ECS task definitions
- **THEN** log output SHALL be compatible with CloudWatch Logs

#### Scenario: Kubernetes compatibility
- **WHEN** deploying to Kubernetes
- **THEN** the container SHALL support liveness and readiness probes
- **THEN** the container SHALL handle termination signals properly
