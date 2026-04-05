<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';
require_once __DIR__ . '/../../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
$userId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$filename = $data['filename'] ?? null;
$caption = $data['caption'] ?? null;

if (!$filename) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing filename parameter']);
    exit;
}

if ($caption !== null) {
    $caption = trim($caption);

    if (strlen($caption) > 500) {
        $caption = substr($caption, 0, 500);
    }

    if (empty($caption)) {
        $caption = null;
    }

}

$filePath = '/var/www/html/uploads/' . basename($filename);

if (!file_exists($filePath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Image file not found']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("INSERT INTO images (filename, user_id, is_posted, caption) VALUES (?, ?, FALSE, ?)");
    $stmt->execute([basename($filename), $userId, $caption]);
    $imageId = (int)$pdo->lastInsertId();
    echo json_encode(['success' => true, 'filename' => basename($filename), 'image_id' => $imageId]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

?>
