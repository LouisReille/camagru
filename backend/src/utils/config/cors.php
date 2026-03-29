<?php
ini_set('display_errors', '0');
ini_set('log_errors', '0');
error_reporting(E_ALL);
$GLOBALS['cors_headers_set'] = false;

function corsFallbackOrigin(): string {
    return rtrim((string) (getenv('FRONTEND_URL') ?: 'http://localhost:3000'), '/');
}

function corsNormalizeOrigin(string $raw): string {
    if ($raw === '') {
        return '';
    }
    $parts = parse_url($raw);
    if (!$parts || !isset($parts['scheme'], $parts['host'])) {
        return '';
    }
    $origin = $parts['scheme'] . '://' . $parts['host'];
    if (isset($parts['port'])) {
        $origin .= ':' . $parts['port'];
    }

    return $origin;
}

function corsIsAllowedOrigin(string $origin): bool {
    if ($origin === '') {
        return false;
    }
    $allowed = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
    ];
    if (in_array($origin, $allowed, true)) {
        return true;
    }

    return (bool) preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin);
}

function corsApplyHeaders(string $allowOrigin): void {
    header('Access-Control-Allow-Origin: ' . $allowOrigin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 3600');
}

function corsResolveAllowOrigin(): ?string {
    $origin = corsNormalizeOrigin($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin !== '') {
        return corsIsAllowedOrigin($origin) ? $origin : null;
    }

    return corsFallbackOrigin();
}

function setCorsHeaders(): void {
    if ($GLOBALS['cors_headers_set'] || headers_sent()) {
        return;
    }
    $allow = corsResolveAllowOrigin();
    if ($allow === null) {
        return;
    }
    corsApplyHeaders($allow);
    $GLOBALS['cors_headers_set'] = true;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $allow = corsResolveAllowOrigin();
    if ($allow !== null) {
        corsApplyHeaders($allow);
    }
    http_response_code(200);
    exit;
}

setCorsHeaders();
register_shutdown_function(function () {
    if (!$GLOBALS['cors_headers_set'] && !headers_sent()) {
        setCorsHeaders();
    }
});
