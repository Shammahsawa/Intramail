import React, { useState } from 'react';
import { Message, User, Priority } from '../types';
import { MOCK_USERS, db } from '../services/mockDatabase';
import { Paperclip, AlertCircle, Shield, Archive, CheckCheck, Filter, Search } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onSelectMessage: (message: Message) => void;
  type: 'inbox' | 'sent' | 'archive';
  onRefresh?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, onSelectMessage, type, onRefresh }) => {
  const getUserName = (id: string) => MOCK_USERS.find(u => u.id === id)?.name || 'Unknown';

  // Local Filter States
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAttachment, setFilterAttachment] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleMarkAllRead = async () => {
    await db.markAllRead(currentUserId);
    if(onRefresh) onRefresh();
  };

  const handleArchive = async (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    // Toggle archive state. If currently 'archive' type, we unarchive. If inbox, we archive.
    const isArchiving = type !== 'archive'; 
    await db.toggleArchive(msgId, currentUserId, isArchiving);
    if(onRefresh) onRefresh();
  };

  // Filter Logic
  const filteredMessages = messages.filter(msg => {
    // 1. Search Text
    const matchesSearch = msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          msg.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Priority Filter
    const matchesPriority = filterPriority === 'ALL' || msg.priority === filterPriority;

    // 3. Attachment Filter
    const matchesAttachment = !filterAttachment || (msg.attachments && msg.attachments.length > 0);

    return matchesSearch && matchesPriority && matchesAttachment;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
      
      {/* Toolbar / Filters */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto flex-1">
             <div className="relative w-full sm:flex-1 md:max-w-xs">
                 <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md w-full focus:outline-none focus:border-emerald-500"
                 />
             </div>
             
             <div className="flex items-center gap-2 w-full sm:w-auto">
               {/* Priority Filter */}
               <select 
                 className="flex-1 sm:flex-none text-xs border border-slate-300 rounded py-1.5 px-2 bg-white text-slate-600 focus:outline-none"
                 value={filterPriority}
                 onChange={(e) => setFilterPriority(e.target.value)}
               >
                 <option value="ALL">All Priorities</option>
                 <option value={Priority.NORMAL}>Normal</option>
                 <option value={Priority.URGENT}>Urgent</option>
                 <option value={Priority.CONFIDENTIAL}>Confidential</option>
               </select>

               {/* Attachment Toggle */}
               <button 
                 onClick={() => setFilterAttachment(!filterAttachment)}
                 className={`p-1.5 rounded border transition-colors ${filterAttachment ? 'bg-slate-200 border-slate-400 text-slate-800' : 'bg-white border-slate-300 text-slate-500 hover:text-slate-700'}`}
                 title="Show only with attachments"
               >
                 <Paperclip size={14} />
               </button>
             </div>
        </div>

        {type === 'inbox' && (
           <button 
             onClick={handleMarkAllRead}
             className="w-full md:w-auto flex items-center justify-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded transition-colors whitespace-nowrap"
           >
             <CheckCheck size={14} /> Mark all read
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              {type === 'archive' ? <Archive size={40} className="text-slate-300" /> : <Shield size={40} className="text-slate-300" />}
            </div>
            <p>No messages found in this folder matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMessages.map((msg) => {
              const isUnread = !msg.isRead && type === 'inbox';
              
              return (
                <div 
                  key={msg.id}
                  onClick={() => onSelectMessage(msg)}
                  className={`flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors group relative ${isUnread ? 'bg-slate-50' : ''}`}
                >
                  {/* Priority Indicator */}
                  <div className="flex-shrink-0">
                    {msg.priority === Priority.URGENT ? (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600" title="Urgent">
                        <AlertCircle size={20} />
                      </div>
                    ) : msg.priority === Priority.CONFIDENTIAL ? (
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600" title="Confidential">
                        <Shield size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                        {getUserName(msg.senderId).charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {type === 'inbox' || type === 'archive' ? getUserName(msg.senderId) : `To: ${msg.recipientIds.map(id => getUserName(id)).join(', ')}`}
                      </h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.priority === Priority.CONFIDENTIAL && (
                         <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Confidential</span>
                      )}
                      <p className={`text-sm truncate ${isUnread ? 'text-slate-800' : 'text-slate-500'}`}>
                        {msg.subject}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {msg.body}
                    </p>
                  </div>

                  {/* Right Side Icons */}
                  <div className="flex items-center gap-2 absolute right-4 top-1/2 -translate-y-1/2">
                    {msg.attachments.length > 0 && (
                        <div className="flex-shrink-0 text-slate-400" title="Has Attachment">
                        <Paperclip size={16} />
                        </div>
                    )}

                    {/* Archive Action (Only for Inbox or Archive views) */}
                    {(type === 'inbox' || type === 'archive') && (
                        <button 
                            onClick={(e) => handleArchive(e, msg.id)}
                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            title={type === 'archive' ? "Unarchive" : "Archive"}
                        >
                            <Archive size={16} />
                        </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;