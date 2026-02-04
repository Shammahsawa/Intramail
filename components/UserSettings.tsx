import React, { useState, useRef } from 'react';
import { User } from '../types';
import { db } from '../services/mockDatabase';
import { Key, Save, AlertCircle, CheckCircle, Camera, Loader } from 'lucide-react';

interface UserSettingsProps {
  currentUser: User;
  onUpdateUser?: (user: User) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setStatus('error');
      setMsg("Password must be at least 8 characters.");
      return;
    }

    setStatus('loading');
    setMsg('');

    try {
      const result = await db.changePassword(currentUser.id, oldPassword, newPassword);
      if (result.success) {
        setStatus('success');
        setMsg('Password updated successfully.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus('error');
        setMsg(result.error || 'Failed to change password.');
      }
    } catch (error) {
      setStatus('error');
      setMsg('System error occurred.');
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        
        // Validation
        if (!file.type.startsWith('image/')) {
            alert("Please select a valid image file.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("Image size should be less than 2MB.");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload file
            const attachment = await db.uploadFile(file);
            
            // 2. Update user profile with new URL
            const result = await db.updateProfile(currentUser.id, attachment.url);
            
            if (result.success) {
                // 3. Update local state
                if (onUpdateUser) {
                    onUpdateUser({ ...currentUser, avatar: attachment.url });
                }
            } else {
                alert("Failed to update profile picture.");
            }
        } catch (error) {
            console.error(error);
            alert("Error uploading image.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Profile Settings</h2>
        <p className="text-sm text-slate-500 mb-6">Manage your account security and appearance.</p>

        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
           <div className="relative group">
               <img 
                 src={currentUser.avatar} 
                 alt="Profile" 
                 className="w-20 h-20 rounded-full border-2 border-slate-200 object-cover" 
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploading}
                 className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white disabled:cursor-not-allowed"
                 title="Change Profile Picture"
               >
                  {isUploading ? <Loader size={20} className="animate-spin" /> : <Camera size={24} />}
               </button>
               <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleAvatarSelect} 
                   className="hidden" 
                   accept="image/png, image/jpeg, image/jpg"
               />
           </div>
           
           <div>
             <h3 className="font-bold text-lg text-slate-800">{currentUser.name}</h3>
             <p className="text-sm text-slate-500">{currentUser.role} • {currentUser.department}</p>
             <p className="text-xs text-slate-400 font-mono mt-1">{currentUser.email}</p>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
            <Key size={18} className="text-emerald-600" />
            <h3>Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {status === 'error' && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} /> {msg}
              </div>
            )}
            {status === 'success' && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200 flex items-center gap-2">
                <CheckCircle size={16} /> {msg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
               <button 
                 type="submit" 
                 disabled={status === 'loading'}
                 className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
               >
                 {status === 'loading' ? 'Updating...' : <><Save size={16} /> Update Password</>}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;