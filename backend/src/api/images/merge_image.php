<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 0);
register_shutdown_function(function() {
    $error = error_get_last();

    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Fatal error: ' . $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
    }

});

require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/config/session.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/image_processing.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_clean();
header('Content-Type: application/json');
$userId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$background = $data['background'] ?? null;
$stickers = $data['stickers'] ?? null;
$caption = $data['caption'] ?? null;
$previewWidth = $data['previewWidth'] ?? 640;
$previewHeight = $data['previewHeight'] ?? 480;

if ($caption !== null) {
    $caption = trim($caption);

    if (strlen($caption) > 500) {
        $caption = substr($caption, 0, 500);
    }

    if (empty($caption)) {
        $caption = null;
    }

}

$uploadDir = '/var/www/html/uploads/';
$backgroundPath = $uploadDir . basename($background);
$output = $uploadDir . uniqid() . '.png';

if (!$background || !file_exists($backgroundPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Background image not found', 'path' => $backgroundPath]);
    exit;
}

if (!$stickers || !is_array($stickers) || count($stickers) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing stickers parameter']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $mergedPath = mergeMultipleStickers($backgroundPath, $stickers, $previewWidth, $previewHeight, $output);

    if (!$mergedPath || !file_exists($output)) {
        throw new Exception('Merge completed but output file was not created');
    }

} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to merge stickers: ' . $e->getMessage()]);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("INSERT INTO images (filename, user_id, is_posted, caption) VALUES (?, ?, FALSE, ?)");
    $stmt->execute([basename($output), $userId, $caption]);

    if (file_exists($backgroundPath) && basename($backgroundPath) !== basename($output)) {
        @unlink($backgroundPath);
    }

    ob_end_clean();
    echo json_encode(['success' => true, 'filename' => basename($output)]);
    exit;
} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to merge images: ' . $e->getMessage()]);
    exit;
}
