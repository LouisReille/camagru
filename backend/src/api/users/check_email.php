<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/validation/validation.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$email = trim($_GET['email'] ?? '');

if (empty($email)) {
    echo json_encode(['available' => false, 'error' => 'Email is required']);
    exit;
}

if (!isValidEmail($email)) {
    echo json_encode(['available' => false, 'error' => 'Invalid email format']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $pdo->exec("DELETE FROM pending_users WHERE created_at < (NOW() - INTERVAL 15 MINUTE)");
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            'available' => false,
            'message' => 'Email already registered',
            'can_reset' => true
        ]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM pending_users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        echo json_encode([
            'available' => false,
            'message' => 'Email verification pending. Please check your email.'
        ]);
        exit;
    }

    echo json_encode(['available' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['available' => false, 'error' => 'Server error']);
}

?>
