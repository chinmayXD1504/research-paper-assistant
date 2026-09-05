'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { api, setAuthToken } from '@/lib/api';
import { store, nameFromEmail } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      // Save dynamic user profile according to the entered email
      const cleanEmail = email.trim();
      const domain = cleanEmail.includes('@') ? cleanEmail.split('@')[1] : 'academic';
      const roleOrDept = domain.includes('edu') || domain.includes('ac') 
        ? `${domain} Department` 
        : 'Research Fellow';

      store.setUserProfile({
        email: cleanEmail,
        fullName: nameFromEmail(cleanEmail),
        roleOrDept: roleOrDept
      });

      setAuthToken(`session-${Date.now()}`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4EEE1] relative overflow-hidden">
      <div className="w-full max-w-md bg-[#FAF7F2] border border-[#D3C4BE] rounded-3xl p-8 shadow-paper-lg relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] text-[#1c1917] shadow-sm mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#1c1917]">Sign In to Workspace</h2>
          <p className="text-xs text-[#57534e]">Intelligent Research Paper Assistant</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-[#EBCFC4] border border-[#D3C4BE] rounded-2xl text-[#1c1917] text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#1c1917]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu or researcher@gmail.com"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 px-4 bg-[#292524] hover:bg-[#1c1917] active:scale-98 disabled:opacity-50 text-[#F4EEE1] font-black text-xs rounded-2xl transition shadow-paper-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F4EEE1]" />
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4 text-[#E9CCB1]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#D3C4BE] text-center text-xs text-[#57534e]">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#1c1917] hover:underline font-extrabold">
            Create Custom Account
          </Link>
        </div>
      </div>
    </div>
  );
}
