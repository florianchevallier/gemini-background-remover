## ADDED Requirements

### Requirement: GeminiWatermarkTool binary integration
The server SHALL integrate the GeminiWatermarkTool binary for image processing.

#### Scenario: Binary availability check
- **WHEN** the server starts up
- **THEN** it SHALL verify the GeminiWatermarkTool binary exists at the expected path
- **THEN** it SHALL verify the binary has execute permissions

#### Scenario: Binary execution
- **WHEN** an image needs processing
- **THEN** the server SHALL execute GeminiWatermarkTool via child process
- **THEN** it SHALL pass input and output file paths as command-line arguments

### Requirement: Temporary file storage
The server SHALL manage temporary storage for uploaded and processed images.

#### Scenario: Uploaded file storage
- **WHEN** an image is uploaded
- **THEN** it SHALL be saved to the system temp directory with a UUID-based filename
- **THEN** the original file extension SHALL be preserved

#### Scenario: Processed file storage
- **WHEN** an image is processed successfully
- **THEN** the output SHALL be saved to the temp directory with UUID_processed extension
- **THEN** the output file SHALL be associated with the original upload

#### Scenario: Temporary file cleanup
- **WHEN** files have been in temp storage for more than 1 hour
- **THEN** they SHALL be automatically deleted
- **THEN** orphaned files from crashed processes SHALL also be removed

### Requirement: Image processing execution
The server SHALL process uploaded images to remove watermarks.

#### Scenario: Single image processing
- **WHEN** a user submits a single image for processing
- **THEN** the server SHALL execute GeminiWatermarkTool with input and output paths
- **THEN** processing SHALL complete within 60 seconds or timeout

#### Scenario: Batch image processing
- **WHEN** a user submits multiple images for processing
- **THEN** each image SHALL be processed sequentially or in parallel
- **THEN** the system SHALL track progress for each image independently

#### Scenario: Successful processing
- **WHEN** GeminiWatermarkTool exits with status code 0
- **THEN** the processed image file SHALL exist at the output path
- **THEN** the processing status SHALL be marked as complete

### Requirement: Concurrent processing limits
The server SHALL enforce limits on concurrent image processing operations.

#### Scenario: Within concurrency limit
- **WHEN** fewer than 5 images are being processed
- **THEN** a new processing request SHALL start immediately
- **THEN** processing SHALL execute without queueing

#### Scenario: Exceeding concurrency limit
- **WHEN** 5 or more images are already being processed
- **THEN** new processing requests SHALL be queued
- **THEN** queued requests SHALL start when a processing slot becomes available

#### Scenario: Queue position tracking
- **WHEN** a request is queued
- **THEN** the user SHALL see their position in the queue
- **THEN** the estimated wait time SHALL be displayed

### Requirement: Processing timeout handling
The server SHALL enforce timeout limits for image processing operations.

#### Scenario: Processing within timeout
- **WHEN** image processing completes within 60 seconds
- **THEN** the result SHALL be returned to the user
- **THEN** temporary files SHALL be marked for cleanup

#### Scenario: Processing timeout exceeded
- **WHEN** image processing exceeds 60 seconds
- **THEN** the GeminiWatermarkTool process SHALL be terminated
- **THEN** an error SHALL be returned indicating timeout
- **THEN** temporary files SHALL be cleaned up immediately

### Requirement: Processing error handling
The server SHALL handle processing errors gracefully.

#### Scenario: Binary execution failure
- **WHEN** GeminiWatermarkTool binary cannot be executed
- **THEN** the error SHALL be logged with details
- **THEN** a user-friendly error message SHALL be returned

#### Scenario: Invalid image format
- **WHEN** GeminiWatermarkTool exits with non-zero status code
- **THEN** the stderr output SHALL be captured and logged
- **THEN** a specific error message SHALL explain the issue to the user

#### Scenario: Disk space exhaustion
- **WHEN** there is insufficient disk space for output file
- **THEN** processing SHALL fail with a clear error message
- **THEN** partial files SHALL be cleaned up

#### Scenario: Memory exhaustion
- **WHEN** processing a very large image exhausts available memory
- **THEN** the process SHALL be terminated gracefully
- **THEN** an error SHALL inform the user to try a smaller image

### Requirement: Processing result validation
The server SHALL validate processing results before returning them.

#### Scenario: Output file verification
- **WHEN** GeminiWatermarkTool reports success
- **THEN** the server SHALL verify the output file exists
- **THEN** the server SHALL verify the output file size is greater than 0

#### Scenario: Image integrity check
- **WHEN** processing completes
- **THEN** the server SHALL verify the output is a valid image file
- **THEN** corrupted output files SHALL trigger an error

### Requirement: Processing status tracking
The server SHALL maintain status information for each processing operation.

#### Scenario: Status initialization
- **WHEN** a processing request is received
- **THEN** a unique processing ID SHALL be generated
- **THEN** the initial status SHALL be set to "pending"

#### Scenario: Status updates during processing
- **WHEN** processing state changes
- **THEN** the status SHALL update to reflect current state (pending/processing/complete/error)
- **THEN** status changes SHALL be persisted for status polling

#### Scenario: Status after completion
- **WHEN** processing completes successfully
- **THEN** the status SHALL include the output file ID
- **THEN** the status SHALL remain available for 1 hour

### Requirement: Process resource management
The server SHALL manage system resources used by processing operations.

#### Scenario: Process cleanup on success
- **WHEN** image processing completes successfully
- **THEN** the child process SHALL be terminated cleanly
- **THEN** no zombie processes SHALL remain

#### Scenario: Process cleanup on failure
- **WHEN** image processing fails or times out
- **THEN** the child process SHALL be killed immediately
- **THEN** all associated file handles SHALL be closed

#### Scenario: Graceful server shutdown
- **WHEN** the server is shutting down
- **THEN** in-progress processing operations SHALL be allowed to complete
- **THEN** new processing requests SHALL be rejected
- **THEN** server SHALL wait up to 30 seconds before force-terminating processes
