<?php
require_once __DIR__ . '/../../config/database.php';

class Image {
    private $pdo;

    public function __construct() {
        $this->pdo = getDatabaseConnection();
    }

    public function create($filename, $userId, $isPosted = false) {
        $stmt = $this->pdo->prepare("INSERT INTO images (filename, user_id, is_posted) VALUES (?, ?, ?)");
        $stmt->execute([$filename, $userId, $isPosted ? 1 : 0]);

        return $this->pdo->lastInsertId();
    }

    public function findById($id) {
        $stmt = $this->pdo->prepare("
            SELECT i.id, i.user_id, i.filename, i.caption, i.is_posted,
                   DATE_FORMAT(i.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at,
                   u.username
            FROM images i
            JOIN users u ON u.id = i.user_id
            WHERE i.id = ?
        ");
        $stmt->execute([$id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findAll($page = 1, $perPage = 10, $currentUserId = null) {
        $offset = ($page - 1) * $perPage;
        $countStmt = $this->pdo->query("SELECT COUNT(*) AS total FROM images WHERE is_posted = TRUE");
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        $stmt = $this->pdo->prepare("
            SELECT i.id, i.user_id, i.filename, i.caption,
                   DATE_FORMAT(i.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at,
                   u.username
            FROM images i
            JOIN users u ON u.id = i.user_id
            WHERE i.is_posted = TRUE
            ORDER BY i.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($images as &$img) {
            $imgUserId = (int)$img['user_id'];
            $img['is_owner'] = ($currentUserId !== null && $imgUserId === $currentUserId);
        }

        return [
            'images' => $images,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int)ceil($total / $perPage)
            ]
        ];
    }

    public function findByUserId($userId) {
        $stmt = $this->pdo->prepare("
            SELECT id, user_id, filename, caption, is_posted,
                   DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at
            FROM images
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete($imageId, $userId) {
        $image = $this->findById($imageId);

        if (!$image || $image['user_id'] != $userId) {
            return false;
        }

        $this->pdo->beginTransaction();

        try {
            $stmt = $this->pdo->prepare("DELETE FROM likes WHERE image_id = ?");
            $stmt->execute([$imageId]);
            $stmt = $this->pdo->prepare("DELETE FROM comments WHERE image_id = ?");
            $stmt->execute([$imageId]);
            $stmt = $this->pdo->prepare("DELETE FROM images WHERE id = ?");
            $stmt->execute([$imageId]);
            $this->pdo->commit();

            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();

            throw $e;
        }

    }

    public function getFilename($imageId) {
        $stmt = $this->pdo->prepare("SELECT filename FROM images WHERE id = ?");
        $stmt->execute([$imageId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ? $result['filename'] : null;
    }

    public function getOwnerInfo($imageId) {
        $stmt = $this->pdo->prepare("
            SELECT i.user_id as owner_id, owner.email as owner_email, owner.username as owner_username
            FROM images i
            JOIN users owner ON owner.id = i.user_id
            WHERE i.id = ?
        ");
        $stmt->execute([$imageId]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

}
