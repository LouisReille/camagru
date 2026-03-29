<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';
require_once __DIR__ . '/../../controllers/ImageController.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
$userId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$imageId = $data['image_id'] ?? null;

if (!$imageId || !$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

try {
    $controller = new ImageController();
    $result = $controller->like($imageId, $userId);
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process like']);
}

?>
