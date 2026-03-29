<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../../utils/config/cors.php';
require_once __DIR__ . '/../../utils/config/session.php';
require_once __DIR__ . '/../../utils/auth/auth_helper.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../utils/image_processing.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
$userId = requireAuth();

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
$fileType = $_FILES['image']['type'] ?? '';
$fileName = $_FILES['image']['name'] ?? '';
$tmpName = $_FILES['image']['tmp_name'] ?? '';
$fileSize = $_FILES['image']['size'] ?? 0;
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExtensions)) {
    if (empty($ext) && !empty($fileType)) {
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif'
        ];
        $ext = $mimeToExt[$fileType] ?? 'png';
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, and GIF are allowed.', 'received_type' => $fileType, 'extension' => $ext, 'filename' => $fileName]);
        exit;
    }

}

if (!empty($fileType) && !in_array($fileType, $allowedTypes)) {
    if (!in_array($ext, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, and GIF are allowed.', 'received_type' => $fileType, 'extension' => $ext]);
        exit;
    }

    $mimeMap = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif'
    ];

    if (isset($mimeMap[$ext])) {
        $fileType = $mimeMap[$ext];
    }

}

if (!empty($tmpName) && is_uploaded_file($tmpName)) {
    $imageInfo = @getimagesize($tmpName);

    if ($imageInfo === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Uploaded file is not a valid image']);
        exit;
    }

    $detectedMime = $imageInfo['mime'] ?? '';

    if (!in_array($detectedMime, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid image format detected.', 'detected_type' => $detectedMime]);
        exit;
    }

}

$maxSize = 10 * 1024 * 1024;

if ($_FILES['image']['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 10MB.']);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);

    if (empty($ext)) {
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif'
        ];
        $ext = $mimeToExt[$fileType] ?? 'png';
    }

    $filename = uniqid() . '_' . time() . '.' . $ext;
    $uploadDir = '/var/www/html/uploads/';

    if (!is_dir($uploadDir)) {
        if (!@mkdir($uploadDir, 0777, true)) {
            $lastError = error_get_last();
            $errorMsg = $lastError['message'] ?? 'Unknown error';
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to create upload directory',
                'path' => $uploadDir,
                'details' => $errorMsg
            ]);
            exit;
        }

    }

    if (!is_writable($uploadDir)) {
        http_response_code(500);
        echo json_encode(['error' => 'Upload directory is not writable', 'path' => $uploadDir]);
        exit;
    }

    $destination = $uploadDir . $filename;
    $tempPath = $uploadDir . 'temp_' . $filename;

    if (uploadImage($_FILES['image'], $tempPath)) {
        try {
            cropImageToPortrait($tempPath, $destination, 800, 1000);
            @unlink($tempPath);
        } catch (Exception $e) {
            if (file_exists($tempPath)) {
                copy($tempPath, $destination);
                @unlink($tempPath);
            }

        }

        echo json_encode(['success' => true, 'filename' => $filename]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Upload failed.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

?>
