<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/validation/validation.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

    header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$token = trim($input['token'] ?? '');
$newPassword = trim($input['password'] ?? '');

if (!$token) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

if (!isValidPassword($newPassword)) {
    require_once __DIR__ . '/../../utils/validation/validation.php';
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['error' => getPasswordErrorMessage()]);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $pdo->exec("DELETE FROM password_resets WHERE expires_at < NOW()");
    $stmt = $pdo->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?");
    $stmt->execute([$token]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset || strtotime($reset['expires_at']) < time()) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hashedPassword, $reset['user_id']]);
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE token = ?");
    $stmt->execute([$token]);
    $pdo->commit();
    ob_end_clean();
    echo json_encode(['message' => 'Password successfully reset']);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
