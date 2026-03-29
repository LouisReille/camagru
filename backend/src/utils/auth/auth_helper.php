<?php
function getCurrentUserId() {
    if (session_status() === PHP_SESSION_NONE) {
        require_once __DIR__ . '/../config/session.php';
    }

    else if (session_status() === PHP_SESSION_ACTIVE && !isset($_SESSION)) {
        require_once __DIR__ . '/../config/session.php';
    }

    if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }

    return null;
}

function isAuthenticated() {
    return getCurrentUserId() !== null;
}

function requireAuth() {
    $userId = getCurrentUserId();

    if ($userId === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }

    return $userId;
}
