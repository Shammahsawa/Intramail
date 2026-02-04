import React, { useState, useRef, useEffect } from 'react';
import { User, ViewState, UserRole, AppNotification } from '../types';
import { 
  Inbox, Send, FileText, ShieldAlert, LogOut, 
  Menu, Bell, User as UserIcon, PlusCircle, Database, LayoutGrid, Users, Settings, X, Archive, AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  currentUser: User | null;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
  showPasswordAlert?: boolean;
  onDismissAlert?: () => void;
  notifications?: AppNotification[];
  onNotificationClick?: (notification: AppNotification) => void;
  isOnline?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentUser, 
  currentView, 
  onNavigate, 
  onLogout, 
  children,
  showPasswordAlert,
  onDismissAlert,
  notifications = [],
  onNotificationClick,
  isOnline = false
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setIsNotifOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return <>{children}</>;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const handleNavClick = (view: ViewState) => {
    onNavigate(view);
    setIsSidebarOpen(false); 
  };

  const handleNotifClick = (n: AppNotification) => {
      if (onNotificationClick) onNotificationClick(n);
      setIsNotifOpen(false);
  };

  // RBAC LOGIC
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isManagement = currentUser.role === UserRole.MANAGEMENT || currentUser.role === UserRole.SUPER_ADMIN;
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 text-emerald-400 font-bold text-xl">
              {/* Sidebar Logo */}
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center border-2 border-white shadow-sm text-white shrink-0">
                  <span className="font-bold text-[10px] leading-tight text-center">FMC<br/>Hong</span>
              </div>
              <span>FMC Hong</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider ml-1">Intramail System v1.0</div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase">Communication</div>
          <nav className="space-y-1 px-2">
            <button
              onClick={() => handleNavClick('compose')}
              className="w-full flex items-center gap-3 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md mb-4 transition-colors shadow-sm"
            >
              <PlusCircle size={18} />
              <span className="font-medium">New Message</span>
            </button>
            
            <NavItem 
              icon={<LayoutGrid size={18} />} 
              label="Dashboard" 
              active={currentView === 'dashboard'} 
              onClick={() => handleNavClick('dashboard')} 
            />
            <NavItem 
              icon={<Users size={18} />} 
              label="Staff Directory" 
              active={currentView === 'directory'} 
              onClick={() => handleNavClick('directory')} 
            />
            <NavItem 
              icon={<Inbox size={18} />} 
              label="Inbox" 
              active={currentView === 'inbox'} 
              onClick={() => handleNavClick('inbox')} 
            />
            <NavItem 
              icon={<Send size={18} />} 
              label="Sent" 
              active={currentView === 'sent'} 
              onClick={() => handleNavClick('sent')} 
            />
             <NavItem 
              icon={<Archive size={18} />} 
              label="Archived" 
              active={currentView === 'archive'} 
              onClick={() => handleNavClick('archive')} 
            />
            <NavItem 
              icon={<FileText size={18} />} 
              label="Circulars & Memos" 
              active={currentView === 'memo-board'} 
              onClick={() => handleNavClick('memo-board')} 
              badge={notifications.filter(n => n.type === 'memo').length || undefined}
              urgent={notifications.some(n => n.type === 'memo')}
            />
          </nav>

          {isManagement && (
            <>
              <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase">Management</div>
              <nav className="space-y-1 px-2">
                 {isAdmin && (
                   <>
                    <NavItem 
                      icon={<ShieldAlert size={18} />} 
                      label="Audit Panel" 
                      active={currentView === 'admin'} 
                      onClick={() => handleNavClick('admin')} 
                    />
                    <NavItem 
                      icon={<Database size={18} />} 
                      label="System Architecture" 
                      active={currentView === 'system-docs'} 
                      onClick={() => handleNavClick('system-docs')} 
                    />
                   </>
                 )}
              </nav>
            </>
          )}

          <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase">Account</div>
          <nav className="space-y-1 px-2">
             <NavItem 
                  icon={<Settings size={18} />} 
                  label="Profile & Settings" 
                  active={currentView === 'settings'} 
                  onClick={() => handleNavClick('settings')} 
                />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full border border-slate-500 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-white" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={toggleSidebar} className="lg:hidden p-1 hover:bg-slate-100 rounded">
              <Menu size={24} />
            </button>

            <h1 className="text-lg font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'directory' && 'Staff Directory'}
              {currentView === 'inbox' && 'Inbox'}
              {currentView === 'sent' && 'Sent Messages'}
              {currentView === 'archive' && 'Archived Messages'}
              {currentView === 'compose' && 'Compose Message'}
              {currentView === 'memo-board' && 'Circulars & Notices'}
              {currentView === 'admin' && 'Administration & Audit'}
              {currentView === 'view-message' && 'Reading Message'}
              {currentView === 'system-docs' && 'System Architecture'}
              {currentView === 'settings' && 'Profile & Settings'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* LAN Status */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isOnline ? 'LAN Connected' : 'Offline Mode'}
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-slate-100 text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 text-sm">Notifications</h4>
                        {notifications.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                <p>No new notifications</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotifClick(n)} className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors relative">
                                    <div className="flex gap-3">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'message' && n.title.includes('Confidential') ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Security Alert Banner */}
        {showPasswordAlert && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Security Alert: Default Password Detected</h4>
                <p className="text-xs text-amber-700 mt-1">
                  You are using the default system password. Please update your password immediately to secure your account.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <button 
                 onClick={() => {
                   onNavigate('settings');
                   if(onDismissAlert) onDismissAlert();
                 }}
                 className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded shadow-sm whitespace-nowrap"
               >
                 Change Password
               </button>
               <button onClick={onDismissAlert} className="text-amber-500 hover:text-amber-700 p-1">
                 <X size={16} />
               </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, badge, urgent }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all ${
      active 
        ? 'bg-slate-700 text-white' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${urgent ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-200'}`}>
        {badge}
      </span>
    )}
  </button>
);

export default Layout;