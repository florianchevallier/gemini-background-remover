## Context

The GeminiWatermarkTool is currently a CLI-only utility built in Go that removes Gemini-generated watermarks from images. This design establishes a web-based interface to make the tool accessible to non-technical users. The web application must maintain the same quality output as the CLI while providing an intuitive, production-ready experience.

**Current State:**
- CLI tool requires manual installation and terminal usage
- No web interface exists
- Users must process images one at a time via command line
- No persistent storage or user sessions required (stateless processing)

**Constraints:**
- GeminiWatermarkTool binary must be bundled in Docker image
- Image processing must happen server-side (binary cannot run in browser)
- Temporary file storage needed for upload/processing/download cycle
- Must support concurrent users processing images simultaneously
- Production deployment via Docker container

**Stakeholders:**
- End users seeking easy watermark removal without technical knowledge
- Operations team deploying and maintaining the service

## Goals / Non-Goals

**Goals:**
- Provide intuitive drag-and-drop image upload interface
- Process images server-side using GeminiWatermarkTool binary
- Show real-time processing status and feedback
- Enable batch processing of multiple images
- Deploy as production-ready Docker container
- Achieve excellent DX with TypeScript, hot reloading, and modern tooling
- Create responsive UI that works on desktop and mobile

**Non-Goals:**
- User authentication or accounts (stateless service)
- Persistent storage of uploaded/processed images beyond request lifecycle
- Image editing features beyond watermark removal
- Payment or rate limiting (can be added later)
- Supporting GeminiWatermarkTool on platforms other than the container OS

## Decisions

### 1. Framework: React Router v7 + Remix

**Decision:** Use React Router v7 with Remix for full-stack application.

**Rationale:**
- React Router v7 provides modern file-system routing with nested layouts
- Remix offers excellent server-side rendering and progressive enhancement
- Built-in form handling and data loading patterns
- Server functions (actions/loaders) provide clean API boundaries
- Vite-based build system for fast HMR and development experience
- TypeScript support out of the box

**Alternatives Considered:**
- Next.js: More complex routing, heavier framework, app router still evolving
- Pure React SPA + Express: Requires more boilerplate, no SSR benefits, less DX
- Astro: Great for content sites, less suitable for interactive applications

### 2. File Upload Strategy: Multipart Form with Server Actions

**Decision:** Use Remix action functions with `unstable_parseMultipartFormData` for file uploads.

**Rationale:**
- Native form handling with progressive enhancement (works without JS)
- Built-in request parsing in Remix
- Can stream large files without loading entirely in memory
- Integrates seamlessly with Remix's form submission patterns

**Alternatives Considered:**
- Client-side base64 encoding: Increases payload size by ~33%, poor performance
- Separate Express endpoint: Unnecessary complexity, duplicates server logic
- Third-party upload service (S3, Cloudinary): Adds external dependency, increases cost

### 3. Processing Status: Polling-Based Updates

**Decision:** Use client-side polling with React Router's `useFetcher` to check processing status.

**Rationale:**
- Simple implementation without WebSocket infrastructure
- Works reliably across all network configurations (no WebSocket blocking)
- Remix's `useFetcher` provides clean polling patterns
- Sufficient latency for image processing operations (typically 1-5 seconds)
- Stateless server design (status stored in temporary file metadata)

**Alternatives Considered:**
- WebSockets: Added complexity, requires long-lived connections, harder to scale
- Server-Sent Events: One-directional, still requires connection management
- Synchronous processing: Poor UX for slow operations, blocks UI

### 4. Temporary Storage: OS Temp Directory with UUID Naming

**Decision:** Store uploaded/processed images in OS temp directory with UUID-based filenames, cleanup after download or timeout.

**Rationale:**
- `/tmp` (Linux) or `os.tmpdir()` (Node.js) provides standard location
- UUIDs prevent filename collisions between concurrent users
- Automatic cleanup via cron job or scheduled task
- No database needed for stateless operation
- Simple file-based approach aligns with CLI tool usage

**Alternatives Considered:**
- In-memory storage: Limited by RAM, lost on restart, not suitable for images
- Persistent database: Unnecessary complexity for temporary files
- Object storage (S3): External dependency, increased cost, overkill for ephemeral data

### 5. Docker Base Image: Node.js with Binary Installation

**Decision:** Use official `node:18-alpine` base image, install GeminiWatermarkTool binary during build.

**Rationale:**
- Alpine provides minimal image size
- Node.js 18 LTS offers stability and long-term support
- Binary can be downloaded and installed via Dockerfile
- Multi-stage build can optimize final image size
- Container includes all runtime dependencies

**Build Strategy:**
1. Build stage: Install dependencies, build Remix app
2. Production stage: Copy built assets, install GeminiWatermarkTool, configure runtime

**Alternatives Considered:**
- Building GeminiWatermarkTool from source: Requires Go toolchain, slower builds, more complex
- Separate containers: Unnecessary microservices overhead for simple use case
- Full Debian image: Larger size (~10x), slower pulls, no significant benefit

### 6. Process Execution: Node.js `child_process.spawn` with Stream Handling

**Decision:** Execute GeminiWatermarkTool binary via `child_process.spawn`, capture stdout/stderr, handle exit codes.

**Rationale:**
- Spawn provides non-blocking execution
- Can capture real-time output for progress/errors
- Proper signal handling for process cleanup
- Works reliably in container environment

**Error Handling:**
- Non-zero exit codes → user-friendly error messages
- Timeout after 60 seconds to prevent hanging processes
- Graceful cleanup of temp files on failure

