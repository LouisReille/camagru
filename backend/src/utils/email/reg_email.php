<?php
require_once __DIR__ . '/smtp_mail.php';

function sendVerificationEmail($to, $token, $requestOrigin = null) {
    require_once __DIR__ . '/../config/config.php';

    if ($requestOrigin) {
        $originParts = parse_url($requestOrigin);

        if ($originParts && isset($originParts['scheme']) && isset($originParts['host'])) {
            $host = $originParts['host'];
            $port = isset($originParts['port']) ? ':' . $originParts['port'] : '';
            $scheme = $originParts['scheme'];
            $backendUrl = "$scheme://$host:8080";
        } else {
            $backendUrl = getenv('BACKEND_URL') ?: (defined('BACKEND_URL') ? BACKEND_URL : 'http://localhost:8080');
        }

    } else {
        $backendUrl = getenv('BACKEND_URL') ?: (defined('BACKEND_URL') ? BACKEND_URL : 'http://localhost:8080');
    }

    $verificationLink = "$backendUrl/src/api/users/verify.php?token=$token";
    $subject = 'Verify your Camagru account';
    $htmlBody = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #e2e8f0;
                        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                        background-attachment: fixed;
                        margin: 0;
                        padding: 20px;
                    }

                    .email-wrapper {
                        max-width: 600px;
                        margin: 0 auto;
                    }

                    .email-container {
                        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255, 107, 157, 0.2);
                    }

                    .email-header {
                        background: linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 50%, #A78BFA 100%);
                        padding: 40px 30px;
                        text-align: center;
                        color: white;
                    }

                    .email-header h1 {
                        margin: 0;
                        font-size: 2.5em;
                        font-weight: 600;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    .email-content {
                        padding: 40px 30px;
                        text-align: center;
                        background: rgba(30, 41, 59, 0.6);
                    }

                    .email-content h2 {
                        color: #e2e8f0;
                        margin-bottom: 20px;
                        font-size: 1.8em;
                        font-weight: 600;
                    }

                    .email-content p {
                        color: #cbd5e1;
                        margin-bottom: 30px;
                        font-size: 16px;
                        line-height: 1.6;
                    }

                    .verify-button {
                        display: inline-block;
                        background: linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%);
                        color: #ffffff;
                        padding: 15px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        margin: 20px 0;
                        box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
                        transition: all 0.3s ease;
                    }

                    .verify-button:hover {
                        background: linear-gradient(135deg, #FF8E9B 0%, #FF6B9D 100%);
                        box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
                        transform: translateY(-2px);
                    }

                    .expiry-info {
                        color: #FF6B9D;
                        font-size: 14px;
                        margin-top: 20px;
                        font-weight: 500;
                    }

                    .email-footer {
                        text-align: center;
                        padding: 30px;
                        background: rgba(30, 41, 59, 0.4);
                        border-top: 1px solid rgba(255, 107, 157, 0.1);
                        color: #94a3b8;
                        font-size: 13px;
                        line-height: 1.5;
                    }

                    @media only screen and (max-width: 600px) {
                        body {
                            padding: 10px;
                        }

                        .email-header h1 {
                            font-size: 2em;
                        }

                        .email-content {
                            padding: 30px 20px;
                        }

                        .verify-button {
                            padding: 12px 30px;
                            font-size: 14px;
                        }

                    }

                </style>
            </head>
            <body>
                <div class='email-wrapper'>
                <div class='email-container'>
                    <div class='email-header'>
                        <h1>Camagru</h1>
                    </div>
                    <div class='email-content'>
                        <h2>Welcome to Camagru!</h2>
                        <p>Click the button below to verify your account:</p>
                        <a href='$verificationLink' class='verify-button'>Verify My Account</a>
                            <p class='expiry-info'>This link will expire in 15 minutes.</p>
                    </div>
                    <div class='email-footer'>
                        <p>If you didn't create an account with Camagru, please ignore this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        ";
    $textBody = "Welcome to Camagru!\n\nVerify your account by visiting this link:\n$verificationLink\n\nThis link will expire in 15 minutes.\n\nIf you didn't create an account with Camagru, please ignore this email.";

    return sendSMTPEmail($to, $subject, $htmlBody, $textBody);
}
