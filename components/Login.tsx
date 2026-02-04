import React, { useState } from 'react';
import { db } from '../services/mockDatabase'; // Now acting as API Service
import { User } from '../types';
import { Lock, User as UserIcon, AlertCircle, Activity } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User, isDefaultPassword?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{username?: string, password?: string}>({});

  const validate = () => {
    const errors: {username?: string, password?: string} = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!password.trim()) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    setLoading(true);

    try {
      // Connect to DB if not already
      // This is now optimized to timeout quickly if offline (500ms)
      await db.init();
      
      const user = await db.login(username, password);

      if (user) {
        const isDefault = password === '12345678';
        onLogin(user, isDefault);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('System Error: Could not verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-800 z-0"></div>
      <div className="absolute top-1/2 left-0 w-full h-full bg-slate-100 z-0"></div>
      
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md z-10 overflow-hidden">
        <div className="p-8 pb-6 text-center bg-white">
          {/* Offline-Ready Logo Component */}
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex flex-col items-center justify-center shadow-xl border-4 border-white text-white">
                  <Activity size={48} strokeWidth={2.5} />
                  <span className="text-3xl font-black tracking-tighter mt-0">FMC</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">Hong</span>
              </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FMC Hong Intramail</h1>
          <p className="text-slate-500 mt-1 text-sm">Secure Internal Communication System</p>
        </div>

        <div className="p-8 pt-0">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors(prev => ({...prev, username: undefined}));
                  }}
                  className={`w-full border rounded-md p-2.5 text-sm pl-10 focus:ring-2 outline-none ${fieldErrors.username ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
                  placeholder="Enter username"
                />
                <UserIcon className={`absolute left-3 top-2.5 ${fieldErrors.username ? 'text-red-400' : 'text-slate-400'}`} size={16} />
              </div>
              {fieldErrors.username && <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: undefined}));
                  }}
                  className={`w-full border rounded-md p-2.5 text-sm pl-10 focus:ring-2 outline-none ${fieldErrors.password ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
                  placeholder="Enter password"
                />
                <Lock className={`absolute left-3 top-2.5 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} size={16} />
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-md transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>
          
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-center text-xs text-slate-400 space-y-2">
              <p>Authorized Personnel Only.</p>
              <p>Federal Medical Centre, Hong. ICT Unit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;