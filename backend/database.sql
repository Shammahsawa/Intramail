-- Database Creation
CREATE DATABASE IF NOT EXISTS intramail_db;
USE intramail_db;

-- Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    last_active TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table (Emails and Memos)
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    sender_id VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    priority ENUM('Normal', 'Urgent', 'Confidential') DEFAULT 'Normal',
    type ENUM('email', 'memo') DEFAULT 'email',
    thread_id VARCHAR(50),
    requires_ack BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Message Recipients (Pivot Table)
CREATE TABLE message_recipients (
    message_id VARCHAR(50),
    user_id VARCHAR(50), -- Can be 'ALL_STAFF' or specific ID
    type ENUM('to', 'cc', 'bcc') DEFAULT 'to',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE, -- For memos
    read_at TIMESTAMP NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Attachments Table
CREATE TABLE attachments (
    id VARCHAR(50) PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(20),
    type VARCHAR(50),
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Audit Logs
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Super Admin Seed (Password: 12345678)
-- Hash: $2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa
INSERT INTO users (id, name, username, email, password_hash, role, department, avatar, last_active) VALUES 
('admin_shammah', 'Shammah Sawa', 'shammah', 'shammah@fmchong.local', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Super Administrator', 'ICT Unit', 'https://ui-avatars.com/api/?name=Shammah+Sawa&background=059669&color=fff', NOW());

-- Sample Users (Password: 12345678)
INSERT INTO users (id, name, username, email, password_hash, role, department, avatar) VALUES 
('u1', 'Dr. Ibrahim Musa', 'cmd', 'cmd@fmchong.local', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Hospital Management', 'Management', 'https://ui-avatars.com/api/?name=Ibrahim+Musa&background=random'),
('u2', 'Sarah Okon', 'sarah', 'sarah@fmchong.local', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Nurse', 'Nursing Services', 'https://ui-avatars.com/api/?name=Sarah+Okon&background=random');
