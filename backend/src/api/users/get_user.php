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
    require_once __DIR__ . '/../../controllers/UserController.php';
    $controller = new UserController();
    $result = $controller->getCurrentUser();
    ob_end_clean();
    echo json_encode($result);
} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    $errorResponse = [
        'logged_in' => false,
        'error' => 'Failed to get user info',
        'details' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
}

?>
