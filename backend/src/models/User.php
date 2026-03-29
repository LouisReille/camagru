<?php
require_once __DIR__ . '/../../config/database.php';

class User {
    private $pdo;

    public function __construct() {
        $this->pdo = getDatabaseConnection();
    }

    public function findById($id) {
        $columns = "id, username, email, created_at";

        try {
            $checkStmt = $this->pdo->query("SHOW COLUMNS FROM users LIKE 'email_notifications_likes'");

            if ($checkStmt->rowCount() > 0) {
                $columns .= ", email_notifications_likes, email_notifications_comments";
            }

        } catch (Exception $e) {
        }

        $stmt = $this->pdo->prepare("SELECT {$columns} FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && !isset($user['email_notifications_likes'])) {
            $user['email_notifications_likes'] = 1;
        }

        if ($user && !isset($user['email_notifications_comments'])) {
            $user['email_notifications_comments'] = 1;
        }

        return $user;
    }

    public function findByUsername($username) {
        $stmt = $this->pdo->prepare("SELECT id, username, email, password, created_at FROM users WHERE username = ?");
        $stmt->execute([$username]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByEmail($email) {
        $stmt = $this->pdo->prepare("SELECT id, username, email, password, created_at FROM users WHERE email = ?");
        $stmt->execute([$email]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByUsernameOrEmail($identifier) {
        $stmt = $this->pdo->prepare("SELECT id, username, email, password, created_at FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$identifier, $identifier]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function usernameExists($username) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmt->execute([$username]);

        return $stmt->fetchColumn() > 0;
    }

    public function emailExists($email) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmt->execute([$email]);

        return $stmt->fetchColumn() > 0;
    }

    public function create($username, $email, $password) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $hashedPassword]);

        return $this->pdo->lastInsertId();
    }

    public function updateUsername($userId, $username) {
        $stmt = $this->pdo->prepare("UPDATE users SET username = ? WHERE id = ?");

        return $stmt->execute([$username, $userId]);
    }

    public function updateEmail($userId, $email) {
        $stmt = $this->pdo->prepare("UPDATE users SET email = ? WHERE id = ?");

        return $stmt->execute([$email, $userId]);
    }

    public function updatePassword($userId, $password) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare("UPDATE users SET password = ? WHERE id = ?");

        return $stmt->execute([$hashedPassword, $userId]);
    }

    public function delete($userId) {
        $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ?");

        return $stmt->execute([$userId]);
    }

    public function verifyPassword($password, $hashedPassword) {
        return password_verify($password, $hashedPassword);
    }

    public function updateEmailNotificationPreference($userId, $type, $enabled) {
        $column = $type === 'likes' ? 'email_notifications_likes' : 'email_notifications_comments';
        $value = $enabled ? 1 : 0;
        $stmt = $this->pdo->prepare("UPDATE users SET {$column} = ? WHERE id = ?");
        $result = $stmt->execute([$value, $userId]);

        return $result;
    }

}
