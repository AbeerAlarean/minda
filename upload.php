<?php
require_once __DIR__ . '/vendor/autoload.php';

use Google\Client;
use Google\Service\Drive;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Google\Exception;

// Set the ID of the folder you want to upload the file to
$folderId = '1WrX0NKWan4bjOsjNbdzrrIxLMP2GDw6R';
putenv('GOOGLE_APPLICATION_CREDENTIALS='.__DIR__.'/../key/rec.json');

// Get the file that was uploaded via the form
$file = $_FILES['file'];

// Validate the file size and type
$maxFileSize = 1024 * 1024 * 50; // 10 MB
$allowedFileTypes = array('audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav');
if ($file['size'] > $maxFileSize || !in_array($file['type'], $allowedFileTypes)) {
    // Return an error response indicating that the file is invalid
    $response = array(
        'status' => 'error',
        'message' => 'Invalid file. Please upload an audio file in MP3 or WAV format (up to 10 MB)',
    );
    echo json_encode($response);
    exit;
}

// Generate a random file name to prevent collisions
$fileName = $file['name'];

// Authenticate with a service account and add the drive.file scope
$client = new Client();
$client->setApplicationName('My Google Drive API Client');
$client->setScopes(['https://www.googleapis.com/auth/drive.file']);
$client->useApplicationDefaultCredentials();

// Create a new Drive instance
$driveService = new Drive($client);

// Create a new file in the specified folder
$fileMetadata = new Google_Service_Drive_DriveFile([
    'name' => $fileName,
    'parents' => array($folderId)
]);
$content = file_get_contents($file['tmp_name']);

try {
    $file = $driveService->files->create($fileMetadata, [
        'data' => $content,
        'mimeType' => $file['type'],
        'uploadType' => 'multipart'
    ]);

    // Return a success response indicating that the file was uploaded
    $response = array(
        'status' => 'success',
        'message' => 'File uploaded successfully',
    );
    echo json_encode($response);
} catch (Google\Service\Exception $e) {
    // Display the error message from the API response
    $response = array(
        'status' => 'error',
        'message' => 'Error uploading file: ' . $e->getMessage(),
    );
    echo json_encode($response);
}
