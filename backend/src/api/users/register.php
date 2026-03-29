<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/email/reg_email.php';
require_once __DIR__ . '/../../utils/validation/validation.php';
require_once __DIR__ . '/../../utils/validation/username_suggestions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
$pdo = getDatabaseConnection();
$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$errors = [];

if (!isValidEmail($email)) {
    $errors['email'] = 'Invalid email format';
}

if (empty($username)) {
    $errors['username'] = 'Username is required';
}

else if (!preg_match('/^[a-zA-Z0-9_\-\.]{3,20}$/', $username)) {
    $errors['username'] = 'Username must be 3-20 characters and contain only letters, numbers, underscores, hyphens, or dots';
}

if (!isValidPassword($password)) {
    require_once __DIR__ . '/../../utils/validation/validation.php';
    $errors['password'] = getPasswordErrorMessage();
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM pending_users WHERE created_at < (NOW() - INTERVAL 15 MINUTE)");
    $stmt->execute();
    $errors = [];

    if (isUsernameTaken($username, $pdo)) {
        $suggestions = generateUsernameSuggestions($username, $pdo);
        $errors['username'] = 'Username is already taken';
        $errors['username_suggestions'] = $suggestions;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        $errors['email'] = 'Email already registered';
        $errors['email_can_reset'] = true;
    }

    $stmt = $pdo->prepare("SELECT id FROM pending_users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        $errors['email'] = 'Email verification pending. Please check your email.';
    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'errors' => $errors
        ]);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare("INSERT INTO pending_users (username, email, password, token) VALUES (?, ?, ?, ?)");
    $stmt->execute([$username, $email, $hash, $token]);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? null;
    sendVerificationEmail($email, $token, $origin);
    echo json_encode(['success' => true, 'message' => 'Registration created. Check your email to verify.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
