'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, User, ArrowRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { api, setAuthToken } from '@/lib/api';
import { store, generateInitials } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
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
      store.setUserProfile({
        email: email.trim(),
        fullName: fullName.trim() || email.split('@')[0],
        initials: generateInitials(fullName.trim() || email.trim()),
        roleOrDept: email.includes('@') ? `${email.split('@')[1]} Scholar` : 'Academic Researcher'
      });

      setAuthToken(`session-${Date.now()}`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <h2 className="text-2xl font-black tracking-tight text-[#1c1917]">Create Custom Profile</h2>
          <p className="text-xs text-[#57534e]">Join to organize and query your academic papers</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 bg-[#EBCFC4] border border-[#D3C4BE] rounded-xl text-[#1c1917] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#1c1917]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Alex Smith"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Academic or Personal Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.smith@stanford.edu"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none transition"
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
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#57534e] bg-[#F3ECE7] p-3 rounded-xl border border-[#D3C4BE]">
            <ShieldCheck className="w-4 h-4 text-[#1c1917] shrink-0" />
            <span>Profile and papers are isolated to your local workspace session.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#292524] hover:bg-[#1c1917] active:scale-98 disabled:opacity-50 text-[#F4EEE1] font-bold text-xs rounded-xl transition shadow-paper-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F4EEE1]" />
            ) : (
              <>
                <span>Complete Registration & Open Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#E9CCB1]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#57534e]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1c1917] hover:underline font-bold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
