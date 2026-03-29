<?php
function uploadImage($file, $destination) {
    if (!isset($file['tmp_name'])) {
        return false;
    }

    $tmpName = $file['tmp_name'];
    $fileExists = file_exists($tmpName);
    $isUploaded = is_uploaded_file($tmpName);

    if (!$fileExists) {
        return false;
    }

    $destDir = dirname($destination);

    if (!is_dir($destDir)) {
        if (!mkdir($destDir, 0755, true)) {
            return false;
        }

    }

    if (!is_writable($destDir)) {
        return false;
    }

    if ($isUploaded && move_uploaded_file($tmpName, $destination)) {
        chmod($destination, 0644);

        return true;
    }

    if ($fileExists) {
        if (copy($tmpName, $destination)) {
            chmod($destination, 0644);

            if ($isUploaded) {
                @unlink($tmpName);
            }

            return true;
        }

    }

    return false;
}

function mergeMultipleStickers($background, $stickers, $previewWidth, $previewHeight, $output) {
    $bgExt = strtolower(pathinfo($background, PATHINFO_EXTENSION));
    $bg = false;

    switch ($bgExt) {
        case 'jpg':
        case 'jpeg':
            $bg = @imagecreatefromjpeg($background);
            break;
        case 'png':
            $bg = @imagecreatefrompng($background);
            break;
        case 'gif':
            $bg = @imagecreatefromgif($background);
            break;
        default:

            throw new Exception('Unsupported background image format: ' . $bgExt);
    }

    if (!$bg) {
        throw new Exception('Failed to load background image');
    }

    $bgWidth = imagesx($bg);
    $bgHeight = imagesy($bg);
    imagealphablending($bg, true);
    imagesavealpha($bg, true);
    $stickersBaseDir = __DIR__ . '/../../stickers/';

    foreach ($stickers as $index => $stickerData) {
        $stickerSrc = $stickerData['src'] ?? null;
        $stickerType = $stickerData['type'] ?? 'sticker';

        if (!$stickerSrc) {
            continue;
        }

        $stickerPath = $stickersBaseDir . basename($stickerSrc);

        if (!file_exists($stickerPath)) {
            continue;
        }

        $sticker = @imagecreatefrompng($stickerPath);

        if (!$sticker) {
            continue;
        }

        imagealphablending($sticker, false);
        imagesavealpha($sticker, true);
        $x = (float)($stickerData['x'] / 100) * $bgWidth;
        $y = (float)($stickerData['y'] / 100) * $bgHeight;
        $stickerWidth = (float)($stickerData['width'] / 100) * $bgWidth;
        $stickerHeight = (float)($stickerData['height'] / 100) * $bgHeight;
        $x = (int)round($x);
        $y = (int)round($y);
        $stickerWidth = (int)round($stickerWidth);
        $stickerHeight = (int)round($stickerHeight);
        $origStickerWidth = imagesx($sticker);
        $origStickerHeight = imagesy($sticker);

        if ($stickerWidth != $origStickerWidth || $stickerHeight != $origStickerHeight) {
            $resizedSticker = imagecreatetruecolor($stickerWidth, $stickerHeight);
            imagealphablending($resizedSticker, false);
            imagesavealpha($resizedSticker, true);
            $transparent = imagecolorallocatealpha($resizedSticker, 0, 0, 0, 127);
            imagefill($resizedSticker, 0, 0, $transparent);
            imagealphablending($resizedSticker, true);
            imagecopyresampled($resizedSticker, $sticker, 0, 0, 0, 0, $stickerWidth, $stickerHeight, $origStickerWidth, $origStickerHeight);
            imagedestroy($sticker);
            $sticker = $resizedSticker;
            $origStickerWidth = $stickerWidth;
            $origStickerHeight = $stickerHeight;
        }

        for ($sy = 0; $sy < $origStickerHeight && ($y + $sy) < $bgHeight; $sy++) {
            if (($y + $sy) < 0) continue;

            for ($sx = 0; $sx < $origStickerWidth && ($x + $sx) < $bgWidth; $sx++) {
                if (($x + $sx) < 0) continue;
                $stickerColor = imagecolorat($sticker, $sx, $sy);
                $stickerAlpha = ($stickerColor >> 24) & 0x7F;

                if ($stickerAlpha == 127) continue;
                $bgColor = imagecolorat($bg, $x + $sx, $y + $sy);
                $stickerR = ($stickerColor >> 16) & 0xFF;
                $stickerG = ($stickerColor >> 8) & 0xFF;
                $stickerB = $stickerColor & 0xFF;
                $bgR = ($bgColor >> 16) & 0xFF;
                $bgG = ($bgColor >> 8) & 0xFF;
                $bgB = $bgColor & 0xFF;
                $alpha = 1 - ($stickerAlpha / 127);
                $invAlpha = 1 - $alpha;
                $finalR = (int)($bgR * $invAlpha + $stickerR * $alpha);
                $finalG = (int)($bgG * $invAlpha + $stickerG * $alpha);
                $finalB = (int)($bgB * $invAlpha + $stickerB * $alpha);
                $finalColor = imagecolorallocate($bg, $finalR, $finalG, $finalB);
                imagesetpixel($bg, $x + $sx, $y + $sy, $finalColor);
            }

        }

        imagedestroy($sticker);
    }

    if (!imagepng($bg, $output)) {
        imagedestroy($bg);

        throw new Exception('Failed to save merged image');
    }

    imagedestroy($bg);

    return $output;
}

function cropImageToPortrait($sourcePath, $outputPath, $targetWidth = 800, $targetHeight = 1000) {
    $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
    $source = false;

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $source = @imagecreatefromjpeg($sourcePath);
            break;
        case 'png':
            $source = @imagecreatefrompng($sourcePath);
            break;
        case 'gif':
            $source = @imagecreatefromgif($sourcePath);
            break;
        default:

            throw new Exception('Unsupported image format: ' . $ext);
    }

    if (!$source) {
        throw new Exception('Failed to load source image');
    }

    $sourceWidth = imagesx($source);
    $sourceHeight = imagesy($source);
    $sourceAspect = $sourceWidth / $sourceHeight;
    $targetAspect = $targetWidth / $targetHeight;

    if ($sourceAspect > $targetAspect) {
        $cropHeight = $sourceHeight;
        $cropWidth = (int)($sourceHeight * $targetAspect);
        $cropX = (int)(($sourceWidth - $cropWidth) / 2);
        $cropY = 0;
    } else {
        $cropWidth = $sourceWidth;
        $cropHeight = (int)($sourceWidth / $targetAspect);
        $cropX = 0;
        $cropY = (int)(($sourceHeight - $cropHeight) / 2);
    }

    $target = imagecreatetruecolor($targetWidth, $targetHeight);

    if ($ext === 'png') {
        imagealphablending($target, false);
        imagesavealpha($target, true);
        $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);
        imagefill($target, 0, 0, $transparent);
    }

    imagecopyresampled(
        $target, $source,
        0, 0, $cropX, $cropY,
        $targetWidth, $targetHeight,
        $cropWidth, $cropHeight
    );
    $success = false;

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $success = imagejpeg($target, $outputPath, 90);
            break;
        case 'png':
            $success = imagepng($target, $outputPath, 9);
            break;
        case 'gif':
            $success = imagegif($target, $outputPath);
            break;
    }

    imagedestroy($source);
    imagedestroy($target);

    if (!$success) {
        throw new Exception('Failed to save cropped image');
    }

    return $outputPath;
}
