# FMC Hong Intramail - Backend API Documentation

This document details the PHP endpoints available in the Intramail system. The backend is designed as a simple REST-like service running on a local LAMP stack.

**Base URL:** `http://localhost/intramail/api/index.php`

All endpoints accept JSON payloads for POST requests and return JSON responses.

---

## Authentication & User Management

### 1. User Login
Validates credentials and updates last active timestamp.
*   **Method:** `POST`
*   **Query Param:** `?action=login`
*   **Payload:**
    ```json
    {
      "username": "shammah",
      "password": "password123"
    }
    ```
*   **Response (Success):**
    ```json
    {
      "success": true,
      "user": { "id": "u1", "name": "...", "role": "...", "isOnline": true }
    }
    ```

### 2. Get All Users
Fetches list of staff members. Includes `isOnline` status based on activity in the last 5 minutes.
*   **Method:** `GET`
*   **Query Param:** `?action=users`
*   **Response:** Array of User objects.

### 3. Create User
Adds a new staff member to the system.
*   **Method:** `POST`
*   **Query Param:** `?action=users`
*   **Payload:**
    ```json
    {
      "id": "u123",
      "name": "Dr. New",
      "username": "dnew",
      "email": "dnew@fmchong.local",
      "role": "Medical Doctor",
      "department": "Clinical Services",
      "avatar": "url..."
    }
    ```

### 4. Update User Role/Department
Updates an existing user's access rights. Logs detailed changes to audit trail.
*   **Method:** `POST`
*   **Query Param:** `?action=update_user`
*   **Payload:**
    ```json
    {
      "id": "u123",
      "role": "Super Administrator",
      "department": "ICT Unit",
      "adminId": "admin_shammah" // ID of admin performing action
    }
    ```

### 5. Admin Password Reset
Allows an admin to force reset a user's password.
*   **Method:** `POST`
*   **Query Param:** `?action=admin_reset_password`
*   **Payload:**
    ```json
    {
      "targetUserId": "u123",
      "newPassword": "newpass",
      "adminId": "admin_shammah"
    }
    ```

### 6. Change Own Password
Allows a user to change their own password.
*   **Method:** `POST`
*   **Query Param:** `?action=change_password`
*   **Payload:** `{ "userId": "...", "oldPassword": "...", "newPassword": "..." }`

---

## Messaging System

### 7. Get Messages
Fetches emails, memos, sent items, or archived items.
*   **Method:** `GET`
*   **Query Params:**
    *   `action=messages`
    *   `userId`: The current user's ID.
    *   `type`: One of `inbox`, `sent`, `archive`, `memo`.

### 8. Send Message
Sends a new email or memo.
*   **Method:** `POST`
*   **Query Param:** `?action=messages`
*   **Payload:**
    ```json
    {
      "id": "m123",
      "senderId": "u1",
      "recipientIds": ["u2", "DEPT_Nursing"],
      "subject": "Hello",
      "body": "...",
      "priority": "Normal",
      "type": "email", // or "memo"
      "attachments": []
    }
    ```

### 9. Mark Message as Read
*   **Method:** `POST`
*   **Query Param:** `?action=mark_read`
*   **Payload:** `{ "messageId": "m123", "userId": "u1" }`

### 10. Mark All as Read
*   **Method:** `POST`
*   **Query Param:** `?action=mark_all_read`
*   **Payload:** `{ "userId": "u1" }`

### 11. Archive/Unarchive Message
*   **Method:** `POST`
*   **Query Param:** `?action=archive_message`
*   **Payload:** `{ "messageId": "m123", "userId": "u1", "isArchived": true }`

---

## File Handling & System

### 12. Upload File
Uploads an attachment.
*   **Method:** `POST`
*   **Query Param:** `?action=upload`
*   **Content-Type:** `multipart/form-data`
*   **Form Field:** `file` (Binary content)
*   **Response:**
    ```json
    {
      "success": true,
      "attachment": { "id": "...", "url": "/intramail/uploads/file.pdf", ... }
    }
    ```

### 13. System Stats
Fetches dashboard metrics for admins.
*   **Method:** `GET`
*   **Query Param:** `?action=stats`
