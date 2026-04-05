<?php
require_once __DIR__ . '/../../../config/uploads_path.php';
require_once __DIR__ . '/../../utils/config/cors.php';

if (!$GLOBALS['cors_headers_set']) {
    setCorsHeaders();
}

$filename = $_GET['filename'] ?? null;

if (!$filename) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing filename parameter']);
    exit;
}

$filename = basename($filename);
$uploadDir = getUploadsDirectory();
$filePath = $uploadDir . $filename;

if (!file_exists($filePath)) {
    $uploadDirExists = is_dir($uploadDir);

    if (!$GLOBALS['cors_headers_set']) {
        setCorsHeaders();
    }

    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Image not found',
        'filename' => $filename,
        'path' => $filePath,
        'upload_dir_exists' => $uploadDirExists
    ]);
    exit;
}

$mimeType = mime_content_type($filePath);

if (!$mimeType || !str_starts_with($mimeType, 'image/')) {
    if (!$GLOBALS['cors_headers_set']) {
        setCorsHeaders();
    }

    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

if (!$GLOBALS['cors_headers_set']) {
    setCorsHeaders();
}

header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: public, max-age=31536000');
readfile($filePath);
exit;
