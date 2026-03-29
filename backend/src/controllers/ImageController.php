<?php
require_once __DIR__ . '/../models/Image.php';
require_once __DIR__ . '/../models/Like.php';
require_once __DIR__ . '/../models/Comment.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/email/notification_email.php';

class ImageController {
    private $imageModel;
    private $likeModel;
    private $commentModel;
    private $userModel;

    public function __construct() {
        $this->imageModel = new Image();
        $this->likeModel = new Like();
        $this->commentModel = new Comment();
        $this->userModel = new User();
    }

    public function list($page = 1, $perPage = 10, $currentUserId = null) {
        $result = $this->imageModel->findAll($page, $perPage, $currentUserId);

        if (empty($result['images'])) {
            return $result;
        }

        $imageIds = array_column($result['images'], 'id');
        $likesByImageId = $this->likeModel->getCountsByImageIds($imageIds);
        $commentsByImageId = $this->commentModel->getByImageIds($imageIds);

        foreach ($result['images'] as &$img) {
            $id = $img['id'];
            $img['likes_count'] = $likesByImageId[$id] ?? 0;
            $img['comments'] = $commentsByImageId[$id] ?? [];
        }

        return $result;
    }

    public function getUserImages($userId) {
        return $this->imageModel->findByUserId($userId);
    }

    public function create($filename, $userId) {
        $imageId = $this->imageModel->create($filename, $userId);

        return ['success' => true, 'image_id' => $imageId];
    }

    public function delete($imageId, $userId) {
        $image = $this->imageModel->findById($imageId);

        if (!$image) {
            return ['success' => false, 'error' => 'Image not found'];
        }

        if ($image['user_id'] != $userId) {
            return ['success' => false, 'error' => 'You do not have permission to delete this image'];
        }

        $filename = $this->imageModel->getFilename($imageId);
        $deleted = $this->imageModel->delete($imageId, $userId);

        if ($deleted && $filename) {
            $filePath = '/var/www/html/uploads/' . basename($filename);

            if (file_exists($filePath)) {
                unlink($filePath);
            }

        }

        return ['success' => $deleted];
    }

    public function like($imageId, $userId) {
        if ($this->likeModel->exists($userId, $imageId)) {
            return ['success' => true];
        }

        $created = $this->likeModel->create($userId, $imageId);

        if ($created) {
            $imageInfo = $this->imageModel->getOwnerInfo($imageId);
            $likerInfo = $this->userModel->findById($userId);

            if ($imageInfo && $likerInfo && $imageInfo['owner_id'] != $userId) {
                $owner = $this->userModel->findById($imageInfo['owner_id']);
                $notificationsEnabled = $owner && (!isset($owner['email_notifications_likes']) || $owner['email_notifications_likes'] != 0);

                if ($notificationsEnabled) {
                    $dateTime = new DateTime('now', new DateTimeZone('UTC'));
                    $timestamp = $dateTime->format('Y-m-d H:i:s');
                    sendLikeNotificationEmail(
                        $imageInfo['owner_email'],
                        $likerInfo['username'],
                        $imageId,
                        $timestamp
                    );
                }

            }

        }

        return ['success' => $created];
    }

    public function addComment($imageId, $userId, $comment) {
        if (empty(trim($comment))) {
            return ['success' => false, 'error' => 'Comment cannot be empty'];
        }

        $imageInfo = $this->imageModel->getOwnerInfo($imageId);

        if (!$imageInfo) {
            return ['success' => false, 'error' => 'Image not found'];
        }

        $commenterInfo = $this->userModel->findById($userId);

        if (!$commenterInfo) {
            return ['success' => false, 'error' => 'User not found'];
        }

        $created = $this->commentModel->create($userId, $imageId, $comment);

        if ($created) {
            $ownerId = (int)$imageInfo['owner_id'];
            $commenterId = (int)$userId;

            if ($ownerId != $commenterId) {
                $owner = $this->userModel->findById($ownerId);
                $notificationsEnabled = $owner && (!isset($owner['email_notifications_comments']) || $owner['email_notifications_comments'] != 0);

                if ($notificationsEnabled) {
                    $dateTime = new DateTime('now', new DateTimeZone('UTC'));
                    $timestamp = $dateTime->format('Y-m-d H:i:s');
                    sendCommentNotificationEmail(
                        $imageInfo['owner_email'],
                        $commenterInfo['username'],
                        $comment,
                        $imageId,
                        $timestamp
                    );
                }

            }

            return [
                'success' => true,
                'username' => $commenterInfo['username'],
                'comment' => $comment
            ];
        }

        return ['success' => false, 'error' => 'Failed to create comment'];
    }

}
