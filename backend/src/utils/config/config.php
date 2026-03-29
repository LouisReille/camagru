<?php
ini_set('log_errors', '0');
ini_set('display_errors', '0');

$dotenvPath = __DIR__ . '/../../.env';

if (file_exists($dotenvPath)) {
    $lines = file($dotenvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        putenv($line);
    }

}

define('DB_HOST', getenv('DB_HOST') ?: 'db');
define('DB_NAME', getenv('DB_NAME') ?: 'camagru');
define('DB_USER', getenv('DB_USER') ?: 'camagru');
define('DB_PASS', getenv('DB_PASS') ?: 'camagru');
define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost:3000');
define('BACKEND_URL', getenv('BACKEND_URL') ?: 'http://localhost:8080');
