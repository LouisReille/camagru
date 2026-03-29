<?php
require_once __DIR__ . '/../../config/database.php';

class Comment {
    private $pdo;

    public function __construct() {
        $this->pdo = getDatabaseConnection();
    }

    public function create($userId, $imageId, $comment) {
        $stmt = $this->pdo->prepare("INSERT INTO comments (user_id, image_id, comment) VALUES (?, ?, ?)");

        return $stmt->execute([$userId, $imageId, $comment]);
    }

    public function getByImageIds($imageIds) {
        if (empty($imageIds)) {
            return [];
        }

        $inClause = implode(',', array_fill(0, count($imageIds), '?'));
        $stmt = $this->pdo->prepare("
            SELECT c.image_id, c.comment, u.username
            FROM comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.image_id IN ($inClause)
            ORDER BY c.id ASC
        ");
        $stmt->execute($imageIds);
        $result = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $result[$row['image_id']][] = [
                'username' => $row['username'],
                'comment' => $row['comment']
            ];
        }

        return $result;
    }
}