import React, { useState, useEffect } from 'react';
import { User, Department, UserRole } from '../types';
import { db } from '../services/mockDatabase';
import UserManagement from './UserManagement';
import { Search, Mail, Building2, UserCog, Users, Eye, Lock } from 'lucide-react';

interface StaffDirectoryProps {
  currentUser: User;
  onMessageUser: (userId: string) => void;
}

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ currentUser, onMessageUser }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'manage'>('directory');
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  // View-only mode for non-admins as per requirements
  const isViewOnly = !isAdmin;
  
  // Use local state for users
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Initial fetch
    const loadUsers = async () => {
        // Try simple get first, then force refresh to update online statuses
        let currentUsers = db.getUsers();
        if(currentUsers.length === 0) {
            await db.init();
            currentUsers = db.getUsers();
        }
        setUsers(currentUsers);
        
        // Force refresh from server to get latest online status
        const refreshed = await db.refreshUsers();
        setUsers(refreshed);
    };

    loadUsers();

    // Poll for status updates every 30 seconds
    const intervalId = setInterval(async () => {
        const refreshed = await db.refreshUsers();
        setUsers(refreshed);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || u.department === selectedDept;
    return matchesSearch && matchesDept && u.id !== currentUser.id;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Staff Directory</h2>
            {isViewOnly && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 uppercase tracking-wide">
                <Eye size={12} /> View Only
              </span>
            )}
          </div>
          <p className="text-slate-500">Connect with colleagues across all departments.</p>
        </div>
        
        {isAdmin && (
           <div className="bg-white p-1 rounded-lg border border-slate-200 flex self-start md:self-auto">
            <button 
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'directory' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={16} /> Browse
            </button>
            <button 
               onClick={() => setActiveTab('manage')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'manage' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCog size={16} /> Manage Staff
            </button>
          </div>
        )}
      </div>

      {activeTab === 'manage' && isAdmin ? (
        <div className="animate-in fade-in">
          <UserManagement />
        </div>
      ) : (
        <div className="animate-in fade-in space-y-6">
          {isViewOnly && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-md flex items-start gap-3 text-sm">
              <Lock size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">Restricted Access:</span> You are viewing the staff directory in read-only mode. 
                Direct messaging from this list is disabled for your role. Please use the "Compose" button to send messages.
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1 md:flex-none md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search staff by name or role..." 
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-emerald-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:border-emerald-500 bg-white"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {Object.values(Department).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all flex items-start gap-4 group relative">
                 {/* Online Status Dot */}
                 {user.isOnline && (
                   <span className="absolute top-4 right-4 flex h-3 w-3" title="Online now">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                   </span>
                 )}

                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border border-slate-100 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                  <p className="text-xs text-slate-500 truncate mb-1">{user.role}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded font-medium mb-3">
                    <Building2 size={10} />
                    {user.department}
                  </div>
                  
                  {!isViewOnly ? (
                    <button 
                      onClick={() => onMessageUser(user.id)}
                      className="w-full py-1.5 rounded border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail size={12} /> Send Message
                    </button>
                  ) : (
                    <div className="w-full py-1.5 rounded bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium flex items-center justify-center gap-2 cursor-not-allowed select-none">
                      <Lock size={10} /> Message Disabled
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <p>No staff members found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;