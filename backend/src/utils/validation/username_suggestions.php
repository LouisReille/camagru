<?php
function generateUsernameSuggestions($baseUsername, $pdo) {
    $suggestions = [];
    $attempts = 0;
    $maxAttempts = 50;

    while (count($suggestions) < 3 && $attempts < $maxAttempts) {
        $attempts++;
        $suggestion = $baseUsername . rand(100, 9999);

        if (!isUsernameTaken($suggestion, $pdo) && !in_array($suggestion, $suggestions)) {
            $suggestions[] = $suggestion;
        }

    }

    if (count($suggestions) < 3) {
        $attempts = 0;

        while (count($suggestions) < 3 && $attempts < $maxAttempts) {
            $attempts++;
            $suggestion = $baseUsername . '_' . rand(10, 999);

            if (!isUsernameTaken($suggestion, $pdo) && !in_array($suggestion, $suggestions)) {
                $suggestions[] = $suggestion;
            }

        }

    }

    if (count($suggestions) < 3) {
        $specialChars = ['_', '-', '.'];
        $attempts = 0;

        while (count($suggestions) < 3 && $attempts < $maxAttempts) {
            $attempts++;
            $char = $specialChars[array_rand($specialChars)];
            $suggestion = $baseUsername . $char . rand(10, 999);

            if (!isUsernameTaken($suggestion, $pdo) && !in_array($suggestion, $suggestions)) {
                $suggestions[] = $suggestion;
            }

        }

    }

    return array_slice($suggestions, 0, 3);
}

function isUsernameTaken($username, $pdo) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);

    if ($stmt->fetch()) {
        return true;
    }

    $stmt = $pdo->prepare("SELECT id FROM pending_users WHERE username = ?");
    $stmt->execute([$username]);

    if ($stmt->fetch()) {
        return true;
    }

    return false;
}
