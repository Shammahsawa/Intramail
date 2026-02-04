import { User, Message, Memo, AuditLog, UserRole, Department, Priority, DashboardStats, Attachment } from '../types';

// API Configuration
// Using relative path ensures it works whether app is at localhost/intramail or localhost/test
const API_URL = 'api/index.php'; 

// Helper for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Fallback Mock Data
const FALLBACK_USERS: User[] = [
  {
    id: 'admin_shammah',
    name: 'Shammah Sawa',
    username: 'shammah',
    email: 'shammah@fmchong.local',
    role: UserRole.SUPER_ADMIN,
    department: Department.ICT,
    avatar: 'https://ui-avatars.com/api/?name=Shammah+Sawa&background=059669&color=fff',
    isOnline: true
  },
  {
    id: 'u1',
    name: 'Dr. Ibrahim Musa',
    username: 'cmd',
    email: 'cmd@fmchong.local',
    role: UserRole.MANAGEMENT,
    department: Department.MANAGEMENT,
    avatar: 'https://ui-avatars.com/api/?name=Ibrahim+Musa&background=random',
    isOnline: true
  },
  {
    id: 'u2',
    name: 'Sarah Okon',
    username: 'sarah',
    email: 'sarah@fmchong.local',
    role: UserRole.NURSE,
    department: Department.NURSING,
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Okon&background=random',
    isOnline: false
  }
];

class DatabaseService {
  private users: User[] = [];
  private messages: Message[] = [];
  private memos: Memo[] = [];
  private logs: AuditLog[] = [];
  private isConnected = false;
  private hasTriedInit = false;

  // Store mock passwords in memory for offline/demo session persistence
  // Key: userId, Value: plain text password
  private mockPasswords: Record<string, string> = {};

  constructor() {
    // 1. Load Persisted Users and Passwords from LocalStorage
    // This ensures that if the server is offline, password changes are still "Saved" in the browser
    const storedUsers = localStorage.getItem('fmc_users');
    const storedPasswords = localStorage.getItem('fmc_passwords');

    if (storedUsers) {
        this.users = JSON.parse(storedUsers);
    } else {
        this.users = [...FALLBACK_USERS];
    }
    
    if (storedPasswords) {
        this.mockPasswords = JSON.parse(storedPasswords);
    }

    // Initialize default passwords for any user who doesn't have one (e.g. fresh seed)
    this.users.forEach(u => {
      if (!this.mockPasswords[u.id]) {
          this.mockPasswords[u.id] = '12345678';
      }
    });

    // Seed some mock messages for offline mode
    this.messages = [
      {
        id: 'm1',
        senderId: 'u1',
        recipientIds: ['admin_shammah'],
        recipientDetails: [
             { userId: 'admin_shammah', name: 'Shammah Sawa', isRead: false, readAt: null }
        ],
        ccIds: [],
        bccIds: [],
        subject: 'Welcome to Intramail',
        body: 'Welcome to the new offline-first local messaging system.',
        priority: Priority.NORMAL,
        attachments: [],
        createdAt: new Date().toISOString(),
        isRead: false,
        threadId: 't1',
        type: 'email',
        isArchived: false
      }
    ];
    this.memos = [
      {
        id: 'memo1',
        senderId: 'u1',
        recipientIds: ['ALL_STAFF'],
        ccIds: [],
        bccIds: [],
        subject: 'CIRCULAR: System Maintenance',
        body: 'The servers will undergo maintenance this weekend.',
        priority: Priority.URGENT,
        attachments: [],
        createdAt: new Date().toISOString(),
        isRead: false,
        threadId: 't_memo1',
        type: 'memo',
        requiresAcknowledgement: true,
        acknowledgedBy: []
      }
    ];
  }

  // Helper to persist offline data
  private saveToStorage() {
      localStorage.setItem('fmc_users', JSON.stringify(this.users));
      localStorage.setItem('fmc_passwords', JSON.stringify(this.mockPasswords));
  }

