## ADDED Requirements

### Requirement: Single image download
The application SHALL allow users to download processed images individually.

#### Scenario: Download button availability
- **WHEN** an image processing completes successfully
- **THEN** a download button SHALL be displayed for that image
- **THEN** the button SHALL be clearly labeled with "Download" or download icon

#### Scenario: Initiating download
- **WHEN** a user clicks the download button for a processed image
- **THEN** the browser SHALL initiate file download
- **THEN** the file SHALL download with no additional prompts

#### Scenario: Download file naming
- **WHEN** an image is downloaded
- **THEN** the filename SHALL be based on the original filename
- **THEN** "_nowatermark" SHALL be appended before the file extension
- **THEN** the original file extension SHALL be preserved

### Requirement: Download endpoint
The server SHALL provide an endpoint for downloading processed images.

#### Scenario: Valid download request
- **WHEN** a client requests download for a valid processed image ID
- **THEN** the server SHALL stream the processed image file
- **THEN** appropriate Content-Type header SHALL be set based on image format

#### Scenario: Invalid image ID
- **WHEN** a client requests download for a non-existent image ID
- **THEN** the server SHALL return 404 Not Found status
- **THEN** the response SHALL indicate the image is not available

#### Scenario: Expired image download
- **WHEN** a client requests download for an image older than 1 hour
- **THEN** the server SHALL return 404 Not Found status
- **THEN** the response SHALL indicate the download has expired

#### Scenario: Download headers
- **WHEN** an image is downloaded
- **THEN** Content-Disposition header SHALL be set to trigger download
- **THEN** Cache-Control header SHALL prevent caching
- **THEN** Content-Length header SHALL indicate file size

### Requirement: Batch download support
The application SHALL support downloading multiple processed images at once.

#### Scenario: Batch download button
- **WHEN** multiple images have completed processing
- **THEN** a "Download All" button SHALL be available
- **THEN** the button SHALL show the count of downloadable images

#### Scenario: Batch download as ZIP
- **WHEN** a user clicks "Download All" with multiple processed images
- **THEN** all images SHALL be packaged into a ZIP archive
- **THEN** the ZIP file SHALL download automatically

#### Scenario: ZIP file naming
- **WHEN** a batch download is initiated
- **THEN** the ZIP filename SHALL include timestamp (e.g., "gemini_processed_2024-01-30.zip")
- **THEN** all original filenames SHALL be preserved within the ZIP

#### Scenario: Batch download progress
- **WHEN** a batch download is being prepared
- **THEN** a progress indicator SHALL show the packaging status
- **THEN** the user SHALL see feedback while the ZIP is being created

### Requirement: Download performance
Downloads SHALL be optimized for performance and reliability.

#### Scenario: Streaming download
- **WHEN** an image is downloaded
- **THEN** the server SHALL stream the file rather than loading it entirely in memory
- **THEN** large images SHALL download without server memory issues

#### Scenario: Download resume support
- **WHEN** a download is interrupted
- **THEN** the server SHALL support HTTP range requests
- **THEN** the browser SHALL be able to resume the download

### Requirement: Download tracking
The system SHALL track download activity for monitoring purposes.

#### Scenario: Download logging
- **WHEN** an image is downloaded
- **THEN** the download SHALL be logged with timestamp and image ID
- **THEN** download count SHALL be incremented

#### Scenario: Download metrics
- **WHEN** monitoring system metrics
- **THEN** total downloads per day SHALL be tracked
- **THEN** average download size SHALL be calculated

### Requirement: Download error handling
The application SHALL handle download errors gracefully.

#### Scenario: Network interruption during download
- **WHEN** network connection is lost during download
- **THEN** the browser SHALL handle the interruption according to its capabilities
- **THEN** the user SHALL be able to retry the download

#### Scenario: File no longer available
- **WHEN** a file is deleted after processing but before download
- **THEN** a clear error message SHALL inform the user
- **THEN** the download button SHALL be disabled

#### Scenario: Server error during download
- **WHEN** a server error occurs while serving a download
- **THEN** an appropriate error response SHALL be returned
- **THEN** the user SHALL see a message to try again

### Requirement: Download preview
The application SHALL show a preview of processed images before download.

#### Scenario: Preview display
- **WHEN** image processing completes
- **THEN** a preview of the processed image SHALL be displayed
- **THEN** the preview SHALL be clickable to view full size

#### Scenario: Before/after comparison
- **WHEN** viewing a processed image
- **THEN** the user SHALL be able to compare original and processed versions
- **THEN** a side-by-side or slider comparison view SHALL be available

### Requirement: Mobile download support
Downloads SHALL work properly on mobile devices.

#### Scenario: Mobile browser download
- **WHEN** a user downloads an image on a mobile device
- **THEN** the image SHALL download to the device's default download location
- **THEN** the mobile browser's download manager SHALL show the download

#### Scenario: Mobile batch download
- **WHEN** a user initiates batch download on mobile
- **THEN** the ZIP file SHALL download successfully
- **THEN** mobile browsers that support ZIP SHALL be able to open it

### Requirement: Download cleanup
Downloaded files SHALL be cleaned up from server storage.

#### Scenario: Post-download cleanup
- **WHEN** an image has been downloaded
- **THEN** the file SHALL remain available for 1 hour after first download
- **THEN** after 1 hour, the file SHALL be eligible for cleanup

#### Scenario: Cleanup of undownloaded files
- **WHEN** a processed file is never downloaded
- **THEN** it SHALL remain available for 1 hour after processing
- **THEN** after 1 hour, it SHALL be automatically deleted
