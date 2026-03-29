<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/validation/validation.php';
require_once __DIR__ . '/../../config/database.php';

class UserController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function getCurrentUser() {
        require_once __DIR__ . '/../utils/config/session.php';
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

        if (!$userId) {
            return ['logged_in' => false];
        }

        $user = $this->userModel->findById($userId);

        if (!$user) {
            session_destroy();

            return ['logged_in' => false];
        }

        return [
            'logged_in' => true,
            'username' => $user['username'],
            'email' => $user['email'],
            'created_at' => isset($user['created_at']) ? $user['created_at'] : null,
            'email_notifications_likes' => isset($user['email_notifications_likes']) ? (bool)$user['email_notifications_likes'] : true,
            'email_notifications_comments' => isset($user['email_notifications_comments']) ? (bool)$user['email_notifications_comments'] : true
        ];
    }

    public function login($identifier, $password) {
        if (!isValidPassword($password)) {
            return [
                'success' => false,
                'error' => 'Invalid password',
                'identifier_exists' => false
            ];
        }

        $isEmail = isValidEmail($identifier);
        $user = $this->userModel->findByUsernameOrEmail($identifier);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'Invalid credentials',
                'identifier_exists' => false,
                'is_email' => $isEmail
            ];
        }

        if (!password_verify($password, $user['password'])) {
            return [
                'success' => false,
                'error' => 'Incorrect password',
                'identifier_exists' => true,
                'is_email' => $isEmail
            ];
        }

        $pdo = getDatabaseConnection();
        $stmt = $pdo->prepare("SELECT email_verified FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$userData || !$userData['email_verified']) {
            return [
                'success' => false,
                'error' => 'Please verify your email before logging in. Check your inbox for the verification link.',
                'identifier_exists' => true,
                'is_email' => $isEmail
            ];
        }

        require_once __DIR__ . '/../utils/config/session.php';
        $_SESSION['user_id'] = $user['id'];

        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email']
            ],
            'identifier_exists' => true,
            'is_email' => $isEmail
        ];
    }

    public function register($username, $email, $password) {
        if (empty($username) || empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'All fields are required'];
        }

        if (!isValidEmail($email)) {
            return ['success' => false, 'error' => 'Invalid email format'];
        }

        if ($this->userModel->usernameExists($username)) {
            return ['success' => false, 'error' => 'Username already taken'];
        }

        if ($this->userModel->emailExists($email)) {
            return ['success' => false, 'error' => 'Email already registered'];
        }

        $userId = $this->userModel->create($username, $email, $password);

        return ['success' => true, 'user_id' => $userId];
    }

    public function checkUsername($username) {
        return ['exists' => $this->userModel->usernameExists($username)];
    }

    public function checkEmail($email) {
        return ['exists' => $this->userModel->emailExists($email)];
    }

    public function updateProfile($userId, $data) {
        $updated = false;
        $errors = [];

        if (isset($data['username'])) {
            if ($this->userModel->usernameExists($data['username'])) {
                $errors['username'] = 'Username already taken';
            } else {
                $this->userModel->updateUsername($userId, $data['username']);
                $updated = true;
            }

        }

        if (isset($data['email'])) {
            if ($this->userModel->emailExists($data['email'])) {
                $errors['email'] = 'Email already registered';
            } else {
                $this->userModel->updateEmail($userId, $data['email']);
                $updated = true;
            }

        }

        if (isset($data['password'])) {
            $this->userModel->updatePassword($userId, $data['password']);
            $updated = true;
        }

        return [
            'success' => $updated && empty($errors),
            'errors' => $errors
        ];
    }

    public function deleteAccount($userId) {
        return $this->userModel->delete($userId);
    }

    public function logout() {
        require_once __DIR__ . '/../utils/config/session.php';
        session_destroy();

        return ['success' => true];
    }

    public function updateEmailNotificationPreference($userId, $type, $enabled) {
        try {
            $this->userModel->updateEmailNotificationPreference($userId, $type, $enabled);

            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }

    }

}
