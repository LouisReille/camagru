<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/config/session.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/validation/validation.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$identifier = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($identifier) || !isValidPassword($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid username/email or password']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $isEmail = isValidEmail($identifier);

    if ($isEmail) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)");
    }

    $stmt->execute([$identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode([
                'error' => 'Incorrect password',
                'error_type' => 'wrong_password',
                'identifier_exists' => true,
                'is_email' => $isEmail
            ]);
            exit;
        }

        $_SESSION = [];

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        echo json_encode(['success' => true, 'message' => 'Logged in successfully']);
        exit;
    }

    $identifierExists = false;

    if ($isEmail) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$identifier]);
        $identifierExists = (bool)$stmt->fetch();

        if (!$identifierExists) {
            $stmt = $pdo->prepare("SELECT id FROM pending_users WHERE LOWER(email) = LOWER(?)");
            $stmt->execute([$identifier]);

            if ($stmt->fetch()) {
                http_response_code(401);
                echo json_encode([
                    'error' => 'Account not verified. Check your email.',
                    'error_type' => 'not_verified',
                    'identifier_exists' => true
                ]);
                exit;
            }

        }

    } else {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)");
        $stmt->execute([$identifier]);
        $identifierExists = (bool)$stmt->fetch();

        if (!$identifierExists) {
            $stmt = $pdo->prepare("SELECT id FROM pending_users WHERE LOWER(username) = LOWER(?)");
            $stmt->execute([$identifier]);

            if ($stmt->fetch()) {
                http_response_code(401);
                echo json_encode([
                    'error' => 'Account not verified. Check your email.',
                    'error_type' => 'not_verified',
                    'identifier_exists' => true
                ]);
                exit;
            }

        }

    }

    http_response_code(404);
    echo json_encode([
        'error' => 'User or email not found',
        'error_type' => 'not_found',
        'identifier_exists' => false,
        'is_email' => $isEmail
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
