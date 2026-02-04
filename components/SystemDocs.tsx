import React from 'react';
import { Database, Server, Shield, Network, Lock, Key } from 'lucide-react';

const SystemDocs: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">System Architecture Overview</h2>
        <p className="text-slate-500">High-level technical documentation for FMC Hong Intramail.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Architecture */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-emerald-700">
            <Server size={24} />
            <h3 className="text-lg font-bold">Deployment Architecture</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            The system operates entirely on an on-premise Local Area Network (LAN) at FMC Hong. It utilizes a typical LAMP/LEMP stack isolated from the public internet for maximum security.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li><strong>OS:</strong> Ubuntu LTS (Linux)</li>
            <li><strong>Web Server:</strong> Nginx (Reverse Proxy & Serving)</li>
            <li><strong>Application:</strong> PHP 8.2 (Laravel Framework)</li>
            <li><strong>Database:</strong> MySQL 8.0 (Normalized Relational Data)</li>
            <li><strong>Mail Transport:</strong> Postfix (Local SMTP Relay)</li>
          </ul>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-emerald-700">
             <Shield size={24} />
            <h3 className="text-lg font-bold">Security & Compliance</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Designed to meet NDPA and Health Data Confidentiality standards. No external cloud dependencies reduce attack vectors.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li><strong>Auth:</strong> Bcrypt Password Hashing + Session-based auth.</li>
            <li><strong>Encryption:</strong> TLS 1.3 for LAN traffic (Self-signed Internal CA).</li>
            <li><strong>RBAC:</strong> Granular permissions (Management, Clinical, Admin).</li>
          </ul>
        </div>
      </div>

      {/* Encryption Deep Dive */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-purple-700">
          <Lock size={24} />
          <h3 className="text-lg font-bold">Attachment Encryption Strategy (AES-256)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-slate-700 text-sm mb-2">Implementation</h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              To ensure patient data confidentiality within attachments, the system implements <strong>Server-Side Encryption</strong>.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li><strong>Algorithm:</strong> AES-256-CBC (Cipher Block Chaining).</li>
              <li><strong>Process:</strong> Upon upload, the PHP backend generates a unique initialization vector (IV). The file stream is encrypted using a Master Key before being written to the disk.</li>
              <li><strong>Storage:</strong> Files on disk are unreadable without the key. The database stores the file path and the IV, but <em>not</em> the key.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm mb-2">Key Management</h4>
            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-600">
              <div className="flex items-start gap-2 mb-2">
                <Key size={16} className="mt-1 text-slate-400" />
                <span>The <strong>Master Encryption Key</strong> is never stored in the database or the web root code.</span>
              </div>
              <p>It is injected via a secure environment variable (<code>APP_KEY</code>) configured in the server's OS environment or a restricted <code>.env</code> file outside the public web directory, accessible only by the root user.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-emerald-700">
          <Database size={24} />
          <h3 className="text-lg font-bold">Database Schema (Simplified)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200">
                 <th className="p-2 font-bold text-slate-700">Table</th>
                 <th className="p-2 font-bold text-slate-700">Columns</th>
                 <th className="p-2 font-bold text-slate-700">Description</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               <tr>
                 <td className="p-2 font-mono text-purple-600">users</td>
                 <td className="p-2 font-mono text-slate-500">id, email, password_hash, role_id, dept_id</td>
                 <td className="p-2 text-slate-600">Staff credentials and profiles.</td>
               </tr>
               <tr>
                 <td className="p-2 font-mono text-purple-600">messages</td>
                 <td className="p-2 font-mono text-slate-500">id, sender_id, subject, body, priority, thread_id</td>
                 <td className="p-2 text-slate-600">Core message content.</td>
               </tr>
               <tr>
                 <td className="p-2 font-mono text-purple-600">message_recipients</td>
                 <td className="p-2 font-mono text-slate-500">message_id, user_id, type (to/cc), is_read</td>
                 <td className="p-2 text-slate-600">Pivot table for 1-to-many delivery.</td>
               </tr>
               <tr>
                 <td className="p-2 font-mono text-purple-600">audit_logs</td>
                 <td className="p-2 font-mono text-slate-500">id, user_id, action, ip_addr, timestamp</td>
                 <td className="p-2 text-slate-600">Immutable log of all system actions.</td>
               </tr>
             </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-center pt-8">
        <p className="text-xs text-slate-400">System Document Generated by ICT Unit, FMC Hong.</p>
      </div>
    </div>
  );
};

export default SystemDocs;