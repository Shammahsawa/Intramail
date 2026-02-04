import React, { useEffect, useState } from 'react';
import { User, UserRole, Message, Memo, DashboardStats } from '../types';
import { db } from '../services/mockDatabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Shield, Users, Server, HardDrive, Mail, FileText, Activity, AlertTriangle, PieChart as PieIcon } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  onNavigate: (view: any) => void;
  inbox: Message[];
  memos: Memo[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate, inbox, memos }) => {
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const unreadCount = inbox.filter(m => !m.isRead).length;
  const recentMemos = memos.slice(0, 3);
  const urgentMessages = inbox.filter(m => m.priority === 'Urgent' && !m.isRead).length;

  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
        const data = await db.fetchStats();
        setStats(data);
    };
    if (isAdmin) loadStats();
  }, [isAdmin]);

  // Mock data for line charts (activity)
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome back, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-slate-500">
            {isAdmin 
              ? 'System Overview & Administrative Controls' 
              : 'Here is what is happening in the hospital today.'}
          </p>
        </div>
        <div className="text-right">
           <div className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
           <div className="text-xs text-slate-500">FMC Hong Intranet</div>
        </div>
      </div>

      {/* Admin Specific Dashboard */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="text-blue-500" />} title="Total Users" value={stats?.activeUsers.toString() || '...'} sub="Registered Staff" />
            <StatCard icon={<Mail className="text-emerald-500" />} title="Messages Sent" value={stats?.totalMessages.toString() || '...'} sub="All time" />
            <StatCard icon={<FileText className="text-purple-500" />} title="Circulars" value={stats?.totalMemos.toString() || '...'} sub="Official Memos" />
            <StatCard icon={<Shield className="text-amber-500" />} title="Health" value={stats?.systemHealth || 'Online'} sub="System Status" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4">Traffic Overview (Last 7 Days)</h3>
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
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <PieIcon size={16} /> Staff Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.rolesDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.rolesDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                   {(stats?.rolesDistribution || []).slice(0, 4).map((entry, index) => (
                       <div key={index} className="flex items-center gap-1 text-xs text-slate-500">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                           {entry.name}
                       </div>
                   ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Common Dashboard (Staff View) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Unread Messages */}
           <div 
             onClick={() => onNavigate('inbox')}
             className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Mail size={24} />
                 </div>
                 {unreadCount > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount} New</span>}
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{unreadCount}</h3>
              <p className="text-sm text-slate-500 font-medium">Unread Messages</p>
              {urgentMessages > 0 && (
                <div className="mt-4 flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 p-2 rounded">
                  <AlertTriangle size={14} />
                  {urgentMessages} Urgent Item(s)
                </div>
              )}
           </div>

           {/* Circulars */}
           <div 
             onClick={() => onNavigate('memo-board')}
             className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <FileText size={24} />
                 </div>
                 <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">{recentMemos.length} Recent</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1">Circulars</h3>
              <p className="text-sm text-slate-500 font-medium">Hospital Announcements</p>
              <div className="mt-4 text-xs text-slate-400">
                Latest: {recentMemos[0]?.subject.substring(0, 25)}...
              </div>
           </div>

           {/* System Status */}
           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <Activity size={24} />
                 </div>
                 <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online
                 </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">System Healthy</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">Intramail v1.0 connected via LAN</p>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs text-slate-500">
                   <span>Server Load</span>
                   <span>12%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5">
                   <div className="bg-green-500 h-1.5 rounded-full w-[12%]"></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Recent Activity / Memos List for both */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <FileText size={16} /> Recent Circulars
             </h3>
             <button onClick={() => onNavigate('memo-board')} className="text-xs text-emerald-600 font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMemos.map(memo => (
              <div key={memo.id} className="p-4 hover:bg-slate-50 transition-colors">
                 <div className="flex justify-between mb-1">
                   <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{memo.type.toUpperCase()}</span>
                   <span className="text-xs text-slate-400">{new Date(memo.createdAt).toLocaleDateString()}</span>
                 </div>
                 <h4 className="font-medium text-slate-800 text-sm">{memo.subject}</h4>
                 <p className="text-xs text-slate-500 mt-1 line-clamp-1">{memo.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <Activity size={16} /> Quick Actions
             </h3>
          </div>
          <div className="p-4 space-y-3">
             <button 
               onClick={() => onNavigate('compose')}
               className="w-full py-2.5 px-4 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
             >
               <Mail size={16} /> Compose Message
             </button>
             <button 
               onClick={() => onNavigate('inbox')}
               className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
             >
               View Inbox
             </button>
             {isAdmin && (
               <button 
                 onClick={() => onNavigate('admin')}
                 className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
               >
                 Audit Logs
               </button>
             )}
          </div>
        </div>
      </div>
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

export default Dashboard;