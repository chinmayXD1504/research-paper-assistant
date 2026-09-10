'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Key, 
  Calendar, 
  Layers, 
  ExternalLink,
  Lock,
  UserPlus
} from 'lucide-react';
import { store, UserProfile } from '@/lib/store';
import Link from 'next/link';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export default function DatabaseModal({ isOpen, onClose, currentUser }: DatabaseModalProps) {
  const [registeredAccounts, setRegisteredAccounts] = useState<any[]>([]);
  const [backendUsers, setBackendUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'info'>('users');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // 1. Load local store accounts
      const localAccounts = store.getRegisteredAccounts();
      setRegisteredAccounts(localAccounts);

      // 2. Fetch from backend database API
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setBackendUsers(data.users || []);
      }
    } catch (e) {
      console.log('Error fetching database users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Merge unique users across local and backend
  const allUsersMap = new Map();
  
  backendUsers.forEach((u) => {
    allUsersMap.set(u.email.toLowerCase(), {
      email: u.email,
      fullName: u.full_name || u.fullName || u.email.split('@')[0],
      created_at: u.created_at || 'Registered in DB',
      source: 'Database (research_assistant.db)'
    });
  });

  registeredAccounts.forEach((u) => {
    if (!allUsersMap.has(u.email.toLowerCase())) {
      allUsersMap.set(u.email.toLowerCase(), {
        email: u.email,
        fullName: u.fullName,
        created_at: u.registeredAt || 'Active Account',
        source: 'Vault Registry & Database'
      });
    }
  });

  const displayUsers = Array.from(allUsersMap.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#D3C4BE] rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-paper-lg flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#D3C4BE] flex items-center justify-between bg-[#F3ECE7]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-[#1c1917] shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#1c1917]">Database & User Registry</h3>
                <span className="text-[10px] font-bold bg-[#E8E6D9] text-[#1c1917] border border-[#C4BDAC] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  research_assistant.db
                </span>
              </div>
              <p className="text-xs text-[#57534e]">Live user accounts, bcrypt password encryption, and isolated Pinecone namespaces</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#57534e] hover:text-[#1c1917] hover:bg-[#E8E6D9] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="px-6 py-4 bg-[#E8E6D9]/50 border-b border-[#D3C4BE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-xs font-black text-[#1c1917]">
              {currentUser.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#1c1917]">Active Session: {currentUser.fullName}</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.2 rounded-full">
                  ✓ Logged In
                </span>
              </div>
              <p className="text-[11px] text-[#57534e] font-medium">{currentUser.email} • {currentUser.roleOrDept}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAccounts}
              disabled={loading}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E4DAC2] text-[#1c1917] border border-[#D3C4BE] transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh DB</span>
            </button>
            <Link
              href="/register"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#292524] hover:bg-[#1c1917] text-[#F4EEE1] transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#E9CCB1]" />
              <span>+ New User</span>
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Database Specs Quick Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#D3C4BE] shadow-paper-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#57534e] mb-1">
                <ShieldCheck className="w-4 h-4 text-[#1c1917]" />
                <span>Security Standard</span>
              </div>
              <p className="text-xs font-black text-[#1c1917]">Bcrypt Salted (12 Rounds)</p>
              <p className="text-[10px] text-[#57534e] mt-0.5">Strict 5-criteria policy</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#D3C4BE] shadow-paper-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#57534e] mb-1">
                <Database className="w-4 h-4 text-[#1c1917]" />
                <span>Storage Engine</span>
              </div>
              <p className="text-xs font-black text-[#1c1917]">SQLite & SQLModel</p>
              <p className="text-[10px] text-[#57534e] mt-0.5">Table: USERS, PAPERS, CHUNKS</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#D3C4BE] shadow-paper-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#57534e] mb-1">
                <Layers className="w-4 h-4 text-[#1c1917]" />
                <span>Vector Isolation</span>
              </div>
              <p className="text-xs font-black text-[#1c1917]">Pinecone Namespace</p>
              <p className="text-[10px] text-[#57534e] mt-0.5">1 Index per User Email</p>
            </div>
          </div>

          {/* Registered Users Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-2">
                <span>Registered Users in Database</span>
                <span className="text-[10px] font-extrabold bg-[#E9CCB1] px-2 py-0.5 rounded-full text-[#1c1917]">
                  {displayUsers.length} Accounts
                </span>
              </h4>
              <span className="text-[11px] text-[#57534e]">Auto-synced on registration</span>
            </div>

            <div className="rounded-2xl border border-[#D3C4BE] overflow-hidden shadow-paper-sm bg-[#FFFFFF]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F3ECE7] border-b border-[#D3C4BE] text-[#1c1917] font-bold">
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Email / Vault Namespace</th>
                    <th className="p-3.5">Security Policy</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D3C4BE]/60">
                  {displayUsers.map((user, idx) => {
                    const isCurrent = user.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                      <tr key={idx} className={isCurrent ? 'bg-[#E8E6D9]/40 font-medium' : 'hover:bg-[#FAF7F2]'}>
                        <td className="p-3.5 font-bold text-[#1c1917] flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-[10px] font-black shrink-0">
                            {user.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate max-w-[130px]">
                            {user.fullName}
                          </div>
                        </td>
                        <td className="p-3.5 text-[#57534e] font-mono text-[11px]">
                          {user.email}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3 text-emerald-700" /> Strong Hashed
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isCurrent ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              Active Now
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-[#57534e] bg-[#FAF7F2] border border-[#D3C4BE] px-2 py-0.5 rounded-full">
                              In Database
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {isCurrent ? (
                            <span className="text-[11px] font-bold text-emerald-700">✓ Current</span>
                          ) : (
                            <Link
                              href="/login"
                              className="text-[11px] font-bold text-[#1c1917] hover:underline bg-[#E8E6D9] hover:bg-[#E4DAC2] border border-[#D3C4BE] px-2.5 py-1 rounded-xl transition"
                            >
                              Login
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#D3C4BE] bg-[#F3ECE7] flex items-center justify-between text-xs text-[#57534e]">
          <span>Database File: <code className="text-[#1c1917] font-mono font-bold">research_assistant.db</code></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#292524] hover:bg-[#1c1917] text-[#F4EEE1] font-bold transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
