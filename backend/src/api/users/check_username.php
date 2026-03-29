<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/validation/username_suggestions.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$username = trim($_GET['username'] ?? '');

if (empty($username)) {
    echo json_encode(['available' => false, 'error' => 'Username is required']);
    exit;
}

if (!preg_match('/^[a-zA-Z0-9_\-\.]{3,20}$/', $username)) {
    echo json_encode([
        'available' => false,
        'error' => 'Username must be 3-20 characters and contain only letters, numbers, underscores, hyphens, or dots'
    ]);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $pdo->exec("DELETE FROM pending_users WHERE created_at < (NOW() - INTERVAL 15 MINUTE)");

    if (isUsernameTaken($username, $pdo)) {
        $suggestions = generateUsernameSuggestions($username, $pdo);
        echo json_encode([
            'available' => false,
            'suggestions' => $suggestions
        ]);
    } else {
        echo json_encode(['available' => true]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['available' => false, 'error' => 'Server error']);
}

?>
