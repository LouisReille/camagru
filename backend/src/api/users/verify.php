<?php
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/config/cors.php';
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

$pdo = getDatabaseConnection();
$token = $_GET['token'] ?? '';

if (!$token) {
    header('Location: ' . $frontendUrl . '/verify/verify_error.html');
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM pending_users WHERE token = ?");
    $stmt->execute([$token]);
    $pending = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pending) {
        header('Location: ' . $frontendUrl . '/verify/verify_error.html');
        exit;
    }

    $pdo->exec("DELETE FROM pending_users WHERE created_at < (NOW() - INTERVAL 15 MINUTE)");
    $stmt = $pdo->prepare("SELECT * FROM pending_users WHERE token = ? AND created_at >= (NOW() - INTERVAL 15 MINUTE)");
    $stmt->execute([$token]);
    $pending = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pending) {
        header('Location: ' . $frontendUrl . '/verify/verify_expired.html');
        exit;
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$pending['username'], $pending['email'], $pending['password']]);
    $stmt = $pdo->prepare("DELETE FROM pending_users WHERE id = ?");
    $stmt->execute([$pending['id']]);
    $pdo->commit();
    header('Location: ' . $frontendUrl . '/verify/verify_success.html');
    exit;
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    header('Location: ' . $frontendUrl . '/verify/verify_error.html');
    exit;
}