  // Initial Data Load
  async init() {
    if (this.hasTriedInit && !this.isConnected) return; 
    
    this.hasTriedInit = true;
    try {
      const userRes = await fetchWithTimeout(`${API_URL}?action=users`, {}, 1000);
      const contentType = userRes.headers.get("content-type");
      if (userRes.ok && contentType && contentType.indexOf("application/json") !== -1) {
        const apiUsers = await userRes.json();
        if (Array.isArray(apiUsers)) {
            this.users = apiUsers;
            this.isConnected = true;
            return;
        }
      }
      throw new Error("Invalid API response");
    } catch (e) {
      console.warn("Offline Mode Active: Using local database.");
      this.isConnected = false;
    }
  }

  getConnectionStatus() { return this.isConnected; }
  getUsers(): User[] { return this.users; }
  getLogs(): AuditLog[] { return this.logs; }

  async refreshUsers(): Promise<User[]> {
      if (this.isConnected) {
          try {
              const res = await fetchWithTimeout(`${API_URL}?action=users`, {}, 2000);
              if (res.ok) {
                  const data = await res.json();
                  if(Array.isArray(data)) this.users = data;
              }
          } catch(e) { console.error('Failed to refresh users', e); }
      }
      return this.users;
  }

  async login(username: string, password: string): Promise<User | null> {
    if (this.isConnected) {
      try {
        const res = await fetchWithTimeout(`${API_URL}?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }, 2000); 
        
        const data = await res.json();
        if (data.success && data.user) {
          return data.user;
        }
      } catch (e) {
        this.isConnected = false;
      }
    }

    // Offline / Fallback Login
    const mockUser = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (mockUser) {
        const storedPass = this.mockPasswords[mockUser.id] || '12345678';
        if (password === storedPass) return mockUser;
    }
    return null;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{success: boolean, error?: string}> {
      if (this.isConnected) {
        try {
          const res = await fetchWithTimeout(`${API_URL}?action=change_password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, oldPassword, newPassword })
          }, 3000);
          
