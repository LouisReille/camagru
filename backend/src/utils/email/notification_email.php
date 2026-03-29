<?php
require_once __DIR__ . '/smtp_mail.php';

function sendLikeNotificationEmail($to, $likerUsername, $imageId, $timestamp) {
    $dateTime = new DateTime($timestamp, new DateTimeZone('UTC'));
    $dateTime->setTimezone(new DateTimeZone('Europe/Paris'));
    $formattedTime = $dateTime->format('F j, Y \a\t g:i A');

    require_once __DIR__ . '/../config/config.php';
    $frontendUrl = defined('FRONTEND_URL') ? FRONTEND_URL : (getenv('FRONTEND_URL') ?: 'http://localhost:3000');
    $subject = 'Someone liked your image on Camagru';
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

                    .highlight {
                        font-weight: 600;
                        color: #FF6B9D;
                    }

                    .view-button {
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

                    .view-button:hover {
                        background: linear-gradient(135deg, #FF8E9B 0%, #FF6B9D 100%);
                        box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
                        transform: translateY(-2px);
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

                        .view-button {
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
                        <h2>Your image was liked! ❤️</h2>
                        <p>Hello!</p>
                        <p><span class='highlight'>{$likerUsername}</span> liked your image on <span class='highlight'>{$formattedTime}</span>.</p>
                        <a href='{$frontendUrl}/index.html' class='view-button'>View on Camagru</a>
                    </div>
                    <div class='email-footer'>
                        <p>Best regards,<br>The Camagru Team</p>
                    </div>
                </div>
                </div>
            </body>
            </html>
        ";
    $textBody = "Hello!\n\n{$likerUsername} liked your image on {$formattedTime}.\n\nView on Camagru: {$frontendUrl}/index.html\n\nBest regards,\nThe Camagru Team";

    return sendSMTPEmail($to, $subject, $htmlBody, $textBody);
}

function sendCommentNotificationEmail($to, $commenterUsername, $comment, $imageId, $timestamp) {
    $dateTime = new DateTime($timestamp, new DateTimeZone('UTC'));
    $dateTime->setTimezone(new DateTimeZone('Europe/Paris'));
    $formattedTime = $dateTime->format('F j, Y \a\t g:i A');
    $escapedComment = htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');

    require_once __DIR__ . '/../config/config.php';
    $frontendUrl = defined('FRONTEND_URL') ? FRONTEND_URL : (getenv('FRONTEND_URL') ?: 'http://localhost:3000');
    $subject = 'New comment on your Camagru image';
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

                    .highlight {
                        font-weight: 600;
                        color: #FF6B9D;
                    }

                    .comment-box {
                        background: rgba(30, 41, 59, 0.8);
                        border-left: 4px solid rgba(255, 107, 157, 0.5);
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 8px;
                        font-style: italic;
                        color: #e2e8f0;
                        text-align: left;
                    }

                    .comment-box p {
                        margin: 0;
                        color: #cbd5e1;
                    }

                    .view-button {
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

                    .view-button:hover {
                        background: linear-gradient(135deg, #FF8E9B 0%, #FF6B9D 100%);
                        box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
                        transform: translateY(-2px);
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

                        .view-button {
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
                        <h2>New comment on your post! 💬</h2>
                        <p>Hello!</p>
                        <p><span class='highlight'>{$commenterUsername}</span> has commented on your post on <span class='highlight'>{$formattedTime}</span>.</p>
                        <div class='comment-box'>
                            <p>\"{$escapedComment}\"</p>
                        </div>
                        <a href='{$frontendUrl}/index.html' class='view-button'>View on Camagru</a>
                    </div>
                    <div class='email-footer'>
                        <p>Best regards,<br>The Camagru Team</p>
                    </div>
                </div>
                </div>
            </body>
            </html>
        ";
    $textBody = "Hello!\n\n{$commenterUsername} has commented on your post on {$formattedTime}.\n\nComment: \"{$comment}\"\n\nView on Camagru: {$frontendUrl}/index.html\n\nBest regards,\nThe Camagru Team";

    return sendSMTPEmail($to, $subject, $htmlBody, $textBody);
}
