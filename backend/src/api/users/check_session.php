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
    $loggedIn = false;

    if (session_status() === PHP_SESSION_ACTIVE) {
        $loggedIn = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    } else {
        session_start();
        $loggedIn = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }

    ob_end_clean();
    echo json_encode(['logged_in' => $loggedIn]);
} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['logged_in' => false, 'error' => $e->getMessage()]);
}

?>