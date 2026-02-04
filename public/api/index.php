<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration
$host = 'localhost';
$db_name = 'intramail_db';
$username = 'root';
$password = ''; // Default XAMPP password is empty

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Simple Router
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper: Get Input Data
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}

// Helper: Update Activity
function updateUserActivity($pdo, $userId) {
    if (!$userId) return;
    $stmt = $pdo->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
    $stmt->execute([$userId]);
}

// --- File Upload ---
if ($action === 'upload' && $method === 'POST') {
    // Check for upload errors
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit();
    }

    $file = $_FILES['file'];
    
    // Check for specific upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $msg = 'Upload failed';
        switch ($file['error']) {
            case UPLOAD_ERR_INI_SIZE: $msg = 'File exceeds php.ini upload_max_filesize'; break;
            case UPLOAD_ERR_FORM_SIZE: $msg = 'File exceeds MAX_FILE_SIZE directive'; break;
            case UPLOAD_ERR_PARTIAL: $msg = 'File only partially uploaded'; break;
            case UPLOAD_ERR_NO_FILE: $msg = 'No file was uploaded'; break;
        }
        http_response_code(400);
        echo json_encode(['error' => $msg]);
        exit();
    }

    $uploadDir = '../uploads/';
    
    // Create dir if not exists
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create upload directory']);
            exit();
        }
    }

    // Validation
    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large (Max 10MB)']);
        exit();
    }

    // Allowed MIME types
    $allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'image/jpeg', 
        'image/png',
        'image/jpg'
    ];
    
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    if (!in_array($mimeType, $allowedTypes)) {
         // Strict check failed, we might want to log this but for now return error
         http_response_code(400);
         echo json_encode(['error' => 'Invalid file type. Allowed: PDF, Word, Excel, Images. Detected: ' . $mimeType]);
         exit();
    }

    // Sanitize filename
    $filename = basename($file['name']);
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
    $uniqueName = uniqid() . '_' . $filename;
    $targetPath = $uploadDir . $uniqueName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Public URL relative to the web root
        // Assuming /intramail/api/index.php is the script, and uploads are in /intramail/uploads/
        $publicUrl = '/intramail/uploads/' . $uniqueName;
        
        // Determine simple type for frontend
        $simpleType = 'other';
        if (strpos($mimeType, 'image') !== false) $simpleType = 'image';
        elseif (strpos($mimeType, 'pdf') !== false) $simpleType = 'pdf';
        elseif (strpos($mimeType, 'word') !== false) $simpleType = 'docx';
        elseif (strpos($mimeType, 'sheet') !== false || strpos($mimeType, 'excel') !== false) $simpleType = 'xlsx';

        // Size string
        $sizeStr = $file['size'] > 1024 * 1024 
          ? number_format($file['size'] / (1024 * 1024), 1) . ' MB'
          : number_format($file['size'] / 1024, 1) . ' KB';

        echo json_encode([
            'success' => true,
            'attachment' => [
                'id' => uniqid('att_'),
                'name' => $file['name'],
                'size' => $sizeStr,
                'type' => $simpleType,
                'url' => $publicUrl
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file to server']);
    }
    exit();
}

// --- Auth ---
if ($action === 'login' && $method === 'POST') {
    $data = getJsonInput();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data['password'], $user['password_hash'])) {
        unset($user['password_hash']);
        
        // Update Activity
        updateUserActivity($pdo, $user['id']);

        // Log Login
        $logStmt = $pdo->prepare("INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (UUID(), ?, 'LOGIN_SUCCESS', 'User logged in', ?)");
        $logStmt->execute([$user['id'], $_SERVER['REMOTE_ADDR']]);
        
        // Add computed isOnline for self
        $user['isOnline'] = true;

        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
    exit();
}

