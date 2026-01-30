## ADDED Requirements

### Requirement: Real-time status polling
The client SHALL poll the server for processing status updates.

#### Scenario: Status polling during processing
- **WHEN** an image is being processed
- **THEN** the client SHALL poll the status endpoint every 500 milliseconds
- **THEN** polling SHALL continue until processing completes or fails

#### Scenario: Status polling after completion
- **WHEN** processing status reaches "complete" or "error"
- **THEN** polling SHALL stop immediately
- **THEN** no further status requests SHALL be made for that processing ID

#### Scenario: Status polling timeout
- **WHEN** no status update is received for 90 seconds
- **THEN** polling SHALL stop
- **THEN** the UI SHALL display a timeout error message

### Requirement: Status endpoint
The server SHALL provide an endpoint for checking processing status.

#### Scenario: Valid status request
- **WHEN** a client requests status for a valid processing ID
- **THEN** the server SHALL return current status (pending/processing/complete/error)
- **THEN** the response SHALL include progress information when available

#### Scenario: Invalid processing ID
- **WHEN** a client requests status for a non-existent processing ID
- **THEN** the server SHALL return 404 Not Found status
- **THEN** the response SHALL indicate the ID is invalid or expired

#### Scenario: Expired status
- **WHEN** a client requests status for a processing ID older than 1 hour
- **THEN** the server SHALL return 404 Not Found status
- **THEN** the response SHALL indicate the status has expired

### Requirement: Processing status states
The system SHALL track and communicate distinct processing states.

#### Scenario: Pending state
- **WHEN** a processing request is queued but not yet started
- **THEN** status SHALL be "pending"
- **THEN** queue position SHALL be included if applicable

#### Scenario: Processing state
- **WHEN** GeminiWatermarkTool is actively processing an image
- **THEN** status SHALL be "processing"
- **THEN** elapsed time SHALL be included

#### Scenario: Complete state
- **WHEN** processing finishes successfully
- **THEN** status SHALL be "complete"
- **THEN** the processed file ID SHALL be included

#### Scenario: Error state
- **WHEN** processing fails for any reason
- **THEN** status SHALL be "error"
- **THEN** error message SHALL be included with user-friendly description

### Requirement: Progress percentage display
The UI SHALL display processing progress as a percentage when available.

#### Scenario: Indeterminate progress
- **WHEN** processing is active but progress cannot be determined
- **THEN** an indeterminate progress indicator SHALL be displayed
- **THEN** elapsed time SHALL be shown

#### Scenario: Progress updates
- **WHEN** GeminiWatermarkTool provides progress information
- **THEN** the progress percentage SHALL be displayed
- **THEN** the progress bar SHALL update smoothly without jumping

### Requirement: Batch processing status
The UI SHALL track and display status for multiple simultaneous processing operations.

#### Scenario: Multiple images processing
- **WHEN** a batch of images is being processed
- **THEN** each image SHALL have independent status tracking
- **THEN** individual status indicators SHALL be displayed for each image

#### Scenario: Overall batch progress
- **WHEN** multiple images are processing
- **THEN** an overall progress indicator SHALL show (X of Y complete)
- **THEN** the overall status SHALL update as individual images complete

#### Scenario: Batch completion
- **WHEN** all images in a batch complete processing
- **THEN** a summary SHALL be displayed (X successful, Y failed)
- **THEN** download options SHALL be enabled for successful images

### Requirement: Status update visual feedback
The UI SHALL provide clear visual feedback for status changes.

#### Scenario: Status change animation
- **WHEN** processing status changes from one state to another
- **THEN** the UI SHALL animate the transition smoothly
- **THEN** the new status SHALL be clearly distinguishable

#### Scenario: Success indication
- **WHEN** processing completes successfully
- **THEN** a success icon or color SHALL be displayed
- **THEN** a success message SHALL confirm completion

#### Scenario: Error indication
- **WHEN** processing fails with an error
- **THEN** an error icon or color SHALL be displayed
- **THEN** the error message SHALL be clearly visible

### Requirement: Processing time estimates
The system SHALL provide time estimates when possible.

#### Scenario: Estimated completion time
- **WHEN** processing is active and queue position is known
- **THEN** an estimated time remaining SHALL be displayed
- **THEN** the estimate SHALL update based on actual processing time

#### Scenario: Queue wait time estimate
- **WHEN** a processing request is queued
- **THEN** estimated wait time SHALL be shown based on queue length
- **THEN** the estimate SHALL account for average processing time

### Requirement: Status persistence
Processing status SHALL remain available after completion.

#### Scenario: Status retrieval after completion
- **WHEN** a user refreshes the page after processing completes
- **THEN** the status SHALL still be retrievable for 1 hour
- **THEN** the download link SHALL remain functional

#### Scenario: Status expiration
- **WHEN** status data is older than 1 hour
- **THEN** it SHALL be removed from storage
- **THEN** attempts to retrieve it SHALL return not found

### Requirement: Error message clarity
Error messages SHALL be specific and actionable.

#### Scenario: File format error
- **WHEN** processing fails due to unsupported image format
- **THEN** the error message SHALL specify which formats are supported
- **THEN** guidance SHALL be provided for converting the image

#### Scenario: File size error
- **WHEN** processing fails due to file size limits
- **THEN** the error message SHALL specify the size limit
- **THEN** guidance SHALL be provided for reducing file size

#### Scenario: Timeout error
- **WHEN** processing exceeds the timeout limit
- **THEN** the error message SHALL explain the timeout occurred
- **THEN** guidance SHALL suggest trying a smaller or simpler image

#### Scenario: Server error
- **WHEN** processing fails due to server error
- **THEN** the error message SHALL indicate a server problem
- **THEN** the user SHALL be encouraged to try again later
