<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (empty($origin) || preg_match('/^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/', $origin)) {
    $origin = $origin ?: 'http://localhost:3000';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

register_shutdown_function(function() use ($origin) {
    $error = error_get_last();

    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();

        if (!headers_sent()) {
            header("Access-Control-Allow-Origin: " . ($origin ?: 'http://localhost:3000'));
            header("Access-Control-Allow-Credentials: true");
            header('Content-Type: application/json');
        }

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Fatal error: ' . $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
    }

});

require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/uploads_path.php';
$userId = requireAuth();
$pdo = null;

try {
    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT filename FROM images WHERE user_id = ?");
    $stmt->execute([$userId]);
    $imageFilenames = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $stmt = $pdo->prepare("SELECT id FROM images WHERE user_id = ?");
    $stmt->execute([$userId]);
    $imageIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $stmt = $pdo->prepare("DELETE FROM comments WHERE user_id = ?");
    $stmt->execute([$userId]);
    $stmt = $pdo->prepare("DELETE FROM likes WHERE user_id = ?");
    $stmt->execute([$userId]);

    if (!empty($imageIds)) {
        $placeholders = implode(',', array_fill(0, count($imageIds), '?'));
        $stmt = $pdo->prepare("DELETE FROM comments WHERE image_id IN ($placeholders)");
        $stmt->execute($imageIds);
    }

    if (!empty($imageIds)) {
        $placeholders = implode(',', array_fill(0, count($imageIds), '?'));
        $stmt = $pdo->prepare("DELETE FROM likes WHERE image_id IN ($placeholders)");
        $stmt->execute($imageIds);
    }

    $stmt = $pdo->prepare("DELETE FROM images WHERE user_id = ?");
    $stmt->execute([$userId]);
    $uploadDir = getUploadsDirectory();

    foreach ($imageFilenames as $filename) {
        $filePath = $uploadDir . basename($filename);

        if (file_exists($filePath)) {
            @unlink($filePath);
        }

    }

    try {
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?");
        $stmt->execute([$userId]);
    } catch (PDOException $e) {
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM pending_email_changes WHERE user_id = ?");
        $stmt->execute([$userId]);
    } catch (PDOException $e) {
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $pdo->commit();

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }

    ob_end_clean();
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    if ($pdo && $pdo->inTransaction()) {
        try {
            $pdo->rollBack();
        } catch (Exception $rollbackError) {
        }

    }

    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to delete account: ' . $e->getMessage()]);
}
