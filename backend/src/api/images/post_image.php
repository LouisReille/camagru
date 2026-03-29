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
$imageId = $data['image_id'] ?? null;

if (!$imageId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing image_id parameter']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("UPDATE images SET is_posted = TRUE, created_at = NOW() WHERE id = ? AND user_id = ?");
    $stmt->execute([$imageId, $userId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Image not found or you do not have permission']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Image posted successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

?>
