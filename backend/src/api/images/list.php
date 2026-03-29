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
    require_once __DIR__ . '/../../utils/config/session.php';
    require_once __DIR__ . '/../../controllers/ImageController.php';
    $currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $controller = new ImageController();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(5, min(50, (int)($_GET['per_page'] ?? 10)));
    $result = $controller->list($page, $perPage, $currentUserId);
    ob_end_clean();
    echo json_encode($result);
} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    $errorResponse = ['error' => 'Failed to fetch images', 'details' => $e->getMessage()];
    echo json_encode($errorResponse);
}

?>
