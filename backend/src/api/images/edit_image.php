<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 0);

require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/image_processing.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_clean();
header('Content-Type: application/json');
$userId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$imageId = $data['image_id'] ?? null;
$stickers = $data['stickers'] ?? null;
$caption = $data['caption'] ?? null;
$previewWidth = $data['previewWidth'] ?? 640;
$previewHeight = $data['previewHeight'] ?? 480;

if ($caption !== null) {
    $caption = trim($caption);

    if (strlen($caption) > 500) {
        $caption = substr($caption, 0, 500);
    }

    if (empty($caption)) {
        $caption = null;
    }

}

if (!$imageId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing image_id parameter']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("SELECT filename, user_id FROM images WHERE id = ?");
    $stmt->execute([$imageId]);
    $image = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$image) {
        http_response_code(404);
        echo json_encode(['error' => 'Image not found']);
        exit;
    }

    if ($image['user_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to edit this image']);
        exit;
    }

    $uploadDir = '/var/www/html/uploads/';
    $baseFilename = basename($image['filename']);
    $imagePath = $uploadDir . $baseFilename;

    if (!file_exists($imagePath)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Image file not found',
            'details' => "Could not find image file: $baseFilename"
        ]);
        exit;
    }

    $updateFields = [];
    $updateValues = [];

    if ($caption !== null) {
        $updateFields[] = "caption = ?";
        $updateValues[] = $caption;
    }

    if (!$stickers || !is_array($stickers) || count($stickers) === 0) {
        if (!empty($updateFields)) {
            $updateValues[] = $imageId;
            $stmt = $pdo->prepare("UPDATE images SET " . implode(", ", $updateFields) . " WHERE id = ?");
            $stmt->execute($updateValues);
        }

        echo json_encode(['success' => true, 'filename' => basename($image['filename'])]);
        exit;
    }

    $output = $uploadDir . uniqid() . '.png';
    $mergedPath = mergeMultipleStickers($imagePath, $stickers, $previewWidth, $previewHeight, $output);

    if (!$mergedPath || !file_exists($output)) {
        throw new Exception('Merge completed but output file was not created');
    }

    $updateFields[] = "filename = ?";
    $updateValues[] = basename($output);
    $updateValues[] = $imageId;
    $stmt = $pdo->prepare("UPDATE images SET " . implode(", ", $updateFields) . " WHERE id = ?");
    $stmt->execute($updateValues);
    $oldMergedPath = $uploadDir . basename($image['filename']);

    if (basename($oldMergedPath) !== basename($output) && file_exists($oldMergedPath)) {
        @unlink($oldMergedPath);
    }

    ob_end_clean();
    echo json_encode(['success' => true, 'filename' => basename($output)]);
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to edit image: ' . $e->getMessage()]);
}

?>