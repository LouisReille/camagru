<?php
require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';
require_once __DIR__ . '/../../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
$userId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$imageId = $data['image_id'] ?? null;

if (!$imageId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing image_id parameter']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("SELECT filename, user_id, caption FROM images WHERE id = ?");
    $stmt->execute([$imageId]);
    $image = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$image) {
        http_response_code(404);
        echo json_encode(['error' => 'Image not found']);
        exit;
    }

    if ($image['user_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to duplicate this image']);
        exit;
    }

    $uploadDir = '/var/www/html/uploads/';
    $originalPath = $uploadDir . basename($image['filename']);

    if (!file_exists($originalPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Original image file not found']);
        exit;
    }

    $newFilename = uniqid() . '_' . time() . '.png';
    $newPath = $uploadDir . $newFilename;

    if (!copy($originalPath, $newPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to duplicate image file']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO images (filename, user_id, is_posted, caption) VALUES (?, ?, FALSE, ?)");
    $stmt->execute([$newFilename, $userId, $image['caption']]);
    $newImageId = $pdo->lastInsertId();
    $stmt = $pdo->prepare("
        SELECT id, user_id, filename, is_posted, caption,
               DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at
        FROM images
        WHERE id = ?
    ");
    $stmt->execute([$newImageId]);
    $newImage = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        'success' => true,
        'image' => $newImage
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to duplicate image: ' . $e->getMessage()]);
}

?>
