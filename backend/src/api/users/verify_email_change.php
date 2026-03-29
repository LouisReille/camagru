<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/config/config.php';
$frontendUrl = null;

if (isset($_SERVER['HTTP_REFERER'])) {
    $refererParts = parse_url($_SERVER['HTTP_REFERER']);

    if ($refererParts && isset($refererParts['scheme']) && isset($refererParts['host'])) {
        $host = $refererParts['host'];
        $port = isset($refererParts['port']) ? ':' . $refererParts['port'] : '';
        $scheme = $refererParts['scheme'];
        $frontendUrl = "$scheme://$host$port";
    }

}

if (!$frontendUrl) {
    $frontendUrl = defined('FRONTEND_URL') ? FRONTEND_URL : (getenv('FRONTEND_URL') ?: 'http://localhost:3000');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
$token = $_GET['token'] ?? '';

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing token']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $pdo->exec("DELETE FROM pending_email_changes WHERE created_at < (NOW() - INTERVAL 1 HOUR)");
    $stmt = $pdo->prepare("SELECT * FROM pending_email_changes WHERE token = ?");
    $stmt->execute([$token]);
    $pending = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pending) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
        exit;
    }

    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $checkStmt->execute([$pending['new_email'], $pending['user_id']]);

    if ($checkStmt->fetch()) {
        $deleteStmt = $pdo->prepare("DELETE FROM pending_email_changes WHERE id = ?");
        $deleteStmt->execute([$pending['id']]);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email is already in use']);
        exit;
    }

    $pdo->beginTransaction();
    $updateStmt = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
    $updateStmt->execute([$pending['new_email'], $pending['user_id']]);
    $deleteStmt = $pdo->prepare("DELETE FROM pending_email_changes WHERE id = ?");
    $deleteStmt->execute([$pending['id']]);
    $pdo->commit();
    header('Location: ' . $frontendUrl . '/verify/verify_email_change_success.html');
    exit;
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
