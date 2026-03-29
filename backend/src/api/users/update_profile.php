<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/validation/validation.php';
require_once __DIR__ . '/../../utils/validation/username_suggestions.php';
require_once __DIR__ . '/../../utils/email/email_change_email.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$username = isset($data['username']) ? trim($data['username']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$password = $data['password'] ?? null;

try {
    $pdo = getDatabaseConnection();
    $errors = [];
    $updates = [];
    $params = [];
    $emailChangePending = false;

    if ($username !== null && $username !== '') {
        if (!preg_match('/^[a-zA-Z0-9_\-\.]{3,20}$/', $username)) {
            $errors['username'] = 'Username must be 3-20 characters and contain only letters, numbers, underscores, hyphens, or dots';
        } else {
            $currentUserStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $currentUserStmt->execute([$_SESSION['user_id']]);
            $currentUser = $currentUserStmt->fetch(PDO::FETCH_ASSOC);

            if ($currentUser && $currentUser['username'] !== $username) {
                if (isUsernameTaken($username, $pdo)) {
                    $suggestions = generateUsernameSuggestions($username, $pdo);
                    $errors['username'] = 'Username is already taken';
                    $errors['username_suggestions'] = $suggestions;
                } else {
                    $updates[] = "username = ?";
                    $params[] = $username;
                }

            }

        }

    }

    if ($email !== null && $email !== '') {
        if (!isValidEmail($email)) {
            $errors['email'] = 'Invalid email format';
        } else {
            $currentUserStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
            $currentUserStmt->execute([$_SESSION['user_id']]);
            $currentUser = $currentUserStmt->fetch(PDO::FETCH_ASSOC);

            if ($currentUser && $currentUser['email'] !== $email) {
                $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $checkStmt->execute([$email, $_SESSION['user_id']]);

                if ($checkStmt->fetch()) {
                    $errors['email'] = 'Email already in use';
                } else {
                    $checkPendingStmt = $pdo->prepare("SELECT id FROM pending_email_changes WHERE user_id = ?");
                    $checkPendingStmt->execute([$_SESSION['user_id']]);

                    if ($checkPendingStmt->fetch()) {
                        $errors['email'] = 'Email change already pending. Please check your email.';
                    } else {
                        $token = bin2hex(random_bytes(32));
                        $insertStmt = $pdo->prepare("INSERT INTO pending_email_changes (user_id, new_email, token) VALUES (?, ?, ?)");
                        $insertStmt->execute([$_SESSION['user_id'], $email, $token]);
                        $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? null;

                        if (sendEmailChangeVerificationEmail($email, $token, $origin)) {
                            $emailChangePending = true;
                        } else {
                            $deleteStmt = $pdo->prepare("DELETE FROM pending_email_changes WHERE token = ?");
                            $deleteStmt->execute([$token]);
                            $errors['email'] = 'Failed to send verification email. Please try again.';
                        }

                    }

                }

            }

        }

    }

    if ($password !== null && $password !== '') {
        if (!isValidPassword($password)) {
            $errors['password'] = getPasswordErrorMessage();
        } else {
            $updates[] = "password = ?";
            $params[] = password_hash($password, PASSWORD_DEFAULT);
        }

    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'errors' => $errors
        ]);
        exit;
    }

    if (empty($updates) && !$emailChangePending) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }

    if (!empty($updates)) {
        $params[] = $_SESSION['user_id'];
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($username !== null && isset($updates[0]) && strpos($updates[0], 'username') !== false) {
            $_SESSION['username'] = $username;
        }

    }

    $messages = [];

    if (!empty($updates)) {
        $messages[] = 'Profile updated successfully';
    }

    if ($emailChangePending) {
        $messages[] = 'Verification email sent to your new email address. Please check your email to complete the change.';
    }

    echo json_encode([
        'success' => true,
        'message' => implode('. ', $messages),
        'email_change_pending' => $emailChangePending
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update profile']);
}

?>
