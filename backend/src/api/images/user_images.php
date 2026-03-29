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

try {
    $controller = new ImageController();
    $images = $controller->getUserImages($userId);
    echo json_encode(['success' => true, 'images' => $images]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch user images', 'details' => $e->getMessage()]);
}

?>
