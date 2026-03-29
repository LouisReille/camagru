<?php
function sendSMTPEmail($to, $subject, $htmlBody, $textBody = '', $fromEmail = null, $fromName = null) {
    $host = getenv('MAIL_HOST') ?: 'smtp.gmail.com';
    $port = (int)(getenv('MAIL_PORT') ?: 587);
    $username = getenv('MAIL_USERNAME');
    $password = getenv('MAIL_PASSWORD');
    $encryption = getenv('MAIL_ENCRYPTION') ?: 'tls';
    $fromEmail = $fromEmail ?: (getenv('MAIL_FROM') ?: 'camagru01.app@gmail.com');
    $fromName = $fromName ?: (getenv('MAIL_FROM_NAME') ?: 'Camagru');

    if (empty($username) || empty($password)) {
        return false;
    }

    $useTLS = ($encryption === 'tls' || $encryption === 'ssl');
    $useSSL = ($encryption === 'ssl');
    $socket = @fsockopen(
        ($useSSL ? 'ssl://' : '') . $host,
        $port,
        $errno,
        $errstr,
        30
    );

    if (!$socket) {
        return false;
    }

    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '220') {
        fclose($socket);

        return false;
    }

    fputs($socket, "EHLO $host\r\n");
    $response = '';

    while ($line = fgets($socket, 515)) {
        $response .= $line;

        if (substr($line, 3, 1) === ' ') break;
    }

    if ($useTLS && !$useSSL) {
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 515);

        if (substr($response, 0, 3) !== '220') {
            fclose($socket);

            return false;
        }

        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);

            return false;
        }

        fputs($socket, "EHLO $host\r\n");
        $response = '';

        while ($line = fgets($socket, 515)) {
            $response .= $line;

            if (substr($line, 3, 1) === ' ') break;
        }

    }

    fputs($socket, "AUTH LOGIN\r\n");
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '334') {
        fclose($socket);

        return false;
    }

    fputs($socket, base64_encode($username) . "\r\n");
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '334') {
        fclose($socket);

        return false;
    }

    fputs($socket, base64_encode($password) . "\r\n");
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '235') {
        fclose($socket);

        return false;
    }

    fputs($socket, "MAIL FROM: <$fromEmail>\r\n");
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '250') {
        fclose($socket);

        return false;
    }

    fputs($socket, "RCPT TO: <$to>\r\n");
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '250') {
        fclose($socket);

        return false;
    }

    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '354') {
        fclose($socket);

        return false;
    }

    $message = "From: $fromName <$fromEmail>\r\n";
    $message .= "To: <$to>\r\n";
    $message .= "Subject: $subject\r\n";
    $message .= "MIME-Version: 1.0\r\n";
    $message .= "Content-Type: multipart/alternative; boundary=\"boundary123\"\r\n";
    $message .= "\r\n";
    $message .= "--boundary123\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n";
    $message .= "\r\n";
    $message .= $textBody ?: strip_tags($htmlBody) . "\r\n";
    $message .= "\r\n";
    $message .= "--boundary123\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n";
    $message .= "\r\n";
    $message .= $htmlBody . "\r\n";
    $message .= "\r\n";
    $message .= "--boundary123--\r\n";
    $message .= ".\r\n";
    fputs($socket, $message);
    $response = fgets($socket, 515);

    if (substr($response, 0, 3) !== '250') {
        fclose($socket);

        return false;
    }

    fputs($socket, "QUIT\r\n");
    fgets($socket, 515);
    fclose($socket);

    return true;
}
