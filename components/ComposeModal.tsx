import React, { useState, useEffect, useRef } from 'react';
import { MOCK_USERS, db } from '../services/mockDatabase';
import { User, Priority, Message, Memo, Department, UserRole, Attachment } from '../types';
import { X, Paperclip, Send, FileText, Mail, CheckSquare, Trash2, File, Image, Loader, AlertCircle } from 'lucide-react';

interface ComposeModalProps {
  currentUser: User;
  onClose: () => void;
  onSent: () => void;
  initialRecipientId?: string;
  initialType?: 'email' | 'memo';
}

const ComposeModal: React.FC<ComposeModalProps> = ({ 
  currentUser, 
  onClose, 
  onSent, 
  initialRecipientId, 
  initialType = 'email' 
}) => {
  const [messageType, setMessageType] = useState<'email' | 'memo'>(initialType);
  const [recipientId, setRecipientId] = useState(initialRecipientId || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [requiresAck, setRequiresAck] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{recipient?: string, subject?: string, body?: string}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if user can send memos (Management, Admin Staff, Super Admin)
  const canSendMemos = [
    UserRole.SUPER_ADMIN, 
    UserRole.MANAGEMENT, 
    UserRole.ADMIN_STAFF
  ].includes(currentUser.role);

  // Group users by department
  const usersByDept = MOCK_USERS.reduce((acc, user) => {
    if (user.id === currentUser.id) return acc;
    if (!acc[user.department]) {
      acc[user.department] = [];
    }
    acc[user.department].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const files = Array.from(e.target.files);
      
      for (const file of files) {
          // Validate size (10MB)
          if (file.size > 10 * 1024 * 1024) {
             alert(`File ${file.name} exceeds 10MB limit.`);
             continue;
          }

          try {
              const uploadedAtt = await db.uploadFile(file);
              // For client-side preview of images immediately after selection (optimization)
              if (uploadedAtt.type === 'image' && !uploadedAtt.previewUrl) {
                  uploadedAtt.previewUrl = URL.createObjectURL(file);
              }
              setAttachments(prev => [...prev, uploadedAtt]);
          } catch (error) {
              alert(`Failed to upload ${file.name}`);
          }
      }
      setIsUploading(false);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
        // Cleanup object URLs to avoid memory leaks
        const att = prev.find(a => a.id === id);
        if (att && att.previewUrl && att.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(att.previewUrl);
        }
        return prev.filter(a => a.id !== id);
    });
  };

  const validate = () => {
    const newErrors: {recipient?: string, subject?: string, body?: string} = {};
    if (!recipientId) newErrors.recipient = "Recipient is required";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!body.trim()) newErrors.body = "Message body is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!validate()) return;
    
    setIsSending(true);

    setTimeout(() => {
      // Clean up previews before sending (in real app we upload first, here we just pass metadata)
      const sanitizedAttachments = attachments.map(a => ({
          ...a, 
          previewUrl: undefined 
      }));

      if (messageType === 'memo') {
        const newMemo: Memo = {
          id: `memo${Date.now()}`,
          senderId: currentUser.id,
          recipientIds: recipientId === 'ALL_STAFF' ? ['ALL_STAFF'] : [recipientId],
          ccIds: [],
          bccIds: [],
          subject,
          body,
          priority,
          attachments: sanitizedAttachments,
          createdAt: new Date().toISOString(),
          isRead: false,
          threadId: `t${Date.now()}`,
          type: 'memo',
          requiresAcknowledgement: requiresAck,
          acknowledgedBy: []
        };
        db.sendMemo(newMemo);
      } else {
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: currentUser.id,
          recipientIds: [recipientId],
          ccIds: [],
          bccIds: [],
          subject,
          body,
          priority,
          attachments: sanitizedAttachments,
          createdAt: new Date().toISOString(),
          isRead: false,
          threadId: `t${Date.now()}`,
          type: 'email'
        };
        db.sendMessage(newMessage);
      }
      
      setIsSending(false);
      onSent();
      onClose();
    }, 1000);
  };

  const isMemo = messageType === 'memo';
  const headerColor = isMemo ? 'bg-indigo-600' : 'bg-emerald-600';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-w-2xl flex flex-col sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`p-4 border-b border-slate-200 flex justify-between items-center ${headerColor} sm:rounded-t-xl text-white transition-colors duration-300 shrink-0`}>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {isMemo ? <FileText size={18} /> : <Send size={18} />} 
            {isMemo ? 'Post Official Circular' : 'New Message'}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle for Authorized Users */}
        {canSendMemos && (
          <div className="px-6 pt-4 shrink-0">
             <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
               <button 
                 type="button"
                 onClick={() => setMessageType('email')}
                 className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                   !isMemo ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 <Mail size={14} /> Standard Message
               </button>
               <button 
                 type="button"
                 onClick={() => {
                   setMessageType('memo');
                   if (!recipientId) setRecipientId('ALL_STAFF');
                 }}
                 className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                   isMemo ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 <FileText size={14} /> Circular / Memo
               </button>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {isMemo ? 'Target Audience' : 'To'}
              </label>
              <select
                className={`w-full border rounded-md p-2 text-sm focus:ring-2 outline-none bg-white ${errors.recipient ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
                value={recipientId}
                onChange={(e) => {
                  setRecipientId(e.target.value);
                  if (errors.recipient) setErrors(prev => ({...prev, recipient: undefined}));
                }}
              >
                <option value="">Select Recipient...</option>
                
                {/* 1. Broadcast Options */}
                <optgroup label="Broadcast / Groups">
                  <option value="ALL_STAFF">All Staff (Hospital Wide)</option>
                  {Object.values(Department).map(dept => (
                    <option key={dept} value={`DEPT_${dept}`}>Entire {dept} Dept.</option>
                  ))}
                </optgroup>

                {/* 2. Individual Staff (Only for Email) */}
                {!isMemo && Object.entries(usersByDept).map(([deptName, users]) => (
                  <optgroup key={deptName} label={deptName}>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.recipient && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.recipient}</p>}
            </div>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
               <div className="flex gap-2">
                 {[Priority.NORMAL, Priority.URGENT, Priority.CONFIDENTIAL].map(p => (
                   <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 text-xs py-2 rounded border transition-colors ${
                      priority === p 
                        ? p === Priority.URGENT ? 'bg-red-100 border-red-500 text-red-700 font-bold' 
                        : p === Priority.CONFIDENTIAL ? 'bg-amber-100 border-amber-500 text-amber-700 font-bold'
                        : 'bg-slate-200 border-slate-400 text-slate-700 font-bold'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                   >
                     {p}
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
            <input
              type="text"
              className={`w-full border rounded-md p-2 text-sm focus:ring-2 outline-none font-medium ${errors.subject ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
              placeholder={isMemo ? "e.g., CIRCULAR: NEW SHIFT ROSTER" : "Enter subject..."}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors(prev => ({...prev, subject: undefined}));
              }}
            />
             {errors.subject && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.subject}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              {isMemo ? 'Circular Content' : 'Message Body'}
            </label>
            <textarea
              className={`w-full border rounded-md p-3 text-sm focus:ring-2 outline-none min-h-[200px] ${errors.body ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}
              placeholder="Type your message here..."
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors(prev => ({...prev, body: undefined}));
              }}
            ></textarea>
            {errors.body && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.body}</p>}
          </div>
          
          {isMemo && (
            <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-md border border-indigo-100">
              <input 
                type="checkbox" 
                id="reqAck" 
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="reqAck" className="text-sm font-medium text-indigo-900 cursor-pointer flex items-center gap-1">
                <CheckSquare size={16} /> Require staff to acknowledge receipt of this circular
              </label>
            </div>
          )}

          <div>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileSelect} 
               className="hidden" 
               multiple 
               accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
             />
             <div className="flex items-center gap-2 mb-2">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 px-3 py-2 border border-slate-300 rounded hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  <Paperclip size={16} /> {isUploading ? 'Uploading...' : 'Attach Files'}
                </button>
                <span className="text-xs text-slate-400 italic">Max 10MB per file. Local network only.</span>
             </div>

             {/* Attachment List */}
             {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-sm group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-slate-200 overflow-hidden text-slate-400">
                          {att.type === 'image' && att.previewUrl ? (
                              <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                              <File size={20} />
                          )}
                        </div>
                        <div>
                           <div className="font-medium text-slate-700 truncate max-w-[200px]">{att.name}</div>
                           <div className="text-xs text-slate-400">{att.size} • {att.type.toUpperCase()}</div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(att.id)} 
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove attachment"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </form>

        <div className="p-4 border-t border-slate-200 bg-slate-50 sm:rounded-b-xl flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors">
            Discard
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSending || isUploading}
            className={`px-6 py-2 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${
               isMemo ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUploading ? (
              <><Loader size={16} className="animate-spin" /> Uploading...</>
            ) : isSending ? (
              'Sending...' 
            ) : (
              isMemo ? <><FileText size={16} /> Post Circular</> : <><Send size={16} /> Send Message</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;