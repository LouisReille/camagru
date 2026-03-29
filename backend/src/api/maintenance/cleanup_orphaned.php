<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../../utils/config/cors.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../../config/database.php';
    $uploadDir = '/var/www/html/uploads/';

    if (!is_dir($uploadDir)) {
        $uploadDir = __DIR__ . '/../../../public/uploads/';
    }

    $pdo = getDatabaseConnection();
    $stmt = $pdo->query("SELECT filename FROM images");
    $dbFilenames = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $dbFilenames[$row['filename']] = true;
    }

    if (!is_dir($uploadDir)) {
        throw new Exception("Uploads directory not found: $uploadDir");
    }

    $files = scandir($uploadDir);
    $orphanedFiles = [];

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.gitkeep') {
            continue;
        }

        $filePath = $uploadDir . $file;

        if (!is_file($filePath)) {
            continue;
        }

        if (!isset($dbFilenames[$file])) {
            $orphanedFiles[] = $file;
        }

    }

    $deletedCount = 0;
    $errorCount = 0;
    $errors = [];

    foreach ($orphanedFiles as $file) {
        $filePath = $uploadDir . $file;

        if (@unlink($filePath)) {
            $deletedCount++;
        } else {
            $errorCount++;
            $errors[] = $file;
        }

    }

    ob_end_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Cleanup completed',
        'stats' => [
            'images_in_db' => count($dbFilenames),
            'orphaned_found' => count($orphanedFiles),
            'deleted' => $deletedCount,
            'errors' => $errorCount
        ],
        'errors' => $errors
    ]);
} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to cleanup orphaned files: ' . $e->getMessage()
    ]);
}
