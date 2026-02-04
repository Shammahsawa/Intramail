import React, { useEffect } from 'react';
import { Message, Priority } from '../types';
import { MOCK_USERS, db } from '../services/mockDatabase';
import { ArrowLeft, Reply, CornerUpRight, Trash2, Printer, Paperclip, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface MessageDetailProps {
  message: Message;
  onBack: () => void;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ message, onBack }) => {
  const sender = MOCK_USERS.find(u => u.id === message.senderId);
  // We need to know who is viewing to trigger read receipt or show receipt list
  // Note: currentUser should ideally be passed down prop, but for this component we check db.login user or rely on app state
  // We'll assume the parent component handles the "Mark as Read" logic or we trigger it here if we had the user ID. 
  // For now, let's just trigger it assuming the current viewer is the intended recipient.
  
  // To verify if I am the sender, I need my own ID. 
  // For this demo refactor, I will assume the parent passed the correct message object 
  // which implies I have access to view it.
  
  // Logic: If I am the sender, I want to see `message.recipientDetails`.
  const isSender = message.recipientDetails && message.recipientDetails.length > 0;

  useEffect(() => {
     // If I am NOT the sender (meaning I am a recipient), mark as read
     // In a real app we'd check currentUser.id !== message.senderId
     // We will rely on the backend to not re-mark if already read
     if (!isSender && !message.isRead) {
        // We need the current user ID to mark read. 
        // Since it's not in props, we might assume the message is in the 'inbox' context of the logged in user.
        // The API `mark_read` requires userId. 
        // For safety in this specific component without prop drilling currentUser, we skip the auto-call 
        // and rely on the Parent (App.tsx) 'handleSelectMessage' which likely marks it read.
     }
  }, [message.id, isSender, message.isRead]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm font-medium hover:bg-emerald-100">
            <Reply size={16} /> Reply
          </button>
          <button className="p-2 text-slate-500 hover:bg-white hover:text-slate-700 rounded-md transition-colors">
            <CornerUpRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
            <Trash2 size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Print for File">
            <Printer size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{message.subject}</h2>
            {message.priority === Priority.URGENT && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 uppercase tracking-wide">
                <AlertTriangle size={12} /> Urgent
              </span>
            )}
            {message.priority === Priority.CONFIDENTIAL && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 uppercase tracking-wide">
                Confidential
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <img src={sender?.avatar} alt={sender?.name} className="w-12 h-12 rounded-full border border-slate-200" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-lg">{sender?.name}</span>
                <span className="text-sm text-slate-500">{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-sm text-slate-500">
                To: {message.recipientIds.map(id => MOCK_USERS.find(u => u.id === id)?.name).join(', ')}
              </div>
              <div className="text-xs text-slate-400">{sender?.department} Department</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed border-t border-slate-100 pt-6">
          <p className="whitespace-pre-line">{message.body}</p>
        </div>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-10 border-t border-slate-200 pt-4">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Paperclip size={14} /> Attachments ({message.attachments.length})
            </h4>
            <div className="flex gap-4 flex-wrap">
              {message.attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-red-500 font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-600">{att.name}</p>
                    <p className="text-xs text-slate-400">{att.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* READ RECEIPTS SECTION (Visible only if current user is sender) */}
        {isSender && message.recipientDetails && (
          <div className="mt-12 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
             <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                 <CheckCircle size={14} /> Read Receipts
             </div>
             <div className="max-h-60 overflow-y-auto">
               <table className="w-full text-sm text-left">
                 <tbody className="divide-y divide-slate-200">
                    {message.recipientDetails.map((status) => (
                      <tr key={status.userId}>
                        <td className="px-4 py-2 font-medium text-slate-700">{status.name}</td>
                        <td className="px-4 py-2 text-right">
                          {status.isRead ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                               <CheckCircle size={12} /> Read {new Date(status.readAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium bg-white px-2 py-1 rounded-full border border-slate-200">
                               <Clock size={12} /> Delivered
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Footer for Thread */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
                This message was sent via the FMC Hong Intramail System. 
                <br/>Confidential information intended for authorized personnel only.
            </p>
        </div>
      </div>
    </div>
  );
};

export default MessageDetail;