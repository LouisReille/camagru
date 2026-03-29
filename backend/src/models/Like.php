<?php
require_once __DIR__ . '/../../config/database.php';

class Like {
    private $pdo;

    public function __construct() {
        $this->pdo = getDatabaseConnection();
    }

    public function exists($userId, $imageId) {
        $stmt = $this->pdo->prepare("SELECT id FROM likes WHERE user_id = ? AND image_id = ?");
        $stmt->execute([$userId, $imageId]);

        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function create($userId, $imageId) {
        if ($this->exists($userId, $imageId)) {
            return false;
        }

        $stmt = $this->pdo->prepare("INSERT INTO likes (user_id, image_id) VALUES (?, ?)");

        return $stmt->execute([$userId, $imageId]);
    }

    public function getCountsByImageIds($imageIds) {
        if (empty($imageIds)) {
            return [];
        }

        $inClause = implode(',', array_fill(0, count($imageIds), '?'));
        $stmt = $this->pdo->prepare("SELECT image_id, COUNT(*) AS likes_count FROM likes WHERE image_id IN ($inClause) GROUP BY image_id");
        $stmt->execute($imageIds);
        $result = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $result[$row['image_id']] = (int)$row['likes_count'];
        }

        return $result;
    }

}
