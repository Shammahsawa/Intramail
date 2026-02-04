import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import MessageList from './components/MessageList';
import MessageDetail from './components/MessageDetail';
import ComposeModal from './components/ComposeModal';
import MemoBoard from './components/MemoBoard';
import AdminPanel from './components/AdminPanel';
import SystemDocs from './components/SystemDocs';
import Dashboard from './components/Dashboard';
import StaffDirectory from './components/StaffDirectory';
import UserSettings from './components/UserSettings';
import { db } from './services/mockDatabase';
import { User, Message, ViewState, Memo, AppNotification, Priority } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState<string | undefined>(undefined);
  const [composeType, setComposeType] = useState<'email' | 'memo'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  // Alert & Notification State
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Data State
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [archived, setArchived] = useState<Message[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);

  // Refresh data helper
  const refreshData = async () => {
    if (user) {
      setIsLoading(true);
      const inboxData = await db.fetchInbox(user.id);
      const sentData = await db.fetchSent(user.id);
      const memoData = await db.fetchMemos();
      
      setInbox(inboxData);
      setSent(sentData);
      setMemos(memoData);

      // Only fetch archive if we are in archive view to save bandwidth
      if (view === 'archive') {
          const archivedData = await db.fetchArchived(user.id);
          setArchived(archivedData);
      }
      
      // Check Connection Status
      setIsOnline(db.getConnectionStatus());
      
      setIsLoading(false);
    }
  };

  // Generate Notifications based on data
  useEffect(() => {
    if (!user) return;
    
    const newNotifs: AppNotification[] = [];
    
    // 1. Unread Urgent/Confidential Messages
    const urgentUnread = inbox.filter(m => (m.priority === Priority.URGENT || m.priority === Priority.CONFIDENTIAL) && !m.isRead);
    urgentUnread.forEach(m => {
        newNotifs.push({
            id: `notif_${m.id}`,
            title: m.priority === Priority.CONFIDENTIAL ? 'Confidential Message' : 'Urgent Message',
            message: m.subject,
            type: 'message',
            referenceId: m.id,
            timestamp: m.createdAt,
            isRead: false
        });
    });

    // 2. Pending Memos
    const pendingMemos = memos.filter(m => m.requiresAcknowledgement && !m.acknowledgedBy.includes(user.id));
    pendingMemos.forEach(m => {
        newNotifs.push({
            id: `notif_${m.id}`,
            title: 'Action Required',
            message: `Please acknowledge circular: ${m.subject}`,
            type: 'memo',
            referenceId: m.id,
            timestamp: m.createdAt,
            isRead: false
        });
    });

    // Sort by newest
    setNotifications(newNotifs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

  }, [inbox, memos, user]);

  useEffect(() => {
    if (user) {
        db.init().then(() => refreshData());
    }
    const interval = setInterval(() => {
        if(user) refreshData();
    }, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [user, view]); 

  const handleLogin = (loggedInUser: User, isDefaultPassword?: boolean) => {
    setUser(loggedInUser);
    setView('dashboard');
    if (isDefaultPassword) {
      setShowPasswordAlert(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setSelectedMessage(null);
    setInbox([]);
    setSent([]);
    setMemos([]);
    setArchived([]);
    setShowPasswordAlert(false);
  };

  const handleNavigate = (newView: ViewState) => {
    setView(newView);
    if (newView !== 'view-message') {
      setSelectedMessage(null);
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    setView('view-message');
    
    // Mark as read immediately if it's an inbox message
    if (user && msg.recipientIds.includes(user.id) && !msg.isRead) {
        db.markAsRead(msg.id, user.id);
        // Optimistically update local state
        setInbox(prev => prev.map(m => m.id === msg.id ? {...m, isRead: true} : m));
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
      if (notif.type === 'message') {
          const msg = inbox.find(m => m.id === notif.referenceId);
          if (msg) handleSelectMessage(msg);
      } else if (notif.type === 'memo') {
          setView('memo-board');
      }
  };

  const handleOpenCompose = (recipientId?: string) => {
    setComposeRecipient(recipientId);
    setComposeType('email');
    setIsComposeOpen(true);
  };

  const handleOpenMemoCompose = () => {
    setComposeRecipient('ALL_STAFF');
    setComposeType('memo');
    setIsComposeOpen(true);
  };

  if (!user || view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentUser={user} 
      currentView={view} 
      onNavigate={handleNavigate} 
      onLogout={handleLogout}
      showPasswordAlert={showPasswordAlert}
      onDismissAlert={() => setShowPasswordAlert(false)}
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      isOnline={isOnline}
    >
      {view === 'dashboard' && (
        <Dashboard 
          currentUser={user} 
          onNavigate={handleNavigate} 
          inbox={inbox}
          memos={memos}
        />
      )}

      {view === 'directory' && (
        <StaffDirectory 
          currentUser={user} 
          onMessageUser={handleOpenCompose} 
        />
      )}

      {view === 'inbox' && (
        <div className="h-full">
            {isLoading && inbox.length === 0 ? (
                <div className="text-center p-10 text-slate-400">Loading messages...</div>
            ) : (
                <MessageList 
                    messages={inbox} 
                    currentUserId={user.id} 
                    onSelectMessage={handleSelectMessage} 
                    type="inbox"
                    onRefresh={refreshData} 
                />
            )}
        </div>
      )}
      
      {view === 'sent' && (
         <MessageList 
            messages={sent} 
            currentUserId={user.id} 
            onSelectMessage={handleSelectMessage} 
            type="sent" 
            onRefresh={refreshData}
         />
      )}

      {view === 'archive' && (
         <MessageList 
            messages={archived} 
            currentUserId={user.id} 
            onSelectMessage={handleSelectMessage} 
            type="archive" 
            onRefresh={refreshData}
         />
      )}

      {view === 'view-message' && selectedMessage && (
        <MessageDetail 
          message={selectedMessage} 
          onBack={() => setView('inbox')} 
        />
      )}

      {view === 'memo-board' && (
        <MemoBoard 
          currentUser={user} 
          memos={memos}
          onCompose={handleOpenMemoCompose} 
        />
      )}

      {view === 'admin' && (
        <AdminPanel currentUser={user} />
      )}

      {view === 'system-docs' && (
        <SystemDocs />
      )}

      {view === 'settings' && (
        <UserSettings 
            currentUser={user} 
            onUpdateUser={(updatedUser) => setUser(updatedUser)} 
        />
      )}

      {view === 'compose' && (
        <div className="h-full flex items-center justify-center text-slate-400">
           <p>Opening composer...</p>
           {setTimeout(() => {
             handleOpenCompose();
             setView('inbox'); 
           }, 10)} 
        </div>
      )}

      {isComposeOpen && (
        <ComposeModal 
          currentUser={user} 
          initialRecipientId={composeRecipient}
          initialType={composeType}
          onClose={() => {
            setIsComposeOpen(false);
            setComposeRecipient(undefined);
            setComposeType('email');
          }} 
          onSent={refreshData} 
        />
      )}
    </Layout>
  );
}

export default App;