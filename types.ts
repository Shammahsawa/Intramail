// Role Definitions
export enum UserRole {
  SUPER_ADMIN = 'Super Administrator',
  MANAGEMENT = 'Hospital Management', // CMD, CMAC
  DOCTOR = 'Medical Doctor',
  NURSE = 'Nurse',
  PHARMACIST = 'Pharmacist',
  LAB_STAFF = 'Laboratory Staff',
  ADMIN_STAFF = 'Administrative Staff',
  RECORDS = 'Records Officer',
}

// Departments
export enum Department {
  MANAGEMENT = 'Management',
  CLINICAL = 'Clinical Services',
  NURSING = 'Nursing Services',
  PHARMACY = 'Pharmacy',
  LABORATORY = 'Laboratory',
  ICT = 'ICT Unit',
  ADMINISTRATION = 'Administration',
  RECORDS = 'Medical Records',
}

// Priority Flags
export enum Priority {
  NORMAL = 'Normal',
  URGENT = 'Urgent',
  CONFIDENTIAL = 'Confidential',
}

// User Entity
export interface User {
  id: string;
  name: string;
  username: string; // Added for auth
  email: string; // Internal email format: name@fmchong.local
  role: UserRole;
  department: Department;
  avatar?: string;
  isOnline?: boolean; // Added for status indicator
}

export interface RecipientStatus {
  userId: string;
  name: string;
  isRead: boolean;
  readAt: string | null;
}

// Message Entity
export interface Message {
  id: string;
  senderId: string;
  recipientIds: string[]; // Can be users or group aliases
  recipientDetails?: RecipientStatus[]; // Added for Read Receipts
  ccIds: string[];
  bccIds: string[];
  subject: string;
  body: string;
  priority: Priority;
  attachments: Attachment[];
  createdAt: string;
  isRead: boolean;
  threadId: string;
  type: 'email' | 'memo';
  isArchived?: boolean; // Frontend state helper
}

// Attachment Entity
export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'other';
  url: string; // Mock URL
  previewUrl?: string; // For client-side previews
}

// Memo Entity (Specialized Message)
export interface Memo extends Message {
  requiresAcknowledgement: boolean;
  acknowledgedBy: string[]; // User IDs
}

// Audit Log Entity
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface DashboardStats {
  activeUsers: number;
  totalMessages: number;
  totalMemos: number;
  systemHealth: string;
  rolesDistribution: { name: string; value: number }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'memo' | 'alert';
  referenceId: string; // ID of message or memo
  timestamp: string;
  isRead: boolean;
}

export type ViewState = 'login' | 'dashboard' | 'directory' | 'inbox' | 'sent' | 'archive' | 'memo-board' | 'compose' | 'admin' | 'system-docs' | 'view-message' | 'settings';