// ... (Password reset endpoints remain the same) ...
if ($action === 'change_password' && $method === 'POST') {
    $data = getJsonInput();
    $userId = $data['userId'];
    $oldPassword = $data['oldPassword'];
    $newPassword = $data['newPassword'];

    // 1. Fetch current user hash
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentHash = $stmt->fetchColumn();

    if ($currentHash && password_verify($oldPassword, $currentHash)) {
        // 2. Hash new password and update
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        if ($updateStmt->execute([$newHash, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update database']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
    }
    exit();
}

if ($action === 'admin_reset_password' && $method === 'POST') {
    $data = getJsonInput();
    $targetUserId = $data['targetUserId'];
    $newPassword = $data['newPassword'];
    $adminId = $data['adminId'] ?? 'system';
    
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    if ($updateStmt->execute([$newHash, $targetUserId])) {
        // Detailed Audit Log
        $logStmt = $pdo->prepare("INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (UUID(), ?, 'PASSWORD_RESET', ?, ?)");
        $details = "Admin ($adminId) reset password for User ($targetUserId)";
        $logStmt->execute([$adminId, $details, $_SERVER['REMOTE_ADDR']]);

        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to reset password']);
    }
    exit();
}

// --- Dashboard Stats (Admin Widgets) ---
if ($action === 'stats' && $method === 'GET') {
    // ... (Existing stats logic) ...
    $stats = [];
    $stats['activeUsers'] = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $stats['totalMessages'] = $pdo->query("SELECT COUNT(*) FROM messages WHERE type='email'")->fetchColumn();
    $stats['totalMemos'] = $pdo->query("SELECT COUNT(*) FROM messages WHERE type='memo'")->fetchColumn();
    $rolesStmt = $pdo->query("SELECT role as name, COUNT(*) as value FROM users GROUP BY role");
    $stats['rolesDistribution'] = $rolesStmt->fetchAll(PDO::FETCH_ASSOC);
    $stats['systemHealth'] = 'Optimal'; 
    echo json_encode($stats);
    exit();
}

// --- Users ---
if ($action === 'users' && $method === 'GET') {
    // Fetch users with computed online status (active in last 5 mins)
    $stmt = $pdo->query("
        SELECT id, name, username, email, role, department, avatar,
        CASE WHEN last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END as isOnline
        FROM users
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Cast boolean
    foreach($users as &$u) { $u['isOnline'] = (bool)$u['isOnline']; }
    
    echo json_encode($users);
    exit();
}

if ($action === 'users' && $method === 'POST') {
    // ... (Existing create user logic) ...
    $data = getJsonInput();
    $hash = password_hash('12345678', PASSWORD_DEFAULT); 
    $stmt = $pdo->prepare("INSERT INTO users (id, name, username, email, password_hash, role, department, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    try {
        $stmt->execute([$data['id'], $data['name'], $data['username'], $data['email'], $hash, $data['role'], $data['department'], $data['avatar']]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit();
}

if ($action === 'update_user' && $method === 'POST') {
    $data = getJsonInput();
    if (!isset($data['id'])) { http_response_code(400); echo json_encode(['error' => 'User ID required']); exit(); }
    
    // 1. Fetch old state for logging
    $oldStmt = $pdo->prepare("SELECT role, department FROM users WHERE id = ?");
    $oldStmt->execute([$data['id']]);
    $oldUser = $oldStmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("UPDATE users SET role = ?, department = ? WHERE id = ?");
    try {
        $stmt->execute([$data['role'], $data['department'], $data['id']]);
        
        // 2. Generate detailed log
        $changes = [];
        if ($oldUser) {
            if ($oldUser['role'] !== $data['role']) {
                $changes[] = "Role: {$oldUser['role']} -> {$data['role']}";
            }
            if ($oldUser['department'] !== $data['department']) {
                $changes[] = "Dept: {$oldUser['department']} -> {$data['department']}";
            }
        }
        
        if (!empty($changes)) {
            $adminId = $data['adminId'] ?? 'system';
            $details = "Updated User {$data['id']}: " . implode(", ", $changes);
            $logStmt = $pdo->prepare("INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (UUID(), ?, 'USER_UPDATE', ?, ?)");
            $logStmt->execute([$adminId, $details, $_SERVER['REMOTE_ADDR']]);
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit();
}

// --- Update Profile (Avatar) ---
if ($action === 'update_profile' && $method === 'POST') {
    $data = getJsonInput();
    $userId = $data['userId'];
    $avatar = $data['avatar'];

    if (!$userId || !$avatar) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
    if ($stmt->execute([$avatar, $userId])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
    exit();
}

// --- Messages / Inbox ---
if ($action === 'messages' && $method === 'GET') {
    $userId = $_GET['userId'];
    $type = $_GET['type'] ?? 'inbox'; // inbox, sent, memo, archive

    updateUserActivity($pdo, $userId);

    $messages = [];
    
    // Resolve Department logic
    $deptTarget = "";
    if ($userId && $userId !== 'system') {
        $uStmt = $pdo->prepare("SELECT department FROM users WHERE id = ?");
        $uStmt->execute([$userId]);
        $dept = $uStmt->fetchColumn();
        if ($dept) $deptTarget = "DEPT_" . $dept;
    }

    if ($type === 'inbox') {
        $sql = "SELECT m.*, u.name as sender_name, u.department as sender_dept, mr.is_read 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id
                JOIN message_recipients mr ON m.id = mr.message_id
                WHERE (mr.user_id = ? OR mr.user_id = 'ALL_STAFF' OR mr.user_id = ?) 
                AND m.type = 'email'
                AND mr.is_archived = 0
                ORDER BY m.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $deptTarget]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } elseif ($type === 'archive') {
        $sql = "SELECT m.*, u.name as sender_name, u.department as sender_dept, mr.is_read 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id
                JOIN message_recipients mr ON m.id = mr.message_id
                WHERE (mr.user_id = ? OR mr.user_id = 'ALL_STAFF' OR mr.user_id = ?) 
                AND m.type = 'email'
                AND mr.is_archived = 1
                ORDER BY m.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $deptTarget]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } elseif ($type === 'sent') {
        $sql = "SELECT m.* FROM messages m WHERE m.sender_id = ? AND m.type = 'email' ORDER BY m.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } elseif ($type === 'memo') {
         $sql = "SELECT m.*, u.name as sender_name, u.department as sender_dept 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id
                WHERE m.type = 'memo' 
                ORDER BY m.created_at DESC";
         $stmt = $pdo->query($sql);
         $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Hydrate Data (Recipients, Attachments)
    foreach ($messages as &$msg) {
        $msg['isRead'] = isset($msg['is_read']) ? (bool)$msg['is_read'] : false;
        
        $recStmt = $pdo->prepare("SELECT user_id FROM message_recipients WHERE message_id = ? AND type='to'");
        $recStmt->execute([$msg['id']]);
        $msg['recipientIds'] = $recStmt->fetchAll(PDO::FETCH_COLUMN);

        $ccStmt = $pdo->prepare("SELECT user_id FROM message_recipients WHERE message_id = ? AND type='cc'");
        $ccStmt->execute([$msg['id']]);
        $msg['ccIds'] = $ccStmt->fetchAll(PDO::FETCH_COLUMN);
        $msg['bccIds'] = [];

        $attStmt = $pdo->prepare("SELECT * FROM attachments WHERE message_id = ?");
        $attStmt->execute([$msg['id']]);
        $msg['attachments'] = $attStmt->fetchAll(PDO::FETCH_ASSOC);

        $statusStmt = $pdo->prepare("
            SELECT mr.user_id as userId, u.name, mr.is_read as isRead, mr.read_at as readAt
            FROM message_recipients mr
            LEFT JOIN users u ON mr.user_id = u.id
            WHERE mr.message_id = ? AND mr.type != 'bcc'
        ");
        $statusStmt->execute([$msg['id']]);
        $msg['recipientDetails'] = $statusStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($msg['recipientDetails'] as &$rd) { $rd['isRead'] = (bool)$rd['isRead']; }

        if ($msg['type'] === 'memo') {
             $ackStmt = $pdo->prepare("SELECT user_id FROM message_recipients WHERE message_id = ? AND is_acknowledged = 1");
             $ackStmt->execute([$msg['id']]);
             $msg['acknowledgedBy'] = $ackStmt->fetchAll(PDO::FETCH_COLUMN);
        }
    }

    echo json_encode($messages);
    exit();
}

if ($action === 'messages' && $method === 'POST') {
    // ... (Existing send message logic) ...
    $data = getJsonInput();
    updateUserActivity($pdo, $data['senderId']);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO messages (id, sender_id, subject, body, priority, type, thread_id, requires_ack) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['id'], $data['senderId'], $data['subject'], $data['body'], $data['priority'], $data['type'], $data['threadId'], $data['requiresAcknowledgement'] ?? 0]);

        $stmtRec = $pdo->prepare("INSERT INTO message_recipients (message_id, user_id, type) VALUES (?, ?, ?)");
        foreach ($data['recipientIds'] as $rid) {
            $stmtRec->execute([$data['id'], $rid, 'to']);
        }

        if (!empty($data['attachments'])) {
            $stmtAtt = $pdo->prepare("INSERT INTO attachments (id, message_id, name, size, type, url) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['attachments'] as $att) {
                $stmtAtt->execute([$att['id'], $data['id'], $att['name'], $att['size'], $att['type'], $att['url']]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit();
}

// --- Mark As Read ---
if ($action === 'mark_read' && $method === 'POST') {
    $data = getJsonInput();
    $msgId = $data['messageId'];
    $userId = $data['userId'];
    updateUserActivity($pdo, $userId);

    $sql = "UPDATE message_recipients SET is_read = 1, read_at = NOW() WHERE message_id = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$msgId, $userId]);
    echo json_encode(['success' => true]);
    exit();
}

// --- Mark All Read ---
if ($action === 'mark_all_read' && $method === 'POST') {
    $data = getJsonInput();
    $userId = $data['userId'];
    updateUserActivity($pdo, $userId);

    // Update all unread messages for this user (ignoring type for now, or could limit to inbox)
    $sql = "UPDATE message_recipients SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true]);
    exit();
}

// --- Archive Message ---
if ($action === 'archive_message' && $method === 'POST') {
    $data = getJsonInput();
    $msgId = $data['messageId'];
    $userId = $data['userId'];
    $isArchived = $data['isArchived'] ? 1 : 0;
    updateUserActivity($pdo, $userId);

    $sql = "UPDATE message_recipients SET is_archived = ? WHERE message_id = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$isArchived, $msgId, $userId]);
    
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
?>