### 7. UI Framework: Tailwind CSS with Shadcn/UI Components

**Decision:** Use Tailwind CSS for styling with Shadcn/UI component library.

**Rationale:**
- Tailwind provides utility-first approach with excellent DX
- Shadcn/UI offers high-quality, accessible components (no runtime library)
- Components are copy-paste (full control, no black box dependencies)
- Excellent TypeScript support
- Responsive design patterns built-in

**Alternatives Considered:**
- Material UI: Heavier bundle, less flexibility, more opinionated
- Plain CSS: More manual work, less DX, harder to maintain consistency
- CSS-in-JS (styled-components): Runtime cost, more complex setup

### 8. File System Structure: Remix File-Based Routing

**Decision:** Use Remix file-system routing conventions with co-located components.

```
app/
├── routes/
│   ├── _index.tsx          # Home page with upload UI
│   ├── api.upload.tsx      # Upload action endpoint
│   ├── api.status.$id.tsx  # Status check endpoint
│   ├── api.download.$id.tsx # Download processed image
├── components/
│   ├── ui/                 # Shadcn/UI components
│   ├── ImageUpload.tsx     # Drag-drop upload component
│   ├── ProcessingStatus.tsx # Status display component
│   └── ImagePreview.tsx    # Preview component
├── lib/
│   ├── watermark.server.ts # GeminiWatermarkTool wrapper
│   ├── storage.server.ts   # Temp file management
│   └── utils.ts            # Shared utilities
└── root.tsx                # App shell
```

**Rationale:**
- Clear separation of routes and reusable components
- `.server.ts` suffix indicates server-only code (tree-shaken from client)
- Co-location improves discoverability and maintenance

## Risks / Trade-offs

### Risk: Concurrent Processing Limits
**Description:** Multiple users processing large images simultaneously could exhaust server resources.

**Mitigation:**
- Implement file size limits (e.g., 10MB per image)
- Limit concurrent processing via queue (e.g., max 5 parallel processes)
- Monitor memory/CPU usage and scale horizontally via Docker replicas
- Add rate limiting per IP if abuse occurs

### Risk: Temporary File Cleanup
**Description:** Failed processes or interrupted requests may leave orphaned files in temp directory.

**Mitigation:**
- Implement cleanup job that removes files older than 1 hour
- Add file age check on server startup to clean stale files
- Monitor disk usage with alerts

### Risk: Binary Compatibility
**Description:** GeminiWatermarkTool binary may not work in Alpine Linux or have missing dependencies.

**Mitigation:**
- Test binary in target container during development
- If incompatible, switch to `node:18-slim` (Debian-based) or build from source
- Document binary installation process for troubleshooting

### Risk: Processing Timeout Handling
**Description:** Very large or complex images may exceed timeout, leaving users without feedback.

**Mitigation:**
- Set generous timeout (60 seconds) based on testing
- Show clear error message on timeout with suggestion to try smaller image
- Log timeout occurrences to identify patterns

### Trade-off: Polling vs WebSockets
**Selected:** Polling with 500ms interval

**Trade-offs:**
- ✅ Simpler implementation, no connection management
- ✅ Works through all proxies/firewalls
- ✅ Stateless server architecture
- ❌ Slightly higher latency (up to 500ms delay)
- ❌ More HTTP requests (acceptable for short-lived processing)

### Trade-off: Stateless vs Persistent Storage
**Selected:** Stateless with temporary files

**Trade-offs:**
- ✅ Simple architecture, no database needed
- ✅ Automatic cleanup, no storage growth
- ✅ Better privacy (files not retained)
- ❌ Cannot retrieve processed images after session
- ❌ Requires user to download immediately

## Migration Plan

**Phase 1: Development Setup**
1. Initialize Remix project with TypeScript
2. Install and configure Tailwind CSS + Shadcn/UI
3. Set up development environment with HMR
4. Create basic routes and component structure

**Phase 2: Core Functionality**
1. Implement image upload route with multipart form handling
2. Integrate GeminiWatermarkTool binary execution
3. Build temp file storage management
4. Create processing status endpoint
5. Implement download endpoint

**Phase 3: UI Implementation**
1. Build drag-and-drop upload component
2. Create processing status display with progress
3. Implement image preview
4. Add batch processing UI
5. Polish responsive design and mobile support

**Phase 4: Dockerization**
1. Create multi-stage Dockerfile
2. Download and install GeminiWatermarkTool in container
3. Configure production environment variables
4. Test container build and runtime
5. Document deployment process

**Phase 5: Production Readiness**
1. Add error handling and user feedback
2. Implement file cleanup job
3. Add basic monitoring/logging
4. Performance testing with concurrent users
5. Security review (file upload validation, path traversal protection)

**Deployment:**
- Build Docker image: `docker build -t gemini-watermark-web .`
- Run container: `docker run -p 3000:3000 gemini-watermark-web`
- Deploy to container platform (Cloud Run, ECS, K8s, etc.)

**Rollback Strategy:**
- Stop container
- Revert to previous image version
- No data migration needed (stateless)

## Open Questions

1. **Image Size Limits:** What maximum file size should we enforce? (Suggested: 10MB)
2. **Concurrent Processing Limit:** How many simultaneous image processing jobs should we allow? (Suggested: 5)
3. **File Retention Period:** How long should we keep temp files before cleanup? (Suggested: 1 hour)
4. **Deployment Target:** Which container platform will be used? (Cloud Run, AWS ECS, self-hosted Docker, etc.)
5. **Domain/URL:** What will be the production URL?
6. **Analytics:** Do we need usage tracking? (GA, Plausible, etc.)
