import React, { useState } from 'react';
import { User, UserRole, Department } from '../types';
import { db } from '../services/mockDatabase';
import { Plus, Trash2, Search, UserPlus, ShieldCheck, Key, X, Save, Pencil, AlertCircle } from 'lucide-react';

interface UserManagementProps {
  currentUser?: User; // Passed for logging purposes
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    role: UserRole.DOCTOR,
    department: Department.CLINICAL
  });

  // New User Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: UserRole.DOCTOR,
    department: Department.CLINICAL,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error
    if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const generateEmail = (username: string) => {
    return `${username.toLowerCase().replace(/\s+/g, '.')}@fmchong.local`;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9.]/g, '');
    setFormData(prev => ({
      ...prev,
      username: val,
      email: generateEmail(val)
    }));
    if (formErrors.username) setFormErrors(prev => ({...prev, username: ''}));
  };

  const validateNewUser = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full Name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (formData.username.length < 3) errors.username = "Username too short (min 3 chars)";
    
    // Simple email regex check (internal format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) errors.email = "Invalid email format";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewUser()) return;

    const newUser: User = {
      id: `u${Date.now()}`,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
    };

    db.addUser(newUser);
    setUsers([...db.getUsers()]); // Refresh list
    setIsAdding(false);
    // Reset form
    setFormData({
      name: '',
      username: '',
      email: '',
      role: UserRole.DOCTOR,
      department: Department.CLINICAL,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      db.deleteUser(id);
      setUsers([...db.getUsers()]);
    }
  };

  // Reset Password Handlers
  const openResetModal = (user: User) => {
    setUserToReset(user);
    setNewResetPassword('');
    setResetMsg('');
    setResetModalOpen(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset) return;
    if (newResetPassword.length < 8) {
      setResetMsg('Password must be at least 8 characters.');
      return;
    }
    
    setResetMsg('Updating...');
    // Pass current user ID (Admin) for logging
    const adminId = currentUser ? currentUser.id : 'unknown_admin';
    const result = await db.adminResetPassword(userToReset.id, newResetPassword, adminId);
    
    if (result.success) {
      alert(`Password for ${userToReset.name} has been reset successfully.`);
      setResetModalOpen(false);
      setUserToReset(null);
    } else {
      setResetMsg(result.error || 'Failed to update password.');
    }
  };

  // Edit User Handlers
  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      role: user.role,
      department: user.department
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (window.confirm(`Are you sure you want to update access rights for ${userToEdit.name}?\n\nNew Role: ${editFormData.role}\nNew Dept: ${editFormData.department}`)) {
        const updatedUser = { 
          ...userToEdit, 
          role: editFormData.role, 
          department: editFormData.department 
        };
        // Pass adminId in the update logic handled by service if needed, 
        // currently updateUser service logic is simple but can be enhanced similarly.
        const adminId = currentUser ? currentUser.id : 'unknown_admin';
        await db.updateUser(updatedUser, adminId);
        
        setUsers([...db.getUsers()]); // Refresh list
        setEditModalOpen(false);
        setUserToEdit(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {/* Reset Password Modal */}
      {resetModalOpen && userToReset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Key size={18} className="text-emerald-600" />
                Reset Password
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
               <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded border border-slate-100">
                 <img src={userToReset.avatar} className="w-10 h-10 rounded-full" alt="" />
                 <div>
                   <div className="font-bold text-slate-800 text-sm">{userToReset.name}</div>
                   <div className="text-xs text-slate-500">{userToReset.role}</div>
                 </div>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                  <input
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="Enter new password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Must be at least 8 characters.</p>
               </div>
               
               {resetMsg && (
                 <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded">{resetMsg}</div>
               )}

               <div className="flex justify-end pt-2">
                 <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                   <Save size={16} /> Update Password
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && userToEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Pencil size={18} className="text-blue-600" />
                Edit Staff Access
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
               {/* User Info Readonly */}
               <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded border border-slate-100">
                 <img src={userToEdit.avatar} className="w-10 h-10 rounded-full" alt="" />
                 <div>
                   <div className="font-bold text-slate-800 text-sm">{userToEdit.name}</div>
                   <div className="text-xs text-slate-500">{userToEdit.email}</div>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
                 <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value as UserRole})}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                 >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                 </select>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
                 <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value as Department})}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                 >
                    {Object.values(Department).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                 </select>
               </div>

               <div className="flex justify-end pt-4">
                 <button type="button" onClick={() => setEditModalOpen(false)} className="mr-2 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-md text-sm">Cancel</button>
                 <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                   <Save size={16} /> Save Changes
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-700">Staff Directory & Access Control</h3>
          <p className="text-sm text-slate-500">Manage user accounts, roles, and system privileges.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center ${
            isAdding ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isAdding ? 'Cancel' : <><UserPlus size={16} /> Add New Staff</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-100 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 pb-2 border-b border-slate-100">
             <h4 className="font-bold text-slate-800">New Account Details</h4>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                className={`w-full border rounded-md p-2 text-sm focus:ring-2 outline-none ${formErrors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
                placeholder="e.g. Dr. Amina Yusuf"
                value={formData.name}
                onChange={handleInputChange}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
              <input
                type="text"
                name="username"
                className={`w-full border rounded-md p-2 text-sm focus:ring-2 outline-none ${formErrors.username ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
                placeholder="e.g. ayusuf"
                value={formData.username}
                onChange={handleUsernameChange}
              />
              {formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
              <select
                name="role"
                required
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.role}
                onChange={handleInputChange}
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
              <select
                name="department"
                required
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.department}
                onChange={handleInputChange}
              >
                {Object.values(Department).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-slate-600 gap-2">
                <span><strong>Email:</strong> {formData.email || '...'}</span>
                <span><strong>Default Password:</strong> <code>12345678</code></span>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button 
                type="submit" 
                className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 shadow-sm"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, role or username..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
             Total Users: {users.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Staff Member</th>
                <th className="px-6 py-3">Role & Dept</th>
                <th className="px-6 py-3 hidden md:table-cell">Username</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="font-medium text-slate-700 flex items-center gap-1">
                         {user.role === UserRole.SUPER_ADMIN && <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />}
                         {user.role}
                       </span>
                       <span className="text-xs text-slate-500">{user.department}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/50 hidden md:table-cell">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {/* Edit Button */}
                       <button
                         onClick={() => openEditModal(user)}
                         className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                         title="Edit User Role/Dept"
                       >
                         <Pencil size={14} /> <span className="hidden sm:inline">Edit</span>
                       </button>

                       {/* Reset Password Button */}
                       <button 
                          onClick={() => openResetModal(user)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                          title="Reset User Password"
                        >
                          <Key size={14} /> <span className="hidden sm:inline">Reset Pass</span>
                        </button>
                        
                        {user.role !== UserRole.SUPER_ADMIN && (
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;