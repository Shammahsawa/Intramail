import React, { useState } from 'react';
import { db } from '../services/mockDatabase';
import { User } from '../types';
import UserManagement from './UserManagement';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, Users, Server, HardDrive, LayoutDashboard, UserCog } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const logs = db.getLogs();
  
  // Mock data for charts
  const activityData = [
    { name: 'Mon', messages: 120, memos: 5 },
    { name: 'Tue', messages: 145, memos: 2 },
    { name: 'Wed', messages: 100, memos: 8 },
    { name: 'Thu', messages: 180, memos: 4 },
    { name: 'Fri', messages: 210, memos: 10 },
    { name: 'Sat', messages: 45, memos: 1 },
    { name: 'Sun', messages: 30, memos: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Administration</h2>
          <p className="text-slate-500">Monitor system health and manage staff access.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'overview' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard size={16} /> Overview & Audit
          </button>
          <button 
             onClick={() => setActiveTab('users')}
             className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'users' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCog size={16} /> User Management
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <UserManagement currentUser={currentUser} />
      ) : (
        /* Overview Tab Content */
        <div className="space-y-6 animate-in fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="text-blue-500" />} title="Active Users" value={db.getUsers().length.toString()} sub="Across 8 Depts" />
            <StatCard icon={<Server className="text-emerald-500" />} title="System Status" value="Healthy" sub="Uptime: 99.9%" />
            <StatCard icon={<HardDrive className="text-purple-500" />} title="Storage" value="45%" sub="1.2TB / 3TB Used" />
            <StatCard icon={<Shield className="text-amber-500" />} title="Security Alerts" value="0" sub="Last 24 hours" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4">Message Volume (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4">System Load</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Recent Audit Logs</h3>
              <button className="text-xs text-blue-600 hover:underline">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{log.userId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                          log.action.includes('DENIED') || log.action.includes('DELETE') ? 'bg-red-50 text-red-600 border-red-200' :
                          log.action.includes('LOGIN') ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-slate-600">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, sub }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 uppercase font-bold">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  </div>
);

export default AdminPanel;