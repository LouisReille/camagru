<?php

/**
 * Absolute path to the writable uploads directory (trailing slash).
 * Docker: volume at /var/www/html/uploads.
 * Native PHP: backend/public/uploads next to this config.
 * Override: CAMAGRU_UPLOAD_DIR or UPLOAD_PATH in the environment.
 */
function getUploadsDirectory(): string {
    static $resolved = null;

    if ($resolved !== null) {
        return $resolved;
    }

    $normalize = static function (string $path): string {
        $path = rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path), DIRECTORY_SEPARATOR);

        return $path === '' ? '' : $path . DIRECTORY_SEPARATOR;
    };

    foreach (['CAMAGRU_UPLOAD_DIR', 'UPLOAD_PATH'] as $envKey) {
        $raw = getenv($envKey);
        if ($raw !== false && $raw !== '') {
            $dir = rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, (string)$raw), DIRECTORY_SEPARATOR);
            if ($dir !== '' && is_dir($dir) && is_writable($dir)) {
                $resolved = $dir . DIRECTORY_SEPARATOR;
                return $resolved;
            }
        }
    }

    $candidates = [
        '/var/www/html/uploads',
        realpath(__DIR__ . '/../public/uploads') ?: null,
    ];

    foreach ($candidates as $dir) {
        if ($dir === null || $dir === '') {
            continue;
        }
        $dir = rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $dir), DIRECTORY_SEPARATOR);
        if (is_dir($dir) && is_writable($dir)) {
            $resolved = $dir . DIRECTORY_SEPARATOR;
            return $resolved;
        }
    }

    $resolved = $normalize('/var/www/html/uploads');
    return $resolved;
}
