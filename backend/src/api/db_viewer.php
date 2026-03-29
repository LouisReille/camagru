<?php
if (session_status() === PHP_SESSION_NONE) {
    session_name('CAMAGRU_DBVIEWER');
    session_start();
}

require_once __DIR__ . '/../utils/config/config.php';

$expectedRootPassword = getenv('DB_ROOT_PASSWORD');

if ($expectedRootPassword === false || $expectedRootPassword === '') {
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>DB Viewer</title></head><body style="font-family:sans-serif;padding:2rem;"><p>Database viewer is disabled: set <code>DB_ROOT_PASSWORD</code> in your <code>.env</code> file.</p></body></html>';
    exit;
}

if (isset($_GET['logout'])) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'] ?? false, $p['httponly'] ?? true);
    }
    session_destroy();
    header('Location: ' . ($_SERVER['SCRIPT_NAME'] ?? 'db_viewer.php'));
    exit;
}

$dbViewerLoginError = '';

if (empty($_SESSION['db_viewer_authenticated'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['db_viewer_password'])) {
        $submitted = (string)($_POST['db_viewer_password'] ?? '');
        if (hash_equals($expectedRootPassword, $submitted)) {
            $_SESSION['db_viewer_authenticated'] = true;
            session_regenerate_id(true);
            header('Location: ' . ($_SERVER['SCRIPT_NAME'] ?? 'db_viewer.php'));
            exit;
        }
        $dbViewerLoginError = 'Invalid password.';
    }
    header('Content-Type: text/html; charset=UTF-8');
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Viewer — Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-box {
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            border-radius: 12px;
            padding: 32px;
            max-width: 400px;
            width: 100%;
            border: 1px solid rgba(255, 107, 157, 0.2);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        h1 { color: #FF6B9D; font-size: 1.35rem; margin-bottom: 8px; }
        p.hint { color: #94a3b8; font-size: 0.9rem; margin-bottom: 20px; }
        label { display: block; color: #cbd5e1; margin-bottom: 8px; font-weight: 500; }
        input[type="password"] {
            width: 100%;
            padding: 12px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255, 107, 157, 0.3);
            background: rgba(30, 41, 59, 0.6);
            color: #e2e8f0;
            font-size: 16px;
            margin-bottom: 16px;
        }
        input[type="password"]:focus {
            outline: none;
            border-color: #FF6B9D;
        }
        button {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%);
            color: white;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
        }
        button:hover { opacity: 0.95; }
        .err {
            background: rgba(255, 71, 87, 0.2);
            border: 1px solid rgba(255, 71, 87, 0.5);
            color: #FF6B9D;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <h1>Database Viewer</h1>
        <p class="hint">Enter the MySQL root password from your <code>.env</code> (<code>DB_ROOT_PASSWORD</code>).</p>
        <?php if ($dbViewerLoginError !== ''): ?>
            <div class="err"><?= htmlspecialchars($dbViewerLoginError, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <form method="post" action="<?= htmlspecialchars($_SERVER['SCRIPT_NAME'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
            <label for="db_viewer_password">Password</label>
            <input type="password" id="db_viewer_password" name="db_viewer_password" required autocomplete="current-password" autofocus>
            <button type="submit">Unlock viewer</button>
        </form>
    </div>
</body>
</html>
    <?php
    exit;
}

require_once __DIR__ . '/../../config/database.php';
$pdo = getDatabaseConnection();
$tables = [];
$stmt = $pdo->query("SHOW TABLES");

while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
    $tables[] = $row[0];
}

$deleteMessage = '';
$deleteError = '';

if (isset($_GET['delete']) && isset($_GET['table']) && isset($_GET['id'])) {
    $deleteTable = $_GET['table'];
    $deleteId = $_GET['id'];

    if (in_array($deleteTable, $tables)) {
        try {
            $stmt = $pdo->query("SHOW KEYS FROM `$deleteTable` WHERE Key_name = 'PRIMARY'");
            $primaryKey = $stmt->fetch(PDO::FETCH_ASSOC);
            $pkColumn = $primaryKey ? $primaryKey['Column_name'] : 'id';
            $stmt = $pdo->prepare("DELETE FROM `$deleteTable` WHERE `$pkColumn` = ?");
            $stmt->execute([$deleteId]);
            $deleteMessage = "Row deleted successfully!";
        } catch (PDOException $e) {
            $deleteError = "Error deleting row: " . $e->getMessage();
        }

    } else {
        $deleteError = "Invalid table name";
    }

}

$selectedTable = $_GET['table'] ?? ($tables[0] ?? null);
$data = [];
$columns = [];
$primaryKeyColumn = 'id';

if ($selectedTable) {
    try {
        $stmt = $pdo->query("DESCRIBE `$selectedTable`");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt = $pdo->query("SHOW KEYS FROM `$selectedTable` WHERE Key_name = 'PRIMARY'");
        $primaryKey = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($primaryKey) {
            $primaryKeyColumn = $primaryKey['Column_name'];
        }

        $stmt = $pdo->query("SELECT * FROM `$selectedTable` ORDER BY $primaryKeyColumn DESC LIMIT 100");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $error = $e->getMessage();
    }

}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Viewer | Camagru</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #e2e8f0;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 107, 157, 0.2);
        }

        h1 {
            color: #FF6B9D;
            margin-bottom: 10px;
            font-size: 2em;
        }

        .warning {
            background: rgba(255, 107, 157, 0.2);
            border: 1px solid rgba(255, 107, 157, 0.5);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            color: #FF6B9D;
        }

        .table-selector {
            margin-bottom: 30px;
        }

        .table-selector label {
            display: block;
            margin-bottom: 10px;
            color: #cbd5e1;
            font-weight: 500;
        }

        .table-selector select {
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(255, 107, 157, 0.3);
            border-radius: 6px;
            padding: 10px 15px;
            color: #e2e8f0;
            font-size: 16px;
            width: 100%;
            max-width: 400px;
            cursor: pointer;
        }

        .table-selector select:focus {
            outline: none;
            border-color: #FF6B9D;
            box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.2);
        }

        .table-info {
            margin-bottom: 20px;
            color: #94a3b8;
            font-size: 14px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(30, 41, 59, 0.4);
            border-radius: 8px;
            overflow: hidden;
        }

        .data-table th {
            background: linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }

        .data-table td {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 107, 157, 0.1);
            color: #cbd5e1;
        }

        .data-table tr:hover {
            background: rgba(255, 107, 157, 0.1);
        }

        .data-table tr:last-child td {
            border-bottom: none;
        }

        .empty {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }

        .error {
            background: rgba(255, 107, 157, 0.2);
            border: 1px solid rgba(255, 107, 157, 0.5);
            padding: 15px;
            border-radius: 8px;
            color: #FF6B9D;
            margin-bottom: 20px;
        }

        .password-field {
            font-family: monospace;
            color: #94a3b8;
            font-size: 0.9em;
        }

        .token-field {
            font-family: monospace;
            color: #94a3b8;
            font-size: 0.85em;
            word-break: break-all;
            max-width: 200px;
        }

        .delete-btn {
            background: linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
        }

        .delete-btn:hover {
            background: linear-gradient(135deg, #FF4757 0%, #FF6B9D 100%);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(255, 107, 157, 0.4);
        }

        .success-message {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.5);
            padding: 15px;
            border-radius: 8px;
            color: #10B981;
            margin-bottom: 20px;
        }

    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Database Viewer</h1>
        <p style="margin-bottom: 16px;"><a href="?logout=1" style="color: #FF8E9B;">Log out</a></p>
        <div class="warning">
            ⚠️ <strong>Development Tool Only!</strong> Remove or secure this page in production!
        </div>
        <?php if ($deleteMessage): ?>
            <div class="success-message">✅ <?= htmlspecialchars($deleteMessage) ?></div>
        <?php endif; ?>
        <?php if ($deleteError): ?>
            <div class="error">❌ <?= htmlspecialchars($deleteError) ?></div>
        <?php endif; ?>
        <div class="table-selector">
            <label for="tableSelect">Select Table:</label>
            <select id="tableSelect" onchange="window.location.href='?table=' + this.value">
                <?php foreach ($tables as $table): ?>
                    <option value="<?= htmlspecialchars($table) ?>" <?= $table === $selectedTable ? 'selected' : '' ?>>
                        <?= htmlspecialchars($table) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        <?php if (isset($error)): ?>
            <div class="error">Error: <?= htmlspecialchars($error) ?></div>
        <?php elseif ($selectedTable): ?>
            <div class="table-info">
                Showing <?= count($data) ?> row(s) from <strong><?= htmlspecialchars($selectedTable) ?></strong>
                <?php if (count($data) >= 100): ?>
                    <span style="color: #FF6B9D;">(Limited to 100 rows)</span>
                <?php endif; ?>
            </div>
            <?php if (empty($data)): ?>
                <div class="empty">No data found in this table.</div>
            <?php else: ?>
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <?php foreach ($columns as $column): ?>
                                    <th><?= htmlspecialchars($column) ?></th>
                                <?php endforeach; ?>
                                <th style="width: 100px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($data as $row): ?>
                                <tr>
                                    <?php foreach ($columns as $column): ?>
                                        <td>
                                            <?php
                                            $value = $row[$column] ?? null;

                                            if ($value === null) {
                                                echo '<span style="color: #64748b;">NULL</span>';
                                            } elseif ($column === 'password') {
                                                echo '<span class="password-field">' . htmlspecialchars(substr($value, 0, 20)) . '...</span>';
                                            } elseif ($column === 'token' && strlen($value) > 30) {
                                                echo '<span class="token-field">' . htmlspecialchars(substr($value, 0, 30)) . '...</span>';
                                            } else {
                                                echo htmlspecialchars($value);
                                            }

                                            ?>
                                        </td>
                                    <?php endforeach; ?>
                                    <td>
                                        <button
                                            class="delete-btn"
                                            onclick="if(confirm('Are you sure you want to delete this row?')) { window.location.href='?table=<?= urlencode($selectedTable) ?>&delete=1&id=<?= urlencode($row[$primaryKeyColumn]) ?>'; }"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</body>
</html>
