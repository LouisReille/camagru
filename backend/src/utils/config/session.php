<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
$isHttps = false;

if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    $isHttps = true;
}

elseif (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $isHttps = true;
}

elseif (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on') {
    $isHttps = true;
}

elseif (isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') {
    $isHttps = true;
}

ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', $isHttps ? 'None' : 'Lax');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');
ini_set('session.cookie_domain', '');
ini_set('session.cookie_path', '/');
ini_set('session.gc_maxlifetime', 28800);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 28800,
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => $isHttps ? 'None' : 'Lax'
    ]);

    if ($isHttps) {
        ini_set('session.use_cookies', '1');
        ini_set('session.use_only_cookies', '1');
    }

    session_start();
}

if (isset($_SESSION['user_id']) && (!isset($_SESSION['last_activity']) || time() - $_SESSION['last_activity'] > 1800)) {
    session_regenerate_id(true);
    $_SESSION['last_activity'] = time();
}
