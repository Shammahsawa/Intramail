import React, { useState } from 'react';
import { Memo, User, Priority, UserRole } from '../types';
import { MOCK_USERS, db } from '../services/mockDatabase';
import { FileText, CheckCircle, Download, UserCheck, Plus, AlertCircle, X, Search } from 'lucide-react';

interface MemoBoardProps {
  currentUser: User;
  memos: Memo[];
  onCompose?: () => void;
}

const MemoBoard: React.FC<MemoBoardProps> = ({ currentUser, memos, onCompose }) => {
  // Modal state for detailed acknowledgement view
  const [viewAckDetails, setViewAckDetails] = useState<string | null>(null);

  const handleAcknowledge = (memoId: string) => {
    db.acknowledgeMemo(memoId, currentUser.id);
  };

  const getUserName = (id: string) => {
    return db.getUsers().find(u => u.id === id)?.name || 'Unknown';
  };

  const getSender = (id: string) => {
     return db.getUsers().find(u => u.id === id);
  }

  // Define who can post memos
  const canPostMemos = [
    UserRole.SUPER_ADMIN,
    UserRole.MANAGEMENT,
    UserRole.ADMIN_STAFF
  ].includes(currentUser.role);

  // Logic to calculate acknowledgement stats
  const getAckStats = (memo: Memo) => {
    const allStaff = db.getUsers();
    const ackCount = memo.acknowledgedBy.length;
    const totalCount = allStaff.length; // Assuming circulars go to everyone
    return {
       ackCount,
       totalCount,
       percent: Math.round((ackCount / totalCount) * 100),
       pending: totalCount - ackCount
    };
  };

  const renderAckModal = () => {
    if (!viewAckDetails) return null;
    const memo = memos.find(m => m.id === viewAckDetails);
    if (!memo) return null;

    const allUsers = db.getUsers();
    const ackUsers = allUsers.filter(u => memo.acknowledgedBy.includes(u.id));
    const pendingUsers = allUsers.filter(u => !memo.acknowledgedBy.includes(u.id));

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
             <h3 className="font-bold text-slate-800">Acknowledgement Status</h3>
             <button onClick={() => setViewAckDetails(null)} className="text-slate-400 hover:text-slate-600">
               <X size={20} />
             </button>
          </div>
          <div className="p-4 bg-slate-50 border-b border-slate-200">
             <h4 className="font-semibold text-slate-700 truncate">{memo.subject}</h4>
             <div className="flex gap-4 mt-2 text-xs">
                <span className="text-emerald-600 font-bold">{ackUsers.length} Acknowledged</span>
                <span className="text-amber-600 font-bold">{pendingUsers.length} Pending</span>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
             <div className="grid grid-cols-2 h-full divide-x divide-slate-100">
                {/* Acknowledged List */}
                <div>
                   <div className="sticky top-0 bg-slate-50 p-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                     Acknowledged
                   </div>
                   <div className="divide-y divide-slate-50">
                     {ackUsers.length === 0 && <p className="p-3 text-xs text-slate-400 italic">No acknowledgements yet.</p>}
                     {ackUsers.map(u => (
                       <div key={u.id} className="p-3 text-sm flex items-center gap-2">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span className="text-slate-700">{u.name}</span>
                       </div>
                     ))}
                   </div>
                </div>
                {/* Pending List */}
                <div>
                   <div className="sticky top-0 bg-slate-50 p-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                     Pending
                   </div>
                   <div className="divide-y divide-slate-50">
                     {pendingUsers.length === 0 && <p className="p-3 text-xs text-slate-400 italic">All staff acknowledged.</p>}
                     {pendingUsers.map(u => (
                       <div key={u.id} className="p-3 text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-200 block"></span>
                          <span className="text-slate-500">{u.name}</span>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderAckModal()}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Official Circulars</h2>
          <p className="text-slate-500 text-sm">Official announcements from Management and HODs.</p>
        </div>
        
        <div className="flex gap-3">
          {canPostMemos && onCompose && (
            <button 
              onClick={onCompose}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Post New Circular
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {memos.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-lg border border-slate-200 border-dashed">
             <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
               <FileText size={24} />
             </div>
             <p className="text-slate-500 font-medium">No active circulars.</p>
           </div>
        ) : (
          memos.map(memo => {
            const isAck = memo.acknowledgedBy.includes(currentUser.id);
            const sender = getSender(memo.senderId);
            const stats = getAckStats(memo);

            return (
              <div key={memo.id} className={`bg-white rounded-lg shadow-md border-l-4 overflow-hidden relative transition-all ${!isAck && memo.requiresAcknowledgement ? 'border-amber-500 ring-1 ring-amber-100' : 'border-emerald-500'}`}>
                {/* Pending Indicator Banner */}
                {!isAck && memo.requiresAcknowledgement && (
                  <div className="bg-amber-50 text-amber-800 text-xs font-bold px-4 py-1.5 flex items-center gap-2 border-b border-amber-100">
                    <AlertCircle size={14} /> ACTION REQUIRED: Please acknowledge receipt of this circular.
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded text-emerald-700">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{memo.subject}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">
                          From: <span className="font-semibold text-slate-700">{sender?.name || 'Admin'}</span> • {sender?.department || 'Management'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-slate-400">{new Date(memo.createdAt).toLocaleDateString()}</span>
                      {memo.priority === Priority.URGENT && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase">Urgent</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-slate-700 text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {memo.body}
                  </div>

                  {memo.attachments && memo.attachments.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {memo.attachments.map(att => (
                        <button key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                          <Download size={14} /> {att.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
                    <div className="w-full sm:w-auto flex items-center gap-3">
                        <button 
                          onClick={() => setViewAckDetails(memo.id)}
                          className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                        >
                          <UserCheck size={14} />
                          <span>Acknowledged by {stats.ackCount} / {stats.totalCount} staff</span>
                        </button>
                        
                        {/* Simple Progress Bar */}
                        <div className="hidden sm:block w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.percent}%` }}></div>
                        </div>
                    </div>

                    {memo.requiresAcknowledgement && (
                      <button
                        onClick={() => handleAcknowledge(memo.id)}
                        disabled={isAck}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          isAck 
                            ? 'bg-green-50 text-green-700 cursor-default border border-green-200' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        }`}
                      >
                        {isAck ? (
                          <>
                            <CheckCircle size={16} /> Acknowledged
                          </>
                        ) : (
                          'Acknowledge Receipt'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MemoBoard;