          if (res.ok) {
              const data = await res.json();
              if (data.success) {
                  // Sync local persistence just in case
                  this.mockPasswords[userId] = newPassword;
                  this.saveToStorage();
                  return { success: true };
              }
              return { success: false, error: data.error };
          }
        } catch (e) { }
      }
      
      // Offline Logic
      const currentPass = this.mockPasswords[userId] || '12345678';
      if (currentPass === oldPassword) {
          this.mockPasswords[userId] = newPassword;
          this.saveToStorage();
          return { success: true };
      }
      return { success: false, error: "Current password is incorrect" };
  }

  async adminResetPassword(targetUserId: string, newPassword: string, adminId?: string): Promise<{success: boolean, error?: string}> {
    if (this.isConnected) {
      try {
        const res = await fetchWithTimeout(`${API_URL}?action=admin_reset_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId, newPassword, adminId })
        }, 3000);
        if (res.ok) {
             const data = await res.json();
             if (data.success) {
                 this.mockPasswords[targetUserId] = newPassword;
                 this.saveToStorage();
                 return { success: true };
             }
             return { success: false, error: data.error };
        }
      } catch (e) {}
    }
    
    // Offline Logic
    if (this.users.find(u => u.id === targetUserId)) {
        this.mockPasswords[targetUserId] = newPassword;
        this.saveToStorage();
        return { success: true };
    }
    return { success: false, error: "User not found locally" };
  }

  async fetchInbox(userId: string): Promise<Message[]> {
    if (this.isConnected) {
      try {
        const res = await fetchWithTimeout(`${API_URL}?action=messages&type=inbox&userId=${userId}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return this.messages.filter(m => (m.recipientIds.includes(userId) || m.recipientIds.includes('ALL_STAFF')) && !m.isArchived);
  }

  async fetchSent(userId: string): Promise<Message[]> {
    if (this.isConnected) {
      try {
        const res = await fetchWithTimeout(`${API_URL}?action=messages&type=sent&userId=${userId}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return this.messages.filter(m => m.senderId === userId);
  }

  async fetchArchived(userId: string): Promise<Message[]> {
    if (this.isConnected) {
      try {
        const res = await fetchWithTimeout(`${API_URL}?action=messages&type=archive&userId=${userId}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return this.messages.filter(m => (m.recipientIds.includes(userId) || m.recipientIds.includes('ALL_STAFF')) && m.isArchived);
  }

  async fetchMemos(): Promise<Memo[]> {
    if (this.isConnected) {
      try {
         const res = await fetchWithTimeout(`${API_URL}?action=messages&type=memo&userId=system`);
         if (res.ok) {
             const data = await res.json();
             return data.map((m: any) => ({
                 ...m,
                 recipientIds: m.recipientIds || ['ALL_STAFF'],
                 attachments: m.attachments || [],
                 acknowledgedBy: m.acknowledgedBy || []
             }));
         }
      } catch (e) {}
    }
    return this.memos;
  }

  async fetchStats(): Promise<DashboardStats | null> {
      if (this.isConnected) {
          try {
              const res = await fetchWithTimeout(`${API_URL}?action=stats`);
              if (res.ok) return await res.json();
          } catch(e) {}
      }
      return null;
  }

  async sendMessage(msg: Message) {
    if (this.isConnected) {
      try {
        await fetchWithTimeout(`${API_URL}?action=messages`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(msg)
        });
      } catch(e) { }
    } else {
        // Offline Stub
        this.messages.unshift(msg);
    }
  }

  async markAsRead(messageId: string, userId: string) {
      if (this.isConnected) {
          try {
              await fetchWithTimeout(`${API_URL}?action=mark_read`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ messageId, userId })
              });
          } catch(e) {}
      } else {
          // Offline Stub
          const msg = this.messages.find(m => m.id === messageId);
          if (msg) msg.isRead = true;
      }
  }

  async markAllRead(userId: string) {
      if (this.isConnected) {
          try {
              await fetchWithTimeout(`${API_URL}?action=mark_all_read`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ userId })
              });
          } catch(e) {}
      } else {
          this.messages.forEach(m => {
              if (m.recipientIds.includes(userId)) m.isRead = true;
          });
      }
  }

  async toggleArchive(messageId: string, userId: string, isArchived: boolean) {
      if (this.isConnected) {
          try {
              await fetchWithTimeout(`${API_URL}?action=archive_message`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ messageId, userId, isArchived })
              });
          } catch(e) {}
      } else {
          const msg = this.messages.find(m => m.id === messageId);
          if (msg) msg.isArchived = isArchived;
      }
  }

  async sendMemo(memo: Memo) {
    if (this.isConnected) {
      try {
        await fetchWithTimeout(`${API_URL}?action=messages`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(memo)
        });
      } catch(e) { }
    } else {
        this.memos.unshift(memo);
    }
  }

  async addUser(user: User) {
    if (this.isConnected) {
      try {
        await fetchWithTimeout(`${API_URL}?action=users`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(user)
        });
      } catch(e) { }
    }
    // Always add to local too
    this.users.push(user);
    this.mockPasswords[user.id] = '12345678';
    this.saveToStorage();
  }

  async updateUser(user: User, adminId?: string) {
      if (this.isConnected) {
        try {
          await fetchWithTimeout(`${API_URL}?action=update_user`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ...user, adminId })
          });
        } catch(e) { }
      }
      // Local Update
      this.users = this.users.map(u => u.id === user.id ? user : u);
      this.saveToStorage();
  }

  async updateProfile(userId: string, avatarUrl: string): Promise<{success: boolean, error?: string}> {
      if (this.isConnected) {
        try {
          const res = await fetchWithTimeout(`${API_URL}?action=update_profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, avatar: avatarUrl })
          });
          if (res.ok) {
              // Update local state too
              const u = this.users.find(u => u.id === userId);
              if (u) {
                  u.avatar = avatarUrl;
                  this.saveToStorage();
              }
              return await res.json();
          }
        } catch (e) { }
      }
      return { success: false };
  }

  deleteUser(userId: string) {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveToStorage();
  }

  acknowledgeMemo(memoId: string, userId: string) {
     const memo = this.memos.find(m => m.id === memoId);
     if (memo && !memo.acknowledgedBy.includes(userId)) {
         memo.acknowledgedBy.push(userId);
     }
  }

  async uploadFile(file: File): Promise<Attachment> {
    if (this.isConnected) {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetchWithTimeout(`${API_URL}?action=upload`, {
                method: 'POST',
                body: formData 
            }, 60000); 

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.attachment) {
                    return data.attachment;
                }
            }
            throw new Error("Upload failed");
        } catch (e) {
            throw e;
        }
    }
    throw new Error("Offline: Cannot upload files.");
  }
}

export const db = new DatabaseService();
export const MOCK_USERS = FALLBACK_USERS;