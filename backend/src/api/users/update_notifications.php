<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../controllers/UserController.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

require_once __DIR__ . '/../../utils/config/session.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['likes']) && isset($data['comments'])) {
    $likesEnabled = isset($data['likes']) ? (bool)$data['likes'] : true;
    $commentsEnabled = isset($data['comments']) ? (bool)$data['comments'] : true;

    try {
        $controller = new UserController();
        $resultLikes = $controller->updateEmailNotificationPreference($_SESSION['user_id'], 'likes', $likesEnabled);
        $resultComments = $controller->updateEmailNotificationPreference($_SESSION['user_id'], 'comments', $commentsEnabled);

        if ($resultLikes['success'] && $resultComments['success']) {
            echo json_encode([
                'success' => true,
                'message' => 'Preferences saved successfully',
                'likes' => $likesEnabled,
                'comments' => $commentsEnabled
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'error' => 'Failed to update preferences',
                'likes_error' => $resultLikes['error'] ?? null,
                'comments_error' => $resultComments['error'] ?? null
            ]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update preferences: ' . $e->getMessage()]);
    }

} else {
    $type = $data['type'] ?? null;
    $enabled = isset($data['enabled']) ? (bool)$data['enabled'] : false;

    if (!$type || !in_array($type, ['likes', 'comments'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid notification type']);
        exit;
    }

    try {
        $controller = new UserController();
        $result = $controller->updateEmailNotificationPreference($_SESSION['user_id'], $type, $enabled);

        if ($result['success']) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => $result['error'] ?? 'Failed to update notification preference']);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update notification preference: ' . $e->getMessage()]);
    }

}

